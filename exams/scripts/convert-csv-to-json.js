'use strict'

const fs = require('fs')
const path = require('path')
const converter = require('convert-csv-to-json')

const filepath = path.resolve(__dirname, '../files/inputs/exams.csv')
const outputpath = path.resolve(__dirname, '../files/outputs/exams.json')

const exams = converter
  .fieldDelimiter('|')
  .getJsonFromCsv(filepath)

const validateGroup = (group) => {
  const groups = {
    'AMOSTRA': 'sample',
    'CONSULTA': 'appointment',
    'EXAME': 'examination',
    'IMAGEM': 'imaging',
    'LABORATORIAL': 'laboratory',
    'VACINA': 'vaccination'
  }

  return groups[group]
}

const validateSubgroup = (subgroup) => {
  const subgroups = {
    'AMOSTRA': 'sample',
    'CONSULTA': 'appointment',
    'EXAME': 'examination',
    'FEZES': 'feces',
    'LÂMINA': 'slide',
    'LÍQUOR': 'csf',
    'QUERATINA': 'keratin',
    'RM': 'magnetic-resonance',
    'RX': 'x-ray',
    'SANGUE': 'blood',
    'SECREÇÃO': 'secretion',
    'SORO': 'serum',
    'TC': 'computerized-tomography',
    'TESTE CUTÂNEO': 'skin-test',
    'URINA': 'urine',
    'USG': 'ultrasonography',
    'VACINA': 'vaccination'
  }

  return subgroups[subgroup]
}

const validatedExams = exams
  .map(exam => {
    const validatedExam = {
      name: exam['DescriçãoFinal'],
      group: validateGroup(exam['GRUPO']),
      subgroup: validateSubgroup(exam['SUBGRUPO']),
      hasLaterality: exam['LATERALIDADE'] === 'SIM',
      integrations: {}
    }

    const { TUSS, AMB, CBHPM, TIPO } = exam

    if (TUSS) {
      validatedExam.tuss = { _id: TUSS }
    }

    if (CBHPM) {
      validatedExam.cbhpm = { _id: CBHPM }
    }

    if (AMB) {
      validatedExam.amb = { _id: AMB }
    }

    if (TIPO === 'UPDATE') {
      validatedExam.integrations.soc = {
        id: exam['COD_SOC']
      }
    }

    return validatedExam
  })

fs.writeFile(outputpath, JSON.stringify(validatedExams), { encoding: 'utf8' }, () => console.log('Foi !'))
