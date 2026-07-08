import { Assets, Container } from "pixi.js";
import { cloneDeep } from "lodash-es";
import { afterEach, beforeAll, beforeEach, vi } from "vitest";
import { config } from "../src/config";
import "./rpc/image-snapshot-client";
import circleImage from "./assets/circle.png?url";

Container.defaultSortableChildren = true;

beforeAll(async () => {
    // warm up the image loader, which lazily creates a worker from an object URL
    // that would otherwise be reported as a leak by the objectURLs fixture
    await Assets.load(circleImage);
});

beforeEach(async function () {
    // declaring the context as an argument will cause a strange error, so we have to use arguments
    // eslint-disable-next-line prefer-rest-params
    const context: any = arguments[0];
    context.__originalConfig = cloneDeep(config);

    config.sound = false;
});
afterEach(async function () {
    // eslint-disable-next-line prefer-rest-params
    const context: any = arguments[0];
    Object.assign(config, context.__originalConfig);

    vi.restoreAllMocks();
});
