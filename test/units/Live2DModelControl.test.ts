import { Live2DModel } from "@/Live2DModel";
import { expect, test } from "vitest";
import { StubInternalModel, baseOptions } from "./stubs";

test("transitionParametersTo applies values during beforeModelUpdate", () => {
    const model = new Live2DModel(baseOptions);
    const internalModel = new StubInternalModel();

    internalModel.params.ParamEyeLOpen = 1;
    internalModel.params.ParamEyeROpen = 1;

    model.internalModel = internalModel as unknown as typeof model.internalModel;
    model.emit("modelLoaded", internalModel as unknown as object);

    void model.transitionParametersTo(
        { ParamEyeLOpen: 0, ParamEyeROpen: 0 },
        { duration: 1000, easing: "linear" },
    );

    model.update(500);
    internalModel.emit("beforeModelUpdate");

    expect(internalModel.params.ParamEyeLOpen).toBeCloseTo(0.5, 3);
    expect(internalModel.params.ParamEyeROpen).toBeCloseTo(0.5, 3);
});

test("lookTo updates focus controller over time", () => {
    const model = new Live2DModel(baseOptions);
    const internalModel = new StubInternalModel();

    model.internalModel = internalModel as unknown as typeof model.internalModel;
    model.emit("modelLoaded", internalModel as unknown as object);

    void model.lookTo(1, -1, { duration: 1000, easing: "linear" });

    model.update(500);

    expect(internalModel.focusController.x).toBeCloseTo(0.5, 2);
    expect(internalModel.focusController.y).toBeCloseTo(-0.5, 2);
});

test("transitionWind updates wind options over time", () => {
    const model = new Live2DModel(baseOptions);
    const internalModel = new StubInternalModel();

    model.internalModel = internalModel as unknown as typeof model.internalModel;
    model.emit("modelLoaded", internalModel as unknown as object);

    void model.transitionWind({
        from: { x: 0, y: 0 },
        to: { x: 1, y: -1 },
        duration: 1000,
        easing: "linear",
    });

    model.update(500);

    const wind = model.getWind();
    expect(wind?.x).toBeCloseTo(0.5, 2);
    expect(wind?.y).toBeCloseTo(-0.5, 2);
});
