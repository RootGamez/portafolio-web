import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { act, fireEvent, render, screen } from "@testing-library/react";
import App from "./App";
import { sectionsMeta } from "@/sections/meta";
import { installMatchMedia, restoreCss, stubCssSupports } from "@/test/doubles";
import { stubStageGeometry } from "@/test/stageGeometry";

/**
 * Integracion de los dos modos. En jsdom no hay layout ni sticky, asi que los
 * escenarios se simulan con la geometria de src/test/stageGeometry.tsx (las
 * secciones reales no tienen `data-height`: miden 0, y cada escenario dura
 * solo su intro de 480px; con un visor de 800px, el escenario i empieza en
 * i * (480 + 800) = i * 1280).
 */
const REDUCED = "(prefers-reduced-motion: reduce)";
const STAGE_START = 1280;

const track = () => document.querySelector("[data-stage-track]");
// Nombre EXACTO: el enlace de salto se llama "Desactivar animaciones de scroll" y una
// regex tambien lo encontraria.
const motionButton = () => screen.getByRole("button", { name: "Animaciones de scroll" });

function setScrollY(value: number) {
  Object.defineProperty(window, "scrollY", { configurable: true, value });
  act(() => {
    window.dispatchEvent(new Event("scroll"));
  });
}

describe("App", () => {
  beforeEach(() => {
    window.localStorage.clear();
    window.history.replaceState(null, "", "/");
    installMatchMedia();
    stubStageGeometry();
    // Como un navegador real: un salto instantaneo mueve el scroll.
    vi.spyOn(window, "scrollTo").mockImplementation(((options: ScrollToOptions) => {
      Object.defineProperty(window, "scrollY", { configurable: true, value: options.top ?? 0 });
    }) as never);
    Element.prototype.scrollIntoView = vi.fn();
  });

  afterEach(() => {
    restoreCss();
    Object.defineProperty(window, "scrollY", { configurable: true, value: 0 });
    // jsdom no trae `scrollIntoView`; `restoreAllMocks` no revierte la asignacion directa.
    delete (Element.prototype as { scrollIntoView?: unknown }).scrollIntoView;
  });

  describe("modo lineal (el sitio clasico)", () => {
    it("sin position: sticky pinta las diez secciones en orden y sin pista de escenarios", () => {
      stubCssSupports(false);

      render(<App />);

      expect(track()).toBeNull();
      const ids = [...document.querySelectorAll("main > section")].map((section) => section.id);
      expect(ids).toEqual(sectionsMeta.map((section) => section.slug));
    });

    it("con prefers-reduced-motion es lineal aunque el navegador soporte sticky", () => {
      stubCssSupports(true);
      installMatchMedia({ [REDUCED]: true });

      render(<App />);

      expect(track()).toBeNull();
      expect(document.querySelectorAll("main > section")).toHaveLength(sectionsMeta.length);
    });

    it("con prefers-reduced-motion no ofrece el interruptor: no cambiaria nada", () => {
      stubCssSupports(true);
      installMatchMedia({ [REDUCED]: true });

      render(<App />);

      expect(screen.queryByRole("button", { name: "Animaciones de scroll" })).toBeNull();
      expect(screen.queryByRole("button", { name: "Desactivar animaciones de scroll" })).toBeNull();
    });
  });

  describe("modo escenarios", () => {
    beforeEach(() => {
      stubCssSupports(true);
    });

    it("monta una pista con un escenario por seccion", () => {
      render(<App />);

      expect(track()).toHaveAttribute("data-stage-count", String(sectionsMeta.length));
      expect(document.querySelectorAll("[data-stage]")).toHaveLength(sectionsMeta.length);
    });

    it("el primer enlace enfocable es 'Saltar al contenido' y el segundo 'Desactivar animaciones de scroll'", () => {
      render(<App />);

      const skip = screen.getByRole("link", { name: "Saltar al contenido" });
      const off = screen.getByRole("button", { name: "Desactivar animaciones de scroll" });

      // Orden en el documento = orden de tabulacion (no hay tabindex positivos).
      expect(skip.compareDocumentPosition(off) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
    });

    it("el riel marca como actual el escenario activo", () => {
      render(<App />);
      const current = () =>
        screen
          .getAllByRole("link", { current: "location" })
          .map((link) => link.getAttribute("href"));

      // Solo el riel de escritorio: el menu movil esta colapsado (hidden) y
      // queda fuera del arbol de accesibilidad.
      expect(current()).toEqual(["#inicio"]);

      setScrollY(2 * STAGE_START); // escenario 2: trayectoria

      expect(current()).toEqual(["#trayectoria"]);
    });

    it("anuncia el escenario nuevo para el lector de pantalla", () => {
      vi.useFakeTimers();
      try {
        render(<App />);

        setScrollY(3 * STAGE_START); // escenario 3: proyectos
        act(() => {
          vi.advanceTimersByTime(400);
        });

        expect(screen.getByRole("status")).toHaveTextContent(
          `Sección 4 de ${sectionsMeta.length}: Mis proyectos`,
        );
      } finally {
        vi.useRealTimers();
      }
    });
  });

  describe("cambio de modo con la pagina abierta", () => {
    beforeEach(() => {
      stubCssSupports(true);
    });

    it("'Modo simple' pasa a lineal y recuerda la eleccion", () => {
      render(<App />);
      expect(track()).not.toBeNull();

      fireEvent.click(motionButton());

      expect(track()).toBeNull();
      expect(document.querySelectorAll("main > section")).toHaveLength(sectionsMeta.length);
      expect(window.localStorage.getItem("portafolio:motion")).toBe("off");
    });

    it("al volver a escenarios el interruptor sigue ahi y reactiva el modo", () => {
      render(<App />);
      fireEvent.click(motionButton());

      fireEvent.click(motionButton());

      expect(track()).not.toBeNull();
    });

    it("al pasar a lineal mantiene al usuario en la seccion que estaba viendo", () => {
      render(<App />);
      setScrollY(2 * STAGE_START); // trayectoria

      fireEvent.click(motionButton());

      const trayectoria = document.getElementById("trayectoria") as HTMLElement;
      expect(trayectoria.scrollIntoView).toHaveBeenCalledWith({ block: "start" });
    });

    it("al volver a escenarios coloca la pista en la seccion que estaba viendo", () => {
      // Regresion de un fallo visto en vivo: al montarse, StageDeck escribia su
      // escenario inicial (0) en el contexto ANTES de colocarse, y el destino
      // restaurado se pisaba por 0. Por eso el caso de prueba NO es el escenario 0.
      render(<App />);
      setScrollY(2 * STAGE_START); // trayectoria
      fireEvent.click(motionButton()); // a lineal
      vi.mocked(window.scrollTo).mockClear();

      fireEvent.click(motionButton()); // de vuelta a escenarios

      expect(window.scrollTo).toHaveBeenCalledTimes(1);
      expect(window.scrollTo).toHaveBeenCalledWith({ top: 2 * STAGE_START, behavior: "auto" });
    });

    it("tras volver a escenarios el riel sigue marcando la seccion restaurada, sin pasar por la primera", () => {
      render(<App />);
      setScrollY(3 * STAGE_START); // proyectos
      fireEvent.click(motionButton());

      fireEvent.click(motionButton());

      const current = screen
        .getAllByRole("link", { current: "location" })
        .map((link) => link.getAttribute("href"));
      expect(current).toEqual(["#proyectos"]);
    });

    it("una carga normal NO restaura nada (manda el hash o la restauracion del navegador)", () => {
      render(<App />);

      expect(Element.prototype.scrollIntoView).not.toHaveBeenCalled();
    });
  });
});
