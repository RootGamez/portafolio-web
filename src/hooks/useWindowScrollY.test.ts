import { afterEach, describe, expect, it, vi } from "vitest";
import { act, renderHook } from "@testing-library/react";
import { useWindowScrollY } from "./useWindowScrollY";

function setScrollY(value: number) {
  Object.defineProperty(window, "scrollY", { configurable: true, value });
}

function scrollTo(value: number) {
  setScrollY(value);
  act(() => {
    window.dispatchEvent(new Event("scroll"));
  });
}

describe("useWindowScrollY", () => {
  afterEach(() => {
    setScrollY(0);
  });

  it("arranca ya con el scroll actual de la ventana, sin pasar por 0", () => {
    // Si arrancase en 0 y se corrigiera en un efecto, al recargar a mitad de
    // pagina el primer pintado saldria en el escenario equivocado.
    setScrollY(340);
    // Se lee DURANTE el render: `renderHook` vacia los efectos dentro de `act`, y
    // el del hook corrige el valor al montar, asi que mirar `result.current` despues
    // no distinguiria "arranca en 340" de "arranca en 0 y se corrige".
    const seenWhileRendering: number[] = [];
    renderHook(() => {
      const scrollY = useWindowScrollY();
      seenWhileRendering.push(scrollY.get());
      return scrollY;
    });

    expect(seenWhileRendering[0]).toBe(340);
  });

  it("sigue los eventos de scroll", () => {
    const { result } = renderHook(() => useWindowScrollY());

    scrollTo(1200);
    expect(result.current.get()).toBe(1200);

    scrollTo(80);
    expect(result.current.get()).toBe(80);
  });

  it("escucha en modo pasivo para no bloquear el scroll", () => {
    const add = vi.spyOn(window, "addEventListener");
    renderHook(() => useWindowScrollY());

    const call = add.mock.calls.find(([type]) => type === "scroll");
    expect(call?.[2]).toMatchObject({ passive: true });
  });

  it("deja de escuchar al desmontar", () => {
    const remove = vi.spyOn(window, "removeEventListener");
    const { unmount } = renderHook(() => useWindowScrollY());

    unmount();

    expect(remove.mock.calls.some(([type]) => type === "scroll")).toBe(true);
  });

  it("devuelve siempre el mismo MotionValue entre renders", () => {
    const { result, rerender } = renderHook(() => useWindowScrollY());
    const first = result.current;

    rerender();

    expect(result.current).toBe(first);
  });
});
