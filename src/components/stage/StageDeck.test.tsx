import { Profiler } from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { act, render, screen, waitFor } from "@testing-library/react";
import { DeckProvider, useDeck } from "./DeckContext";
import { StageDeck } from "./StageDeck";
import { STAGES, stubStageGeometry } from "@/test/stageGeometry";
import { elementsUnderResizeObservation, triggerResize } from "@/test/setup";
import stageDeckSource from "./StageDeck.tsx?raw";
import stageLayerSource from "./StageLayer.tsx?raw";
import stageNavigationSource from "./useStageNavigation.ts?raw";
import windowScrollYSource from "@/hooks/useWindowScrollY.ts?raw";

function ActiveProbe() {
  return <output data-testid="activo">{useDeck().activeIndex}</output>;
}

function renderDeck() {
  return render(
    <DeckProvider>
      <StageDeck stages={STAGES} />
      <ActiveProbe />
    </DeckProvider>,
  );
}

function setScrollY(value: number) {
  Object.defineProperty(window, "scrollY", { configurable: true, value });
  act(() => {
    window.dispatchEvent(new Event("scroll"));
  });
}

const layer = (index: number) => document.querySelector(`[data-stage="${index}"]`) as HTMLElement;
const content = (index: number) => layer(index).querySelector("[data-stage-content]") as HTMLElement;
const track = () => document.querySelector("[data-stage-track]") as HTMLElement;

describe("StageDeck", () => {
  beforeEach(() => {
    stubStageGeometry();
    vi.spyOn(window, "scrollTo").mockImplementation(() => {});
  });

  afterEach(() => {
    Object.defineProperty(window, "scrollY", { configurable: true, value: 0 });
    window.history.replaceState(null, "", "/");
  });

  it("renderiza todos los escenarios en el DOM, en orden", () => {
    renderDeck();

    // `hidden: true`: las capas que no participan van con visibility:hidden y
    // testing-library las da por inaccesibles; aqui se comprueba la presencia en el DOM.
    const headings = screen.getAllByRole("heading", { level: 2, hidden: true });
    expect(headings.map((h) => h.textContent)).toEqual([
      "titulo uno",
      "titulo dos",
      "titulo tres",
    ]);
  });

  it("mide el contenido y da a la pista el alto de la linea de tiempo", () => {
    renderDeck();

    expect(track().style.height).toBe("4440px");
  });

  it("al principio solo el primer escenario es interactivo: el resto va inert", () => {
    renderDeck();

    expect(layer(0)).not.toHaveAttribute("inert");
    expect(layer(1)).toHaveAttribute("inert");
    expect(layer(2)).toHaveAttribute("inert");
    expect(track()).toHaveAttribute("data-stage-active", "0");
  });

  it("al hacer scroll cambia el escenario activo y mueve el inert", () => {
    renderDeck();

    setScrollY(1500);

    expect(track()).toHaveAttribute("data-stage-active", "1");
    expect(layer(1)).not.toHaveAttribute("inert");
    expect(layer(0)).toHaveAttribute("inert");
    expect(layer(2)).toHaveAttribute("inert");
  });

  it("comunica el escenario activo al resto de la app (riel, anunciador)", () => {
    renderDeck();
    expect(screen.getByTestId("activo")).toHaveTextContent("0");

    setScrollY(3300);

    expect(screen.getByTestId("activo")).toHaveTextContent("2");
  });

  it("el cambio de escenario ocurre en la mitad de la transicion, ni antes ni despues", () => {
    renderDeck();

    setScrollY(879);
    expect(track()).toHaveAttribute("data-stage-active", "0");

    setScrollY(880);
    expect(track()).toHaveAttribute("data-stage-active", "1");
  });

  it("la pista pinta el suelo del escenario ACTIVO (la franja bajo el visor en movil con barras dinamicas)", () => {
    // Con la barra del navegador replegada el viewport es mas alto que el visor
    // (100svh) y asoma una franja del fondo del body: debe ser del color del suelo.
    renderDeck();
    expect(track()).toHaveAttribute("data-ground", "washi");

    setScrollY(1500);

    expect(track()).toHaveAttribute("data-ground", "sumi");
  });

  it("al subir de nuevo vuelve al escenario anterior (reversible)", () => {
    renderDeck();
    setScrollY(1500);
    expect(track()).toHaveAttribute("data-stage-active", "1");

    setScrollY(100);

    expect(track()).toHaveAttribute("data-stage-active", "0");
  });

  it("el contenido que desborda sube 1:1 con el scroll", async () => {
    renderDeck();

    setScrollY(2060); // E1: intro hasta 1760, luego pan = 2060 - 1760 = 300

    await waitFor(() => expect(content(1).style.transform).toContain("-300px"));
  });

  it("durante la transicion los dos escenarios vecinos se ven a la vez (crossfade provisional)", async () => {
    renderDeck();

    setScrollY(880); // t = 0.5: ambos a 0.5

    await waitFor(() => {
      expect(Number(layer(0).style.opacity)).toBeCloseTo(0.5, 2);
      expect(Number(layer(1).style.opacity)).toBeCloseTo(0.5, 2);
    });
    // El tercero no participa y queda fuera de pintado.
    expect(layer(2).style.visibility).toBe("hidden");
  });

  it("vuelve a medir cuando cambia el tamano del contenido", () => {
    renderDeck();
    expect(track().style.height).toBe("4440px");

    // El escenario 0 pasa de 600 a 1000px: ahora desborda el visor en 200px.
    document.getElementById("uno")?.setAttribute("data-height", "1000");
    triggerResize();

    expect(track().style.height).toBe("4640px");
  });

  it("hacer scroll DENTRO de un escenario no provoca ningun render de React (lo visual va por MotionValues)", () => {
    // Presupuesto de rendimiento: ni un commit de React por frame de scroll.
    let commits = 0;
    render(
      <DeckProvider>
        <Profiler id="deck" onRender={() => (commits += 1)}>
          <StageDeck stages={STAGES} />
        </Profiler>
      </DeckProvider>,
    );
    const baseline = commits;

    // 0..480 es la intro del escenario 0: 24 eventos de scroll sin cruzar ningun limite.
    for (let y = 10; y < 480; y += 20) setScrollY(y);

    expect(commits).toBe(baseline);
  });

  it("solo hay render al CRUZAR un limite de escenario", () => {
    let commits = 0;
    render(
      <DeckProvider>
        <Profiler id="deck" onRender={() => (commits += 1)}>
          <StageDeck stages={STAGES} />
        </Profiler>
      </DeckProvider>,
    );
    setScrollY(100);
    const baseline = commits;

    setScrollY(1500); // cruza al escenario 1

    expect(commits).toBeGreaterThan(baseline);
  });

  describe("foco al cambiar de escenario por scroll", () => {
    // La capa que deja de ser la activa pasa a `inert`: si tenia el foco, el
    // navegador lo suelta al <body> y quien navega con teclado queda sin
    // posicion (WCAG 2.4.3). El foco debe quedarse en un sitio estable.
    const visor = () => document.querySelector("[data-stage-visor]") as HTMLElement;

    it("si el foco estaba dentro de la capa saliente, pasa al visor (no se pierde en el body)", () => {
      renderDeck();
      screen.getByText("boton uno").focus();
      expect(screen.getByText("boton uno")).toHaveFocus();

      setScrollY(1500); // cruza al escenario 1

      expect(visor()).toHaveFocus();
    });

    it("el visor admite foco por programa (tabindex -1) y no entra en el orden del tabulador", () => {
      renderDeck();

      expect(visor()).toHaveAttribute("tabindex", "-1");
    });

    it("si el foco estaba fuera del deck (el riel), no se mueve", () => {
      render(
        <DeckProvider>
          <button type="button">riel</button>
          <StageDeck stages={STAGES} />
        </DeckProvider>,
      );
      screen.getByText("riel").focus();

      setScrollY(1500);

      expect(screen.getByText("riel")).toHaveFocus();
    });

    it("si el foco esta en el escenario que SIGUE siendo el activo, no se toca", () => {
      renderDeck();
      screen.getByText("boton uno").focus();

      setScrollY(300); // dentro del escenario 0: no cruza ningun limite

      expect(screen.getByText("boton uno")).toHaveFocus();
    });

    it("si el foco estaba en una capa que ya NO es la que entra, tampoco hace falta moverlo dos veces", () => {
      renderDeck();
      screen.getByText("boton uno").focus();
      setScrollY(1500); // el foco pasa al visor
      expect(visor()).toHaveFocus();

      setScrollY(3300); // otro cruce, con el foco ya en el visor

      expect(visor()).toHaveFocus();
    });
  });

  describe("re-anclaje cuando cambian las alturas (fuentes e imagenes que llegan tarde)", () => {
    beforeEach(() => {
      // Como un navegador real: un salto instantaneo mueve el scroll.
      vi.mocked(window.scrollTo).mockImplementation(((options: ScrollToOptions) => {
        Object.defineProperty(window, "scrollY", { configurable: true, value: options.top ?? 0 });
      }) as never);
    });

    it("si un escenario ANTERIOR cambia de alto, desplaza el scroll lo mismo para no perder el sitio", () => {
      renderDeck();
      setScrollY(1500); // escenario 1, 220px dentro
      vi.mocked(window.scrollTo).mockClear();

      // El escenario 0 pasa de 600 a 1000px: su pan crece 200 y el escenario 1 empieza 200px mas abajo.
      document.getElementById("uno")?.setAttribute("data-height", "1000");
      triggerResize();

      expect(window.scrollTo).toHaveBeenCalledWith({ top: 1700, behavior: "auto" });
    });

    it("si cambia el alto del escenario ACTUAL no mueve el scroll (su inicio no cambia)", () => {
      renderDeck();
      setScrollY(1500);
      vi.mocked(window.scrollTo).mockClear();

      document.getElementById("dos")?.setAttribute("data-height", "1700");
      triggerResize();

      expect(window.scrollTo).not.toHaveBeenCalled();
    });

    it("si nada cambia de tamano, no toca el scroll", () => {
      renderDeck();
      setScrollY(1500);
      vi.mocked(window.scrollTo).mockClear();

      triggerResize();

      expect(window.scrollTo).not.toHaveBeenCalled();
    });

    it("durante una transicion no re-ancla (no hay un escenario concreto que conservar)", () => {
      renderDeck();
      setScrollY(900); // transicion 0 -> 1
      vi.mocked(window.scrollTo).mockClear();

      document.getElementById("uno")?.setAttribute("data-height", "1000");
      triggerResize();

      expect(window.scrollTo).not.toHaveBeenCalled();
    });
  });

  it("SALVAGUARDA 1: no registra ningun listener de rueda, tacto ni teclado (no secuestra el scroll)", () => {
    const registered: string[] = [];
    for (const target of [window, document]) {
      vi.spyOn(target, "addEventListener").mockImplementation(((type: string) => {
        registered.push(type);
      }) as never);
    }

    renderDeck();

    const forbidden = ["wheel", "mousewheel", "touchstart", "touchmove", "touchend", "keydown", "keyup", "keypress"];
    expect(registered.filter((type) => forbidden.includes(type))).toEqual([]);
  });

  it("SALVAGUARDA 1 (fuente): ni el deck ni sus capas declaran manejadores de rueda, tacto o teclado", () => {
    // El test de arriba no ve un `onWheel` de React: React registra sus eventos en
    // el contenedor raiz, no en window ni document. Por eso ademas se revisa la fuente.
    const forbidden = /\bon(Wheel|Touch[A-Za-z]*|Key[A-Za-z]*)\b|["'](wheel|mousewheel|touch[a-z]+|key(down|up|press))["']/;
    const sources = {
      "StageDeck.tsx": stageDeckSource,
      "StageLayer.tsx": stageLayerSource,
      "useStageNavigation.ts": stageNavigationSource,
      "useWindowScrollY.ts": windowScrollYSource,
    };

    for (const [name, source] of Object.entries(sources)) {
      expect({ name, match: source.match(forbidden)?.[0] ?? null }).toEqual({ name, match: null });
    }
  });

  it("observa con ResizeObserver el visor y el contenido de cada escenario", () => {
    renderDeck();

    const observed = elementsUnderResizeObservation();
    expect(observed.some((node) => node.hasAttribute("data-stage-visor"))).toBe(true);
    expect(observed.filter((node) => node.hasAttribute("data-stage-content"))).toHaveLength(3);
  });

  it("no hace scroll por su cuenta ni intercepta eventos: el listener es pasivo", () => {
    const add = vi.spyOn(window, "addEventListener");
    renderDeck();

    const scrollCall = add.mock.calls.find(([type]) => type === "scroll");
    expect(scrollCall?.[2]).toMatchObject({ passive: true });
  });
});
