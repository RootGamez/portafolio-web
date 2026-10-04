import type { ReactNode } from "react";
import { describe, expect, it } from "vitest";
import { renderHook } from "@testing-library/react";
import { motionValue } from "motion/react";
import { StageContext, useStage, type StageContextValue } from "./StageContext";

describe("useStage", () => {
  it("fuera de un deck se comporta como modo lineal: activo, cercano y con progreso 1", () => {
    const { result } = renderHook(() => useStage());

    expect(result.current.mode).toBe("linear");
    expect(result.current.isActive).toBe(true);
    expect(result.current.isNear).toBe(true);
    // Progreso 1 = todo en su estado final: la ley "todo arranca visible".
    expect(result.current.progress.get()).toBe(1);
    expect(result.current.intro.get()).toBe(1);
  });

  it("el valor por defecto es siempre el mismo objeto (no se recrea por render)", () => {
    const first = renderHook(() => useStage()).result.current;
    const second = renderHook(() => useStage()).result.current;

    expect(second).toBe(first);
  });

  it("dentro de un escenario devuelve el valor que le dio su capa", () => {
    const value: StageContextValue = {
      mode: "deck",
      index: 3,
      isActive: false,
      isNear: true,
      progress: motionValue(0.25),
      intro: motionValue(0.5),
    };
    const wrapper = ({ children }: { children: ReactNode }) => (
      <StageContext value={value}>{children}</StageContext>
    );

    const { result } = renderHook(() => useStage(), { wrapper });

    expect(result.current).toBe(value);
    expect(result.current.index).toBe(3);
    expect(result.current.isActive).toBe(false);
    expect(result.current.progress.get()).toBe(0.25);
  });
});
