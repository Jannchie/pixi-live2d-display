import type { Live2DModelTransitionEasingFunction } from "./easings";

/**
 * Internal timing primitive shared by the transition controllers.
 *
 * Owns only the timing shell (`delay` → eased progress over `duration`); what the
 * progress is applied to is up to the owning controller via the `apply` callback.
 * Not part of the public API.
 */
export class Tween<T> {
    private elapsed = 0;

    constructor(
        /** Values interpolated by the owner's apply callback. */
        readonly values: T,
        private readonly delay: number,
        private readonly duration: number,
        private readonly easing: Live2DModelTransitionEasingFunction,
        private readonly resolve: () => void,
    ) {}

    /**
     * Advances the tween and invokes `apply` with the eased progress once the
     * delay has passed.
     * @return True when the tween has completed. The owner should drop its
     * reference and then call {@link finish} to resolve the pending promise.
     */
    update(dt: number, apply: (values: T, easedProgress: number) => void): boolean {
        this.elapsed += dt;
        if (this.elapsed < this.delay) {
            return false;
        }

        const elapsed = this.elapsed - this.delay;
        const progress = this.duration === 0 ? 1 : Math.min(1, elapsed / this.duration);

        apply(this.values, this.easing(progress));

        return progress >= 1;
    }

    /**
     * Resolves the pending promise. Called by the owner after it has dropped its
     * reference, both on completion and on cancellation, mirroring the original
     * "null the field, then resolve" ordering.
     */
    finish(): void {
        this.resolve();
    }
}
