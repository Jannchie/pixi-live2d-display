import { FocusController } from "@/cubism-common/FocusController";
import { EventEmitter, Matrix } from "pixi.js";

/**
 * A minimal InternalModel stand-in for unit-testing Live2DModel's delegation
 * and transition logic without a real Cubism runtime.
 *
 * The core model mimics Cubism 4 accessors (`get/setParameterValueById`);
 * use {@link StubCubism2InternalModel} for the Cubism 2 shape.
 */
export class StubInternalModel extends EventEmitter {
    coreModel: {
        getParameterValueById: (parameterId: string) => number;
        setParameterValueById: (parameterId: string, value: number) => void;
    };
    focusController = new FocusController();
    windOptions = { wind: { x: 0, y: 0 } };
    physics: unknown = {
        getOption: () => this.windOptions,
        setOptions: (options: { wind: { x: number; y: number } }) => {
            this.windOptions = { wind: { x: options.wind.x, y: options.wind.y } };
        },
    };
    settings = { name: "stub" };
    params: Record<string, number> = {};

    // used by Live2DModel.focus() to map world coordinates into model space
    localTransform = new Matrix();
    originalWidth = 100;
    originalHeight = 100;

    lipSyncEnabled = false;
    lipSyncValue = 0;
    eyesAlwaysLookAtCamera = false;
    eyeBlinkEnabled = true;
    breathEnabled = true;

    breathParameters: unknown = null;
    breathIntensity = 1;
    breathCycle = 1;

    constructor() {
        super();

        this.coreModel = {
            getParameterValueById: (parameterId: string) => this.params[parameterId] ?? 0,
            setParameterValueById: (parameterId: string, value: number) => {
                this.params[parameterId] = value;
            },
        };
    }

    setLipSyncEnabled(enabled: boolean): void {
        this.lipSyncEnabled = enabled;
    }

    setLipSyncValue(value: number): void {
        this.lipSyncValue = Math.max(0, Math.min(1, value));
    }

    setEyeBlinkEnabled(enabled: boolean): void {
        this.eyeBlinkEnabled = enabled;
    }

    isEyeBlinkEnabled(): boolean {
        return this.eyeBlinkEnabled;
    }

    setBreathEnabled(enabled: boolean): void {
        this.breathEnabled = enabled;
    }

    isBreathEnabled(): boolean {
        return this.breathEnabled;
    }

    setBreathParameters(parameters: unknown): void {
        this.breathParameters = parameters;
    }

    setBreathIntensity(intensity: number): void {
        this.breathIntensity = intensity;
    }

    setBreathCycle(cycle: number): void {
        this.breathCycle = cycle;
    }
}

/**
 * Cubism 2 variant: the core model exposes `get/setParamFloat` instead of
 * the Cubism 4 `...ById` accessors.
 */
export class StubCubism2InternalModel extends StubInternalModel {
    constructor() {
        super();

        this.coreModel = {
            getParamFloat: (parameterId: string) => this.params[parameterId] ?? 0,
            setParamFloat: (parameterId: string, value: number) => {
                this.params[parameterId] = value;
            },
        } as unknown as StubInternalModel["coreModel"];
    }
}

export const baseOptions = {
    autoUpdate: false,
    autoHitTest: false,
    autoFocus: false,
};
