'use strict'

const axios = require('axios')
const cities = require('../lib/cities')
const states = require('../lib/states')
const JobError = require('./job-error')

const client = axios.create({
  baseURL: 'http://srv-provider.intcad.127.0.0.1.xip.io',
  headers: {
    'content-type': 'application/json'
  }
})

const MAIN_OFFICE_CNPJ_REGEX = /\d{8}0001\d{2}/

const isMainOffice = (unit) => MAIN_OFFICE_CNPJ_REGEX.test(unit.CNPJ)

const createProvider = async (params, units) => {
  const provider = {
    data: {
      name: {
        fantasy: params.NM_CREDENCIADO || params.razao_social,
        corporative: params.razao_social || params.NM_CREDENCIADO
      },
      documents: {
        cnae: null,
        cnpj: params.CNPJ,
        cnes: params.nr_cnes
      }
    },
    observations: params.OBSERVACOES,
    type: 'company',
    payment: {
      day: params.dia_pagamento,
      isAdvanced: (params.fl_pagamento_antecipado === '1'),
      isSimplesNacional: null
    }
  }

  const { data } = await client.post('/', provider)

  return data
}

const createAttendanceUnit = async (unit, providerId) => {
  const state = states(unit.ESTADO || unit.cd_estado)
  const city = cities(unit.CIDADE || unit.cd_cidade)

  const { data: provider } = await client.get(`/${providerId}`)

  if (!provider) {
    throw new Error('Provider not found')
  }

  if (!state) {
    throw new Error(`No state found for CNPJ ${unit.CNPJ}`)
  }

  if (!city) {
    throw new Error(`No city found for CNPJ ${unit.CNPJ}`)
  }

  const attendanceUnit = {
    type: 'company',
    address: {
      state: {
        name: state.name,
        initials: state.initials
      },
      city,
      complement: unit.ds_complemento,
      neighborhood: unit.nm_bairro,
      number: unit.ds_numero,
      street: unit.ds_logradouro,
      zipcode: unit.CEP
    },
    attendance: {
      officeHours: {
        endsAt: null,
        beginsAt: null
      },
      observation: null,
      type: 'scheduled',
      isDisplayable: true
    },
    technicalManager: {
      professionalAssociation: {
        code: unit.CRM,
        name: 'CRM'
      },
      name: unit.RESPONSAVEL
    },
    contacts: [],
    documents: {
      cnpj: unit.CNPJ,
      cnae: null,
      cnes: unit.nr_cnes
    },
    integrations: {
      soc: {
        id: 1234
      },
      finpac: {
        id: 'true'
      }
    }
  }

  const { data: { _id } } = await client.post(`/${providerId}/attendance-units`, attendanceUnit)

  provider.payment.bankAccounts.push({
    attendanceUnit: _id,
    branch: unit.nr_agencia,
    account: unit.nr_conta,
    bank: {
      code: unit.nr_banco,
      name: unit.nm_banco
    }
  })

  await client.put(`/${providerId}`, provider)
}

const factory = (group) => async () => {
  try {
    const mainOffice = group.find(isMainOffice)

    if (!mainOffice) {
      const documents = group.map(unit => unit.CNPJ).join(', ')
      throw new JobError(new Error(`No main office in group [${documents}]`), group)
    }

    const { _id } = await createProvider(mainOffice, group)

    for (const unit of group) {
      await createAttendanceUnit(unit, _id)
    }
  } catch (err) {
    throw new JobError(err, group)
  }
}

module.exports = { factory }
