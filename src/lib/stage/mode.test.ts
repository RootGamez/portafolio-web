import { describe, expect, it, vi } from "vitest";
import {
  getLocalStorage,
  isDeckEligible,
  readMotionOptOut,
  resolveDeckMode,
  supportsSticky,
  writeMotionOptOut,
  type DeckInputs,
} from "./mode";
import { MOTION_OFF_VALUE, MOTION_STORAGE_KEY } from "./config";

const FREE: DeckInputs = {
  prefersReducedMotion: false,
  forcedColors: false,
  userOptOut: false,
  supportsSticky: true,
};

describe("resolveDeckMode", () => {
  it("usa el modo escenarios cuando nada lo impide", () => {
    expect(resolveDeckMode(FREE)).toBe("deck");
  });

  it.each([
    ["prefers-reduced-motion", { prefersReducedMotion: true }],
    ["forced-colors", { forcedColors: true }],
    ["el opt-out del usuario", { userOptOut: true }],
    ["falta de position: sticky", { supportsSticky: false }],
  ] as const)("cae al modo lineal por %s", (_name, patch) => {
    expect(resolveDeckMode({ ...FREE, ...patch })).toBe("linear");
  });

  it("basta UNA sola razon, aunque las demas sean favorables", () => {
    expect(
      resolveDeckMode({
        prefersReducedMotion: true,
        forcedColors: false,
        userOptOut: false,
        supportsSticky: true,
      }),
    ).toBe("linear");
  });
});

describe("isDeckEligible", () => {
  it("es true si el navegador y las preferencias permiten escenarios", () => {
    expect(isDeckEligible(FREE)).toBe(true);
  });

  it("ignora el opt-out: aunque el usuario lo apague, podria volver a encenderlo", () => {
    expect(isDeckEligible({ ...FREE, userOptOut: true })).toBe(true);
  });

  it.each([
    ["prefers-reduced-motion", { prefersReducedMotion: true }],
    ["forced-colors", { forcedColors: true }],
    ["falta de position: sticky", { supportsSticky: false }],
  ] as const)("es false por %s: ahi el interruptor no tendria efecto", (_name, patch) => {
    expect(isDeckEligible({ ...FREE, ...patch })).toBe(false);
  });
});

describe("readMotionOptOut", () => {
  it("es false sin almacenamiento", () => {
    expect(readMotionOptOut(null)).toBe(false);
  });

  it("es true solo con el valor exacto de opt-out", () => {
    const stored = (value: string | null) => ({ getItem: vi.fn(() => value) });
    expect(readMotionOptOut(stored(MOTION_OFF_VALUE))).toBe(true);
    expect(readMotionOptOut(stored("on"))).toBe(false);
    expect(readMotionOptOut(stored(""))).toBe(false);
    expect(readMotionOptOut(stored(null))).toBe(false);
  });

  it("lee la clave del portafolio", () => {
    const getItem = vi.fn(() => null);
    readMotionOptOut({ getItem });
    expect(getItem).toHaveBeenCalledWith(MOTION_STORAGE_KEY);
  });

  it("si el almacenamiento lanza (modo privado, datos bloqueados) no rompe: false", () => {
    const hostile = {
      getItem: () => {
        throw new Error("SecurityError");
      },
    };
    expect(readMotionOptOut(hostile)).toBe(false);
  });
});

describe("writeMotionOptOut", () => {
  it("guarda el valor de opt-out al desactivar", () => {
    const storage = { setItem: vi.fn(), removeItem: vi.fn() };
    writeMotionOptOut(storage, true);
    expect(storage.setItem).toHaveBeenCalledWith(MOTION_STORAGE_KEY, MOTION_OFF_VALUE);
    expect(storage.removeItem).not.toHaveBeenCalled();
  });

  it("borra la clave al volver a activar", () => {
    const storage = { setItem: vi.fn(), removeItem: vi.fn() };
    writeMotionOptOut(storage, false);
    expect(storage.removeItem).toHaveBeenCalledWith(MOTION_STORAGE_KEY);
    expect(storage.setItem).not.toHaveBeenCalled();
  });

  it("tolera almacenamiento ausente o que lanza (la eleccion vive solo en la sesion)", () => {
    const hostile = {
      setItem: () => {
        throw new Error("QuotaExceededError");
      },
      removeItem: () => {
        throw new Error("SecurityError");
      },
    };
    expect(() => writeMotionOptOut(null, true)).not.toThrow();
    expect(() => writeMotionOptOut(hostile, true)).not.toThrow();
    expect(() => writeMotionOptOut(hostile, false)).not.toThrow();
  });
});

describe("supportsSticky", () => {
  it("consulta CSS.supports('position', 'sticky')", () => {
    const supports = vi.fn(() => true);
    expect(supportsSticky({ supports })).toBe(true);
    expect(supports).toHaveBeenCalledWith("position", "sticky");
  });

  it("es false si el navegador responde que no", () => {
    expect(supportsSticky({ supports: () => false })).toBe(false);
  });

  it("es false si no hay API de CSS (no se puede asegurar: se prefiere lineal)", () => {
    expect(supportsSticky(undefined)).toBe(false);
    expect(supportsSticky({} as never)).toBe(false);
  });
});

describe("getLocalStorage", () => {
  it("devuelve el almacenamiento del navegador cuando esta disponible", () => {
    expect(getLocalStorage()).toBe(window.localStorage);
  });
});
