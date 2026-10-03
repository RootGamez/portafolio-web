import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { DeckProvider } from "./DeckContext";
import { StageDeck } from "./StageDeck";
import { STAGES, stubStageGeometry, VISOR } from "@/test/stageGeometry";

// La cortina real dura 420 ms; aqui lo justo para que corra por frames.
vi.mock("@/lib/stage/config", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@/lib/stage/config")>()),
  JUMP_CURTAIN_MS: 40,
}));

/**
 * Geometria real de la pista: lo que jsdom no calcula y los demas tests dejaban
 * siempre a 0 (por eso un signo cambiado en `origin` pasaba toda la suite).
 *
 * Linea de tiempo de prueba (src/test/stageGeometry.tsx): pista 4440 px y el
 * escenario 1 ("dos") empieza en 1280.
 */
const TIMELINE_HEIGHT = 4440;
const STAGE_TWO_START = 1280;

/** jsdom no resuelve `top: var(--nav-height)`: se fija el `top` que calcularia un navegador. */
function stubStickyTop(px: number) {
  const real = window.getComputedStyle.bind(window);
  vi.spyOn(window, "getComputedStyle").mockImplementation((element, pseudo) => {
    const style = real(element, pseudo);
    if (!element.hasAttribute("data-stage-visor")) return style;
    return new Proxy(style, {
      get: (target, property) => (property === "top" ? `${px}px` : Reflect.get(target, property, target)),
    });
  });
}

function renderDeck() {
  return render(
    <DeckProvider>
      <a href="#dos">ir a dos</a>
      <StageDeck stages={STAGES} />
    </DeckProvider>,
  );
}

describe("origen de la pista", () => {
  beforeEach(() => {
    vi.spyOn(window, "scrollTo").mockImplementation(() => {});
    window.history.replaceState(null, "", "/");
  });

  afterEach(() => {
    Object.defineProperty(window, "scrollY", { configurable: true, value: 0 });
  });

  it("es el tope de la pista en el documento: una cabecera encima desplaza todos los saltos", async () => {
    stubStageGeometry({ trackTop: 100 });
    renderDeck();

    fireEvent.click(screen.getByText("ir a dos"));

    await waitFor(() =>
      expect(window.scrollTo).toHaveBeenCalledWith({ top: 100 + STAGE_TWO_START, behavior: "auto" }),
    );
  });

  it("descuenta el `top` del visor sticky (la barra de nav fija en movil)", async () => {
    stubStageGeometry({ trackTop: 100 });
    stubStickyTop(56);
    renderDeck();

    fireEvent.click(screen.getByText("ir a dos"));

    // El scroll 0 de la pista es cuando su tope llega a 56px del borde de la ventana.
    await waitFor(() =>
      expect(window.scrollTo).toHaveBeenCalledWith({ top: 100 - 56 + STAGE_TWO_START, behavior: "auto" }),
    );
  });

  it("sin cabecera ni barra (escritorio) el origen es 0", async () => {
    stubStageGeometry();
    renderDeck();

    fireEvent.click(screen.getByText("ir a dos"));

    await waitFor(() => expect(window.scrollTo).toHaveBeenCalledWith({ top: STAGE_TWO_START, behavior: "auto" }));
  });
});

describe("cola de scroll con barras dinamicas del navegador", () => {
  // El visor mide `100svh` (viewport pequeno, con la barra visible) pero con la
  // barra replegada la ventana mide `100lvh`: el scroll maximo del documento es
  // pista - lvh, y sin holgura quedarian sin recorrer `lvh - svh` px del final.
  const track = () => document.querySelector("[data-stage-track]") as HTMLElement;

  beforeEach(() => {
    vi.spyOn(window, "scrollTo").mockImplementation(() => {});
  });

  it("suma a la pista la diferencia entre el viewport grande y el pequeno", () => {
    stubStageGeometry({ lvh: VISOR + 60 });
    renderDeck();

    expect(track().style.height).toBe(`${TIMELINE_HEIGHT + 60}px`);
  });

  it("la barra fija de arriba ya ocupa parte del viewport grande: solo se suma el resto", () => {
    stubStageGeometry({ lvh: VISOR + 56 + 60 });
    stubStickyTop(56);
    renderDeck();

    expect(track().style.height).toBe(`${TIMELINE_HEIGHT + 60}px`);
  });

  it("si el navegador no entiende `lvh` (alto 0) no cambia nada", () => {
    stubStageGeometry({ lvh: 0 });
    renderDeck();

    expect(track().style.height).toBe(`${TIMELINE_HEIGHT}px`);
  });

  it("si el viewport grande no supera al visor, nunca resta", () => {
    stubStageGeometry({ lvh: VISOR - 100 });
    renderDeck();

    expect(track().style.height).toBe(`${TIMELINE_HEIGHT}px`);
  });
});
