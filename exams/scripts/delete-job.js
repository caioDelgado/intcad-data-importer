'use strict'

const axios = require('axios')
const config = require('../config')

const httpClient = axios.create({
  baseURL: config.intcad.api.url,
  timeout: config.intcad.api.timeout,
  headers: {
    'Accept': 'application/json',
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${config.auth.token}`
  }
})

const factory = async () => {
  const exams = await httpClient.get('/exams?limit=1000')
    .then(response => response.data)
    .catch(console.log)

  console.log(exams.length)

  const promiseExams = exams.map(async exam => {
    await httpClient.delete(`/exams/${exam._id}`)
      .then(response => response.data)
      .catch(console.log)
  })

  await Promise.all(promiseExams)

  console.log('Foi !')
}

try {
  factory()
} catch (error) {
  console.log(error)
}
