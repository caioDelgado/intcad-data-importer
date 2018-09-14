'use strict'

const soap = require('soap')
const crypto = require('crypto')

const SOC_SUCCESS_CODE = 'SOC-100'

const getOptions = ({ username, password }) => {
  let dateNow = new Date()
  let dateOneMoreMinute = new Date()
  dateOneMoreMinute.setMinutes(dateOneMoreMinute.getMinutes() + 1)

  return {
    username, // WsAccessCodigoUsario
    password, // WsAccessChaveAcesso
    options: {
      timeStamp: {
        created: (dateNow).toISOString(),
        expires: dateOneMoreMinute.toISOString()
      }
    }
  }
}

const calculatePasswordDigest = (nonceBuf, createdBuf, passwordBuf) => {
  const passwordDigestBuf = Buffer.concat([nonceBuf, createdBuf, passwordBuf])
  const cipher = crypto.createHash('sha1')
  cipher.update(passwordDigestBuf)
  return cipher.digest('base64')
}

const getSoapHeader = (options) => {
  const nonceBuf = crypto.randomBytes(16)
  const createdBuf = Buffer.from(options.options.timeStamp.created)
  const passwordBuf = Buffer.from(options.password)

  const passwordDigest = calculatePasswordDigest(nonceBuf, createdBuf, passwordBuf)
  const nonceBase64 = nonceBuf.toString('base64')

  const header = `<wsse:Security xmlns:wsse="http://docs.oasis-open.org/wss/2004/01/oasis-200401-wss-wssecurity-secext-1.0.xsd" xmlns:wsu="http://docs.oasis-open.org/wss/2004/01/oasis-200401-wss-wssecurity-utility-1.0.xsd">
  <wsu:Timestamp wsu:Id="Timestamp-${options.options.timeStamp.created}">
     <wsu:Created>${options.options.timeStamp.created}</wsu:Created>
     <wsu:Expires>${options.options.timeStamp.expires}</wsu:Expires>
  </wsu:Timestamp>
  <wsse:UsernameToken wsu:Id="SecurityToken-${options.options.timeStamp.created}">
     <wsse:Username>${options.username}</wsse:Username>
     <wsse:Password Type="http://docs.oasis-open.org/wss/2004/01/oasis-200401-wss-username-token-profile-1.0#PasswordDigest">${passwordDigest}</wsse:Password>
     <wsse:Nonce EncodingType="http://docs.oasis-open.org/wss/2004/01/oasis-200401-wss-soap-message-security-1.0#Base64Binary">${nonceBase64}</wsse:Nonce>
     <wsu:Created>${options.options.timeStamp.created}</wsu:Created>
  </wsse:UsernameToken>
</wsse:Security>`

  return header.replace(/\n/g, '')
}

const createSoapClient = (url, soapOptions) => {
  return new Promise((resolve, reject) => {
    soap.createClient(url, soapOptions, (err, client) => {
      if (err) {
        return reject(err)
      }
      resolve(client)
    })
  })
}

/**
 * soc's service class
 */
class SoapService {
  /**
  * Construtor's class
  */
  constructor ({ url, authentication }) {
    this.$url = url
    this.$authentication = authentication
  }

  async makeSoapCall (webservice, method, socResultName, args) {
    const soapOptions = {
      envelopeKey: 'soapenv'
    }

    const client = await createSoapClient(`${this.$url}/${webservice}`, soapOptions)

    const headerOptions = getOptions(this.$authentication)

    const header = getSoapHeader(headerOptions)

    client.addSoapHeader(header)

    return new Promise((resolve, reject) => {
      client[method](args, (err, result) => {
        if (err) {
          return reject(err)
        }

        if (result[socResultName].informacaoGeral.codigoMensagem !== SOC_SUCCESS_CODE) {
          const message = JSON.stringify(result[socResultName].informacaoGeral.mensagemOperacaoDetalheList)

          return reject(new Error(message))
        }

        resolve(result)
      })
    })
  }
}

module.exports = SoapService
