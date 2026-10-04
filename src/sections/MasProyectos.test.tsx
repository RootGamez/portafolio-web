import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { act, render, screen, waitFor } from "@testing-library/react";
import { motionValue } from "motion/react";
import { StageContext, type StageContextValue } from "@/components/stage/StageContext";
import { isFeatured, projects } from "@/data/projects";
import { MasProyectos } from "./MasProyectos";

/**
 * jsdom no tiene layout: cada tarjeta (`[data-reach]`) dice estar a 700 px de
 * la anterior y medir 600; el contenido del escenario empieza en 0.
 */
const realRect = Element.prototype.getBoundingClientRect;
const CARD_GAP = 500;
const CARD_HEIGHT = 450;
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
    index: 4,
    isActive: true,
    isNear: true,
    progress: motionValue(0),
    intro: motionValue(0),
    reading,
  };
  render(
    <StageContext value={stage}>
      <div data-stage-content="">
        <MasProyectos />
      </div>
    </StageContext>,
  );
  return { reading };
}

const rest = projects.filter((project) => !isFeatured(project.id));
/** Las tarjetas en el orden en que se miden (`[data-reach]` en el DOM). */
const shells = () => [...document.querySelectorAll<HTMLElement>("[data-reach]")];
const cardOf = (index: number) => shells()[index].querySelector<HTMLElement>("[style*='opacity']");

describe("Mas proyectos en modo lineal: el sitio clasico", () => {
  it("todas las tarjetas, sin medida de alcance", () => {
    render(<MasProyectos />);

    expect(screen.getAllByRole("heading", { level: 3 })).toHaveLength(rest.length);
    expect(document.querySelector("[data-reach]")).toBeNull();
  });
});

describe("Mas proyectos en el modo escenarios (4.5)", () => {
  it("cada tarjeta del bento se mide para la lectura", () => {
    renderInDeck();

    expect(shells()).toHaveLength(rest.length);
  });

  it("antes de que la lectura llegue, ninguna tarjeta se ve", () => {
    renderInDeck();

    for (let i = 0; i < rest.length; i += 1) expect(cardOf(i)?.style.opacity).toBe("0");
  });

  it("entra TARJETA A TARJETA: con la lectura en la primera, la ultima aun no", async () => {
    const { reading } = renderInDeck();

    act(() => reading.set(FIRST_TOP + CARD_HEIGHT / 2));

    await waitFor(() => expect(cardOf(0)?.style.opacity).toBe("1"));
    expect(cardOf(rest.length - 1)?.style.opacity).toBe("0");
  });

  it("con todo leido, todas estan en su sitio", async () => {
    const { reading } = renderInDeck();

    act(() => reading.set(100_000));

    await waitFor(() => {
      for (let i = 0; i < rest.length; i += 1) expect(cardOf(i)?.style.opacity).toBe("1");
    });
  });
});
