import { describe, expect, it } from "vitest";
import { EDGES, EDGE_VIEWBOX_HEIGHT } from "@/components/ink/edgeShapes";
import { frontEdgeOf, TRANSITIONS, type MassEdge } from "./transitions";
import {
  CARD_END,
  CARD_HIDE_END,
  CARD_HIDE_START,
  CARD_SHOW_FULL,
  CARD_SHOW_START,
  CARD_STROKE_MIN_VISIBLE,
  CARD_STROKE_START,
  COVER_END,
  INK_EDGE_MAX_PX,
  INK_EDGE_MIN_PX,
  SWAP_AT,
} from "./config";
import {
  chapterCardOpacity,
  chapterStrokeProgress,
  curtainProgress,
  inkBandHeight,
  inkBandTop,
  inkEdgeHeight,
  isChapterStrokeVisible,
  isInkBandVisible,
} from "./ink";

const VISOR = 674;
const EDGE = 148;

describe("inkEdgeHeight: alto del frente de pincel segun el visor", () => {
  it("es proporcional al alto del visor", () => {
    expect(inkEdgeHeight(674)).toBe(148);
  });

  it("no baja del minimo (visores muy bajos)", () => {
    expect(inkEdgeHeight(200)).toBe(INK_EDGE_MIN_PX);
  });

  it("no pasa del maximo (visores muy altos)", () => {
    expect(inkEdgeHeight(4000)).toBe(INK_EDGE_MAX_PX);
  });

  it("con un alto no finito o negativo cae al minimo, nunca a NaN", () => {
    expect(inkEdgeHeight(Number.NaN)).toBe(INK_EDGE_MIN_PX);
    expect(inkEdgeHeight(Number.POSITIVE_INFINITY)).toBe(INK_EDGE_MIN_PX);
    expect(inkEdgeHeight(-50)).toBe(INK_EDGE_MIN_PX);
  });

  it("devuelve siempre un entero (los bordes caen en pixeles enteros)", () => {
    for (const visor of [333, 674, 788, 901, 1234]) {
      expect(Number.isInteger(inkEdgeHeight(visor))).toBe(true);
    }
  });
});

describe("inkBandHeight: frente + cuerpo (un visor) + cola", () => {
  it("suma un visor y dos bordes", () => {
    expect(inkBandHeight(VISOR, EDGE)).toBe(VISOR + 2 * EDGE);
  });
});

describe("inkBandTop: donde esta el borde superior de la banda, respecto al tope del visor", () => {
  it("al empezar la transicion la banda esta ENTERA por debajo del visor", () => {
    expect(inkBandTop(0, VISOR, EDGE)).toBe(VISOR);
  });

  it("al acabar la fase de cubrir el frente ya salio por arriba: todo cubierto", () => {
    expect(inkBandTop(COVER_END, VISOR, EDGE)).toBe(-EDGE);
  });

  it("durante la tarjeta la banda no se mueve", () => {
    const middle = (COVER_END + CARD_END) / 2;

    expect(inkBandTop(middle, VISOR, EDGE)).toBe(-EDGE);
    expect(inkBandTop(CARD_END, VISOR, EDGE)).toBe(-EDGE);
  });

  it("al acabar la transicion la banda esta ENTERA por encima del visor", () => {
    const top = inkBandTop(1, VISOR, EDGE);

    expect(top).toBe(-inkBandHeight(VISOR, EDGE));
    expect(top + inkBandHeight(VISOR, EDGE)).toBeLessThanOrEqual(0);
  });

  it("sube de forma lineal con el scroll al cubrir (1:1, sin curva que lo haga confuso)", () => {
    const quarter = inkBandTop(COVER_END / 4, VISOR, EDGE);
    const half = inkBandTop(COVER_END / 2, VISOR, EDGE);

    expect(quarter).toBeCloseTo(VISOR - (VISOR + EDGE) / 4, 6);
    expect(half).toBeCloseTo(VISOR - (VISOR + EDGE) / 2, 6);
  });

  it("nunca baja: la banda solo sube, en cualquier punto de la transicion", () => {
    let previous = Number.POSITIVE_INFINITY;
    for (let step = 0; step <= 200; step += 1) {
      const top = inkBandTop(step / 200, VISOR, EDGE);
      expect(top).toBeLessThanOrEqual(previous);
      previous = top;
    }
  });

  it("es continua en los limites de fase (no hay saltos)", () => {
    const epsilon = 1e-9;

    for (const boundary of [COVER_END, CARD_END]) {
      const before = inkBandTop(boundary - epsilon, VISOR, EDGE);
      const after = inkBandTop(boundary + epsilon, VISOR, EDGE);
      expect(Math.abs(before - after)).toBeLessThan(1e-3);
    }
  });

  it("fuera de 0..1 se recorta (un scroll que se pasa no dibuja la banda en otro sitio)", () => {
    expect(inkBandTop(-0.5, VISOR, EDGE)).toBe(inkBandTop(0, VISOR, EDGE));
    expect(inkBandTop(1.7, VISOR, EDGE)).toBe(inkBandTop(1, VISOR, EDGE));
  });

  it("con un t no finito se queda en el estado de reposo (fuera, por debajo)", () => {
    expect(inkBandTop(Number.NaN, VISOR, EDGE)).toBe(VISOR);
  });

  it.each([320, 674, 788, 1200])(
    "el visor (%ipx) queda CUBIERTO por completo mientras dura la fase de tarjeta",
    (visor) => {
      const edge = inkEdgeHeight(visor);
      const top = inkBandTop((COVER_END + CARD_END) / 2, visor, edge);
      const bottom = top + inkBandHeight(visor, edge);

      // El visor ocupa 0..visor: la banda lo envuelve con el cuerpo y deja los bordes fuera.
      expect(top + edge).toBeLessThanOrEqual(0);
      expect(bottom - edge).toBeGreaterThanOrEqual(visor);
    },
  );
});

describe("chapterCardOpacity: la tarjeta de capitulo solo se ve SOBRE la tinta", () => {
  it("es invisible al empezar y al acabar la transicion (la tinta aun no cubre el centro)", () => {
    expect(chapterCardOpacity(0)).toBe(0);
    expect(chapterCardOpacity(CARD_SHOW_START)).toBe(0);
    expect(chapterCardOpacity(CARD_HIDE_END)).toBe(0);
    expect(chapterCardOpacity(1)).toBe(0);
  });

  it("es opaca mientras la tinta lo cubre todo: toda la fase de tarjeta y un buen margen", () => {
    for (const t of [CARD_SHOW_FULL, COVER_END, SWAP_AT, CARD_END, CARD_HIDE_START]) {
      expect(chapterCardOpacity(t)).toBe(1);
    }
  });

  it("el cambio de escenario (SWAP_AT) ocurre con la tarjeta del todo opaca: queda oculto", () => {
    expect(chapterCardOpacity(SWAP_AT)).toBe(1);
  });

  it("aparece de forma gradual y monotona (sin saltos)", () => {
    let previous = 0;
    for (let step = 0; step <= 100; step += 1) {
      const opacity = chapterCardOpacity((step / 100) * SWAP_AT);
      expect(opacity).toBeGreaterThanOrEqual(previous);
      previous = opacity;
    }
  });

  it("es simetrica: se va igual que llega (al subir el scroll se ve lo mismo)", () => {
    for (const t of [0.26, 0.3, 0.33, 0.1]) {
      expect(chapterCardOpacity(1 - t)).toBeCloseTo(chapterCardOpacity(t), 10);
    }
  });

  it("nunca sale de 0..1 y con un valor no finito no pinta nada", () => {
    expect(chapterCardOpacity(-1)).toBe(0);
    expect(chapterCardOpacity(2)).toBe(0);
    expect(chapterCardOpacity(Number.NaN)).toBe(0);
  });
});

describe("chapterStrokeProgress: el subrayado de pincel se dibuja con el scroll", () => {
  it("empieza sin dibujar y esta completo cuando llega el cambio de escenario", () => {
    expect(chapterStrokeProgress(0)).toBe(0);
    expect(chapterStrokeProgress(CARD_STROKE_START)).toBe(0);
    expect(chapterStrokeProgress(SWAP_AT)).toBe(1);
    expect(chapterStrokeProgress(1)).toBe(1);
  });

  it("se queda dibujado mientras la tarjeta se va (solo desaparece con ella)", () => {
    expect(chapterStrokeProgress(CARD_HIDE_START)).toBe(1);
  });

  it("crece de forma monotona con el scroll", () => {
    let previous = 0;
    for (let step = 0; step <= 100; step += 1) {
      const progress = chapterStrokeProgress(step / 100);
      expect(progress).toBeGreaterThanOrEqual(previous);
      previous = progress;
    }
  });

  it("un valor no finito deja el trazo sin dibujar", () => {
    expect(chapterStrokeProgress(Number.NaN)).toBe(0);
  });
});

/**
 * PRUEBA DE "PARAR A MITAD" (DESIGN_SYSTEM §7.1, salvaguarda 4): el usuario puede
 * detenerse en CUALQUIER punto del scroll, asi que cualquier fotograma tiene que
 * leerse. El riesgo de la tarjeta es mostrarse sobre el escenario que aun no esta
 * tapado: texto sobre texto. Estos tests lo comprueban con las formas REALES de
 * los cantos (EDGES), no con numeros inventados.
 */
const TRANSITION_FRONTS = [...new Set(TRANSITIONS.map((spec) => frontEdgeOf(spec)))];

/**
 * Fraccion del alto del borde por debajo de la cual la tinta es SOLIDA: el punto
 * mas bajo del borde irregular (cota superior: se miran tambien los puntos de
 * control, asi que es conservadora). Sale de los datos de la forma.
 */
function solidFromRatio(variant: MassEdge): number {
  const ys = [...EDGES[variant].d.matchAll(/(-?\d+(?:\.\d+)?),\s*(-?\d+(?:\.\d+)?)/g)]
    .map((match) => Number(match[2]))
    .filter((y) => y < EDGE_VIEWBOX_HEIGHT);
  return Math.max(...ys) / EDGE_VIEWBOX_HEIGHT;
}

/**
 * Semialtura del bloque de la tarjeta, en PX (no como fraccion del visor: la tarjeta
 * no escala con el alto). Con ancho >= 1067 px mide ~356 px: numeral 192 + japones 42 +
 * titulo 66 + subrayado 20 + huecos 36, es decir ~178 de semialtura. La primera version
 * de esta prueba suponia 0,2 de un visor (135 px en un portatil) y daba por buena una
 * tarjeta que asomaba ~20 px sobre el borde irregular.
 */
const CARD_HALF_HEIGHT_PX = 180;

describe("parar a mitad: la tarjeta de capitulo solo se ve sobre tinta solida", () => {
  const VISORS = [560, 674, 788, 900];
  const STEPS = 400;

  it.each(TRANSITION_FRONTS)("frente %s: con la tarjeta a medio fundido ya la cubre la tinta (llegada)", (variant) => {
    const ratio = solidFromRatio(variant);

    for (const visor of VISORS) {
      const edge = inkEdgeHeight(visor);
      for (let step = 0; step <= STEPS / 2; step += 1) {
        const t = step / STEPS;
        if (chapterCardOpacity(t) < 0.5) continue;
        const solidFrom = inkBandTop(t, visor, edge) + ratio * edge;
        const cardTop = visor / 2 - CARD_HALF_HEIGHT_PX;
        expect(solidFrom, `${variant} visor ${visor} t ${t}`).toBeLessThanOrEqual(cardTop);
      }
    }
  });

  it.each(TRANSITION_FRONTS)("frente %s: lo mismo al irse la tarjeta (salida, con la cola)", (variant) => {
    const ratio = solidFromRatio(variant);

    for (const visor of VISORS) {
      const edge = inkEdgeHeight(visor);
      for (let step = STEPS / 2; step <= STEPS; step += 1) {
        const t = step / STEPS;
        if (chapterCardOpacity(t) < 0.5) continue;
        const solidUntil = inkBandTop(t, visor, edge) + inkBandHeight(visor, edge) - ratio * edge;
        const cardBottom = visor / 2 + CARD_HALF_HEIGHT_PX;
        expect(solidUntil, `${variant} visor ${visor} t ${t}`).toBeGreaterThanOrEqual(cardBottom);
      }
    }
  });

  it("la tarjeta solo existe en la franja en que la tinta cubre el centro del visor", () => {
    // Fuera de [CARD_SHOW_START, CARD_HIDE_END] no hay tarjeta: ahi se ve el escenario.
    expect(chapterCardOpacity(CARD_SHOW_START - 0.01)).toBe(0);
    expect(chapterCardOpacity(CARD_HIDE_END + 0.01)).toBe(0);
  });
});

describe("curtainProgress: avance lineal de la cortina de un salto", () => {
  it("vale 0 al empezar, 0,5 a la mitad y 1 al acabar", () => {
    expect(curtainProgress(0, 420)).toBe(0);
    expect(curtainProgress(210, 420)).toBe(0.5);
    expect(curtainProgress(420, 420)).toBe(1);
  });

  it("se recorta a 0..1: un fotograma tardio no se pasa de 1 ni uno anticipado baja de 0", () => {
    expect(curtainProgress(900, 420)).toBe(1);
    expect(curtainProgress(-30, 420)).toBe(0);
  });

  it("una duracion nula o negativa acaba ya (sin dividir por 0), y un valor no finito no avanza", () => {
    expect(curtainProgress(10, 0)).toBe(1);
    expect(curtainProgress(10, -5)).toBe(1);
    expect(curtainProgress(Number.NaN, 420)).toBe(0);
  });
});

describe("isChapterStrokeVisible: el trazo no se pinta hasta que es una raya de verdad", () => {
  // Una raya de longitud casi 0 con puntas redondas dibuja un PUNTO del grosor
  // del trazo en cada extremo. Visto en vivo con pathLength = 0,0000066.
  it("no se pinta con un trazo de longitud casi nula, aunque sea mayor que 0", () => {
    expect(isChapterStrokeVisible(0)).toBe(false);
    expect(isChapterStrokeVisible(0.0000066)).toBe(false);
    expect(isChapterStrokeVisible(CARD_STROKE_MIN_VISIBLE / 2)).toBe(false);
  });

  it("se pinta a partir del minimo visible", () => {
    expect(isChapterStrokeVisible(CARD_STROKE_MIN_VISIBLE)).toBe(true);
    expect(isChapterStrokeVisible(0.5)).toBe(true);
    expect(isChapterStrokeVisible(1)).toBe(true);
  });

  it("un valor no finito no se pinta", () => {
    expect(isChapterStrokeVisible(Number.NaN)).toBe(false);
  });
});

describe("isInkBandVisible: cuando hay algo que pintar", () => {
  it("es falso antes y despues de la transicion", () => {
    expect(isInkBandVisible(0)).toBe(false);
    expect(isInkBandVisible(-0.2)).toBe(false);
    expect(isInkBandVisible(1)).toBe(false);
    expect(isInkBandVisible(1.2)).toBe(false);
  });

  it("es verdadero en cualquier punto de dentro", () => {
    expect(isInkBandVisible(0.0001)).toBe(true);
    expect(isInkBandVisible(0.5)).toBe(true);
    expect(isInkBandVisible(0.9999)).toBe(true);
  });

  it("un valor no finito no pinta nada", () => {
    expect(isInkBandVisible(Number.NaN)).toBe(false);
  });
});
