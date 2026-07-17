import type { Live2DModel } from "../Live2DModel";
import {
    DEFAULT_TRANSITION_DELAY,
    DEFAULT_TRANSITION_DURATION,
    lerp,
    resolveEasing,
} from "../transitions/easings";
import type { Live2DModelTransitionOptions } from "../transitions/easings";
import { Tween } from "../transitions/Tween";

export interface Live2DModelWind {
    x: number;
    y: number;
}

export interface Live2DModelWindTransitionOptions extends Live2DModelTransitionOptions {}

export interface Live2DModelWindTransitionDefinition extends Live2DModelWindTransitionOptions {
    /**
     * Wind values to apply at the beginning of the transition.
     */
    from?: Live2DModelWind;

    /**
     * Wind values to apply at the end of the transition.
     */
    to?: Live2DModelWind;
}

interface Live2DModelWindOptions {
    wind: Live2DModelWind;
}

interface Live2DModelWindPhysics {
    getOption?: () => Live2DModelWindOptions;
    setOptions?: (options: Live2DModelWindOptions) => void;
}

type Live2DModelResolvedWindPhysics = Required<Live2DModelWindPhysics>;

interface WindTweenValues {
    fromX: number;
    fromY: number;
    toX: number;
    toY: number;
}

/**
 * Controls the wind vector of a model's physics (Cubism 4 only). Follows the
 * Automator pattern: owned by Live2DModel, which forwards its public wind API here.
 */
export class WindController {
    private tween: Tween<WindTweenValues> | null = null;

    constructor(private readonly model: Live2DModel) {}

    private getWindPhysics(): Live2DModelResolvedWindPhysics | null {
        if (!this.model.isReady()) {
            return null;
        }

        const physics = this.model.internalModel.physics as Live2DModelWindPhysics | undefined;
        if (
            !physics ||
            typeof physics.getOption !== "function" ||
            typeof physics.setOptions !== "function"
        ) {
            return null;
        }

        const options = physics.getOption();
        if (!options || typeof options.wind?.x !== "number" || typeof options.wind?.y !== "number") {
            return null;
        }

        return physics as Live2DModelResolvedWindPhysics;
    }

    isWindSupported(): boolean {
        return this.getWindPhysics() !== null;
    }

    setWind(x: number, y: number): void {
        const physics = this.getWindPhysics();
        if (!physics) {
            return;
        }

        const options = physics.getOption();
        options.wind.x = x;
        options.wind.y = y;
        physics.setOptions(options);
    }

    getWind(): Live2DModelWind | null {
        const physics = this.getWindPhysics();
        if (!physics) {
            return null;
        }

        const options = physics.getOption();
        return { x: options.wind.x, y: options.wind.y };
    }

    transitionWind(definition: Live2DModelWindTransitionDefinition): Promise<void> {
        if (!this.getWindPhysics()) {
            return Promise.resolve();
        }

        const current = this.getWind() ?? { x: 0, y: 0 };
        const from = definition.from ?? current;
        const to = definition.to ?? current;

        const duration = Math.max(0, definition.duration ?? DEFAULT_TRANSITION_DURATION);
        const delay = Math.max(0, definition.delay ?? DEFAULT_TRANSITION_DELAY);
        const easing = resolveEasing(definition.easing);

        this.stopWindTransition();

        if (duration === 0 && delay === 0) {
            this.setWind(to.x, to.y);
            return Promise.resolve();
        }

        this.setWind(from.x, from.y);

        return new Promise((resolve) => {
            this.tween = new Tween(
                { fromX: from.x, fromY: from.y, toX: to.x, toY: to.y },
                delay,
                duration,
                easing,
                resolve,
                true,
            );
        });
    }

    windTo(x: number, y: number, options: Live2DModelWindTransitionOptions = {}): Promise<void> {
        return this.transitionWind({ ...options, to: { x, y } });
    }

    /**
     * Stops the active wind transition without altering current values.
     */
    stopWindTransition(): void {
        if (!this.tween) {
            return;
        }

        const tween = this.tween;
        this.tween = null;
        tween.finish();
    }

    isWindTransitioning(): boolean {
        return this.tween !== null;
    }

    update(dt: DOMHighResTimeStamp): void {
        const tween = this.tween;
        if (!tween || !this.model.isReady()) {
            return;
        }

        const physics = this.getWindPhysics();
        if (!physics) {
            return;
        }

        const finished = tween.update(dt, (values, progress) => {
            const options = physics.getOption();
            options.wind.x = lerp(values.fromX, values.toX, progress);
            options.wind.y = lerp(values.fromY, values.toY, progress);
            physics.setOptions(options);
        });

        if (finished) {
            this.tween = null;
            tween.finish();
        }
    }

    destroy(): void {
        this.stopWindTransition();
    }
}
