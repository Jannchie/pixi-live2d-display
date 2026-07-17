## Cloning the repo

Clone the repo with its submodule (the Cubism Web Framework):

```sh
git clone https://github.com/Jannchie/pixi-live2d-display.git --recursive
```

Or via SSH:

```sh
git clone git@github.com:Jannchie/pixi-live2d-display.git --recursive
```

If you have already cloned it without `--recursive`, run:

```sh
git submodule update --init
```

## Setup

This project uses [pnpm](https://pnpm.io/) as the package manager.

Install dependencies:

```sh
pnpm install
```

Download Live2D core files into `./core`:

```sh
pnpm run setup
```

## Testing

Tests run in a real Chrome browser via Vitest and WebdriverIO. There's a bundle test that requires a production build, so before running the tests for the first time, you need to build the project:

```sh
pnpm build
```

Then you can run the tests:

```sh
pnpm test
```

Or run the tests and update snapshots:

```sh
pnpm test:u
```

## Playground

The playground is for debugging and testing. To run the playground:

```sh
pnpm playground
```

Then make changes to `playground/index.ts` and check the result.

Changes to this file should _not_ be committed to git. You can run this command to tell git not to track this file:

```sh
git update-index --skip-worktree playground/index.ts
```

## Contributing

Contributions are welcome! Please open an issue or submit a pull request if you have any ideas or suggestions.

Before contributing, or better yet, before each commit, please run the following command to lint and fix the code:

```sh
pnpm lint:fix
```

If there are any errors that cannot be fixed automatically, please fix them manually.
