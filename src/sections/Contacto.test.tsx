import { describe, expect, it } from "vitest";
import { act, render, screen, waitFor } from "@testing-library/react";
import { motionValue } from "motion/react";
import { StageContext, type StageContextValue } from "@/components/stage/StageContext";
import { Contacto } from "./Contacto";

function renderInDeck() {
  const intro = motionValue(0);
  const stage: StageContextValue = {
    mode: "deck",
    index: 8,
    isActive: true,
    isNear: true,
    progress: motionValue(0),
    intro,
    reading: motionValue(0),
  };
  render(
    <StageContext value={stage}>
      <Contacto />
    </StageContext>,
  );
  return { intro };
}

const BUTTONS = ["Email", /WhatsApp/, "LinkedIn", "GitHub", /currículum/];
const buttons = () => BUTTONS.map((name) => screen.getByRole("link", { name }));
/** El envoltorio que se estampa: el mas cercano con escala u opacidad en linea. */
const stampOf = (link: HTMLElement) => link.closest<HTMLElement>("[style*='opacity']");
const headline = () => screen.getByText("Escríbeme");
const writer = () => headline().parentElement as HTMLElement;

describe("Contacto en modo lineal: el sitio clasico", () => {
  it("«Escríbeme» sin mascara y los cinco botones en su lista", () => {
    render(<Contacto />);

    expect(writer().style.maskImage).toBe("");
    expect(screen.getAllByRole("listitem")).toHaveLength(BUTTONS.length);
    for (const link of buttons()) expect(link).toBeInTheDocument();
  });
});

describe("Contacto en el modo escenarios (4.9)", () => {
  it("al llegar, «Escríbeme» aun no esta escrito y los botones no se han estampado", async () => {
    renderInDeck();

    await waitFor(() => expect(writer().style.maskImage).toContain("transparent 0%"));
    for (const link of buttons()) expect(stampOf(link)?.style.opacity).toBe("0");
  });

  it("la mascara de la escritura se mide sobre la PALABRA (w-fit), no sobre toda la columna", () => {
    renderInDeck();

    expect(writer().className).toContain("w-fit");
  });

  it("a mitad: «Escríbeme» ya escrito y los botones cayendo en cascada (el primero si, el ultimo no)", async () => {
    const { intro } = renderInDeck();

    act(() => intro.set(0.68));

    await waitFor(() => expect(writer().style.maskImage).toBe("none"));
    expect(stampOf(buttons()[0])?.style.opacity).toBe("1");
    expect(stampOf(buttons()[BUTTONS.length - 1])?.style.opacity).toBe("0");
  });

  it("al acabar la intro, los cinco botones estampados", async () => {
    const { intro } = renderInDeck();

    act(() => intro.set(1));

    await waitFor(() => {
      for (const link of buttons()) expect(stampOf(link)?.style.opacity).toBe("1");
    });
  });
});
