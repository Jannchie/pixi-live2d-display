import { createTexture } from "@/factory/texture";
import type { Renderer } from "pixi.js";
import { BaseRenderTexture, RenderTexture, AlphaFilter, Graphics, Sprite } from "pixi.js";
import { expect } from "vitest";
import { ALL_TEST_MODELS, TEST_TEXTURE, test } from "../env";
import { addAllModels, createModel, delay } from "../utils";

test("works with PIXI.Sprite", async ({ app }) => {
    const sprite = Sprite.from(await createTexture(TEST_TEXTURE));
    sprite.x = app.canvas.width / 4;
    sprite.y = app.canvas.height / 4;
    sprite.width = app.canvas.width / 2;
    sprite.height = app.canvas.height / 2;
    sprite.zIndex = 100;

    const sprite2 = Sprite.from(sprite.texture);
    sprite2.width = app.canvas.width;
    sprite2.height = app.canvas.height;
    sprite2.zIndex = -100;

    await addAllModels(app);
    app.stage.addChild(sprite);
    app.stage.addChild(sprite2);
    app.render();
    await expect(app).toMatchImageSnapshot();
});

test("works with PIXI.Graphics", async ({ app }) => {
    // https://github.com/guansss/pixi-live2d-display/issues/5

    const graphics = new Graphics();
    graphics.rect(0, 0, app.canvas.width / 2, app.canvas.height / 2).fill(0x00aa00);
    graphics.x = app.canvas.width / 4;
    graphics.y = app.canvas.height / 4;
    graphics.zIndex = 1001;

    const graphics2 = graphics.clone();
    graphics2.scale.set(2);
    graphics2.zIndex = -100;

    await addAllModels(app);
    app.stage.addChild(graphics);
    app.stage.addChild(graphics2);
    app.render();
    await expect(app).toMatchImageSnapshot();
});

test("works with PIXI.RenderTexture", async ({ app }) => {
    const models = await Promise.all(ALL_TEST_MODELS.map((M) => createModel(M.modelJsonWithUrl)));

    models.forEach((model) => {
        model.update(100);

        const renderTexture = new RenderTexture(
            new BaseRenderTexture({
                width: model.width,
                height: model.height,
                resolution: 0.5,
            }),
        );

        const sprite = new Sprite(renderTexture);
        sprite.scale.set(app.canvas.width / sprite.width);
        app.renderer.render(model, { renderTexture });
        app.stage.addChild(sprite);
    });

    app.render();
    await expect(app).toMatchImageSnapshot();
});

test("works with PIXI.Filter", async ({ app }) => {
    const models = await addAllModels(app);
    models.forEach((model) => {
        model.filters = [new AlphaFilter(0.6)];
    });

    app.render();
    await expect(app).toMatchImageSnapshot();
});

test("works after losing and restoring WebGL context", async ({ app }) => {
    await addAllModels(app);

    app.render();

    await delay(50);

    const ext = (app.renderer as Renderer).gl.getExtension("WEBGL_lose_context")!;
    ext.loseContext();

    app.render();

    await delay(100);

    app.render();

    ext.restoreContext();

    await delay(100);

    app.render();

    expect(app).toMatchImageSnapshot();
});
