import { describe, expect, it, vi } from "vitest";
import { render } from "@testing-library/react";
import { motionValue } from "motion/react";
import { buildLayout } from "@/lib/stage/timeline";
import { TRANSITIONS } from "@/lib/stage/transitions";
import { InkOverlay } from "./InkOverlay";

// Un doble de ChapterCard que cuenta sus renders: un `Profiler` no sirve para medir un
// `memo`, porque notifica cuando se re-renderiza su propio fiber aunque los hijos no.
const renders = vi.hoisted(() => ({ count: 0 }));
vi.mock("./ChapterCard", () => ({
  ChapterCard: () => {
    renders.count += 1;
    return null;
  },
}));

const LAYOUT = buildLayout([{ contentHeight: 600 }, { contentHeight: 1400 }, { contentHeight: 800 }], 800);

describe("InkOverlay y memo", () => {
  it("no se vuelve a renderizar cuando el padre se renderiza con las MISMAS props", () => {
    // StageDeck re-renderiza en cada cruce de escenario: sin memo arrastraba ~20 bandas y
    // 9 tarjetas (~74 useTransform) cada vez, aunque ninguna prop hubiera cambiado.
    const props = {
      transitions: TRANSITIONS.slice(0, 2),
      layout: motionValue(LAYOUT),
      scrollOffset: motionValue(0),
      curtain: motionValue(0),
      visorHeight: 800,
    };
    function Parent({ tick }: { readonly tick: number }) {
      return (
        <div data-tick={tick}>
          <InkOverlay {...props} />
        </div>
      );
    }
    const { rerender } = render(<Parent tick={1} />);
    const baseline = renders.count;
    expect(baseline).toBe(2); // una tarjeta por transicion

    rerender(<Parent tick={2} />);

    expect(renders.count).toBe(baseline);
  });

  it("SI se vuelve a renderizar cuando cambia una prop (el visor se redimensiona)", () => {
    const base = {
      transitions: TRANSITIONS.slice(0, 2),
      layout: motionValue(LAYOUT),
      scrollOffset: motionValue(0),
      curtain: motionValue(0),
    };
    const { rerender } = render(<InkOverlay {...base} visorHeight={800} />);
    const baseline = renders.count;

    rerender(<InkOverlay {...base} visorHeight={900} />);

    expect(renders.count).toBeGreaterThan(baseline);
  });
});
