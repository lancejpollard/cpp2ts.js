const prettier = require('prettier')
const buildAST = require('./ast')

function pretty(string) {
  return prettier.format(convert(string), {
    semi: false,
    parser: 'typescript',
    trailingComma: 'all',
    singleQuote: true,
    printWidth: 72,
    tabWidth: 2,
    useTabs: false,
    arrowParens: 'avoid',
    quoteProps: 'as-needed',
    bracketSpacing: true,
    proseWrap: 'always',
    endOfLine: 'lf',
    singleAttributePerLine: true,
    importOrder: [
      '^\\w(.*)$',
      '^@(.*)$',
      '~(.*)$',
      '\\..(.*)$',
      '\\.(.*)$',
    ],
    importOrderSeparation: true,
    importOrderSortSpecifiers: true,
  })
}

function convert(string) {
  const tree = buildAST(string)
  const body = []
  const module = [body]
  const state = {
    path: [],
    module,
    body,
  }

  tree.body.forEach(node => {
    process({ ...state, node })
  })

  return state.module.map(body => body.join('\n')).join('\n')
}

function process(input) {
  switch (input.node.type) {
    case 'namespace':
      processNamespace(input)
      break
    case 'declaration':
      processDeclaration(input)
      break
    case 'function_definition':
      processFunctionDefinition(input)
      break
    case 'binary_expression':
      processBinaryExpression(input)
      break
    case 'path':
      processPath(input)
      break
    case 'switch_statement':
      processSwitchStatement(input)
      break
    case 'if_statement':
      processIfStatement(input)
      break
    case 'conditional_expression':
      processConditionalExpression(input)
      break
    case 'call_expression':
      processCallExpression(input)
      break
    case 'for_statement':
      processForStatement(input)
      break
    case 'number_literal':
      processNumberLiteral(input)
      break
    case 'boolean_literal':
      processBooleanLiteral(input)
      break
    case 'return_statement':
      processReturnStatement(input)
      break
    case 'reference':
      processReference(input)
      break
    case 'assignment_expression':
      processAssignmentExpression(input)
      break
    case 'unary_expression':
      processUnaryExpression(input)
      break
    case 'while_statement':
      processWhileStatement(input)
      break
    case 'throw_statement':
      processThrowStatement(input)
      break
    case 'parenthesized_expression':
      processParenthesizedExpression(input)
      break
    case 'user_defined_literal':
      processUserDefinedLiteral(input)
      break
    case 'string_literal':
      processStringLiteral(input)
      break
    case 'update_expression':
      processUpdateExpression(input)
      break
    case 'case_statement':
      processCaseStatement(input)
      break
    default:
      throwNode(input.node)
  }
}

function processCaseStatement(input) {
  const test = []
  if (!input.node.isDefault) {
    process({ ...input, node: input.node.test, body: test })
  }

  const statements = []
  input.node.statements?.forEach(node => {
    process({ ...input, node, body: statements })
  })

  if (input.node.isDefault) {
    input.body.push(`default:${statements.length ? ` {` : ``}`)
  } else {
    input.body.push(
      `case ${test.join(' ')}:${statements.length ? ` {` : ``}`,
    )
  }

  statements.forEach(line => {
    input.body.push(`  ${line}`)
  })

  if (statements.length) {
    input.body.push(`}`)
  }
}

function processReturnStatement(input) {
  const statement = []
  process({ ...input, node: input.node.statement, body: statement })

  if (statement.length === 1) {
    input.body.push(`return ${statement.join('')}`)
  } else {
    input.body.push(`return (`)
    statement.forEach(line => {
      input.body.push(`  ${line}`)
    })
    input.body.push(')')
  }
}

function processUserDefinedLiteral(input) {
  input.body.push(input.node.text)
}

function processThrowStatement(input) {}

function processWhileStatement(input) {
  const condition = []
  process({ ...input, node: input.node.condition, body: condition })

  const statements = []
  input.node.statements.forEach(node => {
    process({ ...input, node, body: statements })
  })

  input.body.push(`while (${condition.join(' ')}) {`)
  statements.forEach(line => {
    input.body.push(`  ${line}`)
  })
  input.body.push(`}`)
}

function processUpdateExpression(input) {
  const exp = []
  process({ ...input, node: input.node.expression, body: exp })

  if (input.node.isRightSide) {
    input.body.push(`${exp.join('')}${input.node.operator}`)
  } else {
    input.body.push(`${input.node.operator}${exp.join('')}`)
  }
}

function processUnaryExpression(input) {
  const exp = []
  process({ ...input, node: input.node.expression, body: exp })

  input.body.push(`${input.node.operator}${exp.join(' ')}`)
}

function processAssignmentExpression(input) {
  const left = []
  process({ ...input, node: input.node.left, body: left })

  const right = []
  process({ ...input, node: input.node.right, body: right })

  input.body.push(
    `${left.join(' ')} ${input.node.operator} ${right.shift()}`,
  )

  right.forEach(line => {
    input.body.push(`  ${line}`)
  })
}

function processParenthesizedExpression(input) {
  const body = []
  process({ ...input, node: input.node.value, body })

  input.body.push(`(${body.join(' ')})`)
}

function processReference(input) {
  input.body.push(input.node.name)
}

function processNumberLiteral(input) {
  input.body.push(
    input.node.value.startsWith('.')
      ? `0${input.node.value}`
      : input.node.value,
  )
}

function processBooleanLiteral(input) {
  input.body.push(input.node.value)
}

function processStringLiteral(input) {
  input.body.push(input.node.value)
}

function processBinaryExpression(input) {
  const left = []
  process({ ...input, node: input.node.left, body: left })

  // hack, I guess parser is giving something wrong.
  if (!input.node.right && input.node.left.type === 'number_literal') {
    input.body.push(`${input.node.operator}${left.join(' ')}`)
    return
  }

  const right = []
  process({ ...input, node: input.node.right, body: right })

  input.body.push(
    `${left.join(' ')} ${input.node.operator} ${right.join(' ')}`,
  )
}

function processSwitchStatement(input) {
  const condition = []
  process({ ...input, node: input.node.condition, body: condition })

  const statements = []
  input.node.statements.forEach(node => {
    process({ ...input, node, body: statements })
  })

  input.body.push(`switch (${condition.join(' ')}) {`)
  statements.forEach(line => {
    input.body.push(`  ${line}`)
  })
  input.body.push(`}`)
}

function processForStatement(input) {
  // init, test, update, body
  const init = []
  input.node.init.forEach(node => {
    process({ ...input, node, body: init })
  })

  const test = []
  process({ ...input, node: input.node.test, body: test })

  const update = []
  process({ ...input, node: input.node.update, body: update })

  const body = []
  input.node.body.forEach(node => {
    process({ ...input, node, body })
  })

  input.body.push(
    `for (${init.join(', ')}; ${test.join(' ')}; ${update.join(
      ' ',
    )}) {`,
  )

  body.forEach(line => {
    input.body.push(`  ${line}`)
  })

  input.body.push(`}`)
}

function processCallExpression(input) {
  const object = []
  process({ ...input, node: input.node.object, body: object })

  const args = []
  input.node.args.forEach(node => {
    const arg = []
    args.push(arg)
    process({ ...input, node, body: arg })
  })

  input.body.push(
    `${object.join('')}(${args.map(arg => arg.join('\n')).join(', ')})`,
  )
}

function processIfStatement(input) {
  input.node.choices.forEach((choice, i) => {
    const condition = []
    if (choice.condition) {
      process({ ...input, node: choice.condition, body: condition })
    }

    const statements = []

    choice.statements.forEach(statement => {
      process({ ...input, node: statement, body: statements })
    })

    if (i === 0) {
      input.body.push(`if (${condition.join('\n')}) {`)

      statements.forEach(line => {
        input.body.push(`  ${line}`)
      })

      input.body.push('}')
    } else {
      if (condition.length) {
        input.body.push(`else if (${condition.join('\n')}) {`)
      } else {
        input.body.push(`else {`)
      }

      statements.forEach(line => {
        input.body.push(`  ${line}`)
      })

      input.body.push('}')
    }
  })
}

function processConditionalExpression(input) {
  // test, success, failure
  const test = []
  process({ ...input, node: input.node.test, body: test })

  const success = []
  process({ ...input, node: input.node.success, body: success })

  const failure = []
  process({ ...input, node: input.node.failure, body: failure })

  test.forEach((l, i) => {
    if (i === 0) {
      input.body.push(l)
    } else {
      input.body.push(`  ${l}`)
    }
  })

  success.forEach((l, i) => {
    if (i === 0) {
      input.body.push(`  ? ${l}`)
    } else {
      input.body.push(`    ${l}`)
    }
  })

  failure.forEach((l, i) => {
    if (i === 0) {
      input.body.push(`  : ${l}`)
    } else {
      input.body.push(`    ${l}`)
    }
  })
}

function processPath(input) {
  const children = []

  input.node.children.forEach((node, i) => {
    const child = []
    children.push(child)

    if (node.type === 'index') {
      child.push('[')
      process({ ...input, node: node.expression, body: child })
      child.push(']')
    } else {
      if (i > 0) {
        child.push('.')
      }
      process({ ...input, node, body: child })
    }
  })

  input.body.push(`${children.map(x => x.join('')).join('')}`)
}

function processFunctionDefinition(input) {
  const { returnType, name } = input.node
  const params = []
  input.node.parameters.forEach(node => {
    params.push(`${node.name}: ${node.typeName}`)
  })

  const body = []
  input.node.body.forEach(node => {
    process({ ...input, node, body, scope: 'function' })
  })

  input.body.push(
    `function ${name}(${params.join(', ')}): ${returnType} {`,
  )

  body.forEach(line => {
    input.body.push(`  ${line}`)
  })

  input.body.push('}')
}

function processDeclaration(input) {
  input.node.declarators.forEach(declarator => {
    const name = getName(declarator.name, input)
    const type = declarator.typeName
    const init = []
    if (declarator.init) {
      process({ ...input, node: declarator.init, body: init })
      input.body.push(`let ${name}: ${type} = ${init.join('\n')}`)
    } else {
      input.body.push(`let ${name}: ${type}`)
    }
  })
}

function processNamespace(input) {
  const path = input.path.concat([input.node.name])
  const scope = undefined // = 'namespace'
  input.node.body.forEach(node => {
    process({ ...input, node, path, scope })
  })
}

function throwNode(node, ctx) {
  console.log(node)
  throw new Error(
    `Unhandled node type '${node.type}' in context '${
      ctx?.type ?? 'file'
    }'`,
  )
}

module.exports = convert

convert.pretty = pretty

function getName(name, { path, scope }) {
  switch (scope) {
    case 'namespace': {
      const parts = path.concat()
      parts.push(name)
      return parts.join('_')
    }
    default:
      return name
  }
}

function logJSON(obj) {
  console.log(JSON.stringify(obj, null, 2))
}
