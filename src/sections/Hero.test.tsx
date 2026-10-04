import { describe, expect, it } from "vitest";
import { act, render, screen, waitFor } from "@testing-library/react";
import { motionValue } from "motion/react";
import { StageContext, type StageContextValue } from "@/components/stage/StageContext";
import { Hero } from "./Hero";

function renderHeroInDeck() {
  const progress = motionValue(0);
  const intro = motionValue(0);
  const stage: StageContextValue = { mode: "deck", index: 0, isActive: true, isNear: true, progress, intro, reading: motionValue(0) };
  const utils = render(
    <StageContext value={stage}>
      <Hero />
    </StageContext>,
  );
  return { ...utils, progress, intro, reading: motionValue(0) };
}

const ring = (container: HTMLElement) => container.querySelector("[data-enso-ring] path");
const portrait = () => screen.getByRole("img", { name: /Anthony Gámez/ });
/** El envoltorio que se borra: el que contiene el nombre (h1). */
const nameBlock = () => screen.getByRole("heading", { level: 1 }).parentElement as HTMLElement;

describe("Hero en modo lineal: el sitio clasico", () => {
  it("no hay anillo de tinta, ni mascara sobre el nombre, ni paralaje en el retrato", () => {
    const { container } = render(<Hero />);

    expect(ring(container)).toBeNull();
    expect(nameBlock().style.maskImage).toBe("");
    expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent("AnthonyGámez");
  });
});

describe("Hero en el modo escenarios (4.1)", () => {
  it("el enso lleva un anillo de tinta que se dibuja con la intro: oculto al llegar, entero al acabar", async () => {
    const { container, intro } = renderHeroInDeck();
    const path = () => ring(container) as SVGPathElement;
    expect(path()).not.toBeNull();
    await waitFor(() => expect(path()).toHaveAttribute("opacity", "0"));

    act(() => intro.set(1));

    await waitFor(() => expect(path()).toHaveAttribute("opacity", "1"));
  });

  it("el nombre se ve nitido al llegar y se BORRA al final de la intro (y vuelve al subir)", async () => {
    const { intro } = renderHeroInDeck();
    await waitFor(() => expect(nameBlock().style.maskImage).toBe("none"));

    act(() => intro.set(1));
    await waitFor(() => expect(nameBlock().style.maskImage).toContain("transparent 100%"));

    act(() => intro.set(0));
    await waitFor(() => expect(nameBlock().style.maskImage).toBe("none"));
  });

  it("el retrato sube con el escenario (paralaje) y arranca en su sitio", async () => {
    const { progress } = renderHeroInDeck();

    act(() => progress.set(1));

    await waitFor(() => {
      const moved = portrait().closest<HTMLElement>("[style*='translateY(-']");
      expect(moved).not.toBeNull();
    });
  });

  it("LCP: la foto nunca esta dentro de algo que arranque oculto (opacity 0 o visibility hidden)", () => {
    renderHeroInDeck();

    for (let node: HTMLElement | null = portrait(); node; node = node.parentElement) {
      expect(node.style.opacity, node.outerHTML.slice(0, 80)).not.toBe("0");
      expect(node.style.visibility).not.toBe("hidden");
    }
  });
});
