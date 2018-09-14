'use strict'

const fs = require('fs')
const job = require('./job')
const path = require('path')
const queue = require('queue')
const ProgressBar = require('ascii-progress')

const errorPath = path.resolve(__dirname, '../files/errorLogs')
const examsPath = path.resolve(__dirname, '../files/outputs/exams.json')

const exams = JSON.parse(fs.readFileSync(examsPath, 'utf8'))

const progress = new ProgressBar({
  total: exams.length,
  schema: '[:bar] :current/:total :percent :elapseds/:etas. :errors errors'
})

const jobs = exams.map((exam) => job.factory(exam))

let errors = 0

const q = queue({
  concurrency: 1
})

q.push(...jobs)

q.on('success', () => {
  progress.tick({ errors })
})

q.on('error', err => {
  errors++

  progress.tick({
    errors: errors.length
  })

  fs.appendFile(`${errorPath}/intcad-errors.txt`, err.message, 'utf8', () => console.log(err.message))
})

q.on('end', () => {
  console.log('Script complete!')
})

q.start()
