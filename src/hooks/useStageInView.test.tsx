import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { motionValue } from "motion/react";
import { StageContext, type StageContextValue } from "@/components/stage/StageContext";
import { triggerIntersection } from "@/test/setup";
import { useStageInView } from "./useStageInView";

function Probe({ amount }: { readonly amount?: number }) {
  const { ref, shown } = useStageInView<HTMLDivElement>(amount);
  return (
    <div ref={ref} data-testid="probe">
      {shown ? "visible" : "oculto"}
    </div>
  );
}

function deckStage(isActive: boolean): StageContextValue {
  return { mode: "deck", index: 2, isActive, isNear: true, progress: motionValue(0), intro: motionValue(0), reading: motionValue(0) };
}

describe("useStageInView", () => {
  it("fuera de un deck (modo lineal) empieza oculto y se revela al entrar en vista", () => {
    render(<Probe />);
    const probe = screen.getByTestId("probe");
    expect(probe).toHaveTextContent("oculto");

    triggerIntersection(probe, true);

    expect(probe).toHaveTextContent("visible");
  });

  it("es un 'una sola vez': al salir de vista no se vuelve a ocultar", () => {
    render(<Probe />);
    const probe = screen.getByTestId("probe");

    triggerIntersection(probe, true);
    // Con `once` el observer ya soltó el elemento: no queda nadie a quien avisar de la salida.
    expect(() => triggerIntersection(probe, false)).toThrow();

    expect(probe).toHaveTextContent("visible");
  });

  it("en un escenario ACTIVO se revela al entrar en vista", () => {
    render(
      <StageContext value={deckStage(true)}>
        <Probe />
      </StageContext>,
    );
    const probe = screen.getByTestId("probe");

    triggerIntersection(probe, true);

    expect(probe).toHaveTextContent("visible");
  });

  it("en un escenario INACTIVO no se revela aunque el observer lo vea (IntersectionObserver ignora visibility)", () => {
    render(
      <StageContext value={deckStage(false)}>
        <Probe />
      </StageContext>,
    );
    const probe = screen.getByTestId("probe");

    triggerIntersection(probe, true);

    expect(probe).toHaveTextContent("oculto");
  });

  it("si ya estaba en vista, se revela justo cuando su escenario pasa a ser el activo", () => {
    const { rerender } = render(
      <StageContext value={deckStage(false)}>
        <Probe />
      </StageContext>,
    );
    const probe = screen.getByTestId("probe");
    triggerIntersection(probe, true);
    expect(probe).toHaveTextContent("oculto");

    rerender(
      <StageContext value={deckStage(true)}>
        <Probe />
      </StageContext>,
    );

    expect(probe).toHaveTextContent("visible");
  });

  it("si su escenario se activa pero el elemento aun no esta en vista, sigue oculto", () => {
    // Es el caso del contenido que queda por debajo del visor hasta que el
    // escenario sube (pan): debe revelarse al llegar, no al activarse.
    const { rerender } = render(
      <StageContext value={deckStage(false)}>
        <Probe />
      </StageContext>,
    );
    const probe = screen.getByTestId("probe");

    rerender(
      <StageContext value={deckStage(true)}>
        <Probe />
      </StageContext>,
    );
    expect(probe).toHaveTextContent("oculto");

    triggerIntersection(probe, true);
    expect(probe).toHaveTextContent("visible");
  });
});
