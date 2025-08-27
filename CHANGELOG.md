## v1.0.1

[v1.0.0...v1.0.1](https://github.com/Jannchie/pixi-live2d-display/compare/v1.0.0...v1.0.1)

### :adhesive_bandage: Fixes

- **patch-dts-generator**: update import assertion syntax - By [Jannchie](mailto:jannchie@gmail.com) in [0f97125](https://github.com/Jannchie/pixi-live2d-display/commit/0f97125)
- update deps && use url constructor && refactor live2dexpression && improve hitareaframes error handling - By [Jannchie](mailto:jannchie@gmail.com) in [6ef9a7e](https://github.com/Jannchie/pixi-live2d-display/commit/6ef9a7e)

### :wrench: Chores

- **dts-generator**: update validated dts-gen version to 9.5.1 - By [Jannchie](mailto:jannchie@gmail.com) in [cf84dd6](https://github.com/Jannchie/pixi-live2d-display/commit/cf84dd6)

## v1.0.0

[aba311a56a8b968a45993e0e40afa397da29f1a6...v1.0.0](https://github.com/Jannchie/pixi-live2d-display/compare/aba311a56a8b968a45993e0e40afa397da29f1a6...v1.0.0)

### :rocket: Breaking Changes

- **pixi-v8**: migrate to pixi.js v8 api && update dependencies - By [Jannchie](mailto:jannchie@gmail.com) in [eba2eb4](https://github.com/Jannchie/pixi-live2d-display/commit/eba2eb4)
- add "type": "module" to package.json - By [Guan](mailto:821143943@qq.com) in [981fe23](https://github.com/Jannchie/pixi-live2d-display/commit/981fe23)

### :sparkles: Features

- **cubism4**: improve eye blink settings and exposure - By [Jannchie](mailto:jannchie@gmail.com) in [b4cd2e5](https://github.com/Jannchie/pixi-live2d-display/commit/b4cd2e5)
- migrate HitAreaFrames to Pixi v7 - By [Guan](mailto:821143943@qq.com) in [63fad7c](https://github.com/Jannchie/pixi-live2d-display/commit/63fad7c)
- warn of a cubism 2 model being hit tested before first draw - By [Guan](mailto:821143943@qq.com) in [85c03c2](https://github.com/Jannchie/pixi-live2d-display/commit/85c03c2)
- set eventMode to "static" if interactive - By [Guan](mailto:821143943@qq.com) in [6663db0](https://github.com/Jannchie/pixi-live2d-display/commit/6663db0)
- autoInteract not using autoHitTest&&autoFocus as default - By [Guan](mailto:821143943@qq.com) in [5c10383](https://github.com/Jannchie/pixi-live2d-display/commit/5c10383)
- rework model automation - By [Guan](mailto:821143943@qq.com) in [4f95c34](https://github.com/Jannchie/pixi-live2d-display/commit/4f95c34)
- update pixi.js dependency to v7 - By [Guan](mailto:821143943@qq.com) in [d0a389e](https://github.com/Jannchie/pixi-live2d-display/commit/d0a389e)
- add option checkMocConsistency for model creation - By [Guan](mailto:821143943@qq.com) in [46c4c9c](https://github.com/Jannchie/pixi-live2d-display/commit/46c4c9c)

### :adhesive_bandage: Fixes

- **model-settings**: fix relative model asset url resolution - By [Jannchie](mailto:jannchie@gmail.com) in [f8f2f2d](https://github.com/Jannchie/pixi-live2d-display/commit/f8f2f2d)
- unexpected gh-pages in package dependencies - By [Guan](mailto:821143943@qq.com) in [4e57b6e](https://github.com/Jannchie/pixi-live2d-display/commit/4e57b6e)
- dist output being polluted by dev plugins - By [Guan](mailto:821143943@qq.com) in [857ddd9](https://github.com/Jannchie/pixi-live2d-display/commit/857ddd9)
- ZipLoader breaking when importing Live2DFactory with an absolute path - By [Guan](mailto:821143943@qq.com) in [c7a1247](https://github.com/Jannchie/pixi-live2d-display/commit/c7a1247)
- other typing errors - By [Guan](mailto:821143943@qq.com) in [d58ba74](https://github.com/Jannchie/pixi-live2d-display/commit/d58ba74)
- typing errors - By [Guan](mailto:821143943@qq.com) in [0ce0794](https://github.com/Jannchie/pixi-live2d-display/commit/0ce0794)
- inconsistent model's initial state - By [Guan](mailto:821143943@qq.com) in [210d21a](https://github.com/Jannchie/pixi-live2d-display/commit/210d21a)
- unhandled rejection when textures fail to load - By [Guan](mailto:821143943@qq.com) in [063391d](https://github.com/Jannchie/pixi-live2d-display/commit/063391d)
- incorrect delta time - By [Guan](mailto:821143943@qq.com) in [c9f42cc](https://github.com/Jannchie/pixi-live2d-display/commit/c9f42cc)
- ticker not assigned - By [Guan](mailto:821143943@qq.com) in [1b1359e](https://github.com/Jannchie/pixi-live2d-display/commit/1b1359e)
- use full pixi.js in peerDependencies instead of scoped packages - By [Guan](mailto:821143943@qq.com) in [9962aa9](https://github.com/Jannchie/pixi-live2d-display/commit/9962aa9)

### :art: Refactors

- **live2dmodel**: improve type safety and renderer access - By [Jannchie](mailto:jannchie@gmail.com) in [6a2b95d](https://github.com/Jannchie/pixi-live2d-display/commit/6a2b95d)
- fix lint errors - By [Guan](mailto:821143943@qq.com) in [c16df9a](https://github.com/Jannchie/pixi-live2d-display/commit/c16df9a)
- replaces packages re-exported from @pixi/core - By [Guan](mailto:821143943@qq.com) in [84ed4b9](https://github.com/Jannchie/pixi-live2d-display/commit/84ed4b9)

### :lipstick: Styles

- use eslint and prettier - By [Guan](mailto:821143943@qq.com) in [e45baba](https://github.com/Jannchie/pixi-live2d-display/commit/e45baba)

### :memo: Documentation

- **readme**: update pixijs version to v8 and add maintainer credits - By [Jannchie](mailto:jannchie@gmail.com) in [d16cba3](https://github.com/Jannchie/pixi-live2d-display/commit/d16cba3)
- solution for ChromeDriver version mismatch - By [Guan](mailto:821143943@qq.com) in [31317b3](https://github.com/Jannchie/pixi-live2d-display/commit/31317b3)
- update development guide - By [Guan](mailto:821143943@qq.com) in [917b4de](https://github.com/Jannchie/pixi-live2d-display/commit/917b4de)
- change file structure - By [Guan](mailto:821143943@qq.com) in [6dadfc6](https://github.com/Jannchie/pixi-live2d-display/commit/6dadfc6)
- update readme - By [Guan](mailto:821143943@qq.com) in [87b0b56](https://github.com/Jannchie/pixi-live2d-display/commit/87b0b56)

### :wrench: Chores

- **deps**: add terser to dev dependencies - By [Jannchie](mailto:jannchie@gmail.com) in [3ab6111](https://github.com/Jannchie/pixi-live2d-display/commit/3ab6111)
- add warning for missing submodule - By [Guan](mailto:821143943@qq.com) in [ba103ba](https://github.com/Jannchie/pixi-live2d-display/commit/ba103ba)
- fix auth error in publish workflow - By [Guan](mailto:821143943@qq.com) in [08eb442](https://github.com/Jannchie/pixi-live2d-display/commit/08eb442)
- fix publish workflow not working when manually dispatched - By [Guan](mailto:821143943@qq.com) in [5efe8d6](https://github.com/Jannchie/pixi-live2d-display/commit/5efe8d6)
- fix submodule missing in CI - By [Guan](mailto:821143943@qq.com) in [d2a9524](https://github.com/Jannchie/pixi-live2d-display/commit/d2a9524)
- determine dist tag in CI - By [Guan](mailto:821143943@qq.com) in [a8533c3](https://github.com/Jannchie/pixi-live2d-display/commit/a8533c3)
- fix playground page being opened during test - By [Guan](mailto:821143943@qq.com) in [1e2fd36](https://github.com/Jannchie/pixi-live2d-display/commit/1e2fd36)
- clean up dependencies - By [Guan](mailto:821143943@qq.com) in [8ca79b3](https://github.com/Jannchie/pixi-live2d-display/commit/8ca79b3)
- fix commonjs scripts breaking in esm - By [Guan](mailto:821143943@qq.com) in [84dcf41](https://github.com/Jannchie/pixi-live2d-display/commit/84dcf41)
- better test workflow - By [Guan](mailto:821143943@qq.com) in [3b77a30](https://github.com/Jannchie/pixi-live2d-display/commit/3b77a30)
- add publish workflow - By [Guan](mailto:821143943@qq.com) in [4145c9c](https://github.com/Jannchie/pixi-live2d-display/commit/4145c9c)
- upload CI artifact on failure - By [Guan](mailto:821143943@qq.com) in [5786c28](https://github.com/Jannchie/pixi-live2d-display/commit/5786c28)
- fix build error - By [Guan](mailto:821143943@qq.com) in [41bc8b0](https://github.com/Jannchie/pixi-live2d-display/commit/41bc8b0)
- update vite to v4 - By [Guan](mailto:821143943@qq.com) in [e0c25c2](https://github.com/Jannchie/pixi-live2d-display/commit/e0c25c2)
- update setup script to download Cubism 4 R7 - By [Guan](mailto:821143943@qq.com) in [9413ad5](https://github.com/Jannchie/pixi-live2d-display/commit/9413ad5)
- remove yarn.lock - By [Guan](mailto:821143943@qq.com) in [3ed6b31](https://github.com/Jannchie/pixi-live2d-display/commit/3ed6b31)
- update gh workflow - By [Guan](mailto:821143943@qq.com) in [5137708](https://github.com/Jannchie/pixi-live2d-display/commit/5137708)
- replace yarn with npm - By [Guan](mailto:821143943@qq.com) in [d436041](https://github.com/Jannchie/pixi-live2d-display/commit/d436041)
