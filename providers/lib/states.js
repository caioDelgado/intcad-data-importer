'use strict'

const states = require('./data/states.json')

const statesMap = states.reduce((map, state) => {
  return map.set(state.code, state)
}, new Map())

module.exports = (code) => statesMap.get(code)
