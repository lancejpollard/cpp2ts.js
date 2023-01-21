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
    default:
      throwNode(input.node)
  }
}

function processUserDefinedLiteral(input) {
  input.body.push(input.node.value)
}

function processThrowStatement(input) {}

function processWhileStatement(input) {}

function processUnaryExpression(input) {
  const exp = []
  process({ ...input, node: input.node.expression, body: exp })

  input.body.push(`${input.node.operator}${exp.join(' ')}`)
}

function processAssignmentExpression(input) {}

function processParenthesizedExpression(input) {
  const body = []
  process({ ...input, node: input.node.value, body })

  input.body.push(`(${body.join(' ')})`)
}

function processReference(input) {
  input.body.push(input.node.name)
}

function processNumberLiteral(input) {
  input.body.push(input.node.value)
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
  if (input.node.left.type === 'number_literal') {
    input.body.push(`${input.node.operator}${left.join(' ')}`)
    return
  }

  const right = []
  process({ ...input, node: input.node.right, body: right })

  input.body.push(
    `${left.join(' ')} ${input.node.operator} ${right.join(' ')}`,
  )
}

function processSwitchStatement(input) {}

function processForStatement(input) {}

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

function processConditionalExpression(input) {}

function processPath(input) {}

function processFunctionDefinition(input) {
  const { returnType, name } = input.node
  const params = []
  input.node.params?.forEach(node =>
    process({ ...input, node, body: params, scope: undefined }),
  )

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
      process({ ...input, node: declarator.init })
      input.body.push(`let ${name}: ${type} = ${init.join('\n')}`)
    } else {
      input.body.push(`let ${name}: ${type}`)
    }
  })
}

function processNamespace(input) {
  const path = input.path.concat([input.node.name])
  const scope = 'namespace'
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
