import { describe, expect, it, vi } from "vitest";
import { readFileSync } from "node:fs";
import {
  getLocalStorage,
  isDeckEligible,
  readMotionOptOut,
  resolveDeckMode,
  SCROLL_TIMELINE_CONDITION,
  supportsScrollTimeline,
  supportsSticky,
  writeMotionOptOut,
  type DeckInputs,
} from "./mode";
import { MOTION_OFF_VALUE, MOTION_STORAGE_KEY } from "./config";

// Con `?raw` vitest entrega un .css vacio (lo procesa aparte): se lee del disco.
const appCss = readFileSync("src/styles/app.css", "utf-8");

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

describe("supportsScrollTimeline", () => {
  it("exige la linea de tiempo de scroll Y el rango en px (el pan usa los dos)", () => {
    const supports = vi.fn(() => true);
    expect(supportsScrollTimeline({ supports })).toBe(true);
    expect(supports).toHaveBeenCalledWith(SCROLL_TIMELINE_CONDITION);
    expect(SCROLL_TIMELINE_CONDITION).toContain("(animation-timeline: scroll())");
    expect(SCROLL_TIMELINE_CONDITION).toContain("(animation-range: 0px 1px)");
  });

  it("pregunta EXACTAMENTE lo mismo que el @supports de .stage-pan (si no, el pan se quedaria quieto)", () => {
    // Con JS diciendo "si" y CSS "no", nadie moveria el contenido. Se exige que
    // `.stage-pan` sea la regla de ESE bloque, no solo que el texto aparezca.
    const escaped = SCROLL_TIMELINE_CONDITION.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    expect(appCss).toMatch(new RegExp(`@supports ${escaped}\\s*\\{\\s*\\.stage-pan\\s*\\{`));
  });

  it("es false si el navegador responde que no", () => {
    expect(supportsScrollTimeline({ supports: () => false })).toBe(false);
  });

  it("es false si no hay API de CSS (queda el pan por JS de siempre)", () => {
    expect(supportsScrollTimeline(undefined)).toBe(false);
    expect(supportsScrollTimeline({} as never)).toBe(false);
  });
});

describe("getLocalStorage", () => {
  it("devuelve el almacenamiento del navegador cuando esta disponible", () => {
    expect(getLocalStorage()).toBe(window.localStorage);
  });
});
