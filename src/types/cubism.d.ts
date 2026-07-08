declare module "@cubism/config" {
    export namespace CubismConfig {
        export const supportMoreMaskDivisions: boolean;
        export const setOpacityFromMotion: boolean;
    }
}

declare module "@cubism/index" {}

declare module "@cubism/CubismSpec" {
    export namespace CubismSpec {
        export interface ModelJSON {
            Version: number;
            FileReferences: {
                Moc: string;
                Textures: string[];
                Physics?: string;
                Pose?: string;
                Expressions?: Expression[];
                Motions?: Record<string, Motion[]>;
            };
            Groups?: Group[];
            HitAreas?: HitArea[];
            Layout?: Record<string, number>;
        }

        export interface Group {
            Target: string;
            Name: string;
            Ids: string[];
        }

        export interface HitArea {
            Id: string;
            Name: string;
        }

        export interface Expression {
            Name: string;
            File: string;
        }

        export interface Motion {
            File: string;
            Sound?: string;
            FadeInTime?: number;
            FadeOutTime?: number;
        }

        export type MotionJSON = Record<string, unknown>;
        export type ExpressionJSON = Record<string, unknown>;
        export type PoseJSON = Record<string, unknown>;
        export type PhysicsJSON = Record<string, unknown>;
    }
}

declare module "@cubism/cubismdefaultparameterid" {
    export const ParamAngleX: string;
    export const ParamAngleY: string;
    export const ParamAngleZ: string;
    export const ParamBodyAngleX: string;
    export const ParamBreath: string;
    export const ParamEyeBallX: string;
    export const ParamEyeBallY: string;
    export const ParamEyeLOpen: string;
    export const ParamEyeROpen: string;
}

declare module "@cubism/effect/cubismbreath" {
    import type { CubismModel } from "@cubism/model/cubismmodel";

    export class BreathParameterData {
        constructor(
            parameterId: string,
            offset: number,
            peak: number,
            cycle: number,
            weight: number,
        );
    }

    export class CubismBreath {
        static create(): CubismBreath;
        setParameters(parameters: BreathParameterData[]): void;
        updateParameters(model: CubismModel, deltaTimeSeconds: number): void;
    }
}

declare module "@cubism/effect/cubismeyeblink" {
    import type { CubismModel } from "@cubism/model/cubismmodel";

    export class CubismEyeBlink {
        static create(settings: unknown): CubismEyeBlink;
        setBlinkingSetting(closing: number, closed: number, opening: number): void;
        setBlinkingInterval(interval: number): void;
        setParameterIds(parameterIds: string[]): void;
        updateParameters(model: CubismModel, deltaTimeSeconds: number): void;
    }
}

declare module "@cubism/effect/cubismpose" {
    import type { CubismSpec } from "@cubism/CubismSpec";
    import type { CubismModel } from "@cubism/model/cubismmodel";

    export class CubismPose {
        static create(json: CubismSpec.PoseJSON): CubismPose;
        updateParameters(model: CubismModel, deltaTimeSeconds: number): void;
    }
}

declare module "@cubism/math/cubismmatrix44" {
    export class CubismMatrix44 {
        getArray(): Float32Array;
    }
}

declare module "@cubism/model/cubismmodel" {
    export interface CubismModel {
        getModel(): {
            canvasinfo: {
                CanvasWidth: number;
                CanvasHeight: number;
                PixelsPerUnit: number;
            };
        };
        getDrawableIndex(id: string): number;
        getDrawableIds(): string[];
        getDrawableVertices(index: number): Float32Array;
        getParameterValueById(parameterId: string): number;
        setParameterValueById(parameterId: string, value: number): void;
        addParameterValueById(parameterId: string, value: number, weight?: number): void;
        saveParameters(): void;
        loadParameters(): void;
        update(): void;
        release(): void;
    }
}

declare module "@cubism/model/cubismmodeluserdata" {
    export interface CubismModelUserData {}
}

declare module "@cubism/model/cubismmoc" {
    import type { CubismModel } from "@cubism/model/cubismmodel";

    export class CubismMoc {
        static create(data: ArrayBuffer, shouldCheckMocConsistency?: boolean): CubismMoc;
        createModel(): CubismModel;
        release(): void;
    }
}

declare module "@cubism/motion/acubismmotion" {
    export class ACubismMotion {
        setFinishedMotionHandler(onFinishedMotionHandler?: (self: ACubismMotion) => void): void;
    }
}

declare module "@cubism/motion/cubismmotion" {
    import type { CubismSpec } from "@cubism/CubismSpec";
    import { ACubismMotion } from "@cubism/motion/acubismmotion";

    export class CubismMotion extends ACubismMotion {
        static create(
            json: CubismSpec.MotionJSON,
            onFinishedMotionHandler?: (self: ACubismMotion) => void,
        ): CubismMotion;
        setFadeInTime(value: number): void;
        setFadeOutTime(value: number): void;
        setEffectIds(eyeBlinkParameterIds: string[], lipSyncParameterIds: string[]): void;
    }
}

declare module "@cubism/motion/cubismmotionjson" {
    import type { CubismSpec } from "@cubism/CubismSpec";

    export class CubismMotionJson {
        constructor(json: CubismSpec.MotionJSON);
        getMotionFadeInTime(): number | undefined;
        getMotionFadeOutTime(): number | undefined;
    }
}

declare module "@cubism/motion/cubismexpressionmotion" {
    import type { CubismSpec } from "@cubism/CubismSpec";
    import { ACubismMotion } from "@cubism/motion/acubismmotion";

    export class CubismExpressionMotion extends ACubismMotion {
        static create(json: CubismSpec.ExpressionJSON): CubismExpressionMotion;
    }
}

declare module "@cubism/motion/cubismmotionqueuemanager" {
    import type { CubismModel } from "@cubism/model/cubismmodel";
    import type { ACubismMotion } from "@cubism/motion/acubismmotion";

    export class CubismMotionQueueManager {
        isFinished(): boolean;
        setEventCallback(
            callback: (caller: unknown, eventValue: string, customData: unknown) => void,
        ): void;
        stopAllMotions(): void;
        startMotion(motion: ACubismMotion, autoDelete: boolean, userTimeSeconds: number): number;
        doUpdateMotion(model: CubismModel, userTimeSeconds: number): boolean;
        release(): void;
    }
}

declare module "@cubism/physics/cubismphysics" {
    import type { CubismSpec } from "@cubism/CubismSpec";
    import type { CubismModel } from "@cubism/model/cubismmodel";

    export class CubismPhysics {
        static create(json: CubismSpec.PhysicsJSON): CubismPhysics;
        evaluate(model: CubismModel, deltaTimeSeconds: number): void;
        getOption(): { wind: { x: number; y: number } };
        setOptions(options: { wind: { x: number; y: number } }): void;
    }
}

declare module "@cubism/rendering/cubismrenderer_webgl" {
    import type { CubismMatrix44 } from "@cubism/math/cubismmatrix44";
    import type { CubismModel } from "@cubism/model/cubismmodel";

    export class CubismRenderer_WebGL {
        firstDraw: boolean;
        _bufferData: { vertex: unknown; uv: unknown; index: unknown };
        _clippingManager?: {
            _currentFrameNo: number;
            _maskTexture?: unknown;
        };
        initialize(model: CubismModel): void;
        setIsPremultipliedAlpha(value: boolean): void;
        startUp(gl: WebGLRenderingContext): void;
        bindTexture(index: number, texture: WebGLTexture): void;
        setMvpMatrix(matrix: CubismMatrix44): void;
        setRenderState(
            framebuffer: WebGLFramebuffer | null,
            viewport: [number, number, number, number],
        ): void;
        drawModel(): void;
        release(): void;
    }

    export class CubismShader_WebGL {
        _shaderSets: unknown[];
        static getInstance(): CubismShader_WebGL;
    }
}

declare module "@cubism/settings/cubismmodelsettingsjson" {
    import type { CubismSpec } from "@cubism/CubismSpec";

    export class CubismModelSettingsJson {
        constructor(json: CubismSpec.ModelJSON);
        getEyeBlinkParameters(): string[] | undefined;
        getLipSyncParameters(): string[] | undefined;
        groups?: CubismSpec.Group[];
        moc: string;
        expressions?: CubismSpec.Expression[];
        motions?: Record<string, CubismSpec.Motion[]>;
        textures: string[];
        physics?: string;
        pose?: string;
        hitAreas?: CubismSpec.HitArea[];
        layout?: CubismSpec.ModelJSON["Layout"];
    }
}

declare module "@cubism/live2dcubismframework" {
    export interface CubismStartupOption {
        logFunction?: (message: string) => void;
        loggingLevel?: LogLevel;
    }

    export enum LogLevel {
        LogLevel_Verbose = 0,
        LogLevel_Debug = 1,
        LogLevel_Info = 2,
        LogLevel_Warning = 3,
        LogLevel_Error = 4,
        LogLevel_Off = 5,
    }

    export namespace CubismFramework {
        export function isStarted(): boolean;
        export function startUp(options?: CubismStartupOption): void;
        export function initialize(): void;
    }
}
