import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { act, render, screen, waitFor } from "@testing-library/react";
import { motionValue } from "motion/react";
import { StageContext, type StageContextValue } from "@/components/stage/StageContext";
import { timeline } from "@/data/timeline";
import { Trayectoria } from "./Trayectoria";

/**
 * jsdom no tiene layout: cada hito (`li`) dice estar a 500 px del anterior y
 * medir 400; el contenido del escenario empieza en 0.
 */
const realRect = Element.prototype.getBoundingClientRect;
const MILESTONE_GAP = 500;
const MILESTONE_HEIGHT = 400;

function rect(top: number, height: number): DOMRect {
  return { x: 0, y: top, top, left: 0, right: 0, bottom: top + height, width: 0, height, toJSON: () => ({}) } as DOMRect;
}

/** Solo SU espia: `vi.restoreAllMocks()` borraria tambien los dobles globales de setup.ts (matchMedia). */
let rectSpy: ReturnType<typeof vi.spyOn> | null = null;

beforeEach(() => {
  rectSpy = vi.spyOn(Element.prototype, "getBoundingClientRect").mockImplementation(function (this: Element) {
    if (this.hasAttribute("data-stage-content")) return rect(0, 3000);
    if (this.tagName === "LI") {
      const index = [...(this.parentElement?.children ?? [])].indexOf(this);
      return rect(200 + index * MILESTONE_GAP, MILESTONE_HEIGHT);
    }
    return realRect.call(this);
  });
});

afterEach(() => rectSpy?.mockRestore());

function renderInDeck() {
  const reading = motionValue(0);
  const stage: StageContextValue = {
    mode: "deck",
    index: 2,
    isActive: true,
    isNear: true,
    progress: motionValue(0),
    intro: motionValue(0),
    reading,
  };
  render(
    <StageContext value={stage}>
      <div data-stage-content="">
        <Trayectoria />
      </div>
    </StageContext>,
  );
  return { reading };
}

const animated = (node: HTMLElement) => node.closest<HTMLElement>("[style*='opacity']");
const panelOf = (index: number) => screen.getByText(timeline[index].org);
const axisOf = (index: number) =>
  screen.getAllByRole("listitem")[index].querySelector("svg path") as SVGPathElement;

describe("Trayectoria en modo lineal: el sitio clasico", () => {
  it("los hitos no llevan animacion ligada al scroll (mantienen su Reveal por tiempo)", () => {
    render(<Trayectoria />);

    expect(screen.getAllByRole("listitem")).toHaveLength(timeline.length);
    expect(document.querySelector("[data-enso-ring]")).toBeNull();
    for (let i = 0; i < timeline.length; i += 1) expect(axisOf(i)).not.toHaveAttribute("opacity");
  });
});

describe("Trayectoria en el modo escenarios (4.3)", () => {
  it("sigue siendo una lista ordenada con un elemento por hito", () => {
    renderInDeck();

    expect(screen.getByRole("list").tagName).toBe("OL");
    expect(screen.getAllByRole("listitem")).toHaveLength(timeline.length);
  });

  it("antes de que la lectura llegue, ningun hito se ve ni su eje esta dibujado", async () => {
    renderInDeck();

    for (let i = 0; i < timeline.length; i += 1) {
      expect(animated(panelOf(i))?.style.opacity).toBe("0");
      await waitFor(() => expect(axisOf(i)).toHaveAttribute("opacity", "0"));
    }
  });

  it("cada hito se enciende AL ALCANZARLO: con la lectura en el segundo, el primero esta entero y el tercero aun no", async () => {
    const { reading } = renderInDeck();

    // Segundo hito: 700..1100. Lectura a mitad de el.
    act(() => reading.set(200 + MILESTONE_GAP + MILESTONE_HEIGHT / 2));

    await waitFor(() => expect(animated(panelOf(0))?.style.opacity).toBe("1"));
    expect(axisOf(0)).toHaveAttribute("opacity", "1");
    expect(Number(animated(panelOf(1))?.style.opacity)).toBeGreaterThan(0);
    expect(animated(panelOf(2))?.style.opacity).toBe("0");
  });

  it("con todo leido, los tres hitos estan en su sitio", async () => {
    const { reading } = renderInDeck();

    act(() => reading.set(10_000));

    await waitFor(() => {
      for (let i = 0; i < timeline.length; i += 1) expect(animated(panelOf(i))?.style.opacity).toBe("1");
    });
  });
});
