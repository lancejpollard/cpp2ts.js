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

## Testing

To be able to run the ast tool on the C++ file in `test/fixtures`, you
need to download the
[hyperrogue](https://github.com/zenorogue/hyperrogue) repo and install
its dependencies.

```
git clone git@github.com:zenorogue/hyperrogue.git
cd hyperrogue
brew install sdl sdl_gfx sdl_mixer sdl_ttf
```

Then from there, you can run the next commands to generate AST in JSON
for C and C++

```bash
# c++
clang++ -Xclang -ast-dump=json -fsyntax-only file.cpp > file.json
```
