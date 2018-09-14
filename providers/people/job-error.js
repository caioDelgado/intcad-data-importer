'use strict'

class JobError extends Error {
  constructor (err, person) {
    super(err.message)
    this.stack = err.stack
    this.response = err.response
    this.person = person
  }

  get cpf () {
    return this.person.CPF
  }
}

module.exports = JobError
