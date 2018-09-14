'use strict'

const cities = require('./data/cities.json')

const citiesMap = cities.reduce((map, city) => {
  return map.set(city.code, city.name)
}, new Map())

module.exports = (code) => citiesMap.get(code)
