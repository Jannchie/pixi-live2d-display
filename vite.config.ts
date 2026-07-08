/// <reference types="vitest" />

import { existsSync } from "fs";
import path from "path";
import { defineConfig } from "vite";
import { webdriverio } from "@vitest/browser-webdriverio";
import { BaseSequencer } from "vitest/node";
import packageJson from "./package.json";
import { testRpcPlugin } from "./test/rpc/rpc-server";

const cubismSubmodule = path.resolve(__dirname, "cubism");
const cubism2Core = path.resolve(__dirname, "core/live2d.min.js");
const cubism4Core = path.resolve(__dirname, "core/live2dcubismcore.js");

if (!existsSync(cubismSubmodule) || !existsSync(path.resolve(cubismSubmodule, "package.json"))) {
    throw new Error(
        "Cubism submodule not found. Please run `git submodule update --init` to download them. If you have trouble downloading the submodule, please check out DEVELOPMENT.md for possible solutions.",
    );
}

if (!existsSync(cubism2Core) || !existsSync(cubism4Core)) {
    throw new Error("Cubism Core not found. Please run `npm run setup` to download them.");
}

export default defineConfig(({ command, mode }) => {
    const isDev = command === "serve";
    const isTest = mode === "test";

    return {
        define: {
            __DEV__: isDev,
            __VERSION__: JSON.stringify(packageJson.version),

            // test env
            __HEADLESS__: process.env.CI === "true",
        },
        resolve: {
            alias: {
                "@": path.resolve(__dirname, "src"),
                "@cubism": path.resolve(__dirname, "cubism/src"),
            },
        },
        server: {
            open: !isTest && "/playground/index.html",
        },
        build: {
            target: "es6",
            lib: {
                entry: "",
                name: "PIXI.live2d",
            },
            rollupOptions: {
                external(id, parentId, isResolved) {
                    // In Pixi.js v8, we use the unified pixi.js package instead of @pixi/* subpackages
                    return id === "pixi.js";
                },
                output: {
                    extend: true,
                    globals(id: string) {
                        if (id === "pixi.js") {
                            return "PIXI";
                        }
                    },
                },
            },
            minify: false,
        },
        plugins: [
            // Only load test RPC plugin in test mode to avoid ws dependency in dev
            isTest && testRpcPlugin(),
        ],
        test: {
            include: ["**/*.test.ts", "**/*.test.js"],
            browser: {
                enabled: true,
                // run headful (under xvfb in CI): headless Chrome disables
                // software WebGL, which the tests require
                headless: false,
                provider: webdriverio({
                    capabilities: {
                        "goog:chromeOptions": {
                            args: [
                                // allow audio to play without a user gesture
                                "--autoplay-policy=no-user-gesture-required",
                                // allow software WebGL on GPU-less CI runners
                                "--enable-unsafe-swiftshader",
                                "--no-sandbox",
                            ],
                        },
                    },
                }),
                instances: [{ browser: "chrome" }],
                // loads the Cubism cores as classic scripts before any test module runs
                testerHtmlPath: "./test/tester.html",
            },
            setupFiles: ["./test/setup.ts"],
            sequence: {
                sequencer: class MySequencer extends BaseSequencer {
                    // use the default sorting, then put bundle tests at the end
                    // to make sure they will not pollute the environment for other tests
                    override async sort(files: Parameters<BaseSequencer["sort"]>[0]) {
                        files = await super.sort(files);

                        const bundleTestFiles: typeof files = [];

                        files = files.filter((file) => {
                            if (file.moduleId.includes("bundle")) {
                                bundleTestFiles.push(file);
                                return false;
                            }
                            return true;
                        });

                        return [...files, ...bundleTestFiles];
                    }
                },
            },
        },
    };
});
