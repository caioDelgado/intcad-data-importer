'use strict'

const fs = require('fs')
const _ = require('lodash')
const path = require('path')
const csv = require('csvtojson')

const states = require('./states')

const csvFilePath = path.resolve(__dirname, '../files/inputs/data.csv')
const clientsJsonFilePath = path.resolve(__dirname, '../files/outputs/data.json')

;(async () => {
  const dataJson = await csv({ delimiter: '|' }).fromFile(csvFilePath)
    
  const units = dataJson.map(unit => {
    return {
      holding: unit['matriz_Holding'],
      company: {
        name: unit['matriz_Nome fantasia'] || unit['matriz_Razão Social'],
        legalName: unit['matriz_Razão Social'],
        cnpj: unit['matriz_CNPJ'],
        integrations: {
          soc: {
            id: unit['matriz_Id SOC'] || null
          }
        },
        unit: {
          isAllocation: unit['unidade_Unidade de alocação'] === 'Sim',
          name: unit['unidade_Nome fantasia'] || unit['unidade_Razão Social'],
          legalName: unit['unidade_Razão Social'],
          referenceCode: null,
          occupationalHazardLevel: parseInt(unit['unidade_Grau do Risco']),
          documents: {
            cnpj: unit['unidade_CNPJ Unidade'],
            cnae: unit['unidade_CNAE'],
            ie: unit['unidade_Inscrição Estadual'],
          },
          address: {
            zipcode: unit['unidade_CEP'],
            street: unit['unidade_Logradouro'],
            number: unit['unidade_Número'],
            complement: unit['unidade_Complemento'],
            neighborhood: unit['unidade_Bairro'],
            city: unit['unidade_Cidade'],
            state: {
              initials: unit['unidade_Estado'],
              name: states(unit['unidade_Estado'])
            }
          },
          contacts: [
            {
              name: unit['matriz_Nome'],
              email: unit['matriz_E-mail'],
              phones: [
                {
                  areaCode: unit['matriz_Código de Área'] || 0,
                  number: parseInt(unit['matriz_Telefone'] || 0),
                  extension: unit['matriz_Ramal'],
                  type: 'landline'
                }
              ]
            }
          ],
          integrations: {
            soc: {
              id: unit['unidade_Id do SOC'] || null
            }
          }
        }
      }
    }
  })

  const holdings = _.chain(units)
    .groupBy('holding')
    .map((value, holding) => {
      const companies = _.chain(value)
        .groupBy('company.cnpj')
        .map((units) => {
          const { name, legalName, cnpj, integrations } = units[0].company

          return { name, legalName, cnpj, units, integrations }
        })
        .value()

      return { holding, companies }
    })
    .value()

  fs.writeFile(clientsJsonFilePath, JSON.stringify(holdings), { encoding: 'utf8' }, () => console.log('Foi !'))
})()


