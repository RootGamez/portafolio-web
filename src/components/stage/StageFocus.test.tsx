import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { act, fireEvent, render, screen } from "@testing-library/react";
import { DeckProvider } from "./DeckContext";
import { StageDeck } from "./StageDeck";
import { STAGES, stubStageGeometry, VISOR } from "@/test/stageGeometry";
import { FOCUS_MARGIN_PX } from "@/lib/stage/config";

/**
 * Foco por teclado dentro de una capa. Cada capa es `overflow: hidden`, y el
 * navegador, al enfocar un elemento oculto por debajo, DESPLAZA esa capa
 * (scrollTop): un desplazamiento que no corresponde a ninguna posicion del
 * scroll nativo y se suma al pan. Hallazgo de la revision de la Fase 1.
 *
 * Linea de tiempo de prueba (src/test/stageGeometry.tsx): el escenario 1 ("dos")
 * empieza en 1280, su intro acaba en 1760 y su pan maximo es 600.
 */
const scrollTo = () => vi.mocked(window.scrollTo);

function setScrollY(value: number) {
  Object.defineProperty(window, "scrollY", { configurable: true, value });
  act(() => {
    window.dispatchEvent(new Event("scroll"));
  });
}

function rectAt(top: number, bottom: number) {
  return { x: 0, y: top, top, bottom, left: 0, right: 0, width: 0, height: bottom - top, toJSON: () => ({}) } as DOMRect;
}

describe("foco dentro de un escenario", () => {
  beforeEach(() => {
    stubStageGeometry();
    vi.spyOn(window, "scrollTo").mockImplementation(((options: ScrollToOptions) => {
      Object.defineProperty(window, "scrollY", { configurable: true, value: options.top ?? 0 });
    }) as never);
    render(
      <DeckProvider>
        <StageDeck stages={STAGES} />
      </DeckProvider>,
    );
    setScrollY(2060); // escenario 1, pan = 300
    scrollTo().mockClear();
  });

  afterEach(() => {
    Object.defineProperty(window, "scrollY", { configurable: true, value: 0 });
  });

  it("si el elemento enfocado queda por DEBAJO del visor, sube el pan lo justo para verlo", () => {
    const button = screen.getByText("boton dos");
    vi.spyOn(button, "getBoundingClientRect").mockReturnValue(rectAt(900, 950));

    fireEvent.focusIn(button);

    // delta = 950 - (800 - margen); pan 300 + delta; scroll = 1280 + 480 + pan.
    const pan = 300 + (950 - (VISOR - FOCUS_MARGIN_PX));
    expect(scrollTo()).toHaveBeenCalledWith({ top: 1760 + pan, behavior: "auto" });
  });

  it("si queda por ENCIMA del visor, baja el pan para verlo", () => {
    const button = screen.getByText("boton dos");
    vi.spyOn(button, "getBoundingClientRect").mockReturnValue(rectAt(-60, -10));

    fireEvent.focusIn(button);

    const pan = 300 + (-60 - FOCUS_MARGIN_PX);
    expect(scrollTo()).toHaveBeenCalledWith({ top: 1760 + pan, behavior: "auto" });
  });

  it("si ya esta a la vista no mueve nada", () => {
    const button = screen.getByText("boton dos");
    vi.spyOn(button, "getBoundingClientRect").mockReturnValue(rectAt(300, 340));

    fireEvent.focusIn(button);

    expect(scrollTo()).not.toHaveBeenCalled();
  });

  it("si el elemento enfocado es MAS ALTO que el visor (una seccion entera), no baja el pan a su final", () => {
    // Regresion vista en vivo: al saltar a "Hablemos" el foco iba a la seccion y
    // el deck bajaba el pan hasta mostrar su borde inferior.
    setScrollY(1300); // inicio del escenario 1: pan 0, la seccion arranca en el borde del visor
    scrollTo().mockClear();
    const section = document.getElementById("dos") as HTMLElement;
    vi.spyOn(section, "getBoundingClientRect").mockReturnValue(rectAt(0, 1400));

    fireEvent.focusIn(section);

    expect(scrollTo()).not.toHaveBeenCalled();
  });

  it("si el pan no puede cambiar (el escenario cabe en el visor), no mueve la ventana", () => {
    // "uno" mide 600 y el visor 800: pan maximo 0. Aunque el boton quede dentro del
    // margen, subir la ventana solo saltaria al final de la intro sin mostrar nada.
    setScrollY(100);
    scrollTo().mockClear();
    const button = screen.getByText("boton uno");
    vi.spyOn(button, "getBoundingClientRect").mockReturnValue(rectAt(-10, 20));

    fireEvent.focusIn(button);

    expect(scrollTo()).not.toHaveBeenCalled();
  });

  it("anula tambien el desplazamiento horizontal de la capa (desborde en X)", () => {
    const button = screen.getByText("boton dos");
    const layer = button.closest("[data-stage]") as HTMLElement;
    layer.scrollLeft = 40;
    expect(layer.scrollLeft).toBe(40);

    fireEvent.scroll(layer);

    expect(layer.scrollLeft).toBe(0);
  });

  it("anula el scrollTop que el navegador aplique a la capa al enfocar", () => {
    const button = screen.getByText("boton dos");
    const layer = button.closest("[data-stage]") as HTMLElement;
    layer.scrollTop = 120;
    vi.spyOn(button, "getBoundingClientRect").mockReturnValue(rectAt(300, 340));

    fireEvent.focusIn(button);

    expect(layer.scrollTop).toBe(0);
  });

  it("y tambien si el scroll de la capa llega por su cuenta (Ctrl+F, cursor del lector)", () => {
    const layer = screen.getByText("boton dos").closest("[data-stage]") as HTMLElement;
    layer.scrollTop = 75;

    fireEvent.scroll(layer);

    expect(layer.scrollTop).toBe(0);
  });
});
