import { Application, Ticker } from "pixi.js";
import { Live2DModel } from "../src";

const canvas = document.getElementById("canvas") as HTMLCanvasElement;
const modelURL =
    "https://cdn.jsdelivr.net/gh/Eikanya/Live2d-model/Live2D/Senko_Normals/senko.model3.json";

async function main() {
    // Create and initialize PixiJS application
    const app = new Application();
    await app.init({
        resizeTo: window,
        canvas: canvas,
        antialias:true,
    });
    
    // Make app globally accessible for Live2D renderer
    (window as any).app = app;
    
    try {
        // Load Live2D model
        const model = await Live2DModel.from(modelURL, {
            ticker: Ticker.shared,
        });
        (window as any).model = model
        
        // Scale and position model
        const scale = Math.min(window.innerWidth / model.internalModel.width, 
                              window.innerHeight / model.internalModel.height) * 0.8;
        model.scale.set(scale);
        
        // Center the model by setting anchor to center
        model.anchor.set(0.5, 0.5);
        model.x = window.innerWidth / 2;
        model.y = window.innerHeight / 2;
        
        // Add to stage
        app.stage.addChild(model);
        
    } catch (error) {
        console.error("Failed to load model:", error);
    }
}

main();