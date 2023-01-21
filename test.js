const _ = require('lodash')
const fs = require('fs')
const ast = require('./fixtures/hyperpoint.ast.json')
const convert = require('.')

if (!fs.existsSync('tmp')) {
  fs.mkdirSync('tmp')
}
// fs.writeFileSync('hyperpoint.2.json', JSON.stringify(traverse(ast), null, 2))
fs.writeFileSync('tmp/hyperpoint.ts', convert(ast))
