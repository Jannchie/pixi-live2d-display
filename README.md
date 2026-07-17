# pixi-live2d-display

![NPM Version](https://img.shields.io/npm/v/%40jannchie%2Fpixi-live2d-display?style=flat-square)
![Cubism version](https://img.shields.io/badge/Cubism-2/3/4-ff69b4?style=flat-square)
![GitHub Workflow Status](https://img.shields.io/github/actions/workflow/status/Jannchie/pixi-live2d-display/test.yml?style=flat-square)

English | [中文](README.zh.md)

Live2D integration for [PixiJS](https://github.com/pixijs/pixi.js) v8.

This project aims to be a universal Live2D framework on the web platform. While the official Live2D framework is just
complex and problematic, this project has rewritten it to unify and simplify the APIs, which allows you to control the
Live2D models on a high level without the need to learn how the internal system works.

## Maintainer

This repo is maintained by [Jannchie](mailto:jannchie@gmail.com), published on npm
as [`@jannchie/pixi-live2d-display`](https://www.npmjs.com/package/@jannchie/pixi-live2d-display).

Originally created by [guansss](https://github.com/guansss). Credit to the original author for the foundational work.

#### Features

- Supports all versions of Live2D models
- Supports PIXI.RenderTexture and PIXI.Filter
- Pixi-style transform APIs: position, scale, rotation, skew, anchor
- Automatic interactions: focusing, hit-testing
- Enhanced motion reserving logic compared to the official framework
- Lip sync: from audio playback (`speak()`), microphone input, or manual values
- Runtime toggles for eye blink, breathing, and wind (Cubism 4 physics)
- Loading from uploaded files / zip files (experimental)
- Fully typed - we all love types!

#### Requirements

- PixiJS: 8.x
- Cubism core: 2.1 or 4
- Browser: WebGL, ES6

#### Demos

- [Live2D Viewer Online](https://guansss.github.io/live2d-viewer-web/)
- The demos of the original project ([basic](https://codepen.io/guansss/pen/oNzoNoz/left?editors=1010),
  [interaction](https://codepen.io/guansss/pen/KKgXBOP/left?editors=0010),
  [render texture & filter](https://codepen.io/guansss/pen/qBaMNQV/left?editors=1010)) are based on the
  original `pixi-live2d-display` package and PixiJS v6, so the setup code differs from this package
- For an up-to-date example, run the playground in this repo (`pnpm playground`)

#### Documentations

- [Guides](docs/docs/index.md) (in this repo, see `docs/docs/`)
- [Development Notes](DEVELOPMENT.md)

## Cubism

Cubism is the name of Live2D SDK. There are so far three versions of it: Cubism 2.1, Cubism 3 and Cubism 4; where Cubism
4 is backward-compatible with Cubism 3 models.

This plugin supports all variants of Live2D models by using Cubism 2.1 and Cubism 4.

#### Cubism Core

Before using the plugin, you'll need to include the Cubism runtime library, aka Cubism Core.

For Cubism 4, you need `live2dcubismcore.min.js` that can be extracted from
the [Cubism 4 SDK](https://www.live2d.com/download/cubism-sdk/download-web/), or be referred by
a [direct link](https://cubism.live2d.com/sdk-web/cubismcore/live2dcubismcore.min.js) (_however the direct link is quite
unreliable, don't use it in production!_).

For Cubism 2.1, you need `live2d.min.js`. It's no longer downloadable from the official
site [since 2019/9/4](https://help.live2d.com/en/other/other_20/), but can be
found [here](https://github.com/dylanNew/live2d/tree/master/webgl/Live2D/lib), and with
a [CDN link](https://cdn.jsdelivr.net/gh/dylanNew/live2d/webgl/Live2D/lib/live2d.min.js) that you'll probably need.

#### Individual Bundles

The plugin provides individual bundles for each Cubism version to reduce your app's size when you just want to use one
of the versions.

Specifically, there are `cubism2.js` and `cubism4.js` for respective runtime, along with an `index.js` that includes
both of them.

Note that if you want both the Cubism 2.1 and Cubism 4 support, use `index.js`, but _not_ the combination
of `cubism2.js` and `cubism4.js`.

To make it clear, here's how you would use these files:

- Use `cubism2.js`+`live2d.min.js` to support Cubism 2.1 models
- Use `cubism4.js`+`live2dcubismcore.min.js` to support Cubism 3 and Cubism 4 models
- Use `index.js`+`live2d.min.js`+`live2dcubismcore.min.js` to support all versions of models

## Installation

#### Via npm

```sh
npm install @jannchie/pixi-live2d-display pixi.js
```

```js
import { Live2DModel } from '@jannchie/pixi-live2d-display';

// if only Cubism 2.1
import { Live2DModel } from '@jannchie/pixi-live2d-display/cubism2';

// if only Cubism 4
import { Live2DModel } from '@jannchie/pixi-live2d-display/cubism4';
```

#### Via CDN

PixiJS must be loaded first, as the UMD bundles depend on the global `PIXI` namespace.

```html
<script src="https://cdn.jsdelivr.net/npm/pixi.js@8/dist/pixi.min.js"></script>

<script src="https://cdn.jsdelivr.net/npm/@jannchie/pixi-live2d-display/dist/index.min.js"></script>

<!-- if only Cubism 2.1 -->
<script src="https://cdn.jsdelivr.net/npm/@jannchie/pixi-live2d-display/dist/cubism2.min.js"></script>

<!-- if only Cubism 4 -->
<script src="https://cdn.jsdelivr.net/npm/@jannchie/pixi-live2d-display/dist/cubism4.min.js"></script>
```

In this way, all the exported members are available under `PIXI.live2d` namespace, such as `PIXI.live2d.Live2DModel`.

## Basic usage

```javascript
import { Application, Ticker } from 'pixi.js';
import { Live2DModel } from '@jannchie/pixi-live2d-display';

(async function () {
  const app = new Application();

  // PixiJS v8 initializes asynchronously
  await app.init({
    canvas: document.getElementById('canvas'),
    resizeTo: window,
  });

  // pass a ticker so the model can update itself automatically
  const model = await Live2DModel.from('shizuku.model.json', {
    ticker: Ticker.shared,
  });

  app.stage.addChild(model);

  // transforms
  model.x = 100;
  model.y = 100;
  model.rotation = Math.PI;
  model.skew.x = Math.PI;
  model.scale.set(2, 2);
  model.anchor.set(0.5, 0.5);

  // interaction
  model.on('hit', (hitAreas) => {
    if (hitAreas.includes('body')) {
      model.motion('tap_body');
    }
  });
})();
```

If you don't pass the `ticker` option, you can instead expose PIXI to the global scope so the plugin picks
up `window.PIXI.Ticker.shared`:

```javascript
import * as PIXI from 'pixi.js';

window.PIXI = PIXI;
```

## Lip sync

```javascript
// play an audio file (or base64 data URL) with automatic lip sync
await model.speak('voice.mp3', { volume: 1 });

// or drive the mouth with microphone input
await model.startMicrophoneLipSync();
model.stopMicrophoneLipSync();

// or control the value manually (0 = closed, 1 = open)
model.startLipSync();
model.setLipSyncValue(0.8);
model.stopLipSync();
```

---

The example Live2D models, Shizuku (Cubism 2.1) and Haru (Cubism 4), are redistributed under
Live2D's [Free Material License](https://www.live2d.com/eula/live2d-free-material-license-agreement_en.html).
