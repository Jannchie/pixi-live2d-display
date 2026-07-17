export type Live2DModelTransitionEasingName =
    | "linear"
    | "easeInQuad"
    | "easeOutQuad"
    | "easeInOutQuad"
    | "easeInCubic"
    | "easeOutCubic";

export type Live2DModelTransitionEasing =
    | Live2DModelTransitionEasingName
    | ((progress: number) => number);

export interface Live2DModelTransitionOptions {
    /**
     * Transition duration in milliseconds.
     * @default 500
     */
    duration?: number;

    /**
     * Delay before the transition starts in milliseconds.
     * @default 0
     */
    delay?: number;

    /**
     * Easing function or preset name.
     * @default "linear"
     */
    easing?: Live2DModelTransitionEasing;
}

export type Live2DModelTransitionEasingFunction = (progress: number) => number;

export const DEFAULT_TRANSITION_DURATION = 500;
export const DEFAULT_TRANSITION_DELAY = 0;

export const easingPresets: Record<
    Live2DModelTransitionEasingName,
    Live2DModelTransitionEasingFunction
> = {
    linear: (progress) => progress,
    easeInQuad: (progress) => progress * progress,
    easeOutQuad: (progress) => progress * (2 - progress),
    easeInOutQuad: (progress) =>
        progress < 0.5 ? 2 * progress * progress : -1 + (4 - 2 * progress) * progress,
    easeInCubic: (progress) => progress * progress * progress,
    easeOutCubic: (progress) => 1 - (1 - progress) ** 3,
};

export function resolveEasing(
    easing: Live2DModelTransitionEasing | undefined,
): Live2DModelTransitionEasingFunction {
    if (!easing) {
        return easingPresets.linear;
    }

    if (typeof easing === "function") {
        return easing;
    }

    return easingPresets[easing] ?? easingPresets.linear;
}

export function lerp(from: number, to: number, progress: number): number {
    return from + (to - from) * progress;
}
