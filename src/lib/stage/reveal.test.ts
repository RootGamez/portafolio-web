import { describe, expect, it } from "vitest";
import { revealDelta } from "./reveal";

const FRAME = { top: 0, bottom: 800 };
const MARGIN = 24;

describe("revealDelta: cuanto subir o bajar el pan para mostrar un elemento enfocado", () => {
  it("si el elemento ya se ve, no mueve nada", () => {
    expect(revealDelta(FRAME, { top: 300, bottom: 340 }, MARGIN)).toBe(0);
  });

  it("si queda por DEBAJO, baja lo justo para dejarlo a `margin` del borde inferior", () => {
    expect(revealDelta(FRAME, { top: 900, bottom: 950 }, MARGIN)).toBe(950 - (800 - MARGIN));
  });

  it("si queda por ENCIMA, sube lo justo para dejarlo a `margin` del borde superior", () => {
    expect(revealDelta(FRAME, { top: -60, bottom: -10 }, MARGIN)).toBe(-60 - MARGIN);
  });

  it("respeta el margen: un elemento pegado al borde cuenta como fuera", () => {
    expect(revealDelta(FRAME, { top: 10, bottom: 50 }, MARGIN)).toBe(10 - MARGIN);
    expect(revealDelta(FRAME, { top: 760, bottom: 790 }, MARGIN)).toBe(790 - (800 - MARGIN));
  });

  it("usa el visor tal como esta en la ventana (con `top` distinto de 0)", () => {
    const frame = { top: 56, bottom: 856 };

    expect(revealDelta(frame, { top: 400, bottom: 440 }, MARGIN)).toBe(0);
    expect(revealDelta(frame, { top: 40, bottom: 80 }, MARGIN)).toBe(40 - (56 + MARGIN));
  });

  describe("un elemento MAS ALTO que el visor (no cabe entero)", () => {
    // Pasa al enfocar una seccion completa: lo que lo identifica es su borde
    // superior, asi que no se baja el pan para ver el inferior (el usuario
    // llegaria "al final" de un escenario sin ver su arranque).
    const tall = (top: number) => ({ top, bottom: top + 900 });

    it("con su borde superior a la vista, no mueve nada aunque el inferior quede fuera", () => {
      expect(revealDelta(FRAME, tall(100), MARGIN)).toBe(0);
      expect(revealDelta(FRAME, tall(MARGIN), MARGIN)).toBe(0);
    });

    it("con su borde superior pegado al del visor (recien llegado a su escenario), tampoco", () => {
      expect(revealDelta(FRAME, tall(0), MARGIN)).toBe(0);
      expect(revealDelta(FRAME, tall(10), MARGIN)).toBe(0);
    });

    it("con su borde superior por ENCIMA, sube hasta alinearlo", () => {
      expect(revealDelta(FRAME, tall(-50), MARGIN)).toBe(-50 - MARGIN);
    });

    it("con su borde superior por DEBAJO del visor, baja hasta alinearlo", () => {
      expect(revealDelta(FRAME, tall(900), MARGIN)).toBe(900 - MARGIN);
    });

    it("un elemento justo del alto util cabe entero y se trata como uno normal", () => {
      const usable = 800 - 2 * MARGIN;

      expect(revealDelta(FRAME, { top: MARGIN, bottom: MARGIN + usable }, MARGIN)).toBe(0);
      // Si cabe y sobresale por debajo, se baja para verlo ENTERO.
      expect(revealDelta(FRAME, { top: 200, bottom: 200 + usable }, MARGIN)).toBe(200 + usable - (800 - MARGIN));
    });
  });
});
