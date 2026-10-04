import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { act, render, screen, waitFor } from "@testing-library/react";
import { motionValue } from "motion/react";
import { StageContext, type StageContextValue } from "@/components/stage/StageContext";
import { featuredIds, projects } from "@/data/projects";
import { Proyectos } from "./Proyectos";

/**
 * jsdom no tiene layout: cada tarjeta (`[data-reach]`) dice estar a 700 px de
 * la anterior y medir 600; el contenido del escenario empieza en 0.
 */
const realRect = Element.prototype.getBoundingClientRect;
const CARD_GAP = 700;
const CARD_HEIGHT = 600;
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
      return rect(FIRST_TOP + index * CARD_GAP, CARD_HEIGHT);
    }
    return realRect.call(this);
  });
});

afterEach(() => rectSpy?.mockRestore());

function renderInDeck() {
  const reading = motionValue(0);
  const stage: StageContextValue = {
    mode: "deck",
    index: 3,
    isActive: true,
    isNear: true,
    progress: motionValue(0),
    intro: motionValue(0),
    reading,
  };
  render(
    <StageContext value={stage}>
      <div data-stage-content="">
        <Proyectos />
      </div>
    </StageContext>,
  );
  return { reading };
}

const featuredTitles = featuredIds.map((id) => projects.find((project) => project.id === id)!.title);
const cardOf = (index: number) =>
  screen.getByRole("heading", { level: 3, name: featuredTitles[index] }).closest<HTMLElement>("[style*='opacity']");

describe("Proyectos en modo lineal: el sitio clasico", () => {
  it("las dos tarjetas destacadas, sin medida de alcance", () => {
    render(<Proyectos />);

    expect(screen.getAllByRole("heading", { level: 3 })).toHaveLength(featuredIds.length);
    expect(document.querySelector("[data-reach]")).toBeNull();
  });
});

describe("Proyectos en el modo escenarios (4.4)", () => {
  it("cada tarjeta se mide para la lectura y la segunda conserva su solape de koma", () => {
    renderInDeck();

    const shells = document.querySelectorAll("[data-reach]");
    expect(shells).toHaveLength(featuredIds.length);
    expect(shells[1]).toHaveClass("koma-overlap-up");
  });

  it("antes de que la lectura llegue, ninguna tarjeta se ve", () => {
    renderInDeck();

    expect(cardOf(0)?.style.opacity).toBe("0");
    expect(cardOf(1)?.style.opacity).toBe("0");
  });

  it("de UNA EN UNA: con la lectura en la primera, la primera esta entera y la segunda aun no", async () => {
    const { reading } = renderInDeck();

    act(() => reading.set(FIRST_TOP + CARD_HEIGHT / 2));

    await waitFor(() => expect(cardOf(0)?.style.opacity).toBe("1"));
    expect(cardOf(1)?.style.opacity).toBe("0");
  });

  it("con todo leido, las dos estan en su sitio", async () => {
    const { reading } = renderInDeck();

    act(() => reading.set(10_000));

    await waitFor(() => {
      expect(cardOf(0)?.style.opacity).toBe("1");
      expect(cardOf(1)?.style.opacity).toBe("1");
    });
  });
});
