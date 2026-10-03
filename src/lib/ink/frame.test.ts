import { describe, expect, it } from "vitest";
import {
  CARD_HIDE_END,
  CARD_SHOW_START,
  FIELD_COVER_END,
  FIELD_ERASE_START,
  SWAP_AT,
  TONE_PITCHES_PX,
} from "@/lib/stage/config";
import { buildLayout, type StageSpec } from "@/lib/stage/timeline";
import { TRANSITIONS, type TransitionEffect } from "@/lib/stage/transitions";
import { EFFECT_IDS, fieldPhases, inkFieldFrame, sameFieldFrame } from "./frame";

/**
 * Linea de tiempo de prueba con un visor de 800 px (ver timeline.test.ts):
 *   E0 0..480 · T0 480..1280 · E1 1280..2360 · T1 2360..3160 · E2 3160..3640
 */
const SPECS: readonly StageSpec[] = [{ contentHeight: 600 }, { contentHeight: 1400 }, { contentHeight: 800 }];
const LAYOUT = buildLayout(SPECS, 800);
const T0_START = 480;
const T1_START = 2360;
const TRANSITION_LENGTH = 800;

describe("fieldPhases", () => {
  it("en los extremos no hay tinta: nada cubierto al empezar, todo borrado al acabar", () => {
    expect(fieldPhases(0)).toEqual({ cover: 0, erase: 0 });
    expect(fieldPhases(1)).toEqual({ cover: 1, erase: 1 });
  });

  it("cubre del todo justo cuando la tarjeta de capitulo empieza a verse", () => {
    expect(FIELD_COVER_END).toBeLessThanOrEqual(CARD_SHOW_START);
    expect(fieldPhases(FIELD_COVER_END).cover).toBe(1);
  });

  it("no empieza a borrar hasta que la tarjeta se ha ido del todo", () => {
    expect(FIELD_ERASE_START).toBeGreaterThanOrEqual(CARD_HIDE_END);
    expect(fieldPhases(FIELD_ERASE_START).erase).toBe(0);
  });

  it("la pantalla esta entera cubierta en el cambio de escenario (SWAP_AT)", () => {
    expect(fieldPhases(SWAP_AT)).toEqual({ cover: 1, erase: 0 });
  });

  it("cubrir y borrar solo avanzan (scroll hacia abajo) y se rebobinan igual hacia arriba", () => {
    const samples = Array.from({ length: 101 }, (_, i) => fieldPhases(i / 100));

    samples.slice(1).forEach((phase, i) => {
      expect(phase.cover).toBeGreaterThanOrEqual(samples[i].cover);
      expect(phase.erase).toBeGreaterThanOrEqual(samples[i].erase);
    });
    // Misma entrada, misma salida: reversible por construccion.
    expect(fieldPhases(0.2)).toEqual(fieldPhases(0.2));
  });

  it("recorta fuera de 0..1 y trata lo no finito como 0", () => {
    expect(fieldPhases(-3)).toEqual({ cover: 0, erase: 0 });
    expect(fieldPhases(7)).toEqual({ cover: 1, erase: 1 });
    expect(fieldPhases(Number.NaN)).toEqual({ cover: 0, erase: 0 });
  });
});

describe("EFFECT_IDS", () => {
  it("da a cada efecto un numero distinto de 0 a 8 (el shader los distingue por numero)", () => {
    const effects: TransitionEffect[] = TRANSITIONS.map((spec) => spec.effect);
    const ids = effects.map((effect) => EFFECT_IDS[effect]);

    expect([...ids].sort((a, b) => a - b)).toEqual([0, 1, 2, 3, 4, 5, 6, 7, 8]);
  });
});

describe("inkFieldFrame", () => {
  const transitions = TRANSITIONS.slice(0, 2);

  it("dentro de un escenario no hay nada que pintar", () => {
    expect(inkFieldFrame(LAYOUT, 100, transitions)).toBeNull();
    expect(inkFieldFrame(LAYOUT, 1500, transitions)).toBeNull();
  });

  it("en el limite exacto de una transicion (t = 0) todavia no hay tinta", () => {
    expect(inkFieldFrame(LAYOUT, T0_START, transitions)).toBeNull();
  });

  it("en una transicion describe SU tinta: efecto, color, espejo, fases y trama", () => {
    const frame = inkFieldFrame(LAYOUT, T1_START + TRANSITION_LENGTH * 0.1, transitions);
    const spec = transitions[1];

    expect(frame).toEqual({
      index: 1,
      effect: EFFECT_IDS[spec.effect],
      ink: spec.ink,
      mirror: spec.mirror,
      ...fieldPhases(0.1),
      tonePitch: TONE_PITCHES_PX[1],
    });
  });

  it("la trama alterna los tres pasos del screentone (5/8/13 px) entre transiciones", () => {
    const pitches = TRANSITIONS.map((_, index) => TONE_PITCHES_PX[index % TONE_PITCHES_PX.length]);

    pitches.slice(1).forEach((pitch, i) => expect(pitch).not.toBe(pitches[i]));
  });

  it("sin la ficha de esa transicion (lista mas corta que el layout) no pinta", () => {
    expect(inkFieldFrame(LAYOUT, T1_START + 100, transitions.slice(0, 1))).toBeNull();
  });

  it("con el layout vacio (antes de medir) no pinta", () => {
    expect(inkFieldFrame(buildLayout([], 800), 0, transitions)).toBeNull();
  });
});

describe("sameFieldFrame", () => {
  const transitions = TRANSITIONS.slice(0, 2);
  const at = (scroll: number) => inkFieldFrame(LAYOUT, scroll, transitions);

  it("dos fotogramas del mismo scroll son iguales (no hace falta volver a pintar)", () => {
    expect(sameFieldFrame(at(600), at(600))).toBe(true);
    expect(sameFieldFrame(null, null)).toBe(true);
  });

  it("distinto avance o distinta transicion obligan a pintar", () => {
    expect(sameFieldFrame(at(600), at(601))).toBe(false);
    expect(sameFieldFrame(at(600), null)).toBe(false);
    expect(sameFieldFrame(null, at(600))).toBe(false);
  });
});
