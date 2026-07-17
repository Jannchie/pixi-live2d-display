import type { Live2DModel } from "../Live2DModel";
import { AudioAnalyzer } from "../utils";

export interface Live2DModelSpeakOptions {
    volume?: number;
    expression?: string;
    resetExpression?: boolean;
    onFinish?: () => void;
    onError?: (error: Error) => void;
}

/**
 * Owns the audio-driven and manual lip sync features: speaking from audio
 * data/URLs, microphone input, and direct lip sync value control. Follows the
 * Automator pattern: owned by Live2DModel, which forwards its public API here.
 */
export class SpeechController {
    /**
     * Audio analyzer for speech recognition and lip sync.
     */
    private audioAnalyzer: AudioAnalyzer | null = null;

    /**
     * Current speaking state.
     */
    private isSpeaking = false;

    constructor(private readonly model: Live2DModel) {}

    startLipSync(): void {
        if (this.model.isReady()) {
            this.model.internalModel.setLipSyncEnabled(true);
        }
    }

    stopLipSync(): void {
        if (this.model.isReady()) {
            this.model.internalModel.setLipSyncEnabled(false);
            this.model.internalModel.setLipSyncValue(0);
        }
    }

    setLipSyncValue(value: number): void {
        if (this.model.isReady()) {
            this.model.internalModel.setLipSyncValue(value);
        }
    }

    isLipSyncEnabled(): boolean {
        return this.model.isReady() ? this.model.internalModel.lipSyncEnabled : false;
    }

    getLipSyncValue(): number {
        return this.model.isReady() ? this.model.internalModel.lipSyncValue : 0;
    }

    async speak(audioData: string, options: Live2DModelSpeakOptions = {}): Promise<void> {
        if (!this.model.isReady()) {
            throw new Error('Model is not ready');
        }

        if (this.isSpeaking) {
            this.stopSpeaking();
        }

        try {
            this.isSpeaking = true;

            // Initialize audio analyzer if needed
            if (!this.audioAnalyzer) {
                this.audioAnalyzer = new AudioAnalyzer();
            }

            // Start lip sync
            this.startLipSync();

            // Play and analyze audio
            await this.audioAnalyzer.playAndAnalyze(audioData, (volume) => {
                // Apply volume-based lip sync
                const lipSyncValue = Math.min(1, volume * (options.volume || 1));
                this.setLipSyncValue(lipSyncValue);
            });

            // Speaking finished
            this.isSpeaking = false;
            this.setLipSyncValue(0);

            if (options.onFinish) {
                options.onFinish();
            }
        } catch (error) {
            this.isSpeaking = false;
            this.setLipSyncValue(0);

            const errorObj = error instanceof Error ? error : new Error(String(error));
            if (options.onError) {
                options.onError(errorObj);
            } else {
                console.error('Speaking error:', errorObj);
            }
        }
    }

    stopSpeaking(): void {
        if (this.audioAnalyzer) {
            this.audioAnalyzer.destroy();
            this.audioAnalyzer = null;
        }

        this.isSpeaking = false;
        this.setLipSyncValue(0);
    }

    isSpeakingNow(): boolean {
        return this.isSpeaking;
    }

    async startMicrophoneLipSync(onError?: (error: Error) => void): Promise<void> {
        if (!this.model.isReady()) {
            throw new Error('Model is not ready');
        }

        try {
            // Initialize audio analyzer if needed
            if (!this.audioAnalyzer) {
                this.audioAnalyzer = new AudioAnalyzer();
            }

            // Start lip sync
            this.startLipSync();

            // Start microphone capture
            await this.audioAnalyzer.startMicrophone((volume) => {
                // Apply volume-based lip sync
                this.setLipSyncValue(volume);
            });
        } catch (error) {
            const errorObj = error instanceof Error ? error : new Error(String(error));
            if (onError) {
                onError(errorObj);
            } else {
                console.error('Microphone error:', errorObj);
            }
        }
    }

    stopMicrophoneLipSync(): void {
        if (this.audioAnalyzer) {
            this.audioAnalyzer.stopMicrophone();
        }
        this.setLipSyncValue(0);
    }

    destroy(): void {
        if (this.audioAnalyzer) {
            this.audioAnalyzer.destroy();
            this.audioAnalyzer = null;
        }
        this.isSpeaking = false;
    }
}
