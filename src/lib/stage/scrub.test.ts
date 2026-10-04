import { describe, expect, it } from "vitest";
import { SCRUB_DRAW_MIN_VISIBLE } from "./config";
import { drawFrame, parallaxY, revealFrame, scrubT } from "./scrub";

describe("scrubT: avance lineal 0..1 dentro de un tramo del progreso del escenario", () => {
  it("vale 0 antes del tramo, 1 despues y es lineal dentro", () => {
    expect(scrubT(0.1, [0.2, 0.6])).toBe(0);
    expect(scrubT(0.2, [0.2, 0.6])).toBe(0);
    expect(scrubT(0.4, [0.2, 0.6])).toBeCloseTo(0.5);
    expect(scrubT(0.6, [0.2, 0.6])).toBe(1);
    expect(scrubT(0.9, [0.2, 0.6])).toBe(1);
  });

  it("es monotono: avanzar nunca hace retroceder la animacion", () => {
    let previous = -1;
    for (let p = 0; p <= 1; p += 0.01) {
      const t = scrubT(p, [0.1, 0.7]);
      expect(t).toBeGreaterThanOrEqual(previous);
      previous = t;
    }
  });

  it("un tramo de largo 0 es un escalon en su inicio (no divide por 0)", () => {
    expect(scrubT(0.29, [0.3, 0.3])).toBe(0);
    expect(scrubT(0.3, [0.3, 0.3])).toBe(1);
  });

  it("un progreso no finito cuenta como 0 (fotograma inicial), nunca NaN", () => {
    expect(scrubT(Number.NaN, [0, 1])).toBe(0);
    expect(scrubT(Number.POSITIVE_INFINITY, [0, 1])).toBe(0);
  });
});

describe("revealFrame: aparece subiendo desde `distance` px, con entrada y salida suaves", () => {
  it("antes del tramo esta oculto y desplazado; al acabar, visible y en su sitio", () => {
    expect(revealFrame(0, [0.1, 0.4], 24)).toEqual({ opacity: 0, y: 24 });
    expect(revealFrame(1, [0.1, 0.4], 24)).toEqual({ opacity: 1, y: 0 });
  });

  it("a mitad del tramo va a mitad (curva simetrica) y entre medias es suave, no lineal", () => {
    const middle = revealFrame(0.25, [0.1, 0.4], 24);
    expect(middle.opacity).toBeCloseTo(0.5);
    expect(middle.y).toBeCloseTo(12);
    // Al principio del tramo avanza menos que una recta: arranca despacio.
    expect(revealFrame(0.13, [0.1, 0.4], 24).opacity).toBeLessThan(0.1);
  });

  it("un progreso no finito es el fotograma inicial (oculto), nunca NaN", () => {
    expect(revealFrame(Number.NaN, [0, 0.5], 24)).toEqual({ opacity: 0, y: 24 });
  });

  it("opacidad y desplazamiento van atados: el hueco que queda por subir es (1 - opacidad) * distance", () => {
    for (let p = 0; p <= 1; p += 0.05) {
      const { opacity, y } = revealFrame(p, [0.2, 0.5], 40);
      expect(y).toBeCloseTo((1 - opacity) * 40);
    }
  });
});

describe("drawFrame: un trazo SVG que se dibuja con `pathLength`", () => {
  it("la longitud dibujada sigue el tramo de forma lineal (el pincel va a velocidad constante)", () => {
    expect(drawFrame(0, [0, 0.5]).pathLength).toBe(0);
    expect(drawFrame(0.25, [0, 0.5]).pathLength).toBeCloseTo(0.5);
    expect(drawFrame(0.5, [0, 0.5]).pathLength).toBe(1);
  });

  it("por debajo del minimo visible no se pinta (con puntas redondas asomarian dos puntos)", () => {
    const almostNothing = SCRUB_DRAW_MIN_VISIBLE / 2;
    expect(drawFrame(almostNothing, [0, 1]).opacity).toBe(0);
    expect(drawFrame(SCRUB_DRAW_MIN_VISIBLE, [0, 1]).opacity).toBe(1);
    expect(drawFrame(1, [0, 1]).opacity).toBe(1);
  });
});

describe("parallaxY: desplazamiento vertical que crece con el avance", () => {
  it("arranca en 0 (el primer fotograma es el del modo lineal) y llega a -distance", () => {
    expect(parallaxY(0, [0, 1], 60)).toBe(0);
    expect(parallaxY(0.5, [0, 1], 60)).toBeCloseTo(-30);
    expect(parallaxY(1, [0, 1], 60)).toBeCloseTo(-60);
  });

  it("una distancia negativa baja en vez de subir", () => {
    expect(parallaxY(1, [0, 1], -20)).toBeCloseTo(20);
  });

  it("fuera del tramo se queda quieto en su extremo", () => {
    expect(parallaxY(0.9, [0.2, 0.6], 50)).toBeCloseTo(-50);
    expect(parallaxY(0.1, [0.2, 0.6], 50)).toBe(0);
  });
});
