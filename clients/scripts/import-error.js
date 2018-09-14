'use strict'

class ImportError extends Error {
  constructor (err, group = []) {
    super(err.message)
    this.group = group.companies ? group.companies.cnpj : null
    this.stack = err.stack
    this.response = err.response
  }
}

module.exports = ImportError
