import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { act, render, screen, waitFor } from "@testing-library/react";
import { motionValue } from "motion/react";
import { StageContext, type StageContextValue } from "@/components/stage/StageContext";
import { pipeline } from "@/data/timeline";
import { Produccion } from "./Produccion";

/**
 * jsdom no tiene layout: la rejilla de escritorio pone los pasos de DOS EN DOS
 * (1|2, 3|4, 5|6), asi que cada pareja dice estar a la misma altura: filas cada
 * 300 px, de 250 de alto, desde 200.
 */
const realRect = Element.prototype.getBoundingClientRect;
const ROW_GAP = 300;
const ROW_HEIGHT = 250;
const FIRST_TOP = 200;

function rect(top: number, height: number): DOMRect {
  return { x: 0, y: top, top, left: 0, right: 0, bottom: top + height, width: 0, height, toJSON: () => ({}) } as DOMRect;
}

/** Solo SU espia: `vi.restoreAllMocks()` borraria tambien los dobles globales de setup.ts (matchMedia). */
let rectSpy: ReturnType<typeof vi.spyOn> | null = null;

beforeEach(() => {
  rectSpy = vi.spyOn(Element.prototype, "getBoundingClientRect").mockImplementation(function (this: Element) {
    if (this.hasAttribute("data-stage-content")) return rect(0, 3000);
    if (this.hasAttribute("data-reach")) {
      const index = [...document.querySelectorAll("[data-reach]")].indexOf(this);
      return rect(FIRST_TOP + Math.floor(index / 2) * ROW_GAP, ROW_HEIGHT);
    }
    return realRect.call(this);
  });
});

afterEach(() => rectSpy?.mockRestore());

function renderInDeck() {
  const reading = motionValue(0);
  const stage: StageContextValue = {
    mode: "deck",
    index: 5,
    isActive: true,
    isNear: true,
    progress: motionValue(0),
    intro: motionValue(0),
    reading,
  };
  render(
    <StageContext value={stage}>
      <div data-stage-content="">
        <Produccion />
      </div>
    </StageContext>,
  );
  return { reading };
}

const steps = () => screen.getAllByRole("listitem");
const textOf = (index: number) =>
  screen.getByRole("heading", { level: 3, name: pipeline[index].title }).closest<HTMLElement>("[style*='opacity']");
/** El envoltorio del numeral (el que se estampa): padre del kanji decorativo. */
const numeralOf = (index: number) =>
  steps()[index].querySelector<HTMLElement>("span[aria-hidden='true']")?.parentElement;
const ruleOf = (index: number) => steps()[index].querySelector("svg path");

describe("Produccion en modo lineal: el sitio clasico", () => {
  it("seis pasos en una lista ordenada, cada uno con su regla de tinta (borde) y sin pincelada", () => {
    render(<Produccion />);

    expect(screen.getByRole("list").tagName).toBe("OL");
    expect(steps()).toHaveLength(pipeline.length);
    for (const step of steps()) {
      expect(step.className).toContain("border-t-[3px]");
      expect(step.querySelector("svg")).toBeNull();
    }
    expect(document.querySelector("[data-reach]")).toBeNull();
  });
});

describe("Produccion en el modo escenarios (4.6)", () => {
  it("cada paso se mide para la lectura y su regla es una pincelada que se dibuja (no un borde)", () => {
    renderInDeck();

    expect(document.querySelectorAll("[data-reach]")).toHaveLength(pipeline.length);
    for (let i = 0; i < pipeline.length; i += 1) {
      expect(steps()[i].className).not.toContain("border-t-[3px]");
      expect(ruleOf(i)).not.toBeNull();
    }
  });

  it("antes de que la lectura llegue no hay nada: ni regla, ni numeral, ni texto", async () => {
    renderInDeck();

    for (let i = 0; i < pipeline.length; i += 1) {
      expect(textOf(i)?.style.opacity).toBe("0");
      expect(numeralOf(i)?.style.opacity).toBe("0");
      await waitFor(() => expect(ruleOf(i)).toHaveAttribute("opacity", "0"));
    }
  });

  it("EN SECUENCIA: aunque 1 y 2 compartan fila, el 1 termina antes de que el 2 este entero", async () => {
    const { reading } = renderInDeck();
    // Primera fila: 200..450. Un punto en el que el paso 1 ya esta entero.
    act(() => reading.set(FIRST_TOP + ROW_HEIGHT * 0.6));

    await waitFor(() => expect(textOf(0)?.style.opacity).toBe("1"));
    expect(Number(textOf(1)?.style.opacity)).toBeLessThan(1);
    expect(textOf(2)?.style.opacity).toBe("0");
  });

  it("con todo leido, los seis pasos estan estampados y su pipeline dibujado", async () => {
    const { reading } = renderInDeck();

    act(() => reading.set(100_000));

    await waitFor(() => {
      for (let i = 0; i < pipeline.length; i += 1) {
        expect(textOf(i)?.style.opacity).toBe("1");
        expect(numeralOf(i)?.style.opacity).toBe("1");
        expect(ruleOf(i)).toHaveAttribute("opacity", "1");
      }
    });
  });
});
