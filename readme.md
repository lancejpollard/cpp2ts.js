# C++ to TypeScript (rough approximation)

This is a Node.js library for converting C++ code to TypeScript, **to a rough approximation**. It is not meant to be a runnable port of a C++ library to TypeScript, that isn't really straightforward or necessarily possible. Instead, imagine you are trying to port a C++ library to TypeScript. You need to copy the details of a function implementation, changing syntax here and there from C++ to TypeScript. But that is really error prone, you can make lots of mistakes. This library translates the common stuff from C++ to TypeScript, so you can then fine-tune it by hand, cutting out the tedious work of changing the high-level syntax.

So this library is like an aid to your process of porting code from C++ to TypeScript, not a perfect translator. It just saves you some time and avoids some tediousness.

## Dev Notes

Generate AST in JSON for C and C++

```bash
# c
clang -cc1 -undef -fsyntax-only -ast-dump=json file.c > file.json
# c++
clang++ -Xclang -ast-dump=json -fsyntax-only file.cpp > file.json
# specific function
clang++ -Xclang -ast-dump=json -ast-dump-filter=function_name -fsyntax-only file.cpp > file.json
```
