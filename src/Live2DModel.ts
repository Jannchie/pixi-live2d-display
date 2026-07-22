import type { BreathParameter, InternalModel, ModelSettings, MotionPriority } from "@/cubism-common";
import type { MotionManagerOptions } from "@/cubism-common/MotionManager";
import type { Live2DFactoryOptions } from "@/factory/Live2DFactory";
import { Live2DFactory } from "@/factory/Live2DFactory";
import type { Renderer, Texture, Ticker, WebGLRenderer } from "pixi.js";
import { Assets, Matrix, ObservablePoint, Point, Container, Rectangle } from "pixi.js";
import { Automator, type AutomatorOptions } from "./Automator";
import { FocusTransitionController } from "./controllers/FocusTransitionController";
import type { Live2DModelFocusTransitionOptions } from "./controllers/FocusTransitionController";
import { ParameterTransitionController } from "./controllers/ParameterTransitionController";
import type {
    Live2DModelParameterTransitionDefinition,
    Live2DModelParameterTransitionOptions,
    Live2DModelParameterValues,
} from "./controllers/ParameterTransitionController";
import { VisualTransitionController } from "./controllers/VisualTransitionController";
import type {
    Live2DModelAutoTransitionTrigger,
    Live2DModelTransitionDefinition,
    Live2DModelTransitionPresets,
    Live2DModelTransitionState,
    Live2DModelTransitionToOptions,
} from "./controllers/VisualTransitionController";
import { WindController } from "./controllers/WindController";
import type {
    Live2DModelWind,
    Live2DModelWindTransitionDefinition,
    Live2DModelWindTransitionOptions,
} from "./controllers/WindController";
import { Live2DTransform } from "./Live2DTransform";
import type { JSONObject } from "./types/helpers";
import { logger } from "./utils";
import { SpeechController } from "./controllers/SpeechController";
import type { Live2DModelSpeakOptions } from "./controllers/SpeechController";
export type {
    Live2DModelTransitionEasing,
    Live2DModelTransitionEasingName,
    Live2DModelTransitionOptions,
} from "./transitions/easings";
export type {
    Live2DModelWind,
    Live2DModelWindTransitionDefinition,
    Live2DModelWindTransitionOptions,
} from "./controllers/WindController";
export type { Live2DModelSpeakOptions } from "./controllers/SpeechController";
export type { Live2DModelFocusTransitionOptions } from "./controllers/FocusTransitionController";
export type {
    Live2DModelParameterTransitionDefinition,
    Live2DModelParameterTransitionOptions,
    Live2DModelParameterValues,
} from "./controllers/ParameterTransitionController";
export type {
    Live2DModelAutoTransitionTrigger,
    Live2DModelTransitionDefinition,
    Live2DModelTransitionPresets,
    Live2DModelTransitionScale,
    Live2DModelTransitionState,
    Live2DModelTransitionToOptions,
} from "./controllers/VisualTransitionController";

export type Live2DModelBreathParameter = BreathParameter;

export interface Live2DModelOptions extends MotionManagerOptions, AutomatorOptions {
    /**
     * Transition presets for built-in appearance helpers.
     */
    transitions?: Live2DModelTransitionPresets;

    /**
     * Automatically play the appear transition on a lifecycle trigger.
     * @default false
     */
    autoTransition?: Live2DModelAutoTransitionTrigger | boolean;
}

/**
 * Interface for WebGL context with PixiJS UID extension
 */
interface WebGLContextWithUID extends WebGL2RenderingContext {
    _pixiContextUID?: number;
}

const tempPoint = new Point();
const tempMatrix = new Matrix();
// reused when the renderer exposes no projection matrix, to avoid a per-frame allocation
const fallbackProjection = new Matrix();

export type Live2DConstructor = { new (options?: Live2DModelOptions): Live2DModel };

/**
 * A wrapper that allows the Live2D model to be used as a DisplayObject in PixiJS.
 *
 * ```js
 * const model = await Live2DModel.from('shizuku.model.json');
 * container.add(model);
 * ```
 * @emits {@link Live2DModelEvents}
 */
export class Live2DModel<IM extends InternalModel = InternalModel> extends Container {
    /**
     * Creates a Live2DModel from given source.
     * @param source - Can be one of: settings file URL, settings JSON object, ModelSettings instance.
     * @param options - Options for the creation.
     * @return Promise that resolves with the Live2DModel.
     */
    static from<M extends Live2DConstructor = typeof Live2DModel>(
        this: M,
        source: string | JSONObject | ModelSettings,
        options?: Live2DFactoryOptions,
    ): Promise<InstanceType<M>> {
        const model = new this(options) as InstanceType<M>;

        return Live2DFactory.setupLive2DModel(model, source, options).then(() => model);
    }

    /**
     * Synchronous version of `Live2DModel.from()`. This method immediately returns a Live2DModel instance,
     * whose resources have not been loaded. Therefore this model can't be manipulated or rendered
     * until the "load" event has been emitted.
     *
     * ```js
     * // no `await` here as it's not a Promise
     * const model = Live2DModel.fromSync('shizuku.model.json');
     *
     * // these will cause errors!
     * // app.stage.addChild(model);
     * // model.motion('tap_body');
     *
     * model.once('load', () => {
     *     // now it's safe
     *     app.stage.addChild(model);
     *     model.motion('tap_body');
     * });
     * ```
     */
    static fromSync<M extends Live2DConstructor = typeof Live2DModel>(
        this: M,
        source: string | JSONObject | ModelSettings,
        options?: Live2DFactoryOptions,
    ): InstanceType<M> {
        const model = new this(options) as InstanceType<M>;

        Live2DFactory.setupLive2DModel(model, source, options)
            .then(options?.onLoad)
            .catch(options?.onError);

        return model;
    }

    /**
     * Registers the class of `PIXI.Ticker` for auto updating.
     * @deprecated Use {@link Live2DModelOptions.ticker} instead.
     */
    static registerTicker(tickerClass: typeof Ticker): void {
        Automator["defaultTicker"] = tickerClass.shared;
    }

    /**
     * Tag for logging.
     */
    tag = "Live2DModel(uninitialized)";

    /**
     * The internal model. Will be undefined until the "ready" event is emitted.
     */
    internalModel?: IM;

    /**
     * Pixi textures.
     */
    textures: Texture[] = [];

    /**
     * Texture asset URLs used with Pixi Assets.
     */
    textureUrls: string[] = [];

    /** @override */
    transform = new Live2DTransform();

    /**
     * The anchor behaves like the one in `PIXI.Sprite`, where `(0, 0)` means the top left
     * and `(1, 1)` means the bottom right.
     */
    anchor = new ObservablePoint({ _onUpdate: this.onAnchorChange.bind(this) }, 0, 0); // cast the type because it breaks the casting of Live2DModel

    /**
     * An ID of Gl context that syncs with `renderer.CONTEXT_UID`. Used to check if the GL context has changed.
     */
    protected glContextID = -1;

    /**
     * Cached renderer reference for type safety
     */
    protected renderer?: WebGLRenderer;

    /**
     * WebGL textures extracted from the Pixi textures, cached per GL context.
     * Extraction goes through Pixi's texture system and is too expensive to run
     * every frame; entries are invalidated on context change/loss.
     */
    private cachedGlTextures: (WebGLTexture | null)[] = [];

    /**
     * Forces re-extraction of the WebGL textures on the next rendered frame.
     * Set while the context is lost, because the context UID stored on the gl
     * object survives a lost/restored context and won't invalidate the cache.
     */
    private forceTextureUpdate = false;

    /**
     * Elapsed time in milliseconds since created.
     */
    elapsedTime: DOMHighResTimeStamp = 0;

    /**
     * Elapsed time in milliseconds from last frame to this frame.
     */
    deltaTime: DOMHighResTimeStamp = 0;

    automator: Automator;

    private visualTransitions: VisualTransitionController;
    private parameterTransitions = new ParameterTransitionController(this);
    private focusTransitions = new FocusTransitionController(this);
    private windController = new WindController(this);

    private speechController = new SpeechController(this);

    constructor(options?: Live2DModelOptions) {
        super();

        this.automator = new Automator(this, options);
        this.visualTransitions = new VisualTransitionController(this, options?.transitions ?? {});

        // In Pixi.js v8, use onRender callback instead of _render override
        this.onRender = this._onRenderCallback.bind(this);

        this.once("modelLoaded", () => this.init(options));
        this.setupAutoTransition(options);
    }

    /**
     * Sets the renderer reference for type safety
     */
    setRenderer(renderer: Renderer): void {
        if (this.isWebGLRenderer(renderer)) {
            this.renderer = renderer;
        }
    }

    /**
     * Type guard to check if renderer is WebGLRenderer
     */
    private isWebGLRenderer(renderer: Renderer): renderer is WebGLRenderer {
        return 'gl' in renderer && renderer.gl instanceof WebGL2RenderingContext;
    }

    /**
     * Resolves the framebuffer currently bound by Pixi's render target system,
     * mirroring the value Pixi itself binds in its GL render target adaptor
     * (`null` for the canvas). Returns `undefined` when it cannot be determined,
     * in which case InternalModel.draw() falls back to querying GL directly.
     */
    private resolveBoundFramebuffer(renderer: WebGLRenderer): WebGLFramebuffer | null | undefined {
        try {
            // these are semi-private Pixi v8 internals, hence the feature detection
            const renderTargetSystem = renderer.renderTarget as unknown as {
                renderTarget?: object;
                getGpuRenderTarget?: (renderTarget: object) => { framebuffer?: unknown };
            };
            const renderTarget = renderTargetSystem?.renderTarget;

            if (renderTarget && typeof renderTargetSystem.getGpuRenderTarget === "function") {
                const framebuffer =
                    renderTargetSystem.getGpuRenderTarget(renderTarget)?.framebuffer;

                if (framebuffer === null || framebuffer === undefined) {
                    // canvas target: Pixi binds the default framebuffer
                    return null;
                }
                if (framebuffer instanceof WebGLFramebuffer) {
                    return framebuffer;
                }
            }
        } catch {
            // fall through to unknown
        }

        return undefined;
    }

    // TODO: rename
    /**
     * A handler of the "modelLoaded" event, invoked when the internal model has been loaded.
     */
    protected init(_options?: Live2DModelOptions) {
        if (!this.isReady()) {
            return;
        }
        
        this.tag = `Live2DModel(${this.internalModel.settings.name})`;

        // textures may have been (re)assigned during loading
        this.cachedGlTextures.length = 0;

        // Update bounds area now that the internal model is loaded
        this.updateBoundsArea();
        this.parameterTransitions.onModelLoaded();
    }

    private setupAutoTransition(options?: Live2DModelOptions): void {
        const trigger = options?.autoTransition;
        if (!trigger) {
            return;
        }

        const normalizedTrigger: Live2DModelAutoTransitionTrigger =
            trigger === true ? "load" : trigger;
        const startTransition = () => {
            void this.appear();
        };

        switch (normalizedTrigger) {
            case "ready":
                this.once("ready", startTransition);
                break;
            case "load":
                this.once("load", startTransition);
                break;
            case "added":
                this.once("added", startTransition);
                break;
        }
    }

    /**
     * Checks if the model is ready (internal model is loaded).
     */
    isReady(): this is Live2DModel<IM> & { internalModel: IM } {
        return this.internalModel !== undefined;
    }

    /**
     * Checks if the model can render (ready and has textures).
     */
    canRender(): boolean {
        return this.isReady() && this.textures.length > 0;
    }

    /**
     * Checks if the renderer is available and valid.
     */
    hasValidRenderer(): boolean {
        return this.renderer !== undefined && this.renderer.gl instanceof WebGL2RenderingContext;
    }

    /**
     * Type guard for WebGLTexture
     */
    private isWebGLTexture(texture: unknown): texture is WebGLTexture {
        return texture instanceof WebGLTexture;
    }

    /**
     * Extracts WebGLTexture from PixiJS texture with proper type safety
     */
    private extractWebGLTexture(renderer: WebGLRenderer, texture: Texture): WebGLTexture | null {
        if (!renderer.texture || !texture.source) {
            return null;
        }

        try {
            // Get the WebGL source wrapper first
            const glSource = renderer.texture.getGlSource(texture.source);
            
            if (glSource && (glSource as any).texture) {
                // Extract the actual WebGL texture from the wrapper
                return (glSource as any).texture;
            }
            
            // Fallback: try the internal _glTextures approach
            const textureSourceWithGL = texture.source as any;
            if (textureSourceWithGL?._glTextures) {
                const contextTextures = textureSourceWithGL._glTextures[this.glContextID];
                return contextTextures?.texture || contextTextures;
            }
        } catch (error) {
            console.warn('Failed to extract WebGL texture:', error);
        }

        return null;
    }

    /**
     * A callback that observes {@link anchor}, invoked when the anchor's values have been changed.
     */
    protected onAnchorChange(): void {
        if (this.isReady()) {
            this.pivot.set(
                this.anchor.x * this.internalModel.width,
                this.anchor.y * this.internalModel.height,
            );
        }
    }

    /**
     * Shorthand to start a motion.
     * @param group - The motion group.
     * @param index - The index in this group. If not presented, a random motion will be started.
     * @param priority - The motion priority. Defaults to `MotionPriority.NORMAL`.
     * @return Promise that resolves with true if the motion is successfully started, with false otherwise.
     */
    motion(group: string, index?: number, priority?: MotionPriority): Promise<boolean> {
        if (!this.isReady()) {
            return Promise.resolve(false);
        }
        return index === undefined
            ? this.internalModel.motionManager.startRandomMotion(group, priority)
            : this.internalModel.motionManager.startMotion(group, index, priority);
    }

    /**
     * Shorthand to set an expression.
     * @param id - Either the index, or the name of the expression. If not presented, a random expression will be set.
     * @return Promise that resolves with true if succeeded, with false otherwise.
     */
    expression(id?: number | string): Promise<boolean> {
        if (!this.isReady() || !this.internalModel.motionManager.expressionManager) {
            return Promise.resolve(false);
        }
        return id === undefined
            ? this.internalModel.motionManager.expressionManager.setRandomExpression()
            : this.internalModel.motionManager.expressionManager.setExpression(id);
    }

    /**
     * Smoothly moves the focus target in normalized space.
     * @param x - Focus X in range `[-1, 1]`.
     * @param y - Focus Y in range `[-1, 1]`.
     * @param options - Transition options.
     */
    lookTo(x: number, y: number, options: Live2DModelFocusTransitionOptions = {}): Promise<void> {
        return this.focusTransitions.lookTo(x, y, options);
    }

    /**
     * Smoothly moves the focus target using a world position.
     * @param x - Position in world space.
     * @param y - Position in world space.
     * @param options - Transition options.
     */
    lookAt(
        x: number,
        y: number,
        options: Live2DModelFocusTransitionOptions = {},
    ): Promise<void> {
        return this.focusTransitions.lookAt(x, y, options);
    }

    /**
     * Stops the active focus transition without altering current values.
     */
    stopFocusTransition(): void {
        this.focusTransitions.stopFocusTransition();
    }

    /**
     * Returns whether a focus transition is currently running.
     */
    isFocusTransitioning(): boolean {
        return this.focusTransitions.isFocusTransitioning();
    }

    /**
     * Updates the focus position. This will not cause the model to immediately look at the position,
     * instead the movement will be interpolated.
     * @param x - Position in world space.
     * @param y - Position in world space.
     * @param instant - Should the focus position be instantly applied.
     */
    focus(x: number, y: number, instant: boolean = false): void {
        this.focusTransitions.focus(x, y, instant);
    }

    /**
     * Tap on the model. This will perform a hit-testing, and emit a "hit" event
     * if at least one of the hit areas is hit.
     * @param x - Position in world space.
     * @param y - Position in world space.
     * @emits {@link Live2DModelEvents.hit}
     */
    tap(x: number, y: number): void {
        const hitAreaNames = this.hitTest(x, y);

        if (hitAreaNames.length) {
            logger.log(this.tag, `Hit`, hitAreaNames);

            this.emit("hit", hitAreaNames);
        }
    }

    /**
     * Hit-test on the model.
     * @param x - Position in world space.
     * @param y - Position in world space.
     * @return The names of the *hit* hit areas. Can be empty if none is hit.
     */
    hitTest(x: number, y: number): string[] {
        if (!this.isReady()) {
            return [];
        }
        
        tempPoint.x = x;
        tempPoint.y = y;
        this.toModelPosition(tempPoint, tempPoint);

        return this.internalModel.hitTest(tempPoint.x, tempPoint.y);
    }

    /**
     * Calculates the position in the canvas of original, unscaled Live2D model.
     * @param position - A Point in world space.
     * @param result - A Point to store the new value. Defaults to a new Point.
     * @param skipUpdate - True to skip the update transform.
     * @return The Point in model canvas space.
     */
    toModelPosition(
        position: Point,
        result: Point = position.clone(),
        _skipUpdate?: boolean,
    ): Point {
        // In Pixi.js v8, use toLocal method instead of manual worldTransform.applyInverse
        // First convert to local coordinates of this Live2DModel
        const localPosition = this.toLocal(position, undefined, result);
        
        // Then apply the internal model's local transform if model is ready
        if (this.isReady()) {
            this.internalModel.localTransform.applyInverse(localPosition, localPosition);
        }

        return localPosition;
    }

    /**
     * A method required by `PIXI.InteractionManager` to perform hit-testing.
     * @param point - A Point in world space.
     * @return True if the point is inside this model.
     */
    containsPoint(point: Point): boolean {
        // In Pixi.js v8, getBounds() returns a Bounds object, access Rectangle via .rectangle
        return this.getBounds(true).rectangle.contains(point.x, point.y);
    }

    /**
     * Updates the boundsArea based on the internal model dimensions
     */
    private updateBoundsArea(): void {
        if (this.isReady() && this.internalModel.width && this.internalModel.height) {
            // Set boundsArea with actual model dimensions
            this.boundsArea = new Rectangle(0, 0, this.internalModel.width, this.internalModel.height);
        } else if (!this.boundsArea) {
            // Fallback to default size if internal model isn't ready and no boundsArea is set
            this.boundsArea = new Rectangle(0, 0, 512, 512);
        }
    }


    /**
     * Gets a unique ID for the WebGL context
     */
    private _getContextUID(gl: WebGL2RenderingContext): number {
        const contextWithUID = gl as WebGLContextWithUID;
        
        // Create a simple UID for the context if it doesn't have one
        if (!contextWithUID._pixiContextUID) {
            contextWithUID._pixiContextUID = Date.now() + Math.random();
        }
        return contextWithUID._pixiContextUID;
    }

    /**
     * Updates the model. Note this method just updates the timer,
     * and the actual update will be done right before rendering the model.
     * @param dt - The elapsed time in milliseconds since last frame.
     */
    update(dt: DOMHighResTimeStamp): void {
        this.visualTransitions.update(dt);
        this.focusTransitions.update(dt);
        this.windController.update(dt);
        this.parameterTransitions.update(dt);
        this.deltaTime += dt;
        this.elapsedTime += dt;

        // don't call `this.internalModel.update()` here, because it requires WebGL context
    }

    /**
     * Starts a transition. Transitions are updated by {@link Live2DModel.update}.
     */
    transition(definition: Live2DModelTransitionDefinition): Promise<void> {
        return this.visualTransitions.transition(definition);
    }

    /**
     * Convenience helper to transition to target properties.
     */
    transitionTo(
        to: Live2DModelTransitionState,
        options: Live2DModelTransitionToOptions = {},
    ): Promise<void> {
        return this.visualTransitions.transitionTo(to, options);
    }

    /**
     * Plays the appear transition preset.
     */
    appear(options?: Live2DModelTransitionDefinition): Promise<void> {
        return this.visualTransitions.appear(options);
    }

    /**
     * Plays the disappear transition preset.
     */
    disappear(options?: Live2DModelTransitionDefinition): Promise<void> {
        return this.visualTransitions.disappear(options);
    }

    /**
     * Stops the active transition without altering current values.
     */
    stopTransition(): void {
        this.visualTransitions.stopTransition();
    }

    /**
     * Returns whether a transition is currently running.
     */
    isTransitioning(): boolean {
        return this.visualTransitions.isTransitioning();
    }

    /**
     * Gets a parameter value by ID.
     */
    getParameterValue(parameterId: string): number | undefined {
        return this.parameterTransitions.getParameterValue(parameterId);
    }

    /**
     * Sets a parameter value by ID.
     */
    setParameterValue(parameterId: string, value: number): void {
        this.parameterTransitions.setParameterValue(parameterId, value);
    }

    /**
     * Sets multiple parameter values by ID.
     */
    setParameterValues(values: Live2DModelParameterValues): void {
        this.parameterTransitions.setParameterValues(values);
    }

    /**
     * Starts a parameter transition.
     */
    transitionParameters(
        definition: Live2DModelParameterTransitionDefinition,
    ): Promise<void> {
        return this.parameterTransitions.transitionParameters(definition);
    }

    /**
     * Convenience helper to transition parameters to target values.
     */
    transitionParametersTo(
        values: Live2DModelParameterValues,
        options: Live2DModelParameterTransitionOptions = {},
    ): Promise<void> {
        return this.parameterTransitions.transitionParametersTo(values, options);
    }

    /**
     * Stops the active parameter transition without altering current values.
     */
    stopParameterTransition(): void {
        this.parameterTransitions.stopParameterTransition();
    }

    /**
     * Returns whether a parameter transition is currently running.
     */
    isParameterTransitioning(): boolean {
        return this.parameterTransitions.isParameterTransitioning();
    }

    // NOTE: rendering is deliberately NOT extracted into a controller. This is
    // the Pixi integration seam (context tracking, texture extraction/binding,
    // viewport, projection); it is tightly coupled to WebGLRenderer internals,
    // covered only by browser snapshot tests, and extraction would add
    // indirection without any testability gain.
    private _onRenderCallback(renderer: Renderer): void {
        // cache the renderer passed in by the render pipeline
        if (!this.renderer) {
            this.setRenderer(renderer);
        }

        const webglRenderer = this.renderer;

        if (!webglRenderer) {
            // not a WebGL renderer
            return;
        }

        if (webglRenderer.gl.isContextLost()) {
            // the cached GL textures die with the context; re-extract once it's restored
            this.forceTextureUpdate = true;
            return;
        }

        // Early exit if model cannot render
        if (!this.canRender()) {
            return;
        }
        
        // In PixiJS v8, the batch/geometry/shader/state reset methods have been removed
        // These were used to reset renderer state, but v8's architecture no longer needs this

        let shouldUpdateTexture = false;

        // when the WebGL context has changed
        // In PixiJS v8, use a simple hash of the GL context as UID
        const contextUID = this._getContextUID(webglRenderer.gl);
        if (this.glContextID !== contextUID) {
            this.glContextID = contextUID;

            if (this.isReady()){
                this.internalModel.updateWebGLContext(webglRenderer.gl, this.glContextID);
            }

            shouldUpdateTexture = true;
        }

        if (this.forceTextureUpdate) {
            this.forceTextureUpdate = false;
            shouldUpdateTexture = true;
        }

        if (shouldUpdateTexture) {
            this.cachedGlTextures.length = 0;
        }

        let flipYModified = false;

        for (let i = 0; i < this.textures.length; i++) {
            const texture = this.textures[i]!;

            // In v8, texture.valid doesn't exist, check if texture has a valid source
            if (!texture.source) {
                continue;
            }

            let glTexture = this.cachedGlTextures[i] ?? null;

            if (!glTexture) {
                // bind the WebGLTexture into Live2D core.
                // In v8, get the actual WebGL texture object
                glTexture = this.extractWebGLTexture(webglRenderer, texture);
                this.cachedGlTextures[i] = glTexture;

                // Set texture flip state right before binding a freshly extracted texture
                if (this.isWebGLTexture(glTexture) && this.internalModel) {
                    webglRenderer.gl.pixelStorei(
                        WebGLRenderingContext.UNPACK_FLIP_Y_WEBGL,
                        this.internalModel.textureFlipY,
                    );
                    flipYModified = true;
                }
            }

            if (this.isWebGLTexture(glTexture) && this.internalModel) {
                this.internalModel.bindTexture(i, glTexture);
            }

            // manually update the GC counter in v8
            if (webglRenderer.textureGC?.count && texture.source) {
                (texture.source as any).touched = webglRenderer.textureGC.count;
            }
        }

        // Reset GL state after texture binding to avoid affecting other textures
        if (flipYModified) {
            webglRenderer.gl.pixelStorei(
                WebGLRenderingContext.UNPACK_FLIP_Y_WEBGL,
                false,
            );
        }

        // In v8, ensure worldTransform is properly calculated
        const worldTransform = this.worldTransform || this.groupTransform || this.localTransform;

        // In PixiJS v8, we need to use the renderer's globalUniforms
        let projectionMatrix;
        if (webglRenderer.globalUniforms && 'projectionMatrix' in webglRenderer.globalUniforms) {
            projectionMatrix = (webglRenderer.globalUniforms as any).projectionMatrix;
        } else {
            // Fallback: a basic projection matrix using renderer screen dimensions
            const { width, height } = webglRenderer.screen;
            projectionMatrix = fallbackProjection.set(2 / width, 0, 0, -2 / height, -1, 1);
        }

        const internalTransform = tempMatrix
            .copyFrom(projectionMatrix)
            .append(worldTransform);

        if (this.internalModel) {
            const internalModel = this.internalModel;

            // mutate the viewport tuple in place to avoid a per-frame allocation
            const viewport = internalModel.viewport;
            // The Cubism core issues raw gl.viewport() calls in device pixels. In
            // PixiJS v8 renderer.width/height (and screen) are LOGICAL pixels —
            // unlike v7, where they matched the device-pixel drawing buffer — so
            // scale by the renderer resolution. Without this the model is squeezed
            // into a 1/resolution corner of the canvas on HiDPI/retina displays.
            const resolution = webglRenderer.resolution || 1;
            viewport[0] = 0;
            viewport[1] = 0;
            viewport[2] = (webglRenderer.width || webglRenderer.screen?.width || 800) * resolution;
            viewport[3] = (webglRenderer.height || webglRenderer.screen?.height || 600) * resolution;

            internalModel.boundFramebuffer = this.resolveBoundFramebuffer(webglRenderer);

            // the Live2D core calls below can throw; keep them guarded so a broken
            // frame doesn't kill Pixi's render loop, but keep the rest of the hot
            // path (texture binding, matrix math) outside the try/catch
            try {
                // update only if the time has changed, as the model will possibly be updated once but rendered multiple times
                if (this.deltaTime) {
                    internalModel.update(this.deltaTime, this.elapsedTime);
                    this.deltaTime = 0;
                }

                internalModel.updateTransform(internalTransform);
                internalModel.draw(webglRenderer.gl);
            } catch (error) {
                console.error("Error in Live2D render callback:", error);
            }
        }
    }

    /**
     * Starts lip sync animation.
     */
    startLipSync(): void {
        this.speechController.startLipSync();
    }

    /**
     * Stops lip sync animation.
     */
    stopLipSync(): void {
        this.speechController.stopLipSync();
    }

    /**
     * Sets the lip sync value manually.
     * @param value - Lip sync value (0-1), where 0 is closed mouth and 1 is fully open.
     */
    setLipSyncValue(value: number): void {
        this.speechController.setLipSyncValue(value);
    }

    /**
     * Gets current lip sync enabled state.
     * @return Whether lip sync is enabled.
     */
    isLipSyncEnabled(): boolean {
        return this.speechController.isLipSyncEnabled();
    }

    /**
     * Gets current lip sync value.
     * @return Current lip sync value (0-1).
     */
    getLipSyncValue(): number {
        return this.speechController.getLipSyncValue();
    }

    /**
     * Sets whether eyes should always look at camera regardless of head movement.
     * @param enabled - Whether to lock eyes to camera.
     */
    setEyesAlwaysLookAtCamera(enabled: boolean): void {
        if (this.isReady()) {
            this.internalModel.eyesAlwaysLookAtCamera = enabled;
        }
    }

    /**
     * Gets whether eyes are locked to camera.
     * @return Whether eyes are locked to camera.
     */
    isEyesAlwaysLookAtCamera(): boolean {
        return this.isReady() ? this.internalModel.eyesAlwaysLookAtCamera : false;
    }

    /**
     * Sets whether auto eye blinking is enabled.
     * @param enabled - Whether to enable auto eye blinking.
     */
    setEyeBlinkEnabled(enabled: boolean): void {
        if (this.isReady()) {
            this.internalModel.setEyeBlinkEnabled(enabled);
        }
    }

    /**
     * Gets whether auto eye blinking is enabled.
     * @return Whether auto eye blinking is enabled.
     */
    isEyeBlinkEnabled(): boolean {
        return this.isReady() ? this.internalModel.isEyeBlinkEnabled() : true;
    }

    /**
     * Sets whether breathing effects are enabled.
     * @param enabled - Whether to enable breathing effects.
     */
    setBreathEnabled(enabled: boolean): void {
        if (this.isReady()) {
            this.internalModel.setBreathEnabled(enabled);
        }
    }

    /**
     * Gets whether breathing effects are enabled.
     * @return Whether breathing effects are enabled.
     */
    isBreathEnabled(): boolean {
        return this.isReady() ? this.internalModel.isBreathEnabled() : true;
    }

    /**
     * Sets base breathing parameters used by natural movements.
     * @param parameters - Parameters describing the breathing curve.
     */
    setBreathParameters(parameters: Live2DModelBreathParameter[]): void {
        if (this.isReady()) {
            this.internalModel.setBreathParameters(parameters);
        }
    }

    /**
     * Sets breathing intensity multiplier.
     * @param intensity - Intensity multiplier.
     */
    setBreathIntensity(intensity: number): void {
        if (this.isReady()) {
            this.internalModel.setBreathIntensity(intensity);
        }
    }

    /**
     * Sets breathing cycle multiplier.
     * @param cycle - Cycle multiplier applied to base parameters.
     */
    setBreathCycle(cycle: number): void {
        if (this.isReady()) {
            this.internalModel.setBreathCycle(cycle);
        }
    }

    /**
     * Checks whether wind control is supported.
     */
    isWindSupported(): boolean {
        return this.windController.isWindSupported();
    }

    /**
     * Sets the wind vector for physics.
     * @param x - Wind X.
     * @param y - Wind Y.
     */
    setWind(x: number, y: number): void {
        this.windController.setWind(x, y);
    }

    /**
     * Gets the current wind vector.
     * @return Wind vector or null when unsupported.
     */
    getWind(): Live2DModelWind | null {
        return this.windController.getWind();
    }

    /**
     * Smoothly transitions the wind vector.
     */
    transitionWind(definition: Live2DModelWindTransitionDefinition): Promise<void> {
        return this.windController.transitionWind(definition);
    }

    /**
     * Convenience helper to transition wind to target values.
     */
    windTo(
        x: number,
        y: number,
        options: Live2DModelWindTransitionOptions = {},
    ): Promise<void> {
        return this.windController.windTo(x, y, options);
    }

    /**
     * Stops the active wind transition without altering current values.
     */
    stopWindTransition(): void {
        this.windController.stopWindTransition();
    }

    /**
     * Returns whether a wind transition is currently running.
     */
    isWindTransitioning(): boolean {
        return this.windController.isWindTransitioning();
    }

    /**
     * Smoothly sets the eye open value (both eyes).
     * @param value - Eye open value, usually in range `[0, 1]`.
     * @param options - Transition options.
     */
    eyeOpen(value: number, options: Live2DModelParameterTransitionOptions = {}): Promise<void> {
        return this.parameterTransitions.eyeOpen(value, options);
    }

    /**
     * Smoothly closes both eyes.
     * @param options - Transition options.
     */
    eyeClose(options: Live2DModelParameterTransitionOptions = {}): Promise<void> {
        return this.parameterTransitions.eyeClose(options);
    }

    /**
     * Start speaking with base64 audio data or audio URL.
     * @param audioData - Base64 audio data or audio URL
     * @param options - Speaking options
     */
    speak(audioData: string, options: Live2DModelSpeakOptions = {}): Promise<void> {
        return this.speechController.speak(audioData, options);
    }

    /**
     * Stop current speaking.
     */
    stopSpeaking(): void {
        this.speechController.stopSpeaking();
    }

    /**
     * Check if currently speaking.
     * @return Whether the model is currently speaking.
     */
    isSpeakingNow(): boolean {
        return this.speechController.isSpeakingNow();
    }

    /**
     * Start microphone input for real-time lip sync.
     * @param onError - Error callback
     */
    startMicrophoneLipSync(onError?: (error: Error) => void): Promise<void> {
        return this.speechController.startMicrophoneLipSync(onError);
    }

    /**
     * Stop microphone input.
     */
    stopMicrophoneLipSync(): void {
        this.speechController.stopMicrophoneLipSync();
    }

    /**
     * Destroys the model and all related resources. This takes the same options and also
     * behaves the same as `PIXI.Container#destroy`.
     * @param options - Options parameter. A boolean will act as if all options
     *  have been set to that value
     * @param [options.children=false] - if set to true, all the children will have their destroy
     *  method called as well. 'options' will be passed on to those calls.
     * @param [options.texture=false] - Only used for child Sprites if options.children is set to true
     *  Should it destroy the texture of the child sprite
     * @param [options.baseTexture=false] - Only used for child Sprites if options.children is set to true
     *  Should it destroy the base texture of the child sprite
     * @param [options.textureSource=false] - PixiJS v8 alias for baseTexture, destroys the texture source
     */
    destroy(
        options?: {
            children?: boolean;
            texture?: boolean;
            baseTexture?: boolean;
            textureSource?: boolean;
        } | boolean,
    ): void {
        this.visualTransitions.destroy();
        this.parameterTransitions.destroy();
        this.focusTransitions.destroy();
        this.windController.destroy();
        this.emit("destroy");

        const destroyTextures =
            typeof options === "boolean"
                ? options
                : Boolean(options?.texture || options?.baseTexture || options?.textureSource);
        const destroyTextureSource =
            typeof options === "boolean"
                ? options
                : Boolean(options?.baseTexture ?? options?.textureSource);

        if (destroyTextures) {
            if (destroyTextureSource && this.textureUrls.length > 0) {
                const unloadUrls: string[] = [];

                for (let i = 0; i < this.textures.length; i++) {
                    const texture = this.textures[i];
                    const url = this.textureUrls[i];

                    if (url && Assets.cache.has(url)) {
                        unloadUrls.push(url);
                    } else if (texture) {
                        texture.destroy(destroyTextureSource);
                    }
                }

                if (unloadUrls.length > 0) {
                    void Assets.unload(unloadUrls).catch((error) => {
                        logger.warn(this.tag, "Failed to unload textures.", error);
                    });
                }
            } else {
                this.textures.forEach((texture) => texture.destroy(destroyTextureSource));
            }
        }

        this.cachedGlTextures.length = 0;

        this.automator.destroy();
        this.speechController.destroy();

        if (this.isReady()) {
            this.internalModel.destroy();
        }

        super.destroy(options);
    }
}
