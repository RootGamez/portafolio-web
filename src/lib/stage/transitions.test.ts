import { describe, expect, it } from "vitest";
import { sectionsMeta } from "@/sections/meta";
import { TRANSITIONS, transitionAfter } from "./transitions";

/**
 * Test de INTEGRIDAD de la tabla de transiciones: el mismo estilo que
 * font-subset.test.ts. Existe para que el indice de secciones (meta.ts) y la
 * tabla no se desincronicen en silencio: si alguien anade, quita o reordena una
 * seccion, esto falla en vez de dejar una transicion apuntando a la nada.
 */
describe("TRANSITIONS", () => {
  it("hay exactamente una por cada par de escenarios adyacentes", () => {
    expect(TRANSITIONS).toHaveLength(sectionsMeta.length - 1);
  });

  it("cada una enlaza dos slugs CONSECUTIVOS de sectionsMeta, en orden", () => {
    TRANSITIONS.forEach((transition, index) => {
      expect(transition.from).toBe(sectionsMeta[index].slug);
      expect(transition.to).toBe(sectionsMeta[index + 1].slug);
    });
  });

  it("cuando cambia el suelo, la tinta lleva el color del suelo ENTRANTE (el cambio queda oculto detras)", () => {
    TRANSITIONS.forEach((transition, index) => {
      const from = sectionsMeta[index].ground;
      const to = sectionsMeta[index + 1].ground;
      if (from !== to) expect(transition.ink).toBe(to);
    });
  });

  it("cuando el suelo es el mismo, la tinta es de ACENTO (distinta del suelo) o no se veria nada", () => {
    TRANSITIONS.forEach((transition, index) => {
      const from = sectionsMeta[index].ground;
      const to = sectionsMeta[index + 1].ground;
      if (from === to) expect(transition.ink).not.toBe(to);
    });
  });

  it("ninguna transicion adyacente repite el efecto (DESIGN_SYSTEM §5.1: ninguna repite forma)", () => {
    TRANSITIONS.slice(1).forEach((transition, index) => {
      expect(transition.effect).not.toBe(TRANSITIONS[index].effect);
    });
  });

  it("ninguna transicion adyacente repite canto con el mismo espejado", () => {
    TRANSITIONS.slice(1).forEach((transition, index) => {
      const previous = TRANSITIONS[index];
      expect(`${transition.edge}:${transition.mirror}`).not.toBe(`${previous.edge}:${previous.mirror}`);
    });
  });

  it("cada transicion tiene un efecto propio: ninguno se repite en toda la tabla", () => {
    const effects = TRANSITIONS.map((transition) => transition.effect);
    expect(new Set(effects).size).toBe(effects.length);
  });
});

describe("transitionAfter", () => {
  it("devuelve la transicion que sale del escenario dado", () => {
    expect(transitionAfter(0)).toBe(TRANSITIONS[0]);
    expect(transitionAfter(3)).toBe(TRANSITIONS[3]);
  });

  it("el ultimo escenario no tiene transicion de salida", () => {
    expect(transitionAfter(sectionsMeta.length - 1)).toBeUndefined();
  });

  it("un indice fuera de rango devuelve undefined en vez de romper", () => {
    expect(transitionAfter(-1)).toBeUndefined();
    expect(transitionAfter(99)).toBeUndefined();
  });
});
