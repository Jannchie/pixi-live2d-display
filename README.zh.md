# pixi-live2d-display

![NPM Version](https://img.shields.io/npm/v/%40jannchie%2Fpixi-live2d-display?style=flat-square)
![Cubism version](https://img.shields.io/badge/Cubism-2/3/4-ff69b4?style=flat-square)
![GitHub Workflow Status](https://img.shields.io/github/actions/workflow/status/Jannchie/pixi-live2d-display/test.yml?style=flat-square)

[English](README.md) | 中文

为 [PixiJS](https://github.com/pixijs/pixi.js) v8 提供的 Live2D 插件

此项目旨在成为 web 平台上的通用 Live2D 框架。由于 Live2D 的官方框架非常复杂且不可靠，这个项目已将其重写以提供统一且简单的 API，使你可以从较高的层次来控制 Live2D 模型而无需了解其内部的工作原理

## 维护者

此仓库由 [Jannchie](mailto:jannchie@gmail.com) 维护，以
[`@jannchie/pixi-live2d-display`](https://www.npmjs.com/package/@jannchie/pixi-live2d-display) 的包名发布在 npm 上。

最初由 [guansss](https://github.com/guansss) 创建。感谢原作者的基础工作。

#### 特性

- 支持所有版本的 Live2D 模型
- 支持 PIXI.RenderTexture 和 PIXI.Filter
- Pixi 风格的变换 API：position, scale, rotation, skew, anchor
- 自动交互：鼠标跟踪, 点击命中检测
- 比官方框架更好的动作预约逻辑
- 口型同步：支持音频播放（`speak()`）、麦克风输入或手动控制
- 可在运行时开关自动眨眼、呼吸和风（Cubism 4 物理）效果
- 从上传的文件或 zip 文件中加载 (实验性功能)
- 完善的类型定义 - 我们都喜欢类型！

#### 要求

- PixiJS：8.x
- Cubism core：2.1 或 4
- 浏览器：WebGL，ES6

#### 示例

- [Live2D Viewer Online](https://guansss.github.io/live2d-viewer-web/)
- 原项目的示例（[基础](https://codepen.io/guansss/pen/oNzoNoz/left?editors=1010)、
  [交互](https://codepen.io/guansss/pen/KKgXBOP/left?editors=0010)、
  [渲染纹理与滤镜](https://codepen.io/guansss/pen/qBaMNQV/left?editors=1010)）基于原版
  `pixi-live2d-display` 包和 PixiJS v6，初始化代码与本包有所不同
- 想看最新的用法示例，可以在本仓库运行 playground（`pnpm playground`）

#### 文档

- [使用指南](docs/docs/index.md)（位于本仓库 `docs/docs/` 目录，暂无中文翻译）
- [开发指南](DEVELOPMENT.md)

## Cubism

Cubism 是 Live2D SDK 的名称，目前有 3 个版本：Cubism 2.1、Cubism 3、Cubism 4，其中 Cubism 4 可以与 Cubism 3 的模型兼容

该插件使用 Cubism 2.1 和 Cubism 4，从而支持所有版本的 Live2D 模型

#### Cubism Core

在使用该插件之前，你需要加载 Cubism 运行时，也就是 Cubism Core

Cubism 4 需要加载 `live2dcubismcore.min.js`，可以从 [Cubism 4 SDK](https://www.live2d.com/download/cubism-sdk/download-web/)
里解压出来，或者直接引用[这个链接](https://cubism.live2d.com/sdk-web/cubismcore/live2dcubismcore.min.js)
（_链接偶尔会挂掉，不要在生产版本中使用！_）

Cubism 2.1 需要加载 `live2d.min.js`，[从 2019/9/4 起](https://help.live2d.com/en/other/other_20/)
，官方已经不再提供该版本 SDK 的下载，但是可以从 [这里](https://github.com/dylanNew/live2d/tree/master/webgl/Live2D/lib)
找到，以及你大概想要的 [CDN 链接](https://cdn.jsdelivr.net/gh/dylanNew/live2d/webgl/Live2D/lib/live2d.min.js)

#### 单独的打包文件

该插件为每个 Cubism 版本提供了单独的打包文件，从而在你只想使用其中一个版本的时候减少需要加载文件的大小。

具体来说，为两种版本分别提供了 `cubism2.js` 和 `cubism4.js`，以及一个同时包含了两种版本的 `index.js`

注意，如果你想同时支持 Cubism 2.1 和 Cubism 4 的话，请使用 `index.js`，_而不要同时使用_ `cubism2.js` 和 `cubism4.js`

为了更明确一点，这里列出使用这些文件的方法：

- 使用 `cubism2.js`+`live2d.min.js` 以支持 Cubism 2.1 模型
- 使用 `cubism4.js`+`live2dcubismcore.min.js` 以支持 Cubism 3 和 Cubism 4 模型
- 使用 `index.js`+`live2d.min.js`+`live2dcubismcore.min.js` 以支持所有版本的模型

## 安装

#### 通过 npm

```sh
npm install @jannchie/pixi-live2d-display pixi.js
```

```js
import { Live2DModel } from '@jannchie/pixi-live2d-display';

// 如果只需要 Cubism 2.1
import { Live2DModel } from '@jannchie/pixi-live2d-display/cubism2';

// 如果只需要 Cubism 4
import { Live2DModel } from '@jannchie/pixi-live2d-display/cubism4';
```

#### 通过 CDN

UMD 打包文件依赖全局的 `PIXI` 命名空间，因此需要先加载 PixiJS

```html
<script src="https://cdn.jsdelivr.net/npm/pixi.js@8/dist/pixi.min.js"></script>

<script src="https://cdn.jsdelivr.net/npm/@jannchie/pixi-live2d-display/dist/index.min.js"></script>

<!-- 如果只需要 Cubism 2.1 -->
<script src="https://cdn.jsdelivr.net/npm/@jannchie/pixi-live2d-display/dist/cubism2.min.js"></script>

<!-- 如果只需要 Cubism 4 -->
<script src="https://cdn.jsdelivr.net/npm/@jannchie/pixi-live2d-display/dist/cubism4.min.js"></script>
```

通过这种方式加载的话，所有成员都会被导出到 `PIXI.live2d` 命名空间下，比如 `PIXI.live2d.Live2DModel`

## 基础使用

```javascript
import { Application, Ticker } from 'pixi.js';
import { Live2DModel } from '@jannchie/pixi-live2d-display';

(async function () {
    const app = new Application();

    // PixiJS v8 的初始化是异步的
    await app.init({
        canvas: document.getElementById('canvas'),
        resizeTo: window,
    });

    // 传入 ticker 以便模型自动更新
    const model = await Live2DModel.from('shizuku.model.json', {
        ticker: Ticker.shared,
    });

    app.stage.addChild(model);

    // 变换
    model.x = 100;
    model.y = 100;
    model.rotation = Math.PI;
    model.skew.x = Math.PI;
    model.scale.set(2, 2);
    model.anchor.set(0.5, 0.5);

    // 交互
    model.on('hit', (hitAreas) => {
        if (hitAreas.includes('body')) {
            model.motion('tap_body');
        }
    });
})();
```

如果不传入 `ticker` 选项，也可以把 PIXI 暴露到全局，插件会自动使用 `window.PIXI.Ticker.shared`：

```javascript
import * as PIXI from 'pixi.js';

window.PIXI = PIXI;
```

## 口型同步

```javascript
// 播放音频文件（或 base64 data URL）并自动同步口型
await model.speak('voice.mp3', { volume: 1 });

// 或者使用麦克风输入驱动口型
await model.startMicrophoneLipSync();
model.stopMicrophoneLipSync();

// 或者手动控制口型开合（0 = 闭合，1 = 张开）
model.startLipSync();
model.setLipSyncValue(0.8);
model.stopLipSync();
```

---

示例的 Live2D 模型 Shizuku (Cubism 2.1) 和 Haru (Cubism 4) 遵守 Live2D 的
[Free Material License](https://www.live2d.com/eula/live2d-free-material-license-agreement_en.html)
