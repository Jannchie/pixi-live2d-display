import { Application, Ticker } from "pixi.js";
import { Live2DModel } from "../src";

const canvas = document.getElementById("canvas") as HTMLCanvasElement;
const modelURL =
    "./models/06-v2.1024/06-v2.model3.json";

async function main() {
    // Create and initialize PixiJS application
    const app = new Application();
    await app.init({
        resizeTo: window,
        canvas: canvas,
        antialias:true,
    });
    try {
        // Load Live2D model
        const model = await Live2DModel.from(modelURL, {
            ticker: Ticker.shared,
        });
        model.setRenderer(app.renderer);
        // Scale and position model
        const scale = Math.min(window.innerWidth / model.width, 
                              window.innerHeight / model.height) * 0.8;
        model.scale.set(scale);
        
        // Center the model by setting anchor to center
        model.anchor.set(0.5, 0.5);
        model.x = window.innerWidth / 2;
        model.y = window.innerHeight / 2;
        
        // Add to stage
        app.stage.addChild(model);
        
        // Add lip sync controls
        setupLipSyncControls(model);
        
        // Add debug logging
        console.log('Model loaded:', model);
        console.log('Model methods:', Object.getOwnPropertyNames(Object.getPrototypeOf(model)));
        console.log('Model isReady:', model.isReady ? model.isReady() : 'No isReady method');
        
        // Test lip sync directly
        setTimeout(() => {
            const modelWithLipSync = model as any;
            if (typeof modelWithLipSync.startLipSync === 'function') {
                console.log('Starting lip sync...');
                modelWithLipSync.startLipSync();
                modelWithLipSync.setLipSyncValue(0.8);
                console.log('Lip sync value set to 0.8');
            } else {
                console.error('startLipSync method not available');
            }
        }, 2000);
        
    } catch (error) {
        console.error("Failed to load model:", error);
    }
}

function setupLipSyncControls(model: Live2DModel) {
    const modelWithLipSync = model as any;
    // Create control panel
    const controlPanel = document.createElement('div');
    controlPanel.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: rgba(0, 0, 0, 0.8);
        color: white;
        padding: 20px;
        border-radius: 10px;
        font-family: Arial, sans-serif;
        z-index: 1000;
    `;

    // Start/Stop button
    const toggleButton = document.createElement('button');
    toggleButton.textContent = 'Start Lip Sync';
    toggleButton.style.cssText = `
        display: block;
        margin: 10px 0;
        padding: 10px 20px;
        font-size: 16px;
        border: none;
        border-radius: 5px;
        cursor: pointer;
        background: #007bff;
        color: white;
    `;
    toggleButton.onclick = () => {
        if (modelWithLipSync.isLipSyncEnabled()) {
            modelWithLipSync.stopLipSync();
            toggleButton.textContent = 'Start Lip Sync';
            toggleButton.style.background = '#007bff';
        } else {
            modelWithLipSync.startLipSync();
            toggleButton.textContent = 'Stop Lip Sync';
            toggleButton.style.background = '#dc3545';
        }
    };

    // Lip sync value slider
    const sliderContainer = document.createElement('div');
    sliderContainer.innerHTML = `
        <label>Lip Sync Value: <span id="lipSyncValue">0</span></label>
    `;
    
    const slider = document.createElement('input');
    slider.type = 'range';
    slider.min = '0';
    slider.max = '1';
    slider.step = '0.01';
    slider.value = '0';
    slider.style.cssText = `
        width: 200px;
        display: block;
        margin: 10px 0;
    `;
    
    const valueDisplay = sliderContainer.querySelector('#lipSyncValue') as HTMLSpanElement;
    
    slider.oninput = () => {
        const value = parseFloat(slider.value);
        modelWithLipSync.setLipSyncValue(value);
        valueDisplay.textContent = value.toFixed(2);
    };

    // Auto animation button
    let autoAnimation: number | null = null;
    const autoButton = document.createElement('button');
    autoButton.textContent = 'Start Auto Animation';
    autoButton.style.cssText = `
        display: block;
        margin: 10px 0;
        padding: 10px 20px;
        font-size: 16px;
        border: none;
        border-radius: 5px;
        cursor: pointer;
        background: #28a745;
        color: white;
    `;
    
    autoButton.onclick = () => {
        if (autoAnimation) {
            clearInterval(autoAnimation);
            autoAnimation = null;
            autoButton.textContent = 'Start Auto Animation';
            autoButton.style.background = '#28a745';
        } else {
            modelWithLipSync.startLipSync();
            toggleButton.textContent = 'Stop Lip Sync';
            toggleButton.style.background = '#dc3545';
            
            autoAnimation = setInterval(() => {
                // Create talking animation pattern
                const time = Date.now() / 1000;
                const value = Math.max(0, Math.sin(time * 8) * 0.5 + 0.3 + Math.random() * 0.2);
                modelWithLipSync.setLipSyncValue(value);
                slider.value = value.toString();
                valueDisplay.textContent = value.toFixed(2);
            }, 50) as any;
            
            autoButton.textContent = 'Stop Auto Animation';
            autoButton.style.background = '#dc3545';
        }
    };

    // Instructions
    const instructions = document.createElement('div');
    instructions.innerHTML = `
        <h3 style="margin: 0 0 10px 0; color: #fff;">Lip Sync Controls</h3>
        <p style="margin: 0 0 10px 0; font-size: 12px;">Use the controls below to test lip sync animation:</p>
        <ul style="margin: 0; padding-left: 20px; font-size: 12px;">
            <li>Toggle: Enable/disable lip sync</li>
            <li>Slider: Manual control (0 = closed, 1 = open)</li>
            <li>Auto: Automatic talking animation</li>
        </ul>
    `;

    // Assemble control panel
    controlPanel.appendChild(instructions);
    controlPanel.appendChild(toggleButton);
    controlPanel.appendChild(sliderContainer);
    controlPanel.appendChild(slider);
    controlPanel.appendChild(autoButton);

    document.body.appendChild(controlPanel);
}

main();