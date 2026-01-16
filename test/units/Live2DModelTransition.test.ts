import { Live2DModel } from "@/Live2DModel";
import { expect, test } from "vitest";

const baseOptions = {
    autoUpdate: false,
    autoHitTest: false,
    autoFocus: false,
};

test("transitionTo updates alpha over time", () => {
    const model = new Live2DModel(baseOptions);
    model.alpha = 1;

    void model.transitionTo({ alpha: 0 }, { duration: 1000, easing: "linear" });

    model.update(500);
    expect(model.alpha).toBeCloseTo(0.5, 3);

    model.update(500);
    expect(model.alpha).toBeCloseTo(0, 3);
});

test("appear applies from state immediately", () => {
    const model = new Live2DModel(baseOptions);
    model.alpha = 1;

    void model.appear({ duration: 1000, easing: "linear" });

    expect(model.alpha).toBeCloseTo(0, 3);
});

test("disappear uses current values for from state", () => {
    const model = new Live2DModel(baseOptions);
    model.alpha = 0.4;

    void model.disappear({ duration: 1000, easing: "linear" });
    model.update(500);

    expect(model.alpha).toBeCloseTo(0.2, 3);
});
