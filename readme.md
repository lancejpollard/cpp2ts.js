# C++ to TypeScript (rough approximation)

This is a Node.js library for converting C++ code to TypeScript, **to a
rough approximation**. It is not meant to be a runnable port of a C++
library to TypeScript, that isn't really straightforward or necessarily
possible. Instead, imagine you are trying to port a C++ library to
TypeScript. You need to copy the details of a function implementation,
changing syntax here and there from C++ to TypeScript. But that is
really error prone, you can make lots of mistakes. This library
translates the common stuff from C++ to TypeScript, so you can then
fine-tune it by hand, cutting out the tedious work of changing the
high-level syntax.

So this library is like an aid to your process of porting code from C++
to TypeScript, not a perfect translator. It just saves you some time and
avoids some tediousness.

## Development

This is not yet a fully complete project. You can test it out on a
snippet of C++, and if you get an error, it might look like this:

```
Error: Unhandled node type 'import_from_statement' in context 'module'
```

If so, just go and add an `import_from_statement` handler (in the switch
statement) in the `module` handler. It's pretty basic, check out the
source code!
