'use strict'

const fs = require('fs')
const path = require('path')
const axios = require('axios')
const config = require('../config')

const outputpath = path.resolve(__dirname, '../files/outputs')

const httpClient = axios.create({
  baseURL: config.intcad.api.url,
  timeout: config.intcad.api.timeout,
  headers: {
    'Accept': 'application/json',
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${config.auth.token}`
  }
})

const importProviders = async ({ type = 'company', data, attendanceUnits, payment }) => {
  const { _id: providerId } = await httpClient
    .post('/providers', { type, data })
    .then(response => response.data)
    .catch(error => console.log(error.response.data, 'company'))

  const attendanceUnitsPromises = attendanceUnits.map(async attendanceUnit => {
    const { _id: attendanceUnitId } = await httpClient
      .post(`/providers/${providerId}/attendance-units`, attendanceUnit)
      .then(response => response.data)
      .catch(error => console.log(error.response.data, 'unit'))

    const paymentAttendanceUnit = payment.bankAccounts.find(bankAccount => bankAccount.attendanceUnit === attendanceUnit.documents.cnpj)

    const index = payment.bankAccounts.indexOf(paymentAttendanceUnit)

    if (payment.bankAccounts[index]) {
      payment.bankAccounts[index].attendanceUnit = attendanceUnitId
    }
  })

  await Promise.all(attendanceUnitsPromises)

  await httpClient
    .post(`/providers/${providerId}/payment`, payment)

  return { _id: providerId }
}

const factory = (provider) => async () => {
  const importedProvider = await importProviders(provider)

  const message = importedProvider && importedProvider._id ? importedProvider._id : `Cannot found error to provider: ${JSON.stringify(provider)}`

  fs.appendFile(`${outputpath}/finishedProviders.txt`, `${message}, \n`, 'utf8', () => {})
}

module.exports = { factory }
