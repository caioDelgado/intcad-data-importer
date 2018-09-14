'use strict'

const axios = require('axios')
const ImportError = require('./import-error')

const client = axios.create({
  baseURL: 'http://api.intcad.127.0.0.1.xip.io',
  headers: {
    'content-type': 'application/json'
  }
})

const getType = (company) => {
  if (company.unit.isAllocation) {
    return 'allocation'
  }

  if (company.cnpj === company.unit.documents.cnpj) {
    return 'main-office'
  }

  return 'branch'
}

const factory = (group) => async () => {
  try {
    const { holding, companies } = group
    
    const { data: { _id: holdingId } } = await client.post('/client-holdings', { name: holding })

    for (const company of companies) {
      const { data: { _id: companyId } } = await client.post('/client-companies', company)
    
      await client.put(`/client-holdings/${holdingId}/companies/${companyId}`)
    
      for (const unitCompany of company.units) {
        const unit = unitCompany.company.unit
        unit.type = getType(unitCompany.company)

        await client.post(`/client-companies/${companyId}/units`, unit)
      }
    }
  } catch (err) {
    throw new ImportError(err, group.companies)
  }
}

module.exports.factory = factory