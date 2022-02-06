# lionp

Like [np](https://github.com/sindresorhus/np) but for my personal publish workflow:

- Runs a Node build script and resets version if build fails
- Always publishes under a dist/ folder
- Uses [pnpm](https://pnpm.io)

## Tasks

1. Validate project git state
2. Bumps version in package.json
3. Runs test scripts (if fails, reverts to old version)
4. Runs build scripts (if fails, reverts to old version)
5. Runs publish script

## Run
```zsh
lionp
```
