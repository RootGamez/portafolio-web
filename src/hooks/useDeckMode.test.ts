import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { act, renderHook } from "@testing-library/react";
import { useDeckMode } from "./useDeckMode";
import { FORCED_COLORS_QUERY, MOTION_OFF_VALUE, MOTION_STORAGE_KEY } from "@/lib/stage/config";
import { installMatchMedia, restoreCss, stubCssSupports } from "@/test/doubles";

const REDUCED = "(prefers-reduced-motion: reduce)";

describe("useDeckMode", () => {
  beforeEach(() => {
    window.localStorage.clear();
    stubCssSupports(true);
  });

  afterEach(() => {
    restoreCss();
  });

  it("arranca en modo escenarios cuando nada lo impide, ya en el primer render", () => {
    installMatchMedia();
    const { result } = renderHook(() => useDeckMode());

    expect(result.current.mode).toBe("deck");
    expect(result.current.eligible).toBe(true);
    expect(result.current.optedOut).toBe(false);
  });

  it("prefers-reduced-motion fuerza el modo lineal y oculta la opcion de activarlo", () => {
    installMatchMedia({ [REDUCED]: true });
    const { result } = renderHook(() => useDeckMode());

    expect(result.current.mode).toBe("linear");
    expect(result.current.eligible).toBe(false);
  });

  it("forced-colors fuerza el modo lineal", () => {
    installMatchMedia({ [FORCED_COLORS_QUERY]: true });
    const { result } = renderHook(() => useDeckMode());

    expect(result.current.mode).toBe("linear");
    expect(result.current.eligible).toBe(false);
  });

  it("sin position: sticky se queda en lineal", () => {
    installMatchMedia();
    stubCssSupports(false);
    const { result } = renderHook(() => useDeckMode());

    expect(result.current.mode).toBe("linear");
    expect(result.current.eligible).toBe(false);
  });

  it("respeta un opt-out guardado: lineal, pero con la opcion de volver a activarlo", () => {
    installMatchMedia();
    window.localStorage.setItem(MOTION_STORAGE_KEY, MOTION_OFF_VALUE);
    const { result } = renderHook(() => useDeckMode());

    expect(result.current.mode).toBe("linear");
    expect(result.current.optedOut).toBe(true);
    expect(result.current.eligible).toBe(true);
  });

  it("setOptedOut(true) pasa a lineal y recuerda la eleccion", () => {
    installMatchMedia();
    const { result } = renderHook(() => useDeckMode());

    act(() => result.current.setOptedOut(true));

    expect(result.current.mode).toBe("linear");
    expect(result.current.optedOut).toBe(true);
    expect(window.localStorage.getItem(MOTION_STORAGE_KEY)).toBe(MOTION_OFF_VALUE);
  });

  it("setOptedOut(false) vuelve a escenarios y borra la eleccion guardada", () => {
    installMatchMedia();
    window.localStorage.setItem(MOTION_STORAGE_KEY, MOTION_OFF_VALUE);
    const { result } = renderHook(() => useDeckMode());

    act(() => result.current.setOptedOut(false));

    expect(result.current.mode).toBe("deck");
    expect(window.localStorage.getItem(MOTION_STORAGE_KEY)).toBeNull();
  });

  it("reacciona en caliente si el usuario cambia reduced-motion en el sistema", () => {
    const media = installMatchMedia();
    const { result } = renderHook(() => useDeckMode());
    expect(result.current.mode).toBe("deck");

    act(() => media.change(REDUCED, true));
    expect(result.current.mode).toBe("linear");

    act(() => media.change(REDUCED, false));
    expect(result.current.mode).toBe("deck");
  });

  it("reacciona en caliente a forced-colors", () => {
    const media = installMatchMedia();
    const { result } = renderHook(() => useDeckMode());

    act(() => media.change(FORCED_COLORS_QUERY, true));

    expect(result.current.mode).toBe("linear");
  });

  it("deja de escuchar los cambios al desmontar", () => {
    const media = installMatchMedia();
    const { unmount } = renderHook(() => useDeckMode());
    expect(media.listenerCount(FORCED_COLORS_QUERY)).toBeGreaterThan(0);

    unmount();

    expect(media.listenerCount(FORCED_COLORS_QUERY)).toBe(0);
    expect(media.listenerCount(REDUCED)).toBe(0);
  });

  it("si localStorage lanza no rompe: arranca en escenarios y el cambio vive en la sesion", () => {
    installMatchMedia();
    const original = Object.getOwnPropertyDescriptor(window, "localStorage");
    Object.defineProperty(window, "localStorage", {
      configurable: true,
      get() {
        throw new Error("SecurityError");
      },
    });

    try {
      const { result } = renderHook(() => useDeckMode());
      expect(result.current.mode).toBe("deck");

      act(() => result.current.setOptedOut(true));
      expect(result.current.mode).toBe("linear");
    } finally {
      // Se restaura el descriptor original para no contaminar a los demas tests.
      if (original) Object.defineProperty(window, "localStorage", original);
      else Reflect.deleteProperty(window, "localStorage");
    }
  });
});
