import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { act, render, screen, waitFor } from "@testing-library/react";
import { motionValue } from "motion/react";
import { StageContext, type StageContextValue } from "@/components/stage/StageContext";
import { skillGroups } from "@/data/skills";
import { Poderes } from "./Poderes";

/**
 * jsdom no tiene layout: cada grupo (`[data-reach]`) dice estar a 450 px del
 * anterior y medir 400; el contenido del escenario empieza en 0.
 */
const realRect = Element.prototype.getBoundingClientRect;
const GROUP_GAP = 450;
const GROUP_HEIGHT = 400;
const FIRST_TOP = 200;

function rect(top: number, height: number): DOMRect {
  return { x: 0, y: top, top, left: 0, right: 0, bottom: top + height, width: 0, height, toJSON: () => ({}) } as DOMRect;
}

/** Solo SU espia: `vi.restoreAllMocks()` borraria tambien los dobles globales de setup.ts (matchMedia). */
let rectSpy: ReturnType<typeof vi.spyOn> | null = null;

beforeEach(() => {
  rectSpy = vi.spyOn(Element.prototype, "getBoundingClientRect").mockImplementation(function (this: Element) {
    if (this.hasAttribute("data-stage-content")) return rect(0, 4000);
    if (this.hasAttribute("data-reach")) {
      const index = [...document.querySelectorAll("[data-reach]")].indexOf(this);
      return rect(FIRST_TOP + index * GROUP_GAP, GROUP_HEIGHT);
    }
    return realRect.call(this);
  });
});

afterEach(() => rectSpy?.mockRestore());

function renderInDeck() {
  const reading = motionValue(0);
  const stage: StageContextValue = {
    mode: "deck",
    index: 6,
    isActive: true,
    isNear: true,
    progress: motionValue(0),
    intro: motionValue(0),
    reading,
  };
  render(
    <StageContext value={stage}>
      <div data-stage-content="">
        <Poderes />
      </div>
    </StageContext>,
  );
  return { reading };
}

const panelOf = (index: number) =>
  screen.getByRole("heading", { level: 3, name: skillGroups[index].title }).closest<HTMLElement>("[style*='opacity']");
const tagsOf = (index: number) =>
  document.querySelectorAll("[data-reach]")[index].querySelectorAll<HTMLElement>("li");
const totalTags = skillGroups.reduce((sum, group) => sum + group.items.length, 0);

describe("Poderes en modo lineal: el sitio clasico", () => {
  it("los seis grupos con todos sus tags, sin medida de alcance", () => {
    render(<Poderes />);

    expect(screen.getAllByRole("heading", { level: 3 })).toHaveLength(skillGroups.length);
    expect(screen.getAllByRole("listitem")).toHaveLength(totalTags);
    expect(document.querySelector("[data-reach]")).toBeNull();
  });

  it("los paneles siguen estirandose a su celda: todo lo que hay entre la celda y el panel lleva h-full", () => {
    const { container } = render(<Poderes />);
    const grid = container.querySelector(".grid") as HTMLElement;

    for (const article of grid.querySelectorAll("article")) {
      for (let node = article.parentElement; node && node.parentElement !== grid; node = node.parentElement) {
        expect(node.className).toContain("h-full");
      }
    }
  });
});

describe("Poderes en el modo escenarios (4.7)", () => {
  it("cada grupo del bento se mide para la lectura", () => {
    renderInDeck();

    expect(document.querySelectorAll("[data-reach]")).toHaveLength(skillGroups.length);
  });

  it("antes de que la lectura llegue, ni paneles ni tags", () => {
    renderInDeck();

    for (let i = 0; i < skillGroups.length; i += 1) {
      expect(panelOf(i)?.style.opacity).toBe("0");
      for (const tag of tagsOf(i)) expect(tag.style.opacity).toBe("0");
    }
  });

  it("los tags caen EN CASCADA: hay un punto con el primero dentro y el ultimo aun fuera", async () => {
    const { reading } = renderInDeck();
    const tags = [...tagsOf(0)];
    expect(tags.length).toBeGreaterThan(3);

    act(() => reading.set(FIRST_TOP + GROUP_HEIGHT * 0.45));

    await waitFor(() => expect(tags[0].style.opacity).toBe("1"));
    expect(Number(tags.at(-1)?.style.opacity)).toBeLessThan(0.5);
  });

  it("con todo leido, el bento esta ensamblado y todos los tags en su sitio", async () => {
    const { reading } = renderInDeck();

    act(() => reading.set(100_000));

    await waitFor(() => {
      for (let i = 0; i < skillGroups.length; i += 1) {
        expect(panelOf(i)?.style.opacity).toBe("1");
        for (const tag of tagsOf(i)) expect(tag.style.opacity).toBe("1");
      }
    });
  });
});
