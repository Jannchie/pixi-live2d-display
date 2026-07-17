import { Live2DModel } from "@/Live2DModel";
import { expect, test } from "vitest";
import { StubCubism2InternalModel, StubInternalModel, baseOptions } from "./stubs";

function createModel(internalModel: StubInternalModel = new StubInternalModel()) {
    const model = new Live2DModel(baseOptions);
    model.internalModel = internalModel as unknown as typeof model.internalModel;
    model.emit("modelLoaded", internalModel as unknown as object);
    return { model, internalModel };
}

// lip sync

test("lip sync toggles and value round-trip", () => {
    const { model, internalModel } = createModel();

    model.startLipSync();
    expect(model.isLipSyncEnabled()).toBe(true);

    model.setLipSyncValue(0.8);
    expect(model.getLipSyncValue()).toBeCloseTo(0.8, 5);
    expect(internalModel.lipSyncValue).toBeCloseTo(0.8, 5);

    model.stopLipSync();
    expect(model.isLipSyncEnabled()).toBe(false);
    expect(model.getLipSyncValue()).toBe(0);
});

test("lip sync APIs are safe no-ops before modelLoaded", () => {
    const model = new Live2DModel(baseOptions);

    model.startLipSync();
    model.setLipSyncValue(1);
    model.stopLipSync();

    expect(model.isLipSyncEnabled()).toBe(false);
    expect(model.getLipSyncValue()).toBe(0);
});

// speech

test("speak rejects when the model is not ready", async () => {
    const model = new Live2DModel(baseOptions);

    await expect(model.speak("data:audio/wav;base64,unused")).rejects.toThrow(
        "Model is not ready",
    );
});

test("stopSpeaking resets speaking state and lip sync value", () => {
    const { model, internalModel } = createModel();

    model.startLipSync();
    model.setLipSyncValue(0.5);

    model.stopSpeaking();

    expect(model.isSpeakingNow()).toBe(false);
    expect(internalModel.lipSyncValue).toBe(0);
});

test("stopMicrophoneLipSync is safe without an active analyzer", () => {
    const { model } = createModel();

    expect(() => model.stopMicrophoneLipSync()).not.toThrow();
});

// eyes

test("eyeOpen drives Cubism 4 eye parameters through a parameter transition", () => {
    const { model, internalModel } = createModel();

    internalModel.params.ParamEyeLOpen = 1;
    internalModel.params.ParamEyeROpen = 1;

    void model.eyeOpen(0, { duration: 1000, easing: "linear" });

    model.update(500);
    internalModel.emit("beforeModelUpdate");

    expect(internalModel.params.ParamEyeLOpen).toBeCloseTo(0.5, 3);
    expect(internalModel.params.ParamEyeROpen).toBeCloseTo(0.5, 3);
});

test("eyeClose drives Cubism 2 eye parameters through a parameter transition", () => {
    const { model, internalModel } = createModel(new StubCubism2InternalModel());

    internalModel.params.PARAM_EYE_L_OPEN = 1;
    internalModel.params.PARAM_EYE_R_OPEN = 1;

    void model.eyeClose({ duration: 1000, easing: "linear" });

    model.update(500);
    internalModel.emit("beforeModelUpdate");

    expect(internalModel.params.PARAM_EYE_L_OPEN).toBeCloseTo(0.5, 3);
    expect(internalModel.params.PARAM_EYE_R_OPEN).toBeCloseTo(0.5, 3);
});

test("eyeOpen resolves as a no-op when the model is not ready", async () => {
    const model = new Live2DModel(baseOptions);

    await expect(model.eyeOpen(1)).resolves.toBeUndefined();
});

test("eye blink and eyes-look-at-camera flags forward to the internal model", () => {
    const { model, internalModel } = createModel();

    model.setEyeBlinkEnabled(false);
    expect(model.isEyeBlinkEnabled()).toBe(false);
    expect(internalModel.eyeBlinkEnabled).toBe(false);

    model.setEyesAlwaysLookAtCamera(true);
    expect(model.isEyesAlwaysLookAtCamera()).toBe(true);
    expect(internalModel.eyesAlwaysLookAtCamera).toBe(true);
});

// breathing

test("breathing setters forward to the internal model", () => {
    const { model, internalModel } = createModel();

    model.setBreathEnabled(false);
    expect(model.isBreathEnabled()).toBe(false);

    const parameters = [{ parameterId: "ParamBreath", offset: 0, peak: 0.6, cycle: 3.2, weight: 0.5 }];
    model.setBreathParameters(parameters);
    model.setBreathIntensity(1.2);
    model.setBreathCycle(0.8);

    expect(internalModel.breathParameters).toEqual(parameters);
    expect(internalModel.breathIntensity).toBeCloseTo(1.2, 5);
    expect(internalModel.breathCycle).toBeCloseTo(0.8, 5);
});

test("breathing getters report defaults when the model is not ready", () => {
    const model = new Live2DModel(baseOptions);

    expect(model.isBreathEnabled()).toBe(true);
    expect(model.isEyeBlinkEnabled()).toBe(true);
});

// wind

test("isWindSupported is false without usable physics", () => {
    const internalModel = new StubInternalModel();
    internalModel.physics = undefined;

    const { model } = createModel(internalModel);

    expect(model.isWindSupported()).toBe(false);
    expect(model.getWind()).toBeNull();

    // setWind must be a silent no-op
    expect(() => model.setWind(1, 1)).not.toThrow();
});

test("windTo with zero duration applies instantly", async () => {
    const { model } = createModel();

    await model.windTo(1, -1, { duration: 0 });

    const wind = model.getWind();
    expect(wind?.x).toBeCloseTo(1, 5);
    expect(wind?.y).toBeCloseTo(-1, 5);
});

test("stopWindTransition resolves the pending transition without jumping to the target", async () => {
    const { model } = createModel();

    const transition = model.windTo(1, -1, { duration: 1000, easing: "linear" });

    model.update(500);
    model.stopWindTransition();

    await transition;

    expect(model.isWindTransitioning()).toBe(false);

    const wind = model.getWind();
    expect(wind?.x).toBeCloseTo(0.5, 2);
    expect(wind?.y).toBeCloseTo(-0.5, 2);
});

// focus

test("focus applies synchronously and cancels an active lookTo transition", () => {
    const { model, internalModel } = createModel();

    void model.lookTo(1, 1, { duration: 1000, easing: "linear" });
    expect(model.isFocusTransitioning()).toBe(true);

    model.focus(0, 0, true);

    expect(model.isFocusTransitioning()).toBe(false);
    // instant focus writes the controller position directly
    expect(Math.hypot(internalModel.focusController.x, internalModel.focusController.y)).toBeCloseTo(
        1,
        5,
    );
});
