'use strict'

const states = require('../data/states.json')

const statesMap = states.reduce((map, state) => {
  return map.set(state.initials, state.name)
}, new Map())

module.exports = (initials) => statesMap.get(initials)
