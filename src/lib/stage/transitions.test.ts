import { describe, expect, it } from "vitest";
import { sectionsMeta } from "@/sections/meta";
import { frontEdgeOf, TRANSITIONS, transitionAfter, type TransitionSpec } from "./transitions";

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

describe("frontEdgeOf: la forma del frente de tinta", () => {
  it("nunca es `rule`: el frente de tinta es una MASA, no un trazo fino", () => {
    for (const transition of TRANSITIONS) {
      expect(frontEdgeOf(transition)).not.toBe("rule");
    }
  });

  it("si el canto de la seccion entrante es una masa, el frente es ese mismo canto", () => {
    const sweep = TRANSITIONS.find((transition) => transition.edge === "sweep") as TransitionSpec;
    const splash = TRANSITIONS.find((transition) => transition.edge === "splash") as TransitionSpec;

    expect(frontEdgeOf(sweep)).toBe("sweep");
    expect(frontEdgeOf(splash)).toBe("splash");
  });

  it("si el canto es `rule` (mismo suelo, solo un trazo), el frente sale del efecto", () => {
    const brushSweep = TRANSITIONS.find((transition) => transition.effect === "brush-sweep") as TransitionSpec;
    const verticalStroke = TRANSITIONS.find((transition) => transition.effect === "vertical-stroke") as TransitionSpec;

    expect(brushSweep.edge).toBe("rule");
    expect(frontEdgeOf(brushSweep)).toBe("sweep");
    expect(frontEdgeOf(verticalStroke)).toBe("dry");
  });

  it("un efecto sin forma propia cae a `sweep` en vez de dejar el frente sin dibujar", () => {
    const unknown: TransitionSpec = { ...TRANSITIONS[4], edge: "rule", effect: "splash" };

    expect(frontEdgeOf(unknown)).toBe("sweep");
  });

  it("ninguna transicion adyacente repite frente con el mismo espejado (DESIGN_SYSTEM §5.1)", () => {
    TRANSITIONS.slice(1).forEach((transition, index) => {
      const previous = TRANSITIONS[index];
      expect(`${frontEdgeOf(transition)}:${transition.mirror}`).not.toBe(
        `${frontEdgeOf(previous)}:${previous.mirror}`,
      );
    });
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
