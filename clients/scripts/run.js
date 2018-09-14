'use strict'

const path = require('path')
const queue = require('queue')
const ProgressBar = require('ascii-progress')

const data = require('../files/outputs/data.json')
const job = require('./import-clients')

const outputErrorFilePath = path.resolve(__dirname, '../files/inputs/companies.csv')

const progress = new ProgressBar({
  total: data.length,
  schema: '[:bar] :current/:total :percent :elapseds/:etas. :errors errors'
})

const errors = []

const q = queue({
  concurrency: 25
})

const jobs = data.map((holding) => job.factory(holding))

q.push(...jobs)

q.on('success', () => {
  progress.tick({ errors: errors.length })
})

q.on('error', err => {
  progress.tick({ errors: errors.length })

  if (err.message.includes('ENOTFOUND') || err.message.includes('ECONNRESET')) {
    progress.total++
    q.push(job.factory(err.group))
  }

  if (!err.response) {
    return errors.push(`${err.mainCnpj}: ${err.message}`)
  }

  errors.push(`${err.mainCnpj}: ${err.response.data.error.message}`)
})

q.on('end', () => {
  console.log(`Errors (${errors.length}):`)
  console.log(errors.join('\n'))
  process.exit(0)
})

q.start()
