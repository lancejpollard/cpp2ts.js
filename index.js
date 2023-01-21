const prettier = require('prettier')

module.exports = convert

function convert(jsonAst) {
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
    prettierPath: './node_modules/prettier',
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
  const text = []
  ast.inner.forEach(node => text.push(...processNode(node)))
  return text.join('\n')
}

function traverseNamespace(node, options = {}) {
  const text = []
  const path = options.path ?? []
  path.push(node.name)
  const childOptions = { ...options, path }
  node.inner?.forEach(node =>
    text.push(...processNode(node, childOptions)),
  )
  return text
}

function processNode(node, options = {}) {
  const text = []
  switch (node.kind) {
    case 'ClassTemplateDecl':
      text.push(...traverseClassTemplate(node, options))
      break
    case 'NamespaceDecl':
      traverseNamespace(node).forEach(line => {
        text.push(line)
      })
      break
    case 'FullComment':
      // skip
      break
    case 'TypedefDecl':
      text.push(`class ${getName(node.name, options.path)} {`)
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
      node.inner?.forEach(node => {
        processNode(node, options).forEach(line => {
          text.push(`  ${line}`)
        })
      })
      text.push('}')
      break
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
      if (node.tagUsed === 'union') {
        text.push(...traverseUnion(node, options))
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
    case 'TypedefType':
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
      text.push(...traverseTypedef(node, options))
      break
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
      text.push(...traverseFunctionDecl(node, options))
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
      text.push(...traverseFunctionParam(node, options))
      break
    case 'CompoundStmt':
      node.inner?.forEach(node => {
        text.push(...processNode(node, options))
      })
      break
    case 'IfStmt':
      // "kind": "IfStmt",
      // "hasElse": true,
      // "inner": [
      text.push(...traverseIfStmt(node, options))
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
      text.push(...traverseBinaryOperator(node, options))
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
      text.push(...traverseImplicitCastExpr(node, options))
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
      text.push(...traverseUnaryOperator(node, options))
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
      text.push(...traverseMemberExpr(node, options))
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
      text.push(...traverseDeclaration(node, options))
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
      text.push(...traverseIntegerLiteral(node, options))
      break
    case 'ParenExpr':
      // {
      //   "kind": "ParenExpr",
      //   "type": {
      //     "qualType": "bool"
      //   },
      //   "valueCategory": "prvalue",
      //   "inner": [
      text.push(...traverseParenExpr(node, options))
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
      text.push(...traverseParenExpr(node, options))
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
      text.push(...traverseCharacterLiteral(node, options))
      break
    case 'ReturnStmt':
      // {
      //   "kind": "ReturnStmt",
      //   "inner": [
      text.push(...traverseReturnStmt(node, options))
      break
    case 'CallExpr':
      // {
      //   "kind": "CallExpr",
      //   "type": {
      //     "qualType": "int"
      //   },
      //   "valueCategory": "prvalue",
      //   "inner": [
      text.push(...traverseCallExpr(node, options))
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
      text.push(...traverseExprWithCleanups(node, options))
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

function traverseTypedef(node, options) {
  const header = [`class ${node.decl.name} {`]
  const text = [header.join('')]
  node.inner.forEach(node => text.push(...processNode(node, options)))
  text.push('}')
  return text
}

function traverseFunctionDecl(node, options) {
  const header = [`function ${node.name} {`]
  const text = [header.join('')]
  node.inner?.forEach(node => text.push(...processNode(node, options)))
  text.push('}')
  return text
}

function traverseFunctionParam(node, options) {
  const header = []
  header.push(`${node.name}: ${getType(node.type.qualType)}`)
  const text = [header.join('')]
  return text
}

function traverseIfStmt(node, options) {
  const condition = []
  const text = []
  node.inner.forEach(node => text.push(...processNode(node, options)))
  return text
}

function traverseBinaryOperator(node, options) {
  const text = []
  const op = node.opcode
  const sides = []
  node.inner.forEach(node => {
    sides.push(processNode(node, options))
  })

  text.push(sides.map(side => `(${side.join('\n')})`).join(` ${op} `))
  return text
}

function traverseImplicitCastExpr(node, options) {
  const text = []
  node.inner.forEach(node => text.push(...processNode(node, options)))
  return text
}

function traverseUnaryOperator(node, options) {
  const text = []
  const { isPostix } = node
  const op = node.opcode
  const sides = []
  node.inner.forEach(node => {
    sides.push(processNode(node, options))
  })
  if (isPostix) {
    text.push(sides.map(side => `(${side.join('\n')})`).join('') + op)
  } else {
    text.push(
      `${op}` + sides.map(side => `(${side.join('\n')})`).join(''),
    )
  }
  return text
}

function traverseMemberExpr(node, options) {
  const text = []
  const { isArrow } = node
  const header = []
  header.push(`${node.name}.`)
  node.inner.forEach(node => header.push(...processNode(node, options)))
  text.push(header.join(''))
  return text
}

function traverseDeclaration(node, options) {
  const text = []
  const typeInfo = getTypeInfo(node.type.qualType)
  const header = []
  if (typeInfo.ref) {
    header.push(`/* ref */ `)
  }
  header.push(`let ${node.referencedDecl.name}: ${typeInfo.name}`)
  return text
}

function traverseIntegerLiteral(node, options) {
  const text = []
  const typeName = getType(node.type.qualType)
  const value = parseInt(node.value, 10)
  text.push(value)
  return text
}

function traverseParenExpr(node, options) {
  const text = ['(']
  node.inner.forEach(node => text.push(...processNode(node, options)))
  text.push(')')
  return text
}

function traverseParenExpr(node, options) {
  const text = ['(']
  node.inner.forEach(node => text.push(...processNode(node, options)))
  text.push(') as ' + node.castKind)
  return text
}

function traverseCharacterLiteral(node, options) {
  const text = [`'${node.value}'`]
  return text
}

function traverseReturnStmt(node, options) {
  const text = ['return']
  if (node.inner) {
    text[0] += ' ('
  }
  node.inner?.forEach(node => text.push(...processNode(node, options)))
  if (node.inner) {
    text.push(')')
  }
  return text
}

function traverseCallExpr(node, options) {
  const text = []
  node.inner.forEach(node => text.push(...processNode(node, options)))
  return text
}

function traverseExprWithCleanups(node, options) {
  const text = []
  node.inner.forEach(node => text.push(...processNode(node, options)))
  return text
}

function traverseTodo(node, options) {
  const text = []
  return text
}

function traverseUnion(node, options) {
  const text = []
  return text
}

function traverseClassTemplate(node, options) {
  const text = []
  return text
}

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
