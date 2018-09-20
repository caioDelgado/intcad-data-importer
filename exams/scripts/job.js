'use strict'

const fs = require('fs')
const path = require('path')
const axios = require('axios')
const config = require('../config')

const SocSoapService = require('../services/soap')
const SocExamService = require('../services/socExam')

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

// httpClient.interceptors.request.use(
//   (httpConfig) => {
//     httpConfig.headers['Authorization'] = 'Bearer ' + config.auth.token
//     return httpConfig
//   }
// )

const socSoapService = new SocSoapService(config.soc)
const socExamService = new SocExamService(config.soc, socSoapService)

const importExams = async (exam) => {
  // const importedExam = await httpClient
  //   .post('/exams', exam)
  //   .then(response => response.data)
  //   .catch(err => {
  //     const error = err.response ? JSON.stringify(err.response.data) : err
  //     const errorMessage = `cannot insert intcad exam ${JSON.stringify(exam)}, error: ${error} \n`

  //     throw new Error(errorMessage)
  //   })

  if (!exam.integrations.soc) {
    return
  }

  // Integração SOC desativada
  await socExamService.updateToClients(exam)

  // return importedExam
}

const factory = (exam) => async () => {
  const importedExam = await importExams(exam)

  const message = importedExam && importedExam._id ? importedExam._id : `Cannot found error to exam: ${JSON.stringify(exam)}`

  fs.appendFile(`${outputpath}/finishedExams.txt`, `${message}, \n`, 'utf8', () => {})
}

module.exports = { factory }
