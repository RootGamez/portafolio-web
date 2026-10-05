import { describe, expect, it } from "vitest";
import { act, render, screen, waitFor } from "@testing-library/react";
import { motionValue } from "motion/react";
import { StageContext, type StageContextValue } from "@/components/stage/StageContext";
import { FueraDelCodigo } from "./FueraDelCodigo";

function renderInDeck() {
  const intro = motionValue(0);
  const stage: StageContextValue = {
    mode: "deck",
    index: 7,
    isActive: true,
    isNear: true,
    progress: motionValue(0),
    intro,
    reading: motionValue(0),
  };
  const utils = render(
    <StageContext value={stage}>
      <FueraDelCodigo />
    </StageContext>,
  );
  return { ...utils, intro };
}

/**
 * El envoltorio animado del panel: el mas cercano con opacidad en linea (el
 * propio panel, `InkPanel`, lleva `transform: rotate(...)` pero no opacidad).
 */
const slideOf = (title: string) =>
  screen.getByRole("heading", { level: 3, name: title }).closest<HTMLElement>("[style*='opacity']");
const PIZZERIA = "Pizzería Sabor Llanero";
const HOTEL = "Radisson Paracas Resort";

describe("Fuera del codigo en modo lineal: el sitio clasico", () => {
  it("ningun panel entra en horizontal", () => {
    render(<FueraDelCodigo />);

    for (const title of [PIZZERIA, HOTEL]) {
      const transformed = slideOf(title);
      expect(transformed?.style.transform ?? "").not.toContain("translateX");
    }
  });

  it("los paneles siguen estirandose a su celda: todo lo que hay entre la celda y el panel lleva h-full", () => {
    const { container } = render(<FueraDelCodigo />);
    const grid = container.querySelector(".grid") as HTMLElement;

    for (const article of grid.querySelectorAll("article")) {
      for (let node = article.parentElement; node && node.parentElement !== grid; node = node.parentElement) {
        expect(node.className).toContain("h-full");
      }
    }
  });
});

describe("Fuera del codigo en el modo escenarios (4.8)", () => {
  it("los dos paneles entran desde LADOS OPUESTOS: la pizzeria por la izquierda, el hotel por la derecha", () => {
    renderInDeck();

    expect(slideOf(PIZZERIA)?.style.transform).toMatch(/translateX\(-\d+px\)/);
    expect(slideOf(HOTEL)?.style.transform).toMatch(/translateX\(\d+px\)/);
    expect(slideOf(PIZZERIA)?.style.opacity).toBe("0");
    expect(slideOf(HOTEL)?.style.opacity).toBe("0");
  });

  it("el hotel llega DESPUES: hay un punto con la pizzeria en su sitio y el hotel aun entrando", async () => {
    const { intro } = renderInDeck();

    act(() => intro.set(0.42));

    await waitFor(() => expect(slideOf(PIZZERIA)?.style.opacity).toBe("1"));
    expect(Number(slideOf(HOTEL)?.style.opacity)).toBeLessThan(1);
  });

  it("al acabar la intro los dos estan en su sitio y el ¡ÑAM! estampado", async () => {
    const { intro } = renderInDeck();

    act(() => intro.set(1));

    await waitFor(() => {
      expect(slideOf(PIZZERIA)?.style.transform).toBe("none");
      expect(slideOf(HOTEL)?.style.transform).toBe("none");
      expect(screen.getByText("¡ÑAM!").closest<HTMLElement>("[style*='opacity']")?.style.opacity).toBe("1");
    });
  });
});
