import { describe, expect, it } from "vitest";
import { SCRUB_DRAW_MIN_VISIBLE, SCRUB_ERASE_FEATHER_PCT } from "./config";
import {
  drawFrame,
  eraseMask,
  parallaxY,
  reachProgress,
  revealFrame,
  scrubT,
  stampFrame,
  writeMask,
} from "./scrub";

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

describe("eraseMask: la tinta se retira de izquierda a derecha con un borde difuminado", () => {
  const F = SCRUB_ERASE_FEATHER_PCT;
  /** Donde acaba la zona ya borrada (transparente) en una mascara. */
  const erasedUpTo = (mask: string) => Number(/transparent (-?[\d.]+)%/.exec(mask)?.[1]);

  it("antes del tramo no hay mascara: el texto se pinta tal cual, nitido y sin coste", () => {
    expect(eraseMask(0, [0.2, 0.8])).toBe("none");
    expect(eraseMask(0.2, [0.2, 0.8])).toBe("none");
  });

  it("al acabar el tramo esta borrado entero: el borde ya ha salido por la derecha", () => {
    expect(eraseMask(1, [0.2, 0.8])).toBe(`linear-gradient(to right, transparent 100%, #000 ${100 + F}%)`);
  });

  it("el borde avanza siempre hacia la derecha y mide siempre lo mismo", () => {
    let previous = -Infinity;
    for (let p = 0.25; p <= 0.8; p += 0.05) {
      const mask = eraseMask(p, [0.2, 0.8]);
      const from = erasedUpTo(mask);
      const to = Number(/#000 (-?[\d.]+)%/.exec(mask)?.[1]);
      expect(from).toBeGreaterThan(previous);
      expect(to - from).toBeCloseTo(F);
      previous = from;
    }
  });
});

describe("stampFrame: un sello que cae, golpea y se asienta", () => {
  it("antes del tramo no se ve y esta grande (en el aire); al acabar, visible y a tamano real", () => {
    expect(stampFrame(0, [0.4, 0.6], 1.6)).toEqual({ opacity: 0, scale: 1.6 });
    expect(stampFrame(1, [0.4, 0.6], 1.6)).toEqual({ opacity: 1, scale: 1 });
  });

  it("aparece deprisa: ya es opaco antes de la mitad del tramo (el golpe se ve entero)", () => {
    expect(stampFrame(0.5, [0.4, 0.6], 1.6).opacity).toBe(1);
  });

  it("el golpe: en algun momento se queda POR DEBAJO de su tamano y luego vuelve a 1", () => {
    const scales = Array.from({ length: 41 }, (_, i) => stampFrame(0.4 + (0.2 * i) / 40, [0.4, 0.6], 1.6).scale);
    const lowest = Math.min(...scales);
    expect(lowest).toBeLessThan(1);
    expect(lowest).toBeGreaterThan(0.85);
    expect(scales.at(-1)).toBe(1);
  });

  it("es reversible: el mismo progreso da siempre el mismo fotograma", () => {
    expect(stampFrame(0.47, [0.4, 0.6], 1.6)).toEqual(stampFrame(0.47, [0.4, 0.6], 1.6));
  });
});

describe("reachProgress: cuanto ha cruzado la linea de lectura a un elemento", () => {
  it("0 hasta que la linea llega a su borde de arriba, 1 cuando pasa su borde de abajo, lineal entre medias", () => {
    expect(reachProgress(100, 200, 400)).toBe(0);
    expect(reachProgress(200, 200, 400)).toBe(0);
    expect(reachProgress(400, 200, 400)).toBe(0.5);
    expect(reachProgress(600, 200, 400)).toBe(1);
    expect(reachProgress(5000, 200, 400)).toBe(1);
  });

  it("un elemento sin alto es un escalon en su borde; una lectura infinita (modo lineal) lo da por leido", () => {
    expect(reachProgress(199, 200, 0)).toBe(0);
    expect(reachProgress(200, 200, 0)).toBe(1);
    expect(reachProgress(Number.POSITIVE_INFINITY, 200, 400)).toBe(1);
  });

  it("una lectura NaN cuenta como no leido", () => {
    expect(reachProgress(Number.NaN, 200, 400)).toBe(0);
  });
});

describe("writeMask: el texto se ESCRIBE de izquierda a derecha (el borrado, al reves)", () => {
  const F = SCRUB_ERASE_FEATHER_PCT;
  const writtenUpTo = (mask: string) => Number(/#000 (-?[\d.]+)%/.exec(mask)?.[1]);

  it("antes del tramo no hay nada escrito: la mascara lo oculta entero", () => {
    expect(writeMask(0, [0.2, 0.8])).toBe(`linear-gradient(to right, #000 ${-F}%, transparent 0%)`);
  });

  it("al acabar el tramo esta escrito entero y sin mascara (nitido y sin coste)", () => {
    expect(writeMask(0.8, [0.2, 0.8])).toBe("none");
    expect(writeMask(1, [0.2, 0.8])).toBe("none");
  });

  it("el trazo avanza siempre hacia la derecha con el mismo borde difuminado", () => {
    let previous = -Infinity;
    for (let p = 0.25; p < 0.8; p += 0.05) {
      const mask = writeMask(p, [0.2, 0.8]);
      const from = writtenUpTo(mask);
      const to = Number(/transparent (-?[\d.]+)%/.exec(mask)?.[1]);
      expect(from).toBeGreaterThan(previous);
      expect(to - from).toBeCloseTo(F);
      previous = from;
    }
  });
});
