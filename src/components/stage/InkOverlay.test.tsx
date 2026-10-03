import { Profiler } from "react";
import { describe, expect, it } from "vitest";
import { act, render, waitFor } from "@testing-library/react";
import { motionValue } from "motion/react";
import { EDGES } from "@/components/ink/edgeShapes";
import { COVER_END } from "@/lib/stage/config";
import { inkBandHeight, inkBandTop, inkEdgeHeight } from "@/lib/stage/ink";
import { buildLayout, type StageSpec } from "@/lib/stage/timeline";
import { frontEdgeOf, TRANSITIONS } from "@/lib/stage/transitions";
import { InkOverlay } from "./InkOverlay";

/**
 * Linea de tiempo de prueba con un visor de 800 px (ver timeline.test.ts):
 *   E0 0..480 · T0 480..1280 · E1 1280..2360 · T1 2360..3160 · E2 3160..3640
 */
const VISOR = 800;
const SPECS: readonly StageSpec[] = [{ contentHeight: 600 }, { contentHeight: 1400 }, { contentHeight: 800 }];
const LAYOUT = buildLayout(SPECS, VISOR);
const EDGE = inkEdgeHeight(VISOR);
const SPECS_OF_TRANSITIONS = TRANSITIONS.slice(0, 2);

function setup(scroll = 0) {
  const scrollOffset = motionValue(scroll);
  const curtain = motionValue(0);
  const utils = render(
    <InkOverlay
      transitions={SPECS_OF_TRANSITIONS}
      layout={motionValue(LAYOUT)}
      scrollOffset={scrollOffset}
      curtain={curtain}
      visorHeight={VISOR}
    />,
  );
  const overlay = utils.container.querySelector("[data-ink-overlay]") as HTMLElement;
  const band = (index: number | "jump") => overlay.querySelector(`[data-ink-band="${index}"]`) as HTMLElement;
  return { ...utils, scrollOffset, curtain, overlay, band };
}

describe("InkOverlay", () => {
  it("es decorativo: aria-hidden y no capta el puntero (no tapa clics ni foco)", () => {
    const { overlay } = setup();

    expect(overlay).toHaveAttribute("aria-hidden", "true");
    expect(overlay.className).toContain("pointer-events-none");
  });

  it("pinta una banda por cada transicion, en orden", () => {
    const { overlay } = setup();

    // Las de transicion, y al final la cortina de los saltos.
    const bands = [...overlay.querySelectorAll("[data-ink-band]")];
    expect(bands.map((band) => band.getAttribute("data-ink-band"))).toEqual(["0", "1", "jump"]);
  });

  it("cada banda usa el color de su tinta (el suelo que dice la tabla)", () => {
    const { band } = setup();

    expect(band(0)).toHaveAttribute("data-ground", SPECS_OF_TRANSITIONS[0].ink);
    expect(band(1)).toHaveAttribute("data-ground", SPECS_OF_TRANSITIONS[1].ink);
  });

  it("mide frente + cuerpo + cola: un visor mas dos bordes", () => {
    const { band } = setup();

    expect(band(0).style.height).toBe(`${inkBandHeight(VISOR, EDGE)}px`);
  });

  it("el frente y la cola son del mismo canto y vienen espejados entre si", () => {
    const { band } = setup();

    const [front, tail] = [...band(0).querySelectorAll("svg")];
    const frontShape = EDGES[frontEdgeOf(SPECS_OF_TRANSITIONS[0])];
    expect(front.querySelector("path")).toHaveAttribute("d", frontShape.d);
    expect(tail.querySelector("path")).toHaveAttribute("d", frontShape.d);
    // Si el frente no va espejado, la cola SI, y al reves.
    const mirrored = (svg: Element) => svg.querySelector("g")?.hasAttribute("transform") ?? false;
    expect(mirrored(front)).toBe(SPECS_OF_TRANSITIONS[0].mirror);
    expect(mirrored(tail)).toBe(!SPECS_OF_TRANSITIONS[0].mirror);
  });

  it("la cola va del reves (scaleY -1): su lado liso mira al cuerpo y el irregular al escenario nuevo", () => {
    const { band } = setup();

    const [front, tail] = [...band(0).querySelectorAll("svg")];
    expect(front.style.transform).toBe("");
    expect(tail.style.transform).toBe("scaleY(-1)");
  });

  it("fuera de su transicion las bandas estan ocultas (no se pintan)", () => {
    const { band } = setup(100); // dentro del escenario 0

    expect(band(0).style.visibility).toBe("hidden");
    expect(band(1).style.visibility).toBe("hidden");
  });

  it("dentro de una transicion solo se ve SU banda", async () => {
    const { band } = setup(880); // T0 a la mitad

    await waitFor(() => expect(band(0).style.visibility).toBe("visible"));
    expect(band(1).style.visibility).toBe("hidden");
  });

  it("al cubrir, la banda sube con el scroll hasta la posicion que dicta la geometria", async () => {
    const { band, scrollOffset } = setup();

    act(() => scrollOffset.set(480 + 800 * (COVER_END / 2))); // T0 a mitad de la fase de cubrir

    const expected = inkBandTop(COVER_END / 2, VISOR, EDGE);
    await waitFor(() => expect(band(0).style.transform).toContain(`${expected}px`));
  });

  it("en la fase de tarjeta lo cubre todo: el cuerpo ocupa el visor", async () => {
    const { band, scrollOffset } = setup();

    act(() => scrollOffset.set(880)); // t = 0.5

    await waitFor(() => expect(band(0).style.transform).toContain(`${-EDGE}px`));
  });

  it("al volver atras (scroll inverso) la banda baja: es reversible", async () => {
    const { band, scrollOffset } = setup(880);
    await waitFor(() => expect(band(0).style.transform).toContain(`${-EDGE}px`));

    act(() => scrollOffset.set(480 + 800 * 0.1));

    const expected = inkBandTop(0.1, VISOR, EDGE);
    await waitFor(() => expect(band(0).style.transform).toContain(`${expected}px`));
  });

  it("mover el scroll NO provoca ningun render de React (va todo por MotionValues)", async () => {
    let commits = 0;
    const scrollOffset = motionValue(0);
    render(
      <Profiler id="ink" onRender={() => (commits += 1)}>
        <InkOverlay
          transitions={SPECS_OF_TRANSITIONS}
          layout={motionValue(LAYOUT)}
          scrollOffset={scrollOffset}
          curtain={motionValue(0)}
          visorHeight={VISOR}
        />
      </Profiler>,
    );
    const baseline = commits;

    for (let scroll = 0; scroll <= 3200; scroll += 160) act(() => scrollOffset.set(scroll));
    // Un fotograma de margen: un `setState` diferido por rAF tambien contaria.
    await act(() => new Promise<void>((resolve) => setTimeout(resolve, 50)));

    expect(commits).toBe(baseline);
  });

  it("sin transiciones (un solo escenario) no pinta ninguna banda", () => {
    const { container } = render(
      <InkOverlay
        transitions={[]}
        layout={motionValue(LAYOUT)}
        scrollOffset={motionValue(0)}
        curtain={motionValue(0)}
        visorHeight={VISOR}
      />,
    );

    // Sin transiciones de scroll queda solo la cortina de los saltos.
    expect([...container.querySelectorAll("[data-ink-band]")].map((band) => band.getAttribute("data-ink-band"))).toEqual([
      "jump",
    ]);
    expect(container.querySelectorAll("[data-chapter-card]")).toHaveLength(0);
  });

  describe("cortina de los saltos", () => {
    it("hay una banda extra, la ULTIMA (por encima de bandas y tarjetas): tapa todo mientras dura", () => {
      const { overlay } = setup();

      expect(overlay.lastElementChild).toHaveAttribute("data-ink-band", "jump");
    });

    it("en reposo (progreso 0) esta oculta", () => {
      const { band } = setup();

      expect(band("jump").style.visibility).toBe("hidden");
    });

    it("la mueve el PROGRESO de la cortina, no el scroll: a 0,5 lo cubre todo", async () => {
      const { band, curtain, scrollOffset } = setup(100); // el scroll esta quieto en un escenario

      act(() => curtain.set(0.5));

      await waitFor(() => expect(band("jump").style.visibility).toBe("visible"));
      expect(band("jump").style.transform).toContain(`${-EDGE}px`);
      // Y la de transicion no se ha movido: el scroll no ha cambiado.
      expect(band(0).style.visibility).toBe("hidden");
      expect(scrollOffset.get()).toBe(100);
    });

    it("usa tinta sumi, la de siempre en un salto", () => {
      const { band } = setup();

      expect(band("jump")).toHaveAttribute("data-ground", "sumi");
    });

    it("tampoco provoca renders de React al moverse", async () => {
      let commits = 0;
      const curtain = motionValue(0);
      render(
        <Profiler id="curtain" onRender={() => (commits += 1)}>
          <InkOverlay
            transitions={SPECS_OF_TRANSITIONS}
            layout={motionValue(LAYOUT)}
            scrollOffset={motionValue(0)}
            curtain={curtain}
            visorHeight={VISOR}
          />
        </Profiler>,
      );
      const baseline = commits;

      for (let step = 0; step <= 10; step += 1) act(() => curtain.set(step / 10));
      await act(() => new Promise<void>((resolve) => setTimeout(resolve, 50)));

      expect(commits).toBe(baseline);
    });
  });

  describe("tarjetas de capitulo", () => {
    it("hay una por transicion, y anuncia el capitulo que entra", () => {
      const { overlay } = setup();

      const cards = [...overlay.querySelectorAll("[data-chapter-card]")];
      expect(cards).toHaveLength(SPECS_OF_TRANSITIONS.length);
      expect(cards[0]).toHaveTextContent("Sobre mí");
      expect(cards[1]).toHaveTextContent("Mi trayectoria");
    });

    it("van POR ENCIMA de todas las bandas de transicion (despues en el DOM): se leen sobre la tinta", () => {
      const { overlay } = setup();

      const children = [...overlay.children].filter((el) => el.getAttribute("data-ink-band") !== "jump");
      const lastBand = Math.max(...children.map((el, i) => (el.hasAttribute("data-ink-band") ? i : -1)));
      const firstCard = Math.min(...children.map((el, i) => (el.hasAttribute("data-chapter-card") ? i : 99)));
      expect(firstCard).toBeGreaterThan(lastBand);
    });
  });
});
