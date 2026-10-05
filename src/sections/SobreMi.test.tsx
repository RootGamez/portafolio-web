import { describe, expect, it } from "vitest";
import { act, render, screen, waitFor } from "@testing-library/react";
import { motionValue } from "motion/react";
import { StageContext, type StageContextValue } from "@/components/stage/StageContext";
import { SobreMi } from "./SobreMi";

function renderInDeck() {
  const intro = motionValue(0);
  const stage: StageContextValue = {
    mode: "deck",
    index: 1,
    isActive: true,
    isNear: true,
    progress: motionValue(0),
    intro,
    reading: motionValue(0),
  };
  render(
    <StageContext value={stage}>
      <SobreMi />
    </StageContext>,
  );
  return { intro };
}

/** El envoltorio animado mas cercano (el de la primitiva Scrub*). */
const animated = (node: HTMLElement) => node.closest<HTMLElement>("[style*='opacity']");
const opacityOf = (node: HTMLElement) => animated(node)?.style.opacity;

const balloon = () => screen.getByText(/Un problema no es un obstáculo/);
const panel = () => screen.getByText(/Lo que más disfruto es resolver problemas/);
const sfx = () => screen.getByText("¡POW!");
const buttons = () => [
  screen.getByRole("link", { name: "Ver mis proyectos" }),
  screen.getByRole("link", { name: /Descargar el currículum/ }),
  screen.getByRole("link", { name: "Hablemos" }),
];

describe("Sobre mi en modo lineal: el sitio clasico", () => {
  it("nada lleva opacidad ni transformacion de animacion", () => {
    render(<SobreMi />);

    for (const node of [balloon(), panel(), sfx(), ...buttons()]) {
      expect(animated(node)).toBeNull();
    }
  });
});

describe("Sobre mi en el modo escenarios (4.2)", () => {
  it("al llegar no se ve nada todavia: globo, panel, onomatopeya y botones esperan al scroll", () => {
    renderInDeck();

    for (const node of [balloon(), panel(), sfx(), ...buttons()]) {
      expect(opacityOf(node)).toBe("0");
    }
  });

  it("al acabar la intro esta todo en su sitio", async () => {
    const { intro } = renderInDeck();

    act(() => intro.set(1));

    await waitFor(() => {
      for (const node of [balloon(), panel(), sfx(), ...buttons()]) expect(opacityOf(node)).toBe("1");
    });
  });

  it("el orden es globo → panel → onomatopeya → botones", async () => {
    const { intro } = renderInDeck();

    act(() => intro.set(0.3));
    await waitFor(() => expect(opacityOf(balloon())).toBe("1"));
    expect(Number(opacityOf(sfx()))).toBe(0);

    act(() => intro.set(0.5));
    await waitFor(() => expect(opacityOf(panel())).toBe("1"));
    expect(Number(opacityOf(buttons()[0]))).toBe(0);
  });

  it("los botones entran cada uno en su umbral: hay un punto con el primero dentro y el ultimo aun fuera", async () => {
    const { intro } = renderInDeck();

    act(() => intro.set(0.7));

    await waitFor(() => expect(opacityOf(buttons()[0])).toBe("1"));
    expect(Number(opacityOf(buttons()[2]))).toBeLessThan(0.1);
  });
});
