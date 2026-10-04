import { beforeEach, describe, expect, it } from "vitest";
import { act, render, screen, waitFor } from "@testing-library/react";
import { motionValue } from "motion/react";
import { Reveal } from "./Reveal";
import { StageContext, type StageContextValue } from "@/components/stage/StageContext";
import { installMatchMedia } from "@/test/doubles";
import { triggerIntersection } from "@/test/setup";

const REDUCED = "(prefers-reduced-motion: reduce)";

function deckStage(isActive: boolean): StageContextValue {
  return { mode: "deck", index: 1, isActive, isNear: true, progress: motionValue(0), intro: motionValue(0), reading: motionValue(0) };
}

const settle = (ms = 120) => act(() => new Promise<void>((resolve) => setTimeout(resolve, ms)));

describe("Reveal", () => {
  beforeEach(() => {
    installMatchMedia();
  });

  it("con prefers-reduced-motion el contenido arranca VISIBLE: nunca queda en opacity 0", () => {
    // Es la trampa numero uno del proyecto (DESIGN_SYSTEM §7, restriccion 2).
    installMatchMedia({ [REDUCED]: true });
    render(<Reveal>hola</Reveal>);

    expect(screen.getByText("hola")).toBeVisible();
  });

  it("sin reduced-motion empieza oculto hasta que entra en vista", () => {
    render(<Reveal>hola</Reveal>);

    expect(screen.getByText("hola")).not.toBeVisible();
  });

  it("al entrar en vista se revela", async () => {
    render(<Reveal>hola</Reveal>);
    const element = screen.getByText("hola");

    triggerIntersection(element, true);

    await waitFor(() => expect(element).toBeVisible());
  });

  it("en un escenario INACTIVO no se revela aunque el observer lo vea", async () => {
    render(
      <StageContext value={deckStage(false)}>
        <Reveal>hola</Reveal>
      </StageContext>,
    );
    const element = screen.getByText("hola");

    triggerIntersection(element, true);
    await settle();

    expect(element).not.toBeVisible();
  });

  it("se revela cuando su escenario pasa a ser el activo", async () => {
    const { rerender } = render(
      <StageContext value={deckStage(false)}>
        <Reveal>hola</Reveal>
      </StageContext>,
    );
    const element = screen.getByText("hola");
    triggerIntersection(element, true);

    rerender(
      <StageContext value={deckStage(true)}>
        <Reveal>hola</Reveal>
      </StageContext>,
    );

    await waitFor(() => expect(element).toBeVisible());
  });

  it("renderiza la etiqueta pedida (li dentro de una lista) y respeta className", () => {
    render(
      <ul>
        <Reveal as="li" className="hito">
          uno
        </Reveal>
      </ul>,
    );

    const item = screen.getByRole("listitem");
    expect(item).toHaveTextContent("uno");
    expect(item).toHaveClass("hito");
  });
});
