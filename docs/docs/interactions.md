There are two basic interactions on Live2D models:

- Focusing: character will look at the mouse pointer.
- Tapping: handles `pointertap` event, then emits a `hit` event when any of the hit areas is tapped on.

    The `hit` event comes with an array of hit area names.

    ```js
    model.on('hit', (hitAreaNames) => {
        if (hitAreaNames.includes('body')) {
            // body is hit
        }
    });
    ```

!!! tip
    See Live2D's [Collision Detection](http://sites.cybernoids.jp/cubism_e/modeler/models/collision/placement) for more information about hit test.

### Interacting Automatically

This is the default behavior. Model will use Pixi's `InteractionManager` to automatically interact.

The easiest way is to import a full build of Pixi, so that `InteractionManager` is registered out of the box.

```js
import * as PIXI from 'pixi.js';
```

Otherwise, you need to manually register it as plugin:

```js
import { Renderer } from '@pixi/core';
import { InteractionManager } from '@pixi/interaction';

Renderer.registerPlugin('interaction', InteractionManager);
```

### Interacting Manually

If you don't want the default behavior, you can turn off the `autoInteract` option when creating a model, then manually call the interaction methods.

```js
const model = await Live2DModel.from('shizuku.model.json', { autoInteract: false });

canvasElement.addEventListener('pointermove', (event) => model.focus(event.clientX, event.clientY));

canvasElement.addEventListener('pointerdown', (event) => model.tap(event.clientX, event.clientY));
```

## Eye and Gaze Control

You can smoothly control eye openness and gaze direction with built-in transitions.

```js
await model.eyeOpen(0.2, { duration: 260, easing: "easeOutQuad" });
await model.eyeClose({ duration: 200 });

// Focus in normalized space [-1, 1]
await model.lookTo(0, 0, { duration: 300, easing: "easeInOutQuad" });

// Or use world coordinates (e.g. pointer position)
await model.lookAt(event.clientX, event.clientY, { duration: 300 });
```

For fine-grained control, you can transition parameters directly:

```js
await model.transitionParametersTo(
    {
        ParamEyeLOpen: 0,
        ParamEyeROpen: 0,
    },
    { duration: 260, easing: "easeOutQuad" },
);
```

These transitions run on the model update loop, so keep `autoUpdate` enabled or call
`model.update()` manually.

## Breathing

Breathing effects can be toggled at runtime.

```js
model.setBreathEnabled(false);
model.setBreathEnabled(true);
```

You can also adjust intensity, cycle, or provide custom parameters.

```js
model.setBreathIntensity(1.2);
model.setBreathCycle(0.8);

model.setBreathParameters([
    { parameterId: "ParamBreath", offset: 0, peak: 0.6, cycle: 3.2, weight: 0.5 },
]);
```

Intensity and cycle are multipliers where `1` keeps the default behavior.

In Cubism 2 use `PARAM_BREATH` as the parameter ID, and this controls the built-in natural movement
used for breathing.

## Wind

Wind control is available for Cubism 4 models that include physics data.

```js
if (model.isWindSupported()) {
    model.setWind(0, 0.5);
    await model.windTo(1, 0, { duration: 800, easing: "easeOutQuad" });
}
```
