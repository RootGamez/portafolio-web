import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { act, render, screen, waitFor } from "@testing-library/react";
import { motionValue } from "motion/react";
import { StageContext, type StageContextValue } from "@/components/stage/StageContext";
import { triggerResize } from "@/test/setup";
import { ScrubReach } from "./ScrubReach";
import { ScrubReveal } from "./ScrubReveal";

/**
 * jsdom no tiene layout: el elemento medido (`.reach-under-test`) dice estar a
 * `top` px del contenido del escenario y medir `height` px; el contenido, en 0.
 */
const geometry = { top: 200, height: 400 };
const realRect = Element.prototype.getBoundingClientRect;

function rect(top: number, height: number): DOMRect {
  return { x: 0, y: top, top, left: 0, right: 0, bottom: top + height, width: 0, height, toJSON: () => ({}) } as DOMRect;
}

/** Solo SU espia: `vi.restoreAllMocks()` borraria tambien los dobles globales de setup.ts (matchMedia). */
let rectSpy: ReturnType<typeof vi.spyOn> | null = null;

beforeEach(() => {
  geometry.top = 200;
  geometry.height = 400;
  rectSpy = vi.spyOn(Element.prototype, "getBoundingClientRect").mockImplementation(function (this: Element) {
    if (this.hasAttribute("data-stage-content")) return rect(0, 2000);
    if (this.classList.contains("reach-under-test")) return rect(geometry.top, geometry.height);
    return realRect.call(this);
  });
});

afterEach(() => rectSpy?.mockRestore());

function renderReach(mode: "deck" | "linear" = "deck") {
  const reading = motionValue(0);
  const stage: StageContextValue = {
    mode,
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
        <ScrubReach as="li" className="reach-under-test">
          <ScrubReveal over="reach" range={[0, 0.5]}>
            Hito
          </ScrubReveal>
        </ScrubReach>
      </div>
    </StageContext>,
  );
  return { reading };
}

const hito = () => screen.getByText("Hito");

describe("ScrubReach", () => {
  it("respeta la etiqueta pedida", () => {
    renderReach();

    expect(document.querySelector(".reach-under-test")?.tagName).toBe("LI");
  });

  it("sus hijos con over=\"reach\" se animan cuando la linea de lectura cruza el elemento", async () => {
    const { reading } = renderReach();
    expect(hito().style.opacity).toBe("0");

    act(() => reading.set(200 + 100)); // cruzado un 25 %: a mitad del tramo 0..0,5
    await waitFor(() => expect(Number(hito().style.opacity)).toBeCloseTo(0.5));

    act(() => reading.set(200 + 200)); // cruzado un 50 %: tramo completo
    await waitFor(() => expect(hito().style.opacity).toBe("1"));
  });

  it("si el elemento cambia de sitio (fuentes que llegan tarde, otro ancho) se vuelve a medir", async () => {
    const { reading } = renderReach();
    act(() => reading.set(400));
    await waitFor(() => expect(hito().style.opacity).toBe("1"));

    geometry.top = 1000;
    triggerResize();
    act(() => reading.set(401));

    await waitFor(() => expect(hito().style.opacity).toBe("0"));
  });

  it("en modo lineal no anima nada: los hijos se pintan quietos", () => {
    renderReach("linear");

    expect(hito().style.opacity).toBe("");
  });
});
