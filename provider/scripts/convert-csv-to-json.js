'use strict'

const fs = require('fs')
const path = require('path')
const converter = require('convert-csv-to-json')

const filepath = path.resolve(__dirname, '../files/inputs/providers.csv')
const outputpath = path.resolve(__dirname, '../files/outputs/providers.json')

const providers = converter
  .fieldDelimiter('|')
  .getJsonFromCsv(filepath)

const groupBy = (array, func) => {
  const groups = {}

  array.forEach(obj => {
    const group = JSON.stringify(func(obj))

    groups[group] = groups[group] || []
    groups[group].push(obj)
  })
  return Object.keys(groups).map(group => groups[group])
}

const validatedProviders = providers.map(provider => {
  const contacts = []

  for (let i = 0; i < 6; i++) {
    if (provider[`TELEFONE_${i}`]) {
      contacts.push({
        name: !i ? provider[`CONTATO`] : 'Unidade',
        phones: [{
          areaCode: provider[`DDD_${i}`],
          number: parseInt(provider[`TELEFONE_${i}`].replace('-', '')),
          extention: null,
          type: provider[`TIPO_${i}`] === 'Fixo' ? 'landline' : 'mobile'
        }],
        email: provider[`EMAIL_${i}`],
        observation: null
      })
    }
  }

  let bankAccounts = {}

  if (provider['CONTA']) {
    bankAccounts = {
      attendanceUnit: provider['CNPJ_UNIDADE'],
      branch: provider['AGENCIA'],
      account: provider['CONTA'],
      bank: {
        code: provider['CD_BANCO'],
        name: provider['DS_BANCO']
      }
    }
  }

  const payment = {
    day: provider['DIA_PAGAMENTO'],
    type: provider['FORMA DE PAGAMENTO'] === 'BOLETO' ? 'invoice' : 'transfer',
    isAdvanced: provider['PAGAMENTO_ANTECIPADO'] === 'SIM',
    isSimplesNacional: provider['SIMPLES NACIONAL'] === 'SIM',
    bankAccounts
  }

  const validatedProvider = {}

  if (provider['TP_CONTRATACAO'] === 'PJ') {
    validatedProvider.type = 'company'
    validatedProvider.payment = payment
    validatedProvider.observation = null
    validatedProvider.data = {
      name: {
        fantasy: provider['NOME_FANTASIA'],
        corporative: provider['RAZAO_SOCIAL']
      },
      documents: {
        cnpj: provider['CNPJ_PRESTADOR'],
        cnae: provider['CNAE'],
        cnes: provider['CNES'] ? provider['CNES'] : null
      }
    }
    validatedProvider.unit = {
      type: 'company',
      documents: {
        cnpj: provider['CNPJ_UNIDADE'],
        cnae: provider['CNAE'],
        cnes: provider['CNES'] ? provider['CNES'] : null
      },
      address: {
        zipcode: provider['CEP'],
        street: provider['ENDERECO'],
        number: provider['NUMERO'],
        complement: provider['COMPLEMENTO'],
        neighborhood: provider['BAIRRO'],
        city: provider['CIDADE'],
        state: {
          initials: provider['ESTADO_UF'],
          name: provider['ESTADO']
        }
      },
      attendance: {
        type: provider['TIPO_ATENDIMENTO'] === 'Hora Marcada' ? 'scheduled' : 'arrival-order',
        officeHours: {
          beginsAt: provider['HR_INICIAL'],
          endsAt: provider['HR_FINAL']
        },
        isDisplayable: true,
        observation: provider['OBS']
      },
      technicalManager: {
        name: provider['RESPONSAVEL_TECNICO'],
        professionalAssociation: {
          name: provider['CONSELHO'],
          code: provider['CRM'],
          state: provider['UF']
        }
      },
      contacts,
      integrations: {
        soc: {
          id: provider['CD_SOC']
        }
      }
    }
  } else {
    validatedProvider.type = 'person'
    console.log('Person provider not available')
  }

  return validatedProvider
})

const groupedValidatedProvider = groupBy(validatedProviders, item => [item.data.documents.cnpj.toString(0, 8)])

const data = groupedValidatedProvider.map(items => {
  const { type, observation, data, payment: { day, type: paymentType, isAdvanced, isSimplesNacional } } = items[0]

  const provider = { type, observation, data }

  provider.attendanceUnits = []
  provider.payment = {
    day,
    isAdvanced,
    isSimplesNacional,
    bankAccounts: [],
    type: paymentType
  }

  items.forEach(item => {
    provider.attendanceUnits.push(item.unit)

    if (item.payment.bankAccounts.account) {
      provider.payment.bankAccounts.push(item.payment.bankAccounts)
    }
  })

  return provider
})

fs.writeFile(outputpath, JSON.stringify(data), { encoding: 'utf8' }, () => console.log('Foi, porra !'))
