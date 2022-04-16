# lionp

[![npm version](https://img.shields.io/npm/v/lionp)](https://npmjs.com/package/lionp)

A fork of [np](https://github.com/sindresorhus/np) customized for my personal publish workflow:

- Runs a Node build script and resets version if build fails
- Always publishes under a `dist/` folder
- Uses [pnpm](https://pnpm.io)
- Automatically transforms the development `package.json` into a production `package.json`

## Run

```shell
lionp
```
