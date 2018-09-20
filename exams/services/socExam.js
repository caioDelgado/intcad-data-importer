'use strict'

const fs = require('fs')
const path = require('path')
const queue = require('queue')

const socCompanies = require('../dataset/socCompanies')

const outputpath = path.resolve(__dirname, '../files/outputs')
const errorPath = path.resolve(__dirname, '../files/errorLogs')

/**
 * soc's service class
 */
class SocService {
  /**
  * Construtor's class
  */
  constructor (soc, socSoapService) {
    this.$soc = soc
    this.$socSoapService = socSoapService
  }

  async updateToClients (exam, retry = 100) {
    return new Promise((resolve, reject) => {
      const q = queue()
      q.concurrency = 1

      const dadosExame = {
        nome: exam.name
      }

      if (exam.tuss) {
        dadosExame.codigoTuss = exam.tuss._id
      }

      socCompanies.map(async company => {
        const args = {
          AlterarExameWsVo: {
            identificacaoWsVo: {
              codigoUsuario: this.$soc.params.user,
              codigoResponsavel: this.$soc.params.responsible,
              codigoEmpresaPrincipal: this.$soc.params.mainCompany
            },
            tipoBuscaExame: 'CODIGO_SOC',
            tipoBuscaEmpresa: 'CODIGO_SOC',
            codigoExame: exam.integrations.soc.id,
            codigoEmpresa: company,
            dadosExame
          }
        }

        q.push(async () => {
          await this.$socSoapService.makeSoapCall('ExameWs?wsdl', 'alterarExame', 'ExameRetorno', args)
            .then(() => {
              const MESSAGE = `update soc exam ${exam.integrations.soc.id} to company ${company} \n`

              fs.appendFile(`${outputpath}/importedExams.txt`, MESSAGE, 'utf8', () => {})
            })
            .catch(err => {
              const MESSAGE = `error to update soc exam: ${exam.integrations.soc.id} company ${company}, error: ${err} \n`

              if (err.message.includes('SOC-202')) {
                fs.appendFile(`${errorPath}/soc-codigo-empresa-invalido.txt`, MESSAGE, 'utf8', () => {})

                return
              }

              if (err.message.includes('SOC-301')) {
                fs.appendFile(`${errorPath}/soc-exame-nao-encontrado.txt`, MESSAGE, 'utf8', () => {})

                return
              }

              if (retry > 0) {
                fs.appendFile(`${errorPath}/soc-exame-retry.txt`, `retry: ${retry} - ${MESSAGE}`, 'utf8', () => {})
                return this.updateToClients(exam, retry - 1)
              }

              fs.appendFile(`${errorPath}/soc-errors.txt`, MESSAGE, 'utf8', () => {})
            })
        })
      })

      q.start((err) => {
        if (err) reject()

        resolve()
      })
    })
  }
}

module.exports = SocService
