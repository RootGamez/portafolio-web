import { useEffect } from "react";
import { describe, expect, it, vi } from "vitest";
import { act, render } from "@testing-library/react";
import { motionValue } from "motion/react";
import { buildLayout } from "@/lib/stage/timeline";
import { TRANSITIONS } from "@/lib/stage/transitions";
import { InkOverlay } from "./InkOverlay";

/**
 * El cambio de pintor: cuando el canvas WebGL avisa de que esta activo, las bandas
 * SVG de SCROLL sobran (pintarian lo mismo dos veces); la cortina de los saltos y
 * las tarjetas siguen, que son DOM por encima del canvas. El canvas se sustituye
 * por un doble que se declara activo al montar (el de verdad necesita GPU).
 */
const canvasDouble = vi.hoisted(() => ({ setActive: (_active: boolean): void => {} }));
vi.mock("./InkCanvas", () => ({
  InkCanvas: ({ onActiveChange }: { onActiveChange: (active: boolean) => void }) => {
    useEffect(() => {
      canvasDouble.setActive = onActiveChange;
      onActiveChange(true);
    }, [onActiveChange]);
    return <canvas data-ink-canvas="" />;
  },
}));

function renderOverlay() {
  return render(
    <InkOverlay
      transitions={TRANSITIONS.slice(0, 2)}
      layout={motionValue(buildLayout([{ contentHeight: 600 }, { contentHeight: 600 }, { contentHeight: 600 }], 800))}
      scrollOffset={motionValue(0)}
      curtain={motionValue(0)}
      visorHeight={800}
    />,
  );
}

const bandIds = (container: HTMLElement) =>
  [...container.querySelectorAll("[data-ink-band]")].map((band) => band.getAttribute("data-ink-band"));

describe("InkOverlay con la tinta WebGL activa", () => {
  it("quita las bandas SVG de scroll y deja la cortina de los saltos y las tarjetas", () => {
    const { container } = renderOverlay();
    const overlay = container.querySelector("[data-ink-overlay]");

    expect(overlay).toHaveAttribute("data-ink-renderer", "webgl");
    expect(bandIds(container)).toEqual(["jump"]);
    expect(container.querySelectorAll("[data-chapter-card]")).toHaveLength(2);
    // El canvas va el primero: debajo de tarjetas y cortina.
    expect(overlay?.firstElementChild).toHaveAttribute("data-ink-canvas");
  });

  it("si el WebGL se apaga (GPU perdida, lentitud) vuelven las bandas SVG", () => {
    const { container } = renderOverlay();

    act(() => canvasDouble.setActive(false));

    expect(container.querySelector("[data-ink-overlay]")).toHaveAttribute("data-ink-renderer", "svg");
    expect(bandIds(container)).toEqual(["0", "1", "jump"]);
  });
});
