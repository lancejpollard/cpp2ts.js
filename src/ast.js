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

function processInitDeclarator(input) {
  let info = {}

  input.node.children.forEach(node => {
    switch (node.type) {
      case 'type_identifier':
        info.typeName = node.text
        break
      case 'identifier':
        info.name = node.text
        break
      case 'conditional_expression':
        info.init = processConditionalExpression({ ...input, node })
        break
      case 'number_literal':
        info.init = {
          type: 'number_literal',
          value: node.text,
        }
        break
      case 'binary_expression':
        info.init = processBinaryExpression({ ...input, node })
        break
      case 'unary_expression':
        info.init = processUnaryExpression({ ...input, node })
        break
      case 'call_expression':
        info.init = processCallExpression({ ...input, node })
        break
      case ';':
      case '=':
        break
      default:
        throwNode(node, input.node)
    }
  })

  return info
}

function processDeclaration(input) {
  let declarator = {}
  let info = { type: 'declaration', declarators: [declarator] }
  input.node.children.forEach(node => {
    switch (node.type) {
      case 'type_identifier':
      case 'primitive_type':
        declarator.typeName = node.text
        break
      case 'identifier':
        declarator.name = node.text
        break
      case 'auto':
        break
      case 'ERROR': {
        const dec = processDeclaration({ ...input, node })
        const first = dec.declarators.shift()
        declarator.typeName = first.typeName
        declarator.name = first.name
        declarator.init = first.init
        info.declarators.push(...dec.declarators)
        // declarator = undefined
        break
      }
      case 'init_declarator': {
        const init = processInitDeclarator({ ...input, node })
        declarator.name = init.name
        declarator.init = init.init
        break
      }
      case ',':
        declarator = {}
        info.declarators.push(declarator)
        break
      case ';':
        break
      default:
        console.log(input.node.text)
        throwNode(node, input.node)
    }
  })

  return info
}

function processNamespaceDefinition(input) {
  const info = { type: 'namespace', body: [] }
  input.node.children.forEach(node => {
    switch (node.type) {
      case 'namespace':
        break
      case 'identifier':
        info.name = node.text
        break
      case 'declaration_list':
        info.push(
          ...processDeclarationList({
            ...input,
            node,
          }),
        )
        break
      default:
        throwNode(node, input.node)
    }
  })
}

function processDeclarationList(input) {
  const body = []
  input.node.children.forEach(node => {
    switch (node.type) {
      case 'preproc_if':
        break
      case '{':
      case '}':
      case 'comment':
        break
      case 'function_definition':
        body.push(processFunctionDefinition({ ...input, node }))
        break
      case 'declaration':
        body.push(processDeclaration({ ...input, node }))
        break
      default:
        throwNode(node, input.node)
    }
  })
  return body
}

function processFunctionDefinition(input) {
  const info = {
    type: 'function_definition',
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
        if (dec.typeName) {
          input.returnType = dec.typeName
        }
        break
      }
      case 'compound_statement':
        info.body = processCompoundStatement({ ...input, node })
        break
      default:
        throwNode(node, input.node)
    }
  })
}

function processIfStatement(input) {
  let choice = { statements: [] }
  let choices = [choice]
  input.node.children.forEach(node => {
    switch (node.type) {
      case 'if':
      case 'comment':
        break
      case 'else':
        choice = { statements: [] }
        choices.push(choice)
        break
      case 'compound_statement':
        choice.statements.push(
          ...processCompoundStatement({ ...input, node }),
        )
        break
      case 'condition_clause':
        choice.condition = processConditionClause({ ...input, node })
        break
      case 'expression_statement':
        choice.statements.push(
          processExpressionStatement({ ...input, node }),
        )
        break
      case 'return_statement':
        choice.statements.push(
          processReturnStatement({ ...input, node }),
        )
        break
      case 'if_statement':
        choice.statements.push(processIfStatement({ ...input, node }))
        break
      default:
        throwNode(node, input.node)
    }
  })
  return { type: 'if_statement', choices }
}

function processUpdateExpression(input) {
  let info = { type: 'update_expression' }
  input.node.children.forEach(node => {
    switch (node.type) {
      case 'identifier':
        info.expression = {
          type: 'reference',
          name: node.text,
        }
        break
      case '++':
      case '--':
        info.operator = node.type
        break
      default:
        throwNode(node, input.node)
    }
  })
  return info
}

function processForStatement(input) {
  let info = { type: 'for_statement', body: [], init: [] }
  input.node.children.forEach(node => {
    switch (node.type) {
      case 'for':
      case '(':
      case ')':
      case ';':
      case 'comment':
        break
      case 'if_statement':
        info.body.push(processIfStatement({ ...input, node }))
        break
      case 'expression_statement':
        info.body.push(processExpressionStatement({ ...input, node }))
        break
      case 'update_expression':
        info.update = processUpdateExpression({ ...input, node })
        break
      case 'binary_expression':
        info.test = processBinaryExpression({ ...input, node })
        break
      case 'declaration':
        info.init.push(processDeclaration({ ...input, node }))
        break
      case 'compound_statement':
        info.body.push(...processCompoundStatement({ ...input, node }))
        break
      case 'return_statement':
        info.body.push(processReturnStatement({ ...input, node }))
        break
      default:
        throwNode(node, input.node)
    }
  })
  return info
}

function processCompoundStatement(input) {
  const statements = []
  input.node.children.forEach(node => {
    switch (node.type) {
      case '{':
      case '}':
      case 'comment':
        break
      case 'declaration':
        statements.push(processDeclaration({ ...input, node }))
        break
      case 'for_statement':
        statements.push(processForStatement({ ...input, node }))
        break
      case 'expression_statement':
        statements.push(processExpressionStatement({ ...input, node }))
        break
      case 'if_statement':
        statements.push(processIfStatement({ ...input, node }))
        break
      case 'return_statement':
        statements.push(processReturnStatement({ ...input, node }))
        break
      case 'switch_statement':
        statements.push(processSwitchStatement({ ...input, node }))
        break
      case 'case_statement':
        statements.push(processCaseStatement({ ...input, node }))
        break
      default:
        throwNode(node, input.node)
    }
  })
  return statements
}

function processAssignmentExpression(input) {
  const sides = []
  let operator
  input.node.children.forEach(node => {
    switch (node.type) {
      case ';':
      case 'comment':
        break
      case '+=':
      case '-=':
      case '/=':
      case '*=':
      case '>>=':
      case '<<=':
      case '=':
        operator = node.type
        break
      case 'identifier':
        sides.push({
          type: 'reference',
          name: node.text,
        })
        break
      case 'subscript_expression':
        sides.push(processSubscriptExpression({ ...input, node }))
        break
      case 'call_expression':
        sides.push(processCallExpression({ ...input, node }))
        break
      case 'binary_expression':
        sides.push(processBinaryExpression({ ...input, node }))
        break
      case 'assignment_expression':
        sides.push(processAssignmentExpression({ ...input, node }))
        break
      case 'number_literal':
        sides.push({
          type: 'number_literal',
          value: node.text,
        })
        break
      default:
        throwNode(node, input.node)
    }
  })
  const left = sides.shift()
  const right = sides.shift()
  return { type: 'assignment_expression', left, operator, right }
}

function processExpressionStatement(input) {
  let statement
  input.node.children.forEach(node => {
    switch (node.type) {
      case ';':
      case 'comment':
        break
      case 'assignment_expression':
        statement = processAssignmentExpression({ ...input, node })
        break
      case 'call_expression':
        statement = processCallExpression({ ...input, node })
        break
      default:
        throwNode(node, input.node)
    }
  })
  return statement
}

function processCaseStatement(input) {
  let statements
  let test
  let isDefault = false

  input.node.children.forEach(node => {
    switch (node.type) {
      case '{':
      case '}':
      case 'comment':
      case 'case':
      case ':':
        break
      case 'identifier':
        test = {
          type: 'reference',
          name: node.text,
        }
        break
      case 'default':
        isDefault = true
        break
      case 'return_statement':
        statements = [processReturnStatement({ ...input, node })]
        break
      case 'compound_statement':
        statements = processCompoundStatement({ ...input, node })
        break
      default:
        throwNode(node, input.node)
    }
  })
  return { type: 'case_statement', isDefault, test, statements }
}

function processSwitchStatement(input) {
  let statements
  let condition

  input.node.children.forEach(node => {
    switch (node.type) {
      case '{':
      case '}':
      case 'comment':
      case 'switch':
        break
      case 'condition_clause':
        condition = processConditionClause({ ...input, node })
        break
      case 'compound_statement':
        statements = processCompoundStatement({ ...input, node })
        break
      default:
        throwNode(node, input.node)
    }
  })
  return { type: 'switch_statement', condition, statements }
}

function processConditionClause(input) {
  let condition

  input.node.children.forEach(node => {
    switch (node.type) {
      case '(':
      case ')':
        break
      case 'identifier':
        condition = {
          type: 'reference',
          name: node.text,
        }
        break
      case 'call_expression':
        condition = processCallExpression({ ...input, node })
        break
      case 'subscript_expression':
        condition = processSubscriptExpression({ ...input, node })
        break
      case 'binary_expression':
        condition = processBinaryExpression({ ...input, node })
        break
      default:
        throwNode(node, input.node)
    }
  })
  return condition
}

function processReturnStatement(input) {
  let statement
  input.node.children.forEach(node => {
    switch (node.type) {
      case '{':
      case '}':
      case ';':
      case 'comment':
      case 'return':
        break
      case 'false':
      case 'true':
        statement = {
          type: 'boolean_literal',
          value: node.type,
        }
      case 'field_expression':
        statement = processFieldExpression({ ...input, node })
        break
      case 'conditional_expression':
        statement = processConditionalExpression({ ...input, node })
        break
      case 'number_literal':
        statement = {
          type: 'number_literal',
          value: node.text,
        }
        break
      case 'identifier':
        statement = {
          type: 'reference',
          name: node.text,
        }
        break
      case 'call_expression':
        statement = processCallExpression({ ...input, node })
        break
      case 'subscript_expression':
        statement = processSubscriptExpression({ ...input, node })
        break
      case 'binary_expression':
        statement = processBinaryExpression({ ...input, node })
        break
      case 'unary_expression':
        statement = processUnaryExpression({ ...input, node })
        break
      default:
        throwNode(node, input.node)
    }
  })
  return statement
}

function processConditionalExpression(input) {
  let phases = []

  input.node.children.forEach(node => {
    switch (node.type) {
      case '(':
      case ')':
      case '?':
      case ':':
      case 'comment':
        break
      case 'number_literal':
        phases.push({
          type: 'number_literal',
          value: node.text,
        })
        break
      case 'user_defined_literal':
        phases.push({
          type: 'user_defined_literal',
          text: node.text,
        })
        break
      case 'identifier':
        phases.push({
          type: 'reference',
          name: node.text,
        })
        break
      case 'conditional_expression':
        phases.push(processConditionalExpression({ ...input, node }))
        break
      case 'binary_expression':
        phases.push(processBinaryExpression({ ...input, node }))
        break
      case 'call_expression':
        phases.push(processCallExpression({ ...input, node }))
        break
      default:
        throwNode(node, input.node)
    }
  })
  const test = phases.shift()
  const success = phases.shift()
  const failure = phases.shift()
  return { type: 'conditional_expression', test, success, failure }
}

function processArgumentList(input) {
  const args = []
  input.node.children.forEach(node => {
    switch (node.type) {
      case '(':
      case ')':
      case ',':
      case 'comment':
        break
      case 'true':
      case 'false':
        args.push({
          type: 'boolean_literal',
          value: node.type,
        })
        break
      case 'number_literal':
        args.push({
          type: 'number_literal',
          value: node.text,
        })
        break
      case 'conditional_expression':
        args.push(processConditionalExpression({ ...input, node }))
        break
      case 'identifier':
        args.push({
          type: 'reference',
          name: node.text,
        })
        break
      case 'unary_expression':
        args.push(processUnaryExpression({ ...input, node }))
        break
      case 'subscript_expression':
        args.push(processSubscriptExpression({ ...input, node }))
        break
      case 'binary_expression':
        args.push(processBinaryExpression({ ...input, node }))
        break
      case 'call_expression':
        args.push(processCallExpression({ ...input, node }))
        break
      default:
        throwNode(node, input.node)
    }
  })
  return args
}

function processCallExpression(input) {
  const call = { type: 'call_expression' }
  input.node.children.forEach(node => {
    switch (node.type) {
      case ';':
      case 'comment':
        break
      case 'identifier':
      case 'qualified_identifier':
        call.object = {
          type: 'reference',
          name: node.text.replace(/:+/g, '_'),
        }
        break
      case 'argument_list':
        call.args = processArgumentList({ ...input, node })
        break
      default:
        throwNode(node, input.node)
    }
  })
  return call
}

function processSubscriptExpression(input) {
  const path = { type: 'path', children: [] }
  let child = path
  input.node.children.forEach(node => {
    switch (node.type) {
      case ';':
      case 'comment':
        break
      case '[':
        const newChild = {
          type: 'index',
        }
        child.children.push(newChild)
        child = newChild
      case 'identifier':
        child.expression = {
          type: 'reference',
          name: node.text,
        }
        break
      case 'number_literal':
        child.expression = {
          type: 'number_literal',
          value: node.text,
        }
        break
      case 'field_expression':
        child.children.push(
          ...processFieldExpression({ ...input, node }).children,
        )
        break
      case 'subscript_expression':
        child.children.push(
          ...processSubscriptExpression({ ...input, node }).children,
        )
        break
      case ']':
        child = path
        break
      default:
        throwNode(node, input.node)
    }
  })
  return path
}

function processFieldExpression(input) {
  const path = { type: 'path', children: [] }
  input.node.children.forEach(node => {
    switch (node.type) {
      case 'comment':
      case '.':
        break
      case 'subscript_expression':
        path.children.push(
          ...processSubscriptExpression({ ...input, node }).children,
        )
        break
      case 'field_expression':
        path.children.push(
          ...processFieldExpression({ ...input, node }).children,
        )
        break
      case 'field_identifier':
        path.children.push({
          type: 'reference',
          name: node.text,
        })
        break
      case 'call_expression':
        path.children.push(processCallExpression({ ...input, node }))
        break
      default:
        throwNode(node, input.node)
    }
  })
  return path
}

function processBinaryExpression(input) {
  const expressions = []
  let operator

  input.node.children.forEach(node => {
    switch (node.type) {
      case 'comment':
      case 'identifier':
        expressions.push({
          type: 'reference',
          name: node.text,
        })
        break
      case 'number_literal':
        expressions.push({
          type: 'number_literal',
          value: node.text,
        })
        break
      case '*':
      case '/':
      case '+':
      case '-':
      case '>':
      case '>=':
      case '<':
      case '<=':
      case '**':
      case '!=':
      case '==':
      case '&&':
      case '||':
      case '&':
      case '|':
      case '>>':
      case '<<':
        operator = node.type
        break
      case 'subscript_expression':
        expressions.push(processSubscriptExpression({ ...input, node }))
        break
      case 'unary_expression':
        expressions.push(processUnaryExpression({ ...input, node }))
        break
      case 'call_expression':
        expressions.push(processCallExpression({ ...input, node }))
        break
      case 'parenthesized_expression':
        expressions.push(
          processParenthesizedExpression({ ...input, node }),
        )
        break
      case 'user_defined_literal':
        expressions.push({
          type: 'user_defined_literal',
          text: node.text,
        })
        break
      case 'binary_expression':
        expressions.push(processBinaryExpression({ ...input, node }))
        break
      default:
        throwNode(node, input.node)
    }
  })
  const left = expressions[0]
  const right = expressions[1]
  return { operator, left, right }
}

function processUnaryExpression(input) {
  const exp = { type: 'unary_expression' }
  input.node.children.forEach(node => {
    switch (node.type) {
      case '(':
      case ')':
      case 'comment':
        break
      case '!':
      case '-':
        exp.operator = node.type
        break
      case 'subscript_expression':
        exp.expression = processSubscriptExpression({
          ...input,
          node,
        })
        break
      case 'parenthesized_expression':
        exp.expression = processParenthesizedExpression({
          ...input,
          node,
        })
        break
      case 'qualified_identifier':
      case 'identifier':
        exp.expression = {
          type: 'reference',
          name: node.text.replace(/:+/g, '_'),
        }
        break
      case 'call_expression':
        exp.expression = processCallExpression({ ...input, node })
        break
      default:
        throwNode(node, input.node)
    }
  })
  return exp
}

function processParenthesizedExpression(input) {
  const exp = { type: 'parenthesized_expression' }
  input.node.children.forEach(node => {
    switch (node.type) {
      case '(':
      case ')':
      case 'comment':
        break
      case 'unary_expression':
        exp.value = processUnaryExpression({ ...input, node })
        break
      case 'binary_expression':
        exp.value = processBinaryExpression({ ...input, node })
        break
      case 'conditional_expression':
        exp.value = processConditionalExpression({ ...input, node })
        break
      default:
        throwNode(node, input.node)
    }
  })
  return exp
}

function processFunctionDeclarator(input) {
  const info = {}
  input.node.children.forEach(node => {
    switch (node.type) {
      case '{':
      case '}':
      case 'comment':
        break
      case 'qualified_identifier': {
        const [type, name] = node.text.split(/\s+/)
        info.typeName = type
        info.name = name
        break
      }
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
  return info
}

function processParameterList(input) {
  const parameters = []
  input.node.children.forEach(node => {
    switch (node.type) {
      case '(':
      case ')':
      case ',':
      case 'comment':
        break
      case 'parameter_declaration':
        parameters.push(processParameterDeclaration({ ...input, node }))
        break
      default:
        throwNode(node, input.node)
    }
  })
  return parameters
}

function addTypeQualifier(info, node) {
  if (node.text === 'const') {
    info.isConst = true
  } else {
    throwNode(node)
  }
}

function processReferenceDeclarator(input) {
  const info = {}
  input.node.children.forEach(node => {
    switch (node.type) {
      case '&':
        break
      case 'identifier':
        info.name = node.text
        break
      default:
        throwNode(node, input.node)
    }
  })
  return info
}

function processParameterDeclaration(input) {
  const info = {}
  input.node.children.forEach(node => {
    switch (node.type) {
      case 'comment':
        break
      case 'type_identifier':
      case 'primitive_type':
        info.typeName = node.text
        break
      case 'type_qualifier':
        addTypeQualifier(info, node)
        break
      case 'reference_declarator': {
        const ref = processReferenceDeclarator({ ...input, node })
        info.isRef = true
        info.name = ref.name
        break
      }
      case 'identifier':
        info.name = node.text
        break
      default:
        throwNode(node, input.node)
    }
  })
  return info
}

function throwNode(node, ctx) {
  console.log(node)
  throw new Error(
    `Unhandled node type '${node.type}' in context '${
      ctx?.type ?? 'file'
    }'`,
  )
}
