import { describe, expect, it, beforeEach, vi } from "vitest";
import { act, render, fireEvent, screen } from "@testing-library/react";
import { motionValue } from "motion/react";
import { ProjectCard } from "./ProjectCard";
import { StageContext, type StageContextValue } from "@/components/stage/StageContext";
import { ReachContext } from "@/components/motion/useScrubSource";
import { CARD_VIDEO_READY_REACH } from "@/lib/stage/config";
import type { Project } from "@/data/projects";
import { triggerIntersection } from "@/test/setup";

/**
 * El requisito que motivo el refactor: la demo tiene que arrancar con hover
 * Y CON FOCO DE TECLADO. Antes solo existia onMouseEnter, asi que quien
 * navegaba con teclado no veia ni un video.
 *
 * Se dispara focusIn/focusOut, no focus/blur: desde React 17 los handlers
 * onFocus/onBlur se enganchan a los eventos que BURBUJEAN (focusin/focusout),
 * asi que un `focus` suelto no llegaria al componente.
 */
const PROJECT: Project = {
  id: "demo",
  title: "Proyecto de prueba",
  tagline: "Una demo cualquiera.",
  role: "Desarrollador",
  bullets: ["Primer punto", "Segundo punto"],
  stack: ["React", "Vite"],
  status: "produccion",
  liveUrl: "https://example.com",
  repoUrl: "https://github.com/example/repo",
  media: "demo",
  alt: "Demo del proyecto de prueba",
  pow: "¡ZAP!",
};

function setReducedMotion(reduced: boolean) {
  window.matchMedia = vi.fn().mockImplementation((query: string) => ({
    matches: query.includes("prefers-reduced-motion") && reduced,
    media: query,
    onchange: null,
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    addListener: vi.fn(),
    removeListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })) as unknown as typeof window.matchMedia;
}

function renderCard() {
  const utils = render(<ProjectCard project={PROJECT} />);
  const video = utils.container.querySelector("video");
  if (!video) throw new Error("La tarjeta no pinto ningun <video>");
  const card = video.closest("article");
  if (!card) throw new Error("El <video> no esta dentro de un <article>");
  return { ...utils, video, card };
}

describe("ProjectCard — reproduccion de la demo", () => {
  beforeEach(() => {
    setReducedMotion(false);
    vi.clearAllMocks();
  });

  it("reproduce al pasar el raton por encima", () => {
    const { video, card } = renderCard();

    fireEvent.mouseEnter(card);

    expect(video.play).toHaveBeenCalled();
  });

  it("pausa y rebobina al salir el raton", () => {
    const { video, card } = renderCard();

    fireEvent.mouseEnter(card);
    fireEvent.mouseLeave(card);

    expect(video.pause).toHaveBeenCalled();
    expect(video.currentTime).toBe(0);
  });

  it("reproduce al recibir foco de teclado un enlace de la tarjeta", () => {
    // El caso que antes no existia. La tarjeta no es tab-stop: el foco
    // burbujea desde sus propios enlaces.
    const { video } = renderCard();
    const link = screen.getByRole("link", { name: /ver en vivo/i });

    fireEvent.focusIn(link);

    expect(video.play).toHaveBeenCalled();
  });

  it("pausa cuando el foco abandona la tarjeta", () => {
    const { video, card } = renderCard();
    const link = screen.getByRole("link", { name: /ver en vivo/i });

    fireEvent.focusIn(link);
    fireEvent.focusOut(link, { relatedTarget: document.body });
    void card;

    expect(video.pause).toHaveBeenCalled();
  });

  it("NO pausa al tabular entre dos enlaces de la misma tarjeta", () => {
    // Sin este guard habia un parpadeo pausa -> rebobinado -> play cada vez
    // que el foco saltaba de "Ver en vivo" a "Codigo".
    const { video } = renderCard();
    const live = screen.getByRole("link", { name: /ver en vivo/i });
    const repo = screen.getByRole("link", { name: /código/i });

    fireEvent.focusIn(live);
    fireEvent.focusOut(live, { relatedTarget: repo });

    expect(video.pause).not.toHaveBeenCalled();
  });

  it("no reproduce nada con prefers-reduced-motion", () => {
    // Un video en bucle es movimiento: si el usuario ha pedido que no lo
    // haya, se queda el poster.
    setReducedMotion(true);
    const { video, card } = renderCard();

    fireEvent.mouseEnter(card);
    const link = screen.getByRole("link", { name: /ver en vivo/i });
    fireEvent.focusIn(link);

    expect(video.play).not.toHaveBeenCalled();
  });

  it("reserva el hueco de la media para no provocar saltos de layout", () => {
    const { video } = renderCard();

    expect(video).toHaveAttribute("width", "1280");
    expect(video).toHaveAttribute("height", "620");
  });
});

/**
 * Modo escenarios (docs/PLAN_ESCENARIOS.md §6). Con las capas apiladas el
 * IntersectionObserver da por "visibles" tambien las tarjetas de escenarios
 * ocultos, y los 7 videos se pedirian todos al cargar. La tarjeta tiene que
 * enterarse de si su escenario esta cerca y de si es el activo.
 */
function deckStage(patch: Partial<StageContextValue>): StageContextValue {
  return {
    mode: "deck",
    index: 3,
    isActive: true,
    isNear: true,
    progress: motionValue(0),
    intro: motionValue(0),
    reading: motionValue(0),
    ...patch,
  };
}

function renderInStage(stage: StageContextValue) {
  const ui = (value: StageContextValue) => (
    <StageContext value={value}>
      <ProjectCard project={PROJECT} />
    </StageContext>
  );
  const utils = render(ui(stage));
  const video = utils.container.querySelector("video") as HTMLVideoElement;
  const card = video.closest("article") as HTMLElement;
  return {
    ...utils,
    video,
    card,
    update: (next: StageContextValue) => utils.rerender(ui(next)),
  };
}

function setTouch() {
  window.matchMedia = vi.fn().mockImplementation((query: string) => ({
    matches: query.includes("hover: none"),
    media: query,
    onchange: null,
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    addListener: vi.fn(),
    removeListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })) as unknown as typeof window.matchMedia;
}

describe("ProjectCard — dentro de un escenario", () => {
  beforeEach(() => {
    setReducedMotion(false);
    vi.clearAllMocks();
  });

  it("en un escenario lejano no pide ni el video ni el poster", () => {
    const { video } = renderInStage(deckStage({ isActive: false, isNear: false }));

    expect(video.querySelector("source")).toBeNull();
    expect(video).not.toHaveAttribute("poster");
  });

  it("al acercarse el escenario carga el video y el poster", () => {
    const { video, update } = renderInStage(deckStage({ isActive: false, isNear: false }));

    update(deckStage({ isActive: false, isNear: true }));

    expect(video.querySelector("source")).toHaveAttribute("src", "/media/video/demo.mp4");
    expect(video).toHaveAttribute("poster", "/media/poster/demo.webp");
  });

  it("una vez cargado no lo descarta al alejarse (evita volver a pedirlo)", () => {
    const { video, update } = renderInStage(deckStage({ isActive: false, isNear: true }));

    update(deckStage({ isActive: false, isNear: false }));

    expect(video.querySelector("source")).not.toBeNull();
  });

  it("al dejar de ser el escenario activo pausa el video aunque el raton siga encima", () => {
    const { video, card, update } = renderInStage(deckStage({ isActive: true }));
    fireEvent.mouseEnter(card);
    expect(video.play).toHaveBeenCalled();

    update(deckStage({ isActive: false }));

    expect(video.pause).toHaveBeenCalled();
  });

  it("tras reactivarse, un hover que ya no existe no vuelve a reproducir por su cuenta", () => {
    const { video, card, update } = renderInStage(deckStage({ isActive: true }));
    fireEvent.mouseEnter(card);
    update(deckStage({ isActive: false }));
    vi.clearAllMocks();

    update(deckStage({ isActive: true }));

    expect(video.play).not.toHaveBeenCalled();
  });

  it("en tactil reproduce al entrar en pantalla SOLO si su escenario es el activo", () => {
    setTouch();
    const active = renderInStage(deckStage({ isActive: true }));
    triggerIntersection(active.video, true);
    expect(active.video.play).toHaveBeenCalled();
    active.unmount();
    vi.clearAllMocks();

    const inactive = renderInStage(deckStage({ isActive: false }));
    // Si el escenario esta inactivo el hook ni siquiera observa el video: no hay
    // nada que disparar. Se intenta igualmente, como haria el navegador.
    try {
      triggerIntersection(inactive.video, true);
    } catch {
      // Nadie observa el elemento: es justo lo esperado.
    }

    expect(inactive.video.play).not.toHaveBeenCalled();
  });

  describe("dentro de un bloque con alcance (ScrubReach, Fase 4.4)", () => {
    function renderReaching(initialReach: number) {
      const reach = motionValue(initialReach);
      const utils = render(
        <StageContext value={deckStage({ isActive: true })}>
          <ReachContext value={reach}>
            <ProjectCard project={PROJECT} />
          </ReachContext>
        </StageContext>,
      );
      const video = utils.container.querySelector("video") as HTMLVideoElement;
      return { ...utils, video, reach };
    }

    it("en tactil NO reproduce mientras la tarjeta no ha entrado, aunque el video este en pantalla", () => {
      // Visto en vivo: con las capas apiladas el video "esta en pantalla" mientras
      // la tinta aun destapa el escenario y la tarjeta sigue con opacidad 0.
      setTouch();
      const { video } = renderReaching(0);

      try {
        triggerIntersection(video, true);
      } catch {
        // Nadie observa el video todavia: es justo lo esperado.
      }

      expect(video.play).not.toHaveBeenCalled();
    });

    it("en tactil reproduce en cuanto la tarjeta ha entrado y esta en pantalla", () => {
      setTouch();
      const { video, reach } = renderReaching(0);

      act(() => reach.set(CARD_VIDEO_READY_REACH));
      triggerIntersection(video, true);

      expect(video.play).toHaveBeenCalled();
    });

    it("si se vuelve atras y la tarjeta deja de estar entrada, pausa", () => {
      setTouch();
      const { video, reach } = renderReaching(1);
      triggerIntersection(video, true);
      vi.mocked(video.pause).mockClear();

      act(() => reach.set(0));

      expect(video.pause).toHaveBeenCalled();
    });

    it("con raton, un hover sobre la tarjeta aun invisible no la pone en marcha", () => {
      const { video } = renderReaching(0);

      fireEvent.mouseEnter(video.closest("article") as HTMLElement);

      expect(video.play).not.toHaveBeenCalled();
    });
  });
});

