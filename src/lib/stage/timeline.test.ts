import { describe, expect, it, vi } from "vitest";
import {
  activeIndex,
  buildLayout,
  layerOpacity,
  EMPTY_LAYOUT,
  introProgress,
  locate,
  offsetOfStage,
  panFor,
  scrollForPan,
  smoothstep,
  stageProgress,
  transitionProgress,
  type StageSpec,
} from "./timeline";
import { CARD_END, COVER_END, SWAP_AT, TRANSITION_SCREENS } from "./config";

/**
 * Escenario de referencia. Con un visor de 800px:
 *   intro = round(0.6 * 800) = 480 · transicion = 800
 *
 *   E0  contenido 600  -> cabe:        start    0 · pan   0 · end  480
 *   T0                                 start  480 · end 1280
 *   E1  contenido 1400 -> desborda 600: start 1280 · pan 600 · end 2360
 *   T1                                 start 2360 · end 3160
 *   E2  contenido 800  -> justo cabe:  start 3160 · pan   0 · end 3640
 *
 * total = 3640 · pista = 3640 + 800 = 4440
 */
const VIEWPORT = 800;
const SPECS: readonly StageSpec[] = [
  { contentHeight: 600 },
  { contentHeight: 1400 },
  { contentHeight: 800 },
];

const layout = buildLayout(SPECS, VIEWPORT);

describe("buildLayout", () => {
  it("el tempo se puede pasar explicito: cada transicion mide ese numero de visores", () => {
    const layout = buildLayout([{ contentHeight: 600 }, { contentHeight: 600 }], 737, 2.5);

    expect(layout.transitions[0]?.length).toBe(Math.round(2.5 * 737));
  });

  it("el tempo real de config.ts (sin el mock de referencia de los tests) es mas lento que una pantalla", async () => {
    const real = await vi.importActual<typeof import("./config")>("./config");

    expect(real.TRANSITION_SCREENS).toBeGreaterThan(1);
  });

  it("sin tempo explicito usa TRANSITION_SCREENS de config.ts", () => {
    const layout = buildLayout([{ contentHeight: 600 }, { contentHeight: 600 }, { contentHeight: 600 }], 737);

    layout.transitions.forEach((transition) => {
      expect(transition.length).toBe(Math.round(TRANSITION_SCREENS * 737));
    });
  });

  it("reparte escenarios y transiciones en tramos contiguos", () => {
    expect(layout.stages.map((s) => [s.start, s.end])).toEqual([
      [0, 480],
      [1280, 2360],
      [3160, 3640],
    ]);
    expect(layout.transitions.map((t) => [t.start, t.end])).toEqual([
      [480, 1280],
      [2360, 3160],
    ]);
  });

  it("calcula el desbordamiento (pan) solo cuando el contenido no cabe", () => {
    expect(layout.stages.map((s) => s.panLength)).toEqual([0, 600, 0]);
    expect(layout.stages.map((s) => s.introLength)).toEqual([480, 480, 480]);
  });

  it("el largo total es la suma de tramos y la pista suma un alto de visor", () => {
    expect(layout.totalLength).toBe(3640);
    expect(layout.trackHeight).toBe(3640 + VIEWPORT);
    expect(layout.viewportHeight).toBe(VIEWPORT);
  });

  it("cada transicion dura un alto de visor", () => {
    expect(layout.transitions.every((t) => t.length === VIEWPORT)).toBe(true);
  });

  it("respeta el introScreens propio de un escenario", () => {
    const custom = buildLayout([{ contentHeight: 100, introScreens: 2 }], VIEWPORT);
    expect(custom.stages[0].introLength).toBe(1600);
    expect(custom.totalLength).toBe(1600);
  });

  it("un unico escenario no tiene transiciones", () => {
    const single = buildLayout([{ contentHeight: 100 }], VIEWPORT);
    expect(single.transitions).toEqual([]);
    expect(single.totalLength).toBe(480);
  });

  it("sin escenarios devuelve un layout vacio pero valido", () => {
    const empty = buildLayout([], VIEWPORT);
    expect(empty.stages).toEqual([]);
    expect(empty.transitions).toEqual([]);
    expect(empty.totalLength).toBe(0);
    expect(empty.trackHeight).toBe(VIEWPORT);
  });

  it("no produce NaN con un visor o unas alturas invalidas", () => {
    const broken = buildLayout(
      [{ contentHeight: Number.NaN }, { contentHeight: -50 }],
      Number.NaN,
    );
    const numbers = [
      broken.viewportHeight,
      broken.totalLength,
      broken.trackHeight,
      ...broken.stages.flatMap((s) => [s.start, s.end, s.panLength, s.introLength]),
      ...broken.transitions.flatMap((t) => [t.start, t.end, t.length]),
    ];
    expect(numbers.every(Number.isFinite)).toBe(true);
    expect(broken.stages.every((s) => s.panLength === 0)).toBe(true);
  });

  it("no muta sus entradas", () => {
    const frozen = Object.freeze(SPECS.map((s) => Object.freeze({ ...s })));
    expect(() => buildLayout(frozen, VIEWPORT)).not.toThrow();
  });

  it("los tramos son contiguos con cualquier numero de escenarios", () => {
    const many = buildLayout(
      Array.from({ length: 10 }, (_, i) => ({ contentHeight: 300 + i * 137 })),
      733,
    );
    many.transitions.forEach((t, i) => {
      expect(many.stages[i].end).toBe(t.start);
      expect(t.end).toBe(many.stages[i + 1].start);
    });
    expect(many.stages.at(-1)?.end).toBe(many.totalLength);
  });
});

describe("locate", () => {
  it("arranca en el escenario 0 sin avance", () => {
    expect(locate(layout, 0)).toEqual({ kind: "stage", index: 0, progress: 0, pan: 0 });
  });

  it("dentro de la intro el contenido no se mueve (pan 0)", () => {
    expect(locate(layout, 240)).toEqual({ kind: "stage", index: 0, progress: 0.5, pan: 0 });
  });

  it("al terminar un escenario empieza su transicion en t = 0 (fase cubrir)", () => {
    expect(locate(layout, 480)).toEqual({
      kind: "transition",
      from: 0,
      to: 1,
      t: 0,
      phase: "cover",
      phaseT: 0,
    });
  });

  it("recorre las tres fases de la transicion en orden", () => {
    const at = (t: number) => locate(layout, 480 + t * VIEWPORT);

    const cover = at(0.2);
    expect(cover.kind === "transition" && cover.phase).toBe("cover");
    expect(cover.kind === "transition" && cover.phaseT).toBeCloseTo(0.2 / COVER_END, 5);

    const card = at(0.5);
    expect(card.kind === "transition" && card.phase).toBe("card");
    expect(card.kind === "transition" && card.phaseT).toBeCloseTo(
      (0.5 - COVER_END) / (CARD_END - COVER_END),
      5,
    );

    const reveal = at(0.8);
    expect(reveal.kind === "transition" && reveal.phase).toBe("reveal");
    expect(reveal.kind === "transition" && reveal.phaseT).toBeCloseTo(
      (0.8 - CARD_END) / (1 - CARD_END),
      5,
    );
  });

  it("al terminar la transicion entra el siguiente escenario en progreso 0", () => {
    expect(locate(layout, 1280)).toEqual({ kind: "stage", index: 1, progress: 0, pan: 0 });
  });

  it("el contenido sobrante sube 1:1 con el scroll una vez pasada la intro", () => {
    const start = 1280 + 480;
    expect(locate(layout, start)).toMatchObject({ kind: "stage", index: 1, pan: 0 });
    expect(locate(layout, start + 300)).toMatchObject({ kind: "stage", index: 1, pan: 300 });
    expect(locate(layout, start + 599)).toMatchObject({ kind: "stage", index: 1, pan: 599 });
  });

  it("el pan llega a su maximo justo cuando empieza la transicion de salida", () => {
    // El tramo es [start, end): el ultimo px del escenario aun tiene pan 599 y el
    // limite exacto ya es t = 0 de la transicion, con el contenido en su maximo.
    expect(locate(layout, 2360)).toMatchObject({ kind: "transition", from: 1, to: 2, t: 0 });
    expect(panFor(layout, 1, 2360)).toBe(600);
  });

  it("el final exacto del documento pertenece al ultimo escenario", () => {
    expect(locate(layout, 3640)).toEqual({ kind: "stage", index: 2, progress: 1, pan: 0 });
  });

  it("recorta el scroll fuera de rango", () => {
    expect(locate(layout, -500)).toEqual(locate(layout, 0));
    expect(locate(layout, 99999)).toEqual(locate(layout, 3640));
    expect(locate(layout, Number.NaN)).toEqual(locate(layout, 0));
  });

  it("es una funcion pura: ida y vuelta devuelve exactamente lo mismo", () => {
    const first = locate(layout, 1500);
    locate(layout, 10);
    locate(layout, 3000);
    expect(locate(layout, 1500)).toEqual(first);
  });

  it("un layout vacio devuelve una posicion por defecto en vez de romper", () => {
    expect(locate(EMPTY_LAYOUT, 120)).toEqual({ kind: "stage", index: 0, progress: 0, pan: 0 });
  });
});

describe("activeIndex", () => {
  it("en un escenario es su indice", () => {
    expect(activeIndex(locate(layout, 1500))).toBe(1);
  });

  it("en una transicion cambia al cruzar SWAP_AT, no antes", () => {
    const justBefore = 480 + Math.floor(SWAP_AT * VIEWPORT) - 1;
    const atSwap = 480 + SWAP_AT * VIEWPORT;
    expect(activeIndex(locate(layout, justBefore))).toBe(0);
    expect(activeIndex(locate(layout, atSwap))).toBe(1);
  });

  it("nunca retrocede al avanzar el scroll (monotonia)", () => {
    let previous = -1;
    for (let s = 0; s <= layout.totalLength; s += 7) {
      const current = activeIndex(locate(layout, s));
      expect(current).toBeGreaterThanOrEqual(previous);
      previous = current;
    }
    expect(previous).toBe(2);
  });
});

describe("offsetOfStage", () => {
  it("devuelve donde empieza cada escenario", () => {
    expect([0, 1, 2].map((i) => offsetOfStage(layout, i))).toEqual([0, 1280, 3160]);
  });

  it("saltar a un escenario lo deja en progreso 0", () => {
    [0, 1, 2].forEach((i) => {
      expect(locate(layout, offsetOfStage(layout, i))).toMatchObject({
        kind: "stage",
        index: i,
        progress: 0,
      });
    });
  });

  it("recorta indices fuera de rango al primero y al ultimo", () => {
    expect(offsetOfStage(layout, -3)).toBe(0);
    expect(offsetOfStage(layout, 99)).toBe(3160);
    expect(offsetOfStage(EMPTY_LAYOUT, 0)).toBe(0);
  });
});

describe("panFor", () => {
  it("es 0 antes de que termine la intro", () => {
    expect(panFor(layout, 1, 1500)).toBe(0);
    expect(panFor(layout, 1, 0)).toBe(0);
  });

  it("sube 1:1 y se queda en el maximo", () => {
    expect(panFor(layout, 1, 2060)).toBe(300);
    expect(panFor(layout, 1, 99999)).toBe(600);
  });

  it("un escenario que cabe nunca se desplaza", () => {
    expect(panFor(layout, 0, 480)).toBe(0);
    expect(panFor(layout, 2, 3640)).toBe(0);
  });

  it("coincide con el pan de locate dentro del escenario", () => {
    for (let s = 1280; s < 2360; s += 13) {
      const position = locate(layout, s);
      expect(position.kind === "stage" && position.pan).toBe(panFor(layout, 1, s));
    }
  });

  it("un indice inexistente devuelve 0", () => {
    expect(panFor(layout, 42, 1000)).toBe(0);
  });
});

describe("scrollForPan", () => {
  it("devuelve el scroll en el que el contenido ha subido exactamente `pan` px", () => {
    // E1 empieza en 1280, intro 480: pan 300 -> 1280 + 480 + 300.
    expect(scrollForPan(layout, 1, 300)).toBe(2060);
    expect(panFor(layout, 1, scrollForPan(layout, 1, 300))).toBe(300);
  });

  it("recorta el pan al rango del escenario (0..panLength)", () => {
    expect(scrollForPan(layout, 1, -50)).toBe(1760);
    expect(scrollForPan(layout, 1, 99999)).toBe(2360);
  });

  it("un escenario que cabe no tiene pan: siempre cae al final de su intro", () => {
    expect(scrollForPan(layout, 0, 500)).toBe(480);
  });

  it("un indice inexistente devuelve 0", () => {
    expect(scrollForPan(layout, 9, 100)).toBe(0);
  });
});

describe("stageProgress", () => {
  it("vale 0 antes del escenario, 1 despues y la fraccion dentro", () => {
    expect(stageProgress(layout, 1, 100)).toBe(0);
    expect(stageProgress(layout, 1, 1280 + 540)).toBe(0.5);
    expect(stageProgress(layout, 1, 3000)).toBe(1);
  });

  it("un indice inexistente devuelve 0", () => {
    expect(stageProgress(layout, 9, 100)).toBe(0);
  });
});

describe("introProgress: avance 0..1 dentro de la INTRO del escenario (donde ocurre su coreografia)", () => {
  // E1: start 1280, intro 480 (1280..1760), luego pan 600.
  it("vale 0 al empezar el escenario, 1 al acabar la intro y la fraccion dentro", () => {
    expect(introProgress(layout, 1, 1280)).toBe(0);
    expect(introProgress(layout, 1, 1280 + 240)).toBe(0.5);
    expect(introProgress(layout, 1, 1760)).toBe(1);
  });

  it("antes del escenario vale 0 y durante el pan (y despues) se queda en 1", () => {
    expect(introProgress(layout, 1, 100)).toBe(0);
    expect(introProgress(layout, 1, 2000)).toBe(1);
    expect(introProgress(layout, 1, 4000)).toBe(1);
  });

  it("no depende del pan: dos escenarios con la misma intro avanzan igual aunque uno desborde", () => {
    // E0 (cabe) y E1 (desborda 600) tienen la misma intro de 480 px.
    expect(introProgress(layout, 0, 0 + 120)).toBe(introProgress(layout, 1, 1280 + 120));
  });

  it("una intro de largo 0 es un escalon en el inicio del escenario", () => {
    const noIntro = buildLayout([{ contentHeight: 600, introScreens: 0 }], VIEWPORT);
    expect(introProgress(noIntro, 0, 0)).toBe(1);
    expect(introProgress(noIntro, 0, -5)).toBe(0);
  });

  it("un indice inexistente o un layout vacio devuelven 0; un scroll no finito, 0", () => {
    expect(introProgress(layout, 9, 100)).toBe(0);
    expect(introProgress(EMPTY_LAYOUT, 0, 100)).toBe(0);
    expect(introProgress(layout, 1, Number.NaN)).toBe(0);
  });
});

describe("transitionProgress", () => {
  // T0 va de 480 a 1280 (800 px) y T1 de 2360 a 3160.
  it("vale 0 al empezar la transicion y 1 al acabarla, y la fraccion dentro", () => {
    expect(transitionProgress(layout, 0, 480)).toBe(0);
    expect(transitionProgress(layout, 0, 480 + 200)).toBe(0.25);
    expect(transitionProgress(layout, 0, 880)).toBe(0.5);
    expect(transitionProgress(layout, 0, 1280)).toBe(1);
  });

  it("antes de la transicion vale 0 y despues vale 1 (nunca se sale de 0..1)", () => {
    expect(transitionProgress(layout, 1, 100)).toBe(0);
    expect(transitionProgress(layout, 1, 3640)).toBe(1);
    expect(transitionProgress(layout, 0, -50)).toBe(0);
  });

  it("cada transicion lee su propio tramo", () => {
    expect(transitionProgress(layout, 1, 2360 + 400)).toBe(0.5);
    expect(transitionProgress(layout, 0, 2360 + 400)).toBe(1);
  });

  it("un indice sin transicion (el del ultimo escenario, o fuera de rango) devuelve 0", () => {
    expect(transitionProgress(layout, 2, 3000)).toBe(0);
    expect(transitionProgress(layout, 9, 1000)).toBe(0);
    expect(transitionProgress(layout, -1, 1000)).toBe(0);
  });

  it("con un layout vacio o un scroll no finito devuelve 0, nunca NaN", () => {
    expect(transitionProgress(EMPTY_LAYOUT, 0, 100)).toBe(0);
    expect(transitionProgress(layout, 0, Number.NaN)).toBe(0);
  });

  it("coincide con el `t` que da locate dentro de la transicion", () => {
    for (const scroll of [500, 700, 880, 1100, 1279]) {
      const position = locate(layout, scroll);
      expect(position.kind).toBe("transition");
      if (position.kind === "transition") {
        expect(transitionProgress(layout, position.from, scroll)).toBeCloseTo(position.t, 10);
      }
    }
  });
});

describe("smoothstep", () => {
  it("satura en los extremos y vale 0.5 en el centro", () => {
    expect(smoothstep(0, 1, -1)).toBe(0);
    expect(smoothstep(0, 1, 2)).toBe(1);
    expect(smoothstep(0, 1, 0.5)).toBe(0.5);
  });

  it("con bordes iguales se comporta como un escalon (sin dividir por 0)", () => {
    expect(smoothstep(0.5, 0.5, 0.4)).toBe(0);
    expect(smoothstep(0.5, 0.5, 0.6)).toBe(1);
  });
});

describe("layerOpacity: una sola capa se ve y el cambio ocurre en SWAP_AT (oculto tras la tinta)", () => {
  // T0 va de 480 a 1280 (800 px): SWAP_AT cae en 480 + 800 * SWAP_AT.
  const swapScroll = 480 + 800 * SWAP_AT;

  it("es 1 dentro de su propio escenario y 0 lejos de el", () => {
    expect(layerOpacity(layout, 0, 100)).toBe(1);
    expect(layerOpacity(layout, 1, 1500)).toBe(1);
    expect(layerOpacity(layout, 2, 100)).toBe(0);
    expect(layerOpacity(layout, 0, 3000)).toBe(0);
  });

  it("durante una transicion se ve la SALIENTE hasta SWAP_AT y la ENTRANTE desde SWAP_AT", () => {
    expect([layerOpacity(layout, 0, swapScroll - 1), layerOpacity(layout, 1, swapScroll - 1)]).toEqual([1, 0]);
    expect([layerOpacity(layout, 0, swapScroll), layerOpacity(layout, 1, swapScroll)]).toEqual([0, 1]);
  });

  it("en cualquier punto del scroll hay EXACTAMENTE una capa visible: nunca dos, nunca ninguna", () => {
    for (let s = 0; s <= 3640; s += 7) {
      const visible = [0, 1, 2].filter((index) => layerOpacity(layout, index, s) === 1);
      expect(visible, `scroll ${s}`).toHaveLength(1);
    }
  });

  it("los extremos de la transicion son continuos con los escenarios", () => {
    expect(layerOpacity(layout, 0, 480)).toBe(1);
    expect(layerOpacity(layout, 1, 480)).toBe(0);
    expect(layerOpacity(layout, 0, 1280)).toBe(0);
    expect(layerOpacity(layout, 1, 1280)).toBe(1);
  });

  it("un tercer escenario no participa en una transicion ajena", () => {
    expect(layerOpacity(layout, 2, 880)).toBe(0);
  });

  it("un indice inexistente, un layout vacio o un scroll no finito devuelven 0 o una capa valida, nunca NaN", () => {
    expect(layerOpacity(layout, 7, 100)).toBe(0);
    expect(layerOpacity(layout, 0, Number.NaN)).toBe(1);
  });

  // LCP: antes de medir (layout vacio) el Hero tiene que verse ya en el primer
  // fotograma. Si todas las capas salen ocultas, la foto del Hero (el elemento
  // LCP) espera a la medicion y a un fotograma mas de Motion (medido: ~+0,5 s en
  // movil con CPU 4x).
  it("sin medidas (layout vacio) se ve la capa 0 y solo ella", () => {
    expect(layerOpacity(EMPTY_LAYOUT, 0, 0)).toBe(1);
    expect(layerOpacity(EMPTY_LAYOUT, 0, 100)).toBe(1);
    expect(layerOpacity(EMPTY_LAYOUT, 1, 0)).toBe(0);
    expect(layerOpacity(EMPTY_LAYOUT, 9, 0)).toBe(0);
  });
});
