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

  process({ ...state, node: tree.rootNode })

  return state.module.map(body => body.join('\n')).join('\n')
}

function process(input) {
  switch (input.node.type) {
    case 'translation_unit':
      processChildren(input)
      break
    case 'comment':
      break
    case 'preproc_include':
      break
    case 'namespace_definition':
      processNamespaceDefinition(input)
      break
    case '{':
    case '}':
    case '(':
    case ')':
    case ';':
      break
    default:
      throwNode(input.node)
  }
}

function processChildren(input) {
  input.node.children.forEach(node => {
    process({ ...input, node })
  })
}

function processDeclaration(input) {
  let info = {}
  input.node.children.forEach(node => {
    switch (node.type) {
      case 'type_identifier':
        info.type = node.text
        break
      case 'identifier':
        info.name = node.text
        break
      case ';':
        break
      default:
        throwNode(node, input.node)
    }
  })

  input.body.push(`let ${getName(info.name, input)}: ${info.type}`)
}

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

function processNamespaceDefinition(input) {
  let path = input.path.concat()
  input.node.children.forEach(node => {
    switch (node.type) {
      case 'namespace':
        break
      case 'identifier':
        path.push(node.text)
        break
      case 'declaration_list':
        processDeclarationList({
          ...input,
          node,
          path,
          scope: 'namespace',
        })
        break
      default:
        throwNode(node, input.node)
    }
  })
}

function processDeclarationList(input) {
  input.node.children.forEach(node => {
    switch (node.type) {
      case 'preproc_if':
        break
      case '{':
      case '}':
      case 'comment':
        break
      case 'function_definition':
        processFunctionDefinition({ ...input, node })
        break
      case 'declaration':
        processDeclaration({ ...input, node })
        break
      default:
        throwNode(node, input.node)
    }
  })
}

function processFunctionDefinition(input) {
  const info = {}
  input.node.children.forEach(node => {
    switch (node.type) {
      case '{':
      case '}':
      case 'comment':
        break
      case 'type_identifier':
        info.returnType = node.text
        break
      case 'ERROR':
        info.returnType = node.text
        break
      case 'function_declarator':
        processFunctionDeclarator({ ...input, node })
        break
      default:
        throwNode(node, input.node)
    }
  })
}

function processFunctionDeclarator(input) {
  const info = {}
  input.node.children.forEach(node => {
    switch (node.type) {
      case '{':
      case '}':
      case 'comment':
        break
      case 'identifier':
        info.name = node.text
        break
      case 'ERROR':
        info.returnType = node.text
        break
      case 'function_declarator':
        processFunctionDeclarator({ ...input, node })
        break
      default:
        throwNode(node, input.node)
    }
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
