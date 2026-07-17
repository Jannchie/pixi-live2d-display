import type { Live2DModel } from "../Live2DModel";
import {
    DEFAULT_TRANSITION_DELAY,
    DEFAULT_TRANSITION_DURATION,
    lerp,
    resolveEasing,
} from "../transitions/easings";
import type { Live2DModelTransitionOptions } from "../transitions/easings";
import { Tween } from "../transitions/Tween";

export type Live2DModelParameterValues = Record<string, number>;

export interface Live2DModelParameterTransitionOptions extends Live2DModelTransitionOptions {}

export interface Live2DModelParameterTransitionDefinition
    extends Live2DModelParameterTransitionOptions {
    /**
     * Parameter values to apply at the beginning of the transition.
     */
    from?: Live2DModelParameterValues;

    /**
     * Parameter values to apply at the end of the transition.
     */
    to?: Live2DModelParameterValues;
}

interface Live2DCoreModelAccessors {
    getParameterValueById?: (parameterId: string) => number;
    setParameterValueById?: (parameterId: string, value: number) => void;
    getParamFloat?: (parameterId: string) => number;
    setParamFloat?: (parameterId: string, value: number) => void;
}

interface Live2DModelTransitionValue {
    from: number;
    to: number;
}

type Live2DModelParameterTransitionValues = Record<string, Live2DModelTransitionValue>;

const CUBISM4_EYE_PARAM_IDS = {
    leftOpen: "ParamEyeLOpen",
    rightOpen: "ParamEyeROpen",
    ballX: "ParamEyeBallX",
    ballY: "ParamEyeBallY",
};
const CUBISM2_EYE_PARAM_IDS = {
    leftOpen: "PARAM_EYE_L_OPEN",
    rightOpen: "PARAM_EYE_R_OPEN",
    ballX: "PARAM_EYE_BALL_X",
    ballY: "PARAM_EYE_BALL_Y",
};

function buildParameterTransitionValues(
    current: Record<string, number | undefined>,
    from: Live2DModelParameterValues | undefined,
    to: Live2DModelParameterValues | undefined,
): Live2DModelParameterTransitionValues {
    const values: Live2DModelParameterTransitionValues = {};
    const keys = new Set<string>();

    for (const key of Object.keys(from ?? {})) {
        keys.add(key);
    }
    for (const key of Object.keys(to ?? {})) {
        keys.add(key);
    }

    for (const key of keys) {
        const currentValue = current[key];
        const fromValue = from?.[key] ?? currentValue;
        const toValue = to?.[key] ?? currentValue;

        if (fromValue === undefined || toValue === undefined) {
            continue;
        }

        values[key] = { from: fromValue, to: toValue };
    }

    return values;
}

/**
 * Runs core-model parameter transitions (including the eyeOpen/eyeClose sugar).
 * The computed values are applied inside the internal model's "beforeModelUpdate"
 * event so they land after motions/expressions but before the core update.
 * Follows the Automator pattern: owned by Live2DModel, which forwards its
 * public parameter API here.
 */
export class ParameterTransitionController {
    private tween: Tween<Live2DModelParameterTransitionValues> | null = null;
    private pendingValues: Live2DModelParameterValues | null = null;
    private handler: (() => void) | null = null;
    private attached = false;

    constructor(private readonly model: Live2DModel) {}

    /**
     * Attaches the "beforeModelUpdate" handler. Called when the internal model
     * has been loaded.
     */
    onModelLoaded(): void {
        if (!this.model.internalModel) {
            return;
        }

        if (!this.handler) {
            this.handler = () => {
                this.applyPendingValues();
            };
        }

        if (!this.attached) {
            this.model.internalModel.on("beforeModelUpdate", this.handler);
            this.attached = true;
        }
    }

    private detach(): void {
        if (!this.model.internalModel || !this.handler || !this.attached) {
            return;
        }

        this.model.internalModel.off("beforeModelUpdate", this.handler);
        this.attached = false;
    }

    private getCoreModel(): Live2DCoreModelAccessors | null {
        if (!this.model.isReady()) {
            return null;
        }

        return this.model.internalModel.coreModel as Live2DCoreModelAccessors;
    }

    private getDefaultEyeParamIds():
        | typeof CUBISM4_EYE_PARAM_IDS
        | typeof CUBISM2_EYE_PARAM_IDS
        | null {
        const coreModel = this.getCoreModel();
        if (!coreModel) {
            return null;
        }

        if (typeof coreModel.setParameterValueById === "function") {
            return CUBISM4_EYE_PARAM_IDS;
        }

        if (typeof coreModel.setParamFloat === "function") {
            return CUBISM2_EYE_PARAM_IDS;
        }

        return null;
    }

    getParameterValue(parameterId: string): number | undefined {
        const coreModel = this.getCoreModel();
        if (!coreModel) {
            return;
        }

        if (typeof coreModel.getParameterValueById === "function") {
            return coreModel.getParameterValueById(parameterId);
        }

        if (typeof coreModel.getParamFloat === "function") {
            return coreModel.getParamFloat(parameterId);
        }
    }

    setParameterValue(parameterId: string, value: number): void {
        const coreModel = this.getCoreModel();
        if (!coreModel) {
            return;
        }

        if (typeof coreModel.setParameterValueById === "function") {
            coreModel.setParameterValueById(parameterId, value);
            return;
        }

        if (typeof coreModel.setParamFloat === "function") {
            coreModel.setParamFloat(parameterId, value);
        }
    }

    setParameterValues(values: Live2DModelParameterValues): void {
        for (const [parameterId, value] of Object.entries(values)) {
            this.setParameterValue(parameterId, value);
        }
    }

    transitionParameters(definition: Live2DModelParameterTransitionDefinition): Promise<void> {
        if (!this.model.isReady()) {
            return Promise.resolve();
        }

        const from = definition.from;
        const to = definition.to;
        const current: Record<string, number | undefined> = {};

        for (const parameterId of new Set([
            ...Object.keys(from ?? {}),
            ...Object.keys(to ?? {}),
        ])) {
            current[parameterId] = this.getParameterValue(parameterId);
        }

        const values = buildParameterTransitionValues(current, from, to);
        const entries = Object.entries(values);

        if (entries.length === 0) {
            return Promise.resolve();
        }

        const duration = Math.max(0, definition.duration ?? DEFAULT_TRANSITION_DURATION);
        const delay = Math.max(0, definition.delay ?? DEFAULT_TRANSITION_DELAY);
        const easing = resolveEasing(definition.easing);

        this.stopParameterTransition();

        if (duration === 0 && delay === 0) {
            this.pendingValues = this.computeValues(values, 1);
            this.setParameterValues(this.pendingValues);
            return Promise.resolve();
        }

        this.pendingValues = this.computeValues(values, 0);
        this.setParameterValues(this.pendingValues);

        return new Promise((resolve) => {
            this.tween = new Tween(values, delay, duration, easing, resolve, true);
        });
    }

    transitionParametersTo(
        values: Live2DModelParameterValues,
        options: Live2DModelParameterTransitionOptions = {},
    ): Promise<void> {
        return this.transitionParameters({ ...options, to: values });
    }

    /**
     * Stops the active parameter transition without altering current values.
     */
    stopParameterTransition(): void {
        if (!this.tween) {
            return;
        }

        const tween = this.tween;
        this.tween = null;
        this.pendingValues = null;
        tween.finish();
    }

    isParameterTransitioning(): boolean {
        return this.tween !== null;
    }

    update(dt: DOMHighResTimeStamp): void {
        const tween = this.tween;
        if (!tween) {
            return;
        }

        const finished = tween.update(dt, (values, progress) => {
            this.pendingValues = this.computeValues(values, progress);
        });

        if (finished) {
            // the final values stay pending so the next "beforeModelUpdate" applies them
            this.tween = null;
            tween.finish();
        }
    }

    private computeValues(
        values: Live2DModelParameterTransitionValues,
        progress: number,
    ): Live2DModelParameterValues {
        const result: Live2DModelParameterValues = {};

        for (const [parameterId, value] of Object.entries(values)) {
            result[parameterId] = lerp(value.from, value.to, progress);
        }

        return result;
    }

    private applyPendingValues(): void {
        if (!this.pendingValues) {
            return;
        }

        this.setParameterValues(this.pendingValues);

        if (!this.tween) {
            this.pendingValues = null;
        }
    }

    eyeOpen(value: number, options: Live2DModelParameterTransitionOptions = {}): Promise<void> {
        const paramIds = this.getDefaultEyeParamIds();
        if (!paramIds) {
            return Promise.resolve();
        }

        return this.transitionParametersTo(
            {
                [paramIds.leftOpen]: value,
                [paramIds.rightOpen]: value,
            },
            options,
        );
    }

    eyeClose(options: Live2DModelParameterTransitionOptions = {}): Promise<void> {
        return this.eyeOpen(0, options);
    }

    destroy(): void {
        this.stopParameterTransition();
        this.detach();
    }
}
