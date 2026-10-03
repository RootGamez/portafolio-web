import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { act, render, screen } from "@testing-library/react";
import { DeckContext, type DeckContextValue } from "./DeckContext";
import { StageAnnouncer } from "./StageAnnouncer";
import { ANNOUNCE_DELAY_MS } from "@/lib/stage/config";

const TITLES = ["Anthony Gámez", "Sobre mí", "Mi trayectoria", "Mis proyectos"];

function deck(patch: Partial<DeckContextValue> = {}): DeckContextValue {
  return {
    mode: "deck",
    eligible: true,
    optedOut: false,
    setOptedOut: () => {},
    activeIndex: 0,
    setActiveIndex: () => {},
    ...patch,
  };
}

function Harness({ value }: { readonly value: DeckContextValue }) {
  return (
    <DeckContext value={value}>
      <StageAnnouncer titles={TITLES} />
    </DeckContext>
  );
}

const wait = (ms: number) =>
  act(() => {
    vi.advanceTimersByTime(ms);
  });

describe("StageAnnouncer", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("es una region viva cortes y arranca vacia", () => {
    render(<Harness value={deck()} />);

    const region = screen.getByRole("status");
    expect(region).toHaveAttribute("aria-live", "polite");
    expect(region).toHaveAttribute("aria-atomic", "true");
    expect(region).toBeEmptyDOMElement();
  });

  it("no anuncia el escenario inicial al cargar la pagina", () => {
    render(<Harness value={deck()} />);

    wait(ANNOUNCE_DELAY_MS * 3);

    expect(screen.getByRole("status")).toBeEmptyDOMElement();
  });

  it("anuncia el escenario nuevo con su posicion y su titulo, tras una pausa", () => {
    const { rerender } = render(<Harness value={deck()} />);

    rerender(<Harness value={deck({ activeIndex: 3 })} />);
    expect(screen.getByRole("status")).toBeEmptyDOMElement();

    wait(ANNOUNCE_DELAY_MS);

    expect(screen.getByRole("status")).toHaveTextContent("Sección 4 de 4: Mis proyectos");
  });

  it("en un scroll rapido solo anuncia el escenario donde el usuario se detiene", () => {
    const { rerender } = render(<Harness value={deck()} />);

    rerender(<Harness value={deck({ activeIndex: 1 })} />);
    wait(ANNOUNCE_DELAY_MS / 3);
    rerender(<Harness value={deck({ activeIndex: 2 })} />);
    wait(ANNOUNCE_DELAY_MS / 3);
    expect(screen.getByRole("status")).toBeEmptyDOMElement();

    rerender(<Harness value={deck({ activeIndex: 3 })} />);
    wait(ANNOUNCE_DELAY_MS);

    expect(screen.getByRole("status")).toHaveTextContent("Mis proyectos");
    expect(screen.getByRole("status")).not.toHaveTextContent("Sobre mí");
  });

  it("si el usuario vuelve al escenario inicial antes de la pausa, no anuncia nada", () => {
    const { rerender } = render(<Harness value={deck()} />);

    rerender(<Harness value={deck({ activeIndex: 2 })} />);
    wait(ANNOUNCE_DELAY_MS / 2);
    rerender(<Harness value={deck({ activeIndex: 0 })} />);
    wait(ANNOUNCE_DELAY_MS * 2);

    expect(screen.getByRole("status")).toBeEmptyDOMElement();
  });

  it("en modo lineal no anuncia nada: ahi el lector de pantalla recorre el documento normal", () => {
    const { rerender } = render(<Harness value={deck({ mode: "linear" })} />);

    rerender(<Harness value={deck({ mode: "linear", activeIndex: 3 })} />);
    wait(ANNOUNCE_DELAY_MS * 2);

    expect(screen.getByRole("status")).toBeEmptyDOMElement();
  });
});
