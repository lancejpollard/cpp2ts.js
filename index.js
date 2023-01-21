const prettier = require('prettier')

module.exports = convert

function convert(jsonAst) {
  return traverseAST(jsonAst)
}

convert.pretty = pretty

function pretty(jsonAst) {
  return prettier.format(traverseAST(jsonAst), {
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

function traverseAST(ast) {
  const body = []
  const module = [body]
  const path = []
  ast.inner.forEach(node => processNode({ node, body, module, path }))
  return module.map(body => body.join('\n')).join('\n')
}

function traverseNamespace(input) {
  const childPath = input.path.concat()
  childPath.push(input.node.name)
  input.node.inner?.forEach(node =>
    processNode({ ...input, node, path: childPath }),
  )
}

function processNode(input) {
  const text = []
  switch (input.node.kind) {
    case 'ClassTemplateDecl': {
      const body = []
      input.module.push(body)
      traverseClassTemplate({ ...input, body })
      break
    }
    case 'NamespaceDecl':
      traverseNamespace(input)
      break
    case 'FullComment':
      // skip
      break
    case 'TypedefDecl': {
      // {
      //   "kind": "TypedefDecl",
      //   "isImplicit": true,
      //   "isReferenced": true,
      //   "name": "__int128_t",
      //   "type": {
      //     "qualType": "__int128"
      //   },
      //   "inner": [
      //     {
      //       "kind": "BuiltinType",
      //       "type": {
      //         "qualType": "__int128"
      //       }
      //     }
      //   ]
      // }
      const body = []
      input.module.push(body)
      traverseTypedefDecl({ ...input, body })
      break
    }
    case 'RecordType':
      // records are structs
      // https://jcsites.juniata.edu/faculty/rhodes/cs2/ch05a.htm
      // {
      //   "kind": "RecordType",
      //   "type": {
      //     "qualType": "__NSConstantString_tag"
      //   },
      //   "decl": {
      //     "id": "0x7fecd4832b38",
      //     "kind": "CXXRecordDecl",
      //     "name": "__NSConstantString_tag"
      //   }
      // }
      break
    case 'BuiltinType':
      // {
      //   "kind": "BuiltinType",
      //   "type": {
      //     "qualType": "__int128"
      //   }
      // }
      break
    case 'PointerType':
      // {
      //   "kind": "PointerType",
      //   "type": {
      //     "qualType": "char *"
      //   },
      //   "inner": [
      //     {
      //       "kind": "BuiltinType",
      //       "type": {
      //         "qualType": "char"
      //       }
      //     }
      //   ]
      // }
      break
    case 'ConstantArrayType':
      // {
      //   "kind": "ConstantArrayType",
      //   "type": {
      //     "qualType": "__va_list_tag[1]"
      //   },
      //   "size": 1,
      //   "inner": [
      //     {
      //       "kind": "RecordType",
      //       "type": {
      //         "qualType": "__va_list_tag"
      //       },
      //       "decl": {
      //         "id": "0x7fecd4832f60",
      //         "kind": "CXXRecordDecl",
      //         "name": "__va_list_tag"
      //       }
      //     }
      //   ]
      // }
      break
    case 'CXXRecordDecl':
      // {
      //   "kind": "CXXRecordDecl",
      //   "tagUsed": "union",
      //   "completeDefinition": true,
      //   "definitionData": {
      //     "canPassInRegisters": true,
      //     "copyAssign": {
      //       "hasConstParam": true,
      //       "implicitHasConstParam": true,
      //       "needsImplicit": true,
      //       "simple": true,
      //       "trivial": true
      //     },
      //     "copyCtor": {
      //       "hasConstParam": true,
      //       "implicitHasConstParam": true,
      //       "simple": true,
      //       "trivial": true
      //     },
      //     "defaultCtor": {
      //       "exists": true,
      //       "trivial": true
      //     },
      //     "dtor": {
      //       "irrelevant": true,
      //       "needsImplicit": true,
      //       "simple": true,
      //       "trivial": true
      //     },
      //     "hasVariantMembers": true,
      //     "isAggregate": true,
      //     "isLiteral": true,
      //     "isPOD": true,
      //     "isStandardLayout": true,
      //     "isTrivial": true,
      //     "isTriviallyCopyable": true,
      //     "moveAssign": {
      //       "exists": true,
      //       "needsImplicit": true,
      //       "simple": true,
      //       "trivial": true
      //     },
      //     "moveCtor": {
      //       "exists": true,
      //       "needsImplicit": true,
      //       "simple": true,
      //       "trivial": true
      //     }
      //   },
      //   "inner": [
      //     {
      //       "kind": "FieldDecl",
      //       "name": "__mbstate8",
      //       "type": {
      //         "qualType": "char[128]"
      //       }
      //     },
      //     {
      //       "kind": "FieldDecl",
      //       "name": "_mbstateL",
      //       "type": {
      //         "qualType": "long long"
      //       }
      //     },
      //     {
      //       "kind": "CXXConstructorDecl",
      //       "isImplicit": true,
      //       "isUsed": true,
      //       "name": "",
      //       "mangledName": "__ZN11__mbstate_tC1Ev",
      //       "type": {
      //         "qualType": "void () throw()"
      //       },
      //       "inline": true,
      //       "explicitlyDefaulted": "default",
      //       "inner": [
      //         {
      //           "kind": "CompoundStmt"
      //         }
      //       ]
      //     },
      //     {
      //       "kind": "CXXConstructorDecl",
      //       "isImplicit": true,
      //       "name": "",
      //       "mangledName": "__ZN11__mbstate_tC1ERKS_",
      //       "type": {
      //         "qualType": "void (const __mbstate_t &)"
      //       },
      //       "inline": true,
      //       "explicitlyDefaulted": "default",
      //       "inner": [
      //         {
      //           "kind": "ParmVarDecl",
      //           "type": {
      //             "qualType": "const __mbstate_t &"
      //           }
      //         }
      //       ]
      //     }
      //   ]
      // }
      if (input.node.tagUsed === 'union') {
        traverseUnion(input)
      }
      break
    case 'ElaboratedType':
      // {
      //   "kind": "ElaboratedType",
      //   "type": {
      //     "qualType": "union __mbstate_t"
      //   },
      //   "ownedTagDecl": {
      //     "id": "0x7fecd600da08",
      //     "kind": "CXXRecordDecl",
      //     "name": ""
      //   },
      //   "inner": [
      //     {
      //       "kind": "RecordType",
      //       "type": {
      //         "qualType": "__mbstate_t"
      //       },
      //       "decl": {
      //         "id": "0x7fecd600da08",
      //         "kind": "CXXRecordDecl",
      //         "name": ""
      //       }
      //     }
      //   ]
      // }
      break
    case 'TypedefType': {
      // {
      //   "kind": "TypedefType",
      //   "type": {
      //     "qualType": "__mbstate_t"
      //   },
      //   "decl": {
      //     "id": "0x7fecd600dcf8",
      //     "kind": "TypedefDecl",
      //     "name": "__mbstate_t"
      //   },
      //   "inner": [
      //     {
      //       "kind": "ElaboratedType",
      //       "type": {
      //         "qualType": "union __mbstate_t"
      //       },
      //       "ownedTagDecl": {
      //         "id": "0x7fecd600da08",
      //         "kind": "CXXRecordDecl",
      //         "name": ""
      //       },
      //       "inner": [
      //         {
      //           "kind": "RecordType",
      //           "type": {
      //             "qualType": "__mbstate_t"
      //           },
      //           "decl": {
      //             "id": "0x7fecd600da08",
      //             "kind": "CXXRecordDecl",
      //             "name": ""
      //           }
      //         }
      //       ]
      //     }
      //   ]
      // }
      const body = []
      input.module.push(body)
      traverseTypedef({ ...input, body })
      break
    }
    case 'LinkageSpecDecl':
      // {
      //   "kind": "LinkageSpecDecl",
      //   "language": "C",
      //   "hasBraces": true,
      //   "inner": [
      break
    case 'FunctionDecl':
      // {
      //   "kind": "FunctionDecl",
      //   "name": "__sputc",
      //   "mangledName": "__Z7__sputciP7__sFILE",
      //   "type": {
      //     "qualType": "int (int, FILE *)"
      //   },
      //   "inline": true,
      //   "inner": [
      traverseFunctionDecl(input)
      break
    case 'ParmVarDecl':
      // {
      //   "kind": "ParmVarDecl",
      //   "isUsed": true,
      //   "name": "_c",
      //   "mangledName": "__ZZ7__sputciP7__sFILEE2_c",
      //   "type": {
      //     "qualType": "int"
      //   }
      // }
      traverseFunctionParam(input)
      break
    case 'CompoundStmt':
      input.node.inner?.forEach(node => {
        processNode({ ...input, node })
      })
      break
    case 'IfStmt':
      // "kind": "IfStmt",
      // "hasElse": true,
      // "inner": [
      traverseIfStmt(input)
      break
    case 'BinaryOperator':
      // {
      //   "kind": "BinaryOperator",
      //   "type": {
      //     "qualType": "bool"
      //   },
      //   "valueCategory": "prvalue",
      //   "opcode": "||",
      //   "inner": [
      traverseBinaryOperator(input)
      break
    case 'ImplicitCastExpr':
      // {
      //   "kind": "ImplicitCastExpr",
      //   "type": {
      //     "qualType": "int"
      //   },
      //   "valueCategory": "prvalue",
      //   "castKind": "LValueToRValue",
      //   "inner": [
      traverseImplicitCastExpr(input)
      break
    case 'UnaryOperator':
      // {
      //   "kind": "UnaryOperator",
      //   "type": {
      //     "qualType": "int"
      //   },
      //   "valueCategory": "lvalue",
      //   "isPostfix": false,
      //   "opcode": "--",
      //   "inner": [
      traverseUnaryOperator(input)
      break
    case 'MemberExpr':
      // {
      //   "kind": "MemberExpr",
      //   "type": {
      //     "qualType": "int"
      //   },
      //   "valueCategory": "lvalue",
      //   "name": "_w",
      //   "isArrow": true,
      //   "referencedMemberDecl": "0x7fecd488b010",
      //   "inner": [
      traverseMemberExpr(input)
      break
    case 'DeclRefExpr':
      // A reference to a declared variable, function, enum, etc.
      //
      // {
      //   "kind": "DeclRefExpr",
      //   "type": {
      //     "qualType": "FILE *"
      //   },
      //   "valueCategory": "lvalue",
      //   "referencedDecl": {
      //     "id": "0x7fecd488c780",
      //     "kind": "ParmVarDecl",
      //     "name": "_p",
      //     "type": {
      //       "qualType": "FILE *"
      //     }
      //   }
      // }
      traverseDeclaration(input)
      break
    case 'IntegerLiteral':
      // {
      //   "kind": "IntegerLiteral",
      //   "type": {
      //     "qualType": "int"
      //   },
      //   "valueCategory": "prvalue",
      //   "value": "0"
      // }
      traverseIntegerLiteral(input)
      break
    case 'ParenExpr':
      // {
      //   "kind": "ParenExpr",
      //   "type": {
      //     "qualType": "bool"
      //   },
      //   "valueCategory": "prvalue",
      //   "inner": [
      traverseParenExpr(input)
      break
    case 'CStyleCastExpr':
      // {
      //   "kind": "CStyleCastExpr",
      //   "type": {
      //     "qualType": "char"
      //   },
      //   "valueCategory": "prvalue",
      //   "castKind": "NoOp",
      //   "inner": [
      traverseParenExpr(input)
      break
    case 'CharacterLiteral':
      // {
      //   "kind": "CharacterLiteral",
      //   "type": {
      //     "qualType": "char"
      //   },
      //   "valueCategory": "prvalue",
      //   "value": 10
      // }
      traverseCharacterLiteral(input)
      break
    case 'ReturnStmt':
      // {
      //   "kind": "ReturnStmt",
      //   "inner": [
      traverseReturnStmt(input)
      break
    case 'CallExpr':
      // {
      //   "kind": "CallExpr",
      //   "type": {
      //     "qualType": "int"
      //   },
      //   "valueCategory": "prvalue",
      //   "inner": [
      traverseCallExpr(input)
      break
    case 'AlwaysInlineAttr':
      // {
      //   "kind": "AlwaysInlineAttr"
      // }
      break
    case 'ExprWithCleanups':
      // {
      //   "kind": "ExprWithCleanups",
      //   "type": {
      //     "qualType": "std::nullptr_t"
      //   },
      //   "valueCategory": "prvalue",
      //   "inner": [
      traverseExprWithCleanups(input)
      break
    case 'CXXConstructExpr':
      // {
      //   "kind": "CXXConstructExpr",
      //   "type": {
      //     "qualType": "std::nullptr_t"
      //   },
      //   "valueCategory": "prvalue",
      //   "ctorType": {
      //     "qualType": "void (const std::nullptr_t &) throw()"
      //   },
      //   "elidable": true,
      //   "hadMultipleCandidates": true,
      //   "constructionKind": "complete",
      //   "inner": [
      break
    case 'VisibilityAttr':
      break
    case 'InternalLinkageAttr':
      break
    case 'UsingDecl':
      // {
      //   "kind": "UsingDecl",
      //   "name": "::ptrdiff_t",
      //   "inner": [
      //     {
      //       "kind": "UsingIfExistsAttr"
      //     }
      //   ]
      // }
      break
    case 'UsingShadowDecl':
      break
    case 'ClassTemplateSpecializationDecl':
      break
    case 'ClassTemplatePartialSpecializationDecl':
      break
    case 'TypeAliasTemplateDecl':
      break
    case 'FunctionTemplateDecl':
      break
    case 'TemplateSpecializationType':
      break
    case 'VarDecl':
      break
    case 'EnumDecl':
      break
    case 'AvailabilityAttr':
      break
    case 'ReturnsNonNullAttr':
      break
    case 'AllocSizeAttr':
      break
    case 'RestrictAttr':
      break
    case 'RecoveryExpr':
      break
    case 'DeclStmt':
      break
    case 'CXXThrowExpr':
      break
    case 'ConditionalOperator':
      break
    case 'CXXMethodDecl':
      break
    case 'CXXOperatorCallExpr':
      break
    case 'CXXStaticCastExpr':
      break
    case 'WhileStmt':
      break
    case 'TypeAliasDecl':
      break
    case 'CXXMemberCallExpr':
      break
    case 'CXXConstructorDecl':
      break
    case 'CXXDestructorDecl':
      break
    case 'ArraySubscriptExpr':
      break
    case 'UnaryExprOrTypeTraitExpr':
      break
    case 'CompoundAssignOperator':
      break
    case 'CXXFunctionalCastExpr':
      break
    case 'OpaqueValueExpr':
      break
    case 'ForStmt':
      break
    case 'CXXBoolLiteralExpr':
      break
    case 'FloatingLiteral':
      break
    case 'NullStmt':
      break
    default:
      console.log(JSON.stringify(node, null, 2))
      throw new Error('Unhandled node type ' + node.kind)
  }
  return text
}

function traverseTypedefDecl(input) {
  input.body.push(`class ${getName(input.node.name, input.path)} {`)
  input.node.inner?.forEach(node => {
    processNode({ ...input, node })
  })
  input.body.push('}')
}

function traverseTypedef(input) {
  const header = [`class ${input.node.decl.name} {`]
  input.body.push(header.join(''))
  input.node.inner.forEach(node => processNode({ ...input, node }))
  input.body.push('}')
}

function traverseFunctionDecl(input) {
  const header = [`function ${input.node.name}() {`]
  input.body.push(header.join(''))
  input.node.inner?.forEach(node => processNode({ ...input, node }))
  input.body.push('}')
}

function traverseFunctionParam(input) {
  const header = []
  header.push(
    `${input.node.name}: ${getType(input.node.type.qualType)}`,
  )
  input.body.push(header.join(''))
}

function traverseIfStmt(input) {
  const condition = []
  input.node.inner.forEach(node => processNode({ ...input, node }))
}

function traverseBinaryOperator(input) {
  const op = input.node.opcode
  const sides = []
  input.node.inner.forEach(node => {
    processNode({ ...input, node, body: sides })
  })

  input.body.push(sides.join(` ${op} `))
}

function traverseImplicitCastExpr(input) {
  input.node.inner.forEach(node => processNode({ ...input, node }))
}

function traverseUnaryOperator(input) {
  const { isPostix } = input.node
  const op = input.node.opcode
  const sides = []
  input.node.inner.forEach(node => {
    processNode({ ...input, node, body: sides })
  })
  if (isPostix) {
    input.body.push(sides.join('\n') + op)
  } else {
    input.body.push(`${op}` + sides.join('\n'))
  }
}

function traverseMemberExpr(input) {
  const { isArrow } = input.node
  const header = []
  header.push(`${input.node.name}.`)
  input.node.inner.forEach(node => {
    processNode({ ...input, node, body: header })
  })
  input.body.push(header.join(''))
}

function traverseDeclaration(input) {
  const typeInfo = getTypeInfo(input.node.type.qualType)
  const header = []
  if (typeInfo.ref) {
    header.push(`/* ref */ `)
  }
  header.push(`let ${input.node.referencedDecl.name}: ${typeInfo.name}`)
  input.body.push(header.join(''))
}

function traverseIntegerLiteral(input) {
  const typeName = getType(input.node.type.qualType)
  const value = parseInt(input.node.value, 10)
  input.body.push(value)
}

function traverseParenExpr(input) {
  input.body.push('(')
  input.node.inner.forEach(node => processNode({ ...input, node }))
  input.body.push(')')
}

function traverseParenExpr(input) {
  input.body.push('(')
  input.node.inner.forEach(node => processNode({ ...input, node }))
  input.body.push(') as ' + input.node.castKind)
}

function traverseCharacterLiteral(input) {
  input.body.push(`'${input.node.value}'`)
}

function traverseReturnStmt(input) {
  const header = ['return']
  if (input.node.inner) {
    header.push(' (')
  }
  input.body.push(header.join(''))
  input.node.inner?.forEach(node => processNode({ ...input, node }))
  if (input.node.inner) {
    input.body.push(')')
  }
}

function traverseCallExpr(input) {
  input.node.inner.forEach(node => processNode({ ...input, node }))
}

function traverseExprWithCleanups(input) {
  input.node.inner.forEach(node => processNode({ ...input, node }))
}

function traverseTodo(input) {
  const text = []
  return text
}

function traverseUnion(input) {}

function traverseClassTemplate(input) {}

function getName(name, path = []) {
  const parts = path.concat()
  parts.push(name)
  return parts.join('_')
}

function getType(name) {
  switch (name) {
    case 'int':
      return 'number'
    default:
      return name
  }
}

function getTypeInfo(string) {
  let parts = string.split(/\s+/)
  let name = getType(parts.shift())
  if (parts.length > 1) {
    // uncomment to check
    // throw new Error(parts.join(' '))
  }
  let isRef = parts[0] === '*'
  return { name, isRef }
}
