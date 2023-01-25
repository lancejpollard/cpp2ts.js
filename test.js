const fs = require('fs')
const convert = require('./src')
const print = require('./src/print')

test('hyperpoint.cpp')
// test('hyper.h')

function test(name) {
  const parts = name.split('.')
  parts.pop()
  const baseName = parts.join('.')
  const content = fs.readFileSync(`fixtures/${name}`, 'utf-8')

  if (!fs.existsSync('tmp')) {
    fs.mkdirSync('tmp')
  }

  fs.writeFileSync(
    `tmp/${baseName}.ast.json`,
    JSON.stringify(print(content), null, 2),
  )

  fs.writeFileSync(`tmp/${baseName}.ts`, convert(content))
}
