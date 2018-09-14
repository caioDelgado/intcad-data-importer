'use strict'

const MAIN_OFFICE_CNPJ_REGEX = /\d{8}0001\d{2}/

const isMainOffice = (unit) => MAIN_OFFICE_CNPJ_REGEX.test(unit.CNPJ)

class JobError extends Error {
  constructor (err, group = []) {
    super(err.message)
    this.group = group
    this.stack = err.stack
    this.response = err.response
  }

  get mainCnpj () {
    const mainOffice = this.group.find(isMainOffice)
    return mainOffice
      ? mainOffice.CNPJ
      : null
  }
}

module.exports = JobError
