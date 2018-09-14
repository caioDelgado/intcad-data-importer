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

const createProvider = async (params) => {
  const firstName = params.NM_CREDENCIADO.split(' ')[0]

  const lastName = params.NM_CREDENCIADO.split(' ')
                                        .slice(1)
                                        .join(' ')

  const provider = {
    data: {
      name: {
        first: firstName,
        last: lastName
      },
      documents: {
        cpf: params.CPF,
        rg: params.RG,
        pis: params.PIS || null
      }
    },
    observations: params.OBSERVACOES,
    type: 'person',
    payment: {
      day: params.dia_pagamento,
      isAdvanced: (params.fl_pagamento_antecipado === '1'),
      isSimplesNacional: null
    }
  }

  const { data } = await client.post('/', provider)

  return data
}

const createAttendanceUnit = async (providerId, unit) => {
  const state = states(unit.ESTADO || unit.cd_estado)
  const city = cities(unit.CIDADE || unit.cd_cidade)

  const { data: provider } = await client.get(`/${providerId}`)

  if (!provider) {
    throw new Error('Provider not found')
  }

  if (!state) {
    throw new Error(`No state found for CPF ${unit.CPF}`)
  }

  if (!city) {
    throw new Error(`No city found for CPF ${unit.CPF}`)
  }

  const attendanceUnit = {
    type: 'person',
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
      cpf: unit.CPF,
      rg: unit.RG,
      pis: unit.PIS || null
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

const factory = (person) => async () => {
  try {
    const { _id } = await createProvider(person)

    await createAttendanceUnit(_id, person)
  } catch (err) {
    throw new JobError(err, person)
  }
}

module.exports = { factory }
