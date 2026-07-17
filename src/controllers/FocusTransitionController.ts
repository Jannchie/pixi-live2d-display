import { Point } from "pixi.js";
import type { Live2DModel } from "../Live2DModel";
import {
    DEFAULT_TRANSITION_DELAY,
    DEFAULT_TRANSITION_DURATION,
    lerp,
    resolveEasing,
} from "../transitions/easings";
import type { Live2DModelTransitionOptions } from "../transitions/easings";
import { Tween } from "../transitions/Tween";

export interface Live2DModelFocusTransitionOptions extends Live2DModelTransitionOptions {
    /**
     * Apply the target instantly when no transition options are provided.
     * @default false
     */
    instant?: boolean;
}

interface FocusTweenValues {
    fromX: number;
    fromY: number;
    toX: number;
    toY: number;
}

const tempPoint = new Point();

/**
 * Handles pointer-driven focus (world space) and smooth focus transitions in
 * normalized space. The name intentionally differs from cubism-common's
 * FocusController, which owns the low-level interpolation. Follows the
 * Automator pattern: owned by Live2DModel, which forwards its public focus
 * API here.
 */
export class FocusTransitionController {
    private tween: Tween<FocusTweenValues> | null = null;

    constructor(private readonly model: Live2DModel) {}

    /**
     * Maps a world position onto the unit circle used by the focus controller.
     * Writes into `tempPoint`; do not retain the result.
     */
    private resolveFocusTargetFromWorld(x: number, y: number): Point | null {
        const model = this.model;

        if (!model.isReady()) {
            return null;
        }

        tempPoint.x = x;
        tempPoint.y = y;

        // we can pass `true` as the third argument to skip the update transform
        // because focus won't take effect until the model is rendered,
        // and a model being rendered will always get transform updated
        model.toModelPosition(tempPoint, tempPoint, true);

        const tx = (tempPoint.x / model.internalModel.originalWidth) * 2 - 1;
        const ty = (tempPoint.y / model.internalModel.originalHeight) * 2 - 1;
        const radian = Math.atan2(ty, tx);

        tempPoint.x = Math.cos(radian);
        tempPoint.y = -Math.sin(radian);

        return tempPoint;
    }

    /**
     * Smoothly moves the focus target in normalized space.
     * @param x - Focus X in range `[-1, 1]`.
     * @param y - Focus Y in range `[-1, 1]`.
     * @param options - Transition options.
     */
    lookTo(x: number, y: number, options: Live2DModelFocusTransitionOptions = {}): Promise<void> {
        const model = this.model;

        if (!model.isReady()) {
            return Promise.resolve();
        }

        this.stopFocusTransition();

        const hasTransition =
            options.duration !== undefined ||
            options.delay !== undefined ||
            options.easing !== undefined;

        if (!hasTransition) {
            model.internalModel.focusController.focus(x, y, options.instant ?? false);
            return Promise.resolve();
        }

        const duration = Math.max(0, options.duration ?? DEFAULT_TRANSITION_DURATION);
        const delay = Math.max(0, options.delay ?? DEFAULT_TRANSITION_DELAY);
        const easing = resolveEasing(options.easing);
        const values: FocusTweenValues = {
            fromX: model.internalModel.focusController.x,
            fromY: model.internalModel.focusController.y,
            toX: x,
            toY: y,
        };

        if (duration === 0 && delay === 0) {
            model.internalModel.focusController.focus(x, y, true);
            return Promise.resolve();
        }

        return new Promise((resolve) => {
            this.tween = new Tween(values, delay, duration, easing, resolve, true);
            this.applyProgress(values, 0);
        });
    }

    /**
     * Smoothly moves the focus target using a world position.
     * @param x - Position in world space.
     * @param y - Position in world space.
     * @param options - Transition options.
     */
    lookAt(x: number, y: number, options: Live2DModelFocusTransitionOptions = {}): Promise<void> {
        const target = this.resolveFocusTargetFromWorld(x, y);
        if (!target) {
            return Promise.resolve();
        }

        return this.lookTo(target.x, target.y, options);
    }

    /**
     * Updates the focus position from a world position, without allocations.
     * This runs on every pointermove, so it bypasses the Promise machinery of
     * lookAt()/lookTo() entirely.
     * @param x - Position in world space.
     * @param y - Position in world space.
     * @param instant - Should the focus position be instantly applied.
     */
    focus(x: number, y: number, instant: boolean = false): void {
        const model = this.model;

        if (!model.isReady()) {
            return;
        }

        this.stopFocusTransition();

        const target = this.resolveFocusTargetFromWorld(x, y);
        if (!target) {
            return;
        }

        model.internalModel.focusController.focus(target.x, target.y, instant);
    }

    /**
     * Stops the active focus transition without altering current values.
     */
    stopFocusTransition(): void {
        if (!this.tween) {
            return;
        }

        const tween = this.tween;
        this.tween = null;
        tween.finish();
    }

    isFocusTransitioning(): boolean {
        return this.tween !== null;
    }

    update(dt: DOMHighResTimeStamp): void {
        const tween = this.tween;
        if (!tween || !this.model.isReady()) {
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

    private applyProgress(values: FocusTweenValues, progress: number): void {
        const model = this.model;

        if (!model.isReady()) {
            return;
        }

        const x = lerp(values.fromX, values.toX, progress);
        const y = lerp(values.fromY, values.toY, progress);

        model.internalModel.focusController.focus(x, y, true);
    }

    destroy(): void {
        this.stopFocusTransition();
    }
}
