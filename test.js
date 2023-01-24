const _ = require('lodash')
const fs = require('fs')
const convert = require('./src')
const print = require('./src/print')

if (!fs.existsSync('tmp')) {
  fs.mkdirSync('tmp')
}
// fs.writeFileSync(
//   'fixtures/hyper.ast.json',
//   JSON.stringify(
//     print(fs.readFileSync('fixtures/hyper.h', 'utf-8')),
//     null,
//     2,
//   ),
// )

// fs.writeFileSync('hyperpoint.2.json', JSON.stringify(traverse(ast), null, 2))
fs.writeFileSync(
  'tmp/hyperpoint.ts',
  convert(fs.readFileSync('fixtures/hyperpoint.cpp', 'utf-8')),
)
fs.writeFileSync(
  'tmp/hyper.ts',
  convert(fs.readFileSync('fixtures/hyper.h', 'utf-8')),
)
