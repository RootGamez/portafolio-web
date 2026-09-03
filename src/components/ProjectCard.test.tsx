import { describe, expect, it, beforeEach, vi } from "vitest";
import { render, fireEvent, screen } from "@testing-library/react";
import { ProjectCard } from "./ProjectCard";
import type { Project } from "@/data/projects";

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
