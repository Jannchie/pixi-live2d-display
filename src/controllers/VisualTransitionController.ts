import type { Live2DModel } from "../Live2DModel";
import {
    DEFAULT_TRANSITION_DELAY,
    DEFAULT_TRANSITION_DURATION,
    lerp,
    resolveEasing,
} from "../transitions/easings";
import type { Live2DModelTransitionOptions } from "../transitions/easings";
import { Tween } from "../transitions/Tween";

export interface Live2DModelTransitionScale {
    x?: number;
    y?: number;
}

/**
 * Visual properties supported by transitions.
 */
export interface Live2DModelTransitionState {
    alpha?: number;
    x?: number;
    y?: number;
    rotation?: number;
    scale?: number | Live2DModelTransitionScale;
}

export interface Live2DModelTransitionDefinition extends Live2DModelTransitionOptions {
    /**
     * Properties to apply at the beginning of the transition.
     */
    from?: Live2DModelTransitionState;

    /**
     * Properties to apply at the end of the transition.
     */
    to?: Live2DModelTransitionState;
}

export type Live2DModelTransitionToOptions = Omit<Live2DModelTransitionDefinition, "to">;

export interface Live2DModelTransitionPresets {
    /**
     * Preset used by {@link Live2DModel.appear}.
     */
    appear?: Live2DModelTransitionDefinition;

    /**
     * Preset used by {@link Live2DModel.disappear}.
     */
    disappear?: Live2DModelTransitionDefinition;
}

export type Live2DModelAutoTransitionTrigger = "ready" | "load" | "added";

interface Live2DModelTransitionStateValues {
    alpha?: number;
    x?: number;
    y?: number;
    rotation?: number;
    scaleX?: number;
    scaleY?: number;
}

interface Live2DModelTransitionSnapshot {
    alpha: number;
    x: number;
    y: number;
    rotation: number;
    scaleX: number;
    scaleY: number;
}

interface Live2DModelTransitionValue {
    from: number;
    to: number;
}

interface Live2DModelTransitionValues {
    alpha?: Live2DModelTransitionValue;
    x?: Live2DModelTransitionValue;
    y?: Live2DModelTransitionValue;
    rotation?: Live2DModelTransitionValue;
    scaleX?: Live2DModelTransitionValue;
    scaleY?: Live2DModelTransitionValue;
}

const DEFAULT_APPEAR_TRANSITION: Live2DModelTransitionDefinition = {
    duration: 500,
    easing: "easeOutQuad",
    from: { alpha: 0 },
};
const DEFAULT_DISAPPEAR_TRANSITION: Live2DModelTransitionDefinition = {
    duration: 300,
    easing: "easeInQuad",
    to: { alpha: 0 },
};

function mergeTransitionDefinition(
    base: Live2DModelTransitionDefinition | undefined,
    override: Live2DModelTransitionDefinition | undefined,
): Live2DModelTransitionDefinition {
    const merged: Live2DModelTransitionDefinition = { ...base, ...override };

    if (base?.from || override?.from) {
        merged.from = { ...base?.from, ...override?.from };
    }

    if (base?.to || override?.to) {
        merged.to = { ...base?.to, ...override?.to };
    }

    return merged;
}

function normalizeTransitionState(
    state: Live2DModelTransitionState | undefined,
): Live2DModelTransitionStateValues {
    if (!state) {
        return {};
    }

    const normalized: Live2DModelTransitionStateValues = {
        alpha: state.alpha,
        x: state.x,
        y: state.y,
        rotation: state.rotation,
    };

    if (state.scale !== undefined) {
        if (typeof state.scale === "number") {
            normalized.scaleX = state.scale;
            normalized.scaleY = state.scale;
        } else {
            if (state.scale.x !== undefined) {
                normalized.scaleX = state.scale.x;
            }
            if (state.scale.y !== undefined) {
                normalized.scaleY = state.scale.y;
            }
        }
    }

    return normalized;
}

function buildTransitionValues(
    current: Live2DModelTransitionSnapshot,
    from: Live2DModelTransitionStateValues,
    to: Live2DModelTransitionStateValues,
): Live2DModelTransitionValues {
    const values: Live2DModelTransitionValues = {};

    if (from.alpha !== undefined || to.alpha !== undefined) {
        values.alpha = {
            from: from.alpha ?? current.alpha,
            to: to.alpha ?? current.alpha,
        };
    }
    if (from.x !== undefined || to.x !== undefined) {
        values.x = {
            from: from.x ?? current.x,
            to: to.x ?? current.x,
        };
    }
    if (from.y !== undefined || to.y !== undefined) {
        values.y = {
            from: from.y ?? current.y,
            to: to.y ?? current.y,
        };
    }
    if (from.rotation !== undefined || to.rotation !== undefined) {
        values.rotation = {
            from: from.rotation ?? current.rotation,
            to: to.rotation ?? current.rotation,
        };
    }
    if (from.scaleX !== undefined || to.scaleX !== undefined) {
        values.scaleX = {
            from: from.scaleX ?? current.scaleX,
            to: to.scaleX ?? current.scaleX,
        };
    }
    if (from.scaleY !== undefined || to.scaleY !== undefined) {
        values.scaleY = {
            from: from.scaleY ?? current.scaleY,
            to: to.scaleY ?? current.scaleY,
        };
    }

    return values;
}

/**
 * Runs visual (alpha/position/rotation/scale) transitions on a Live2DModel,
 * including the appear/disappear presets. Follows the Automator pattern:
 * owned by Live2DModel, which forwards its public transition API here.
 */
export class VisualTransitionController {
    private presets: Live2DModelTransitionPresets;
    private tween: Tween<Live2DModelTransitionValues> | null = null;

    constructor(
        private readonly model: Live2DModel,
        presets: Live2DModelTransitionPresets = {},
    ) {
        this.presets = presets;
    }

    transition(definition: Live2DModelTransitionDefinition): Promise<void> {
        const current = this.captureSnapshot();
        const from = normalizeTransitionState(definition.from);
        const to = normalizeTransitionState(definition.to);
        const values = buildTransitionValues(current, from, to);
        const hasValues =
            values.alpha !== undefined ||
            values.x !== undefined ||
            values.y !== undefined ||
            values.rotation !== undefined ||
            values.scaleX !== undefined ||
            values.scaleY !== undefined;

        if (!hasValues) {
            return Promise.resolve();
        }

        const duration = Math.max(0, definition.duration ?? DEFAULT_TRANSITION_DURATION);
        const delay = Math.max(0, definition.delay ?? DEFAULT_TRANSITION_DELAY);
        const easing = resolveEasing(definition.easing);

        this.stopTransition();

        if (duration === 0 && delay === 0) {
            this.applyProgress(values, 1);
            return Promise.resolve();
        }

        this.applyProgress(values, 0);

        return new Promise((resolve) => {
            this.tween = new Tween(values, delay, duration, easing, resolve);
        });
    }

    transitionTo(
        to: Live2DModelTransitionState,
        options: Live2DModelTransitionToOptions = {},
    ): Promise<void> {
        return this.transition({ ...options, to });
    }

    appear(options?: Live2DModelTransitionDefinition): Promise<void> {
        const merged = mergeTransitionDefinition(
            DEFAULT_APPEAR_TRANSITION,
            mergeTransitionDefinition(this.presets.appear, options),
        );
        return this.transition(merged);
    }

    disappear(options?: Live2DModelTransitionDefinition): Promise<void> {
        const merged = mergeTransitionDefinition(
            DEFAULT_DISAPPEAR_TRANSITION,
            mergeTransitionDefinition(this.presets.disappear, options),
        );
        return this.transition(merged);
    }

    /**
     * Stops the active transition without altering current values.
     */
    stopTransition(): void {
        if (!this.tween) {
            return;
        }

        const tween = this.tween;
        this.tween = null;
        tween.finish();
    }

    isTransitioning(): boolean {
        return this.tween !== null;
    }

    update(dt: DOMHighResTimeStamp): void {
        const tween = this.tween;
        if (!tween) {
            return;
        }

        const finished = tween.update(dt, (values, progress) => {
            this.applyProgress(values, progress);
        });

        if (finished) {
            this.tween = null;
            tween.finish();
        }
    }

    private captureSnapshot(): Live2DModelTransitionSnapshot {
        return {
            alpha: this.model.alpha,
            x: this.model.x,
            y: this.model.y,
            rotation: this.model.rotation,
            scaleX: this.model.scale.x,
            scaleY: this.model.scale.y,
        };
    }

    private applyProgress(values: Live2DModelTransitionValues, progress: number): void {
        const model = this.model;

        if (values.alpha) {
            model.alpha = lerp(values.alpha.from, values.alpha.to, progress);
        }
        if (values.x) {
            model.x = lerp(values.x.from, values.x.to, progress);
        }
        if (values.y) {
            model.y = lerp(values.y.from, values.y.to, progress);
        }
        if (values.rotation) {
            model.rotation = lerp(values.rotation.from, values.rotation.to, progress);
        }
        if (values.scaleX) {
            model.scale.x = lerp(values.scaleX.from, values.scaleX.to, progress);
        }
        if (values.scaleY) {
            model.scale.y = lerp(values.scaleY.from, values.scaleY.to, progress);
        }
    }

    destroy(): void {
        this.stopTransition();
    }
}
