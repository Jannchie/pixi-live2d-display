import { readFile, writeFile } from "fs/promises";
import { cpus } from "os";
import { dirname, resolve } from "path";
import { fileURLToPath } from "url";
import { minify } from "terser";
import { build } from "vite";

const __dirname = dirname(fileURLToPath(import.meta.url));

const entries = [
    { entry: "src/csm2.ts", name: "cubism2" },
    { entry: "src/csm4.ts", name: "cubism4" },
    { entry: "src/index.ts", name: "index" },
    { entry: "src/extra.ts", name: "extra" },
];

const distDir = resolve(__dirname, "..", "dist");
const defaultConcurrency = Math.min(entries.length, Math.max(1, cpus().length - 1));
const buildConcurrency = resolveConcurrency("BUILD_CONCURRENCY", defaultConcurrency);

const profiles = entries.map(({ entry, name }) => ({
    build: {
        emptyOutDir: false,
        minify: false,
        lib: {
            formats: ["es", "umd"],
            entry: resolve(__dirname, "..", entry),
            fileName: (format) => `${name}${format === "umd" ? "" : "." + format}.js`,
        },
    },
}));

async function minifyUmdFile(name) {
    const inputPath = resolve(distDir, `${name}.js`);
    const outputPath = resolve(distDir, `${name}.min.js`);
    const code = await readFile(inputPath, "utf8");
    const result = await minify(code, { safari10: true });

    if (!result.code) {
        throw new Error(`Failed to minify ${inputPath}`);
    }

    await writeFile(outputPath, result.code);
}

function resolveConcurrency(key, fallback) {
    const rawValue = process.env[key];
    const parsed = rawValue ? Number.parseInt(rawValue, 10) : Number.NaN;

    if (Number.isFinite(parsed) && parsed > 0) {
        return parsed;
    }

    return fallback;
}

async function runLimited(tasks, limit) {
    const running = new Set();
    const allTasks = [];

    for (const task of tasks) {
        const promise = task();
        allTasks.push(promise);
        running.add(promise);
        promise.finally(() => running.delete(promise));

        if (running.size >= limit) {
            await Promise.race(running);
        }
    }

    await Promise.all(allTasks);
}

async function main() {
    const buildTasks = profiles.map((profile) => async () => {
        console.log("\n" + `Building profile: ${profile.build.lib.fileName("umd")}`);

        await build(profile);
    });

    await runLimited(buildTasks, buildConcurrency);

    const minifyTasks = entries.map(({ name }) => async () => {
        console.log("\n" + `Minifying: ${name}.min.js`);
        await minifyUmdFile(name);
    });

    await runLimited(minifyTasks, buildConcurrency);
}

main();
