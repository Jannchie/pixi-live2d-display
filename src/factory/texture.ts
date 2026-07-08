import { Texture, Assets } from "pixi.js";

export async function createTexture(
    url: string,
    options: { crossOrigin?: string } = {},
): Promise<Texture> {
    // In Pixi.js v8, use Assets.load to load the texture from URL
    const texture = await Assets.load({
        src: url,
        loadParser: "loadTextures",
        data: { crossorigin: options.crossOrigin },
    });

    // Assets.load may resolve with a non-Texture value for unrecognized sources
    if (!(texture instanceof Texture)) {
        throw new Error(`Failed to load texture: ${url}`);
    }

    return texture;
}
