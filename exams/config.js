'use strict'

const env = require('sugar-env')

module.exports = {
  soc: {
    params: {
      user: parseInt(env.get('SOC_PARAMS_USER', 0)),
      responsible: parseInt(env.get('SOC_PARAMS_RESPONSIBLE', 0)),
      mainCompany: parseInt(env.get('SOC_PARAMS_MAIN_COMPANY', 0))
    },
    authentication: {
      username: parseInt(env.get('SOC_AUTHENTICATION_USERNAME', 0)),
      password: env.get('SOC_AUTHENTICATION_PASSWORD')
    },
    url: env.get('SOC_URL')
  },
  intcad: {
    exam: {
      url: env.get('EXAMS_URL', 'http://svc-exams.intcad.127.0.0.1.xip.io'),
      timeout: parseInt(env.get('EXAMS_TIMOUT', 30000))
    },
    api: {
      url: env.get('API_URL', 'http://api.intcad.127.0.0.1.xip.io'),
      timeout: parseInt(env.get('EXAMS_TIMOUT', 30000))
    }
  },
  auth: {
    token: env.get('AUTH_TOKEN'),
    idToken: env.get('AUTH_ID_TOKEN')
  }
}
