const Parser = require('tree-sitter')
const cpp = require('tree-sitter-cpp')

const parser = new Parser()
parser.setLanguage(cpp)

module.exports = build

function build(string) {
  const tree = parser.parse(string)
  const body = []

  process({ body, node: tree.rootNode })

  return body
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
  let info = { type: 'declaration' }
  input.node.children.forEach(node => {
    switch (node.type) {
      case 'type_identifier':
        info.typeName = node.text
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

  input.body.push(info)
}

function processNamespaceDefinition(input) {
  const info = { type: 'namespace', body: [] }
  input.body.push(info)
  input.node.children.forEach(node => {
    switch (node.type) {
      case 'namespace':
        break
      case 'identifier':
        info.name = node.text
        break
      case 'declaration_list':
        processDeclarationList({
          ...input,
          node,
          body: info.body,
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
  const info = {
    type: 'function_definition',
    body: [],
  }
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
      case 'function_declarator': {
        const dec = processFunctionDeclarator({ ...input, node })
        input.name = dec.name
        input.params = dec.params
        break
      }
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
      case 'parameter_list':
        info.parameters = processParameterList({ ...input, node })
        break
      default:
        throwNode(node, input.node)
    }
  })
}

function processParameterList(input) {}

function throwNode(node, ctx) {
  console.log(node)
  throw new Error(
    `Unhandled node type '${node.type}' in context '${
      ctx?.type ?? 'file'
    }'`,
  )
}
