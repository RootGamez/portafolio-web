import { describe, expect, it, beforeEach, vi } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useInViewVideo } from "./useInViewVideo";
import { observerCallbacks } from "@/test/setup";

/** Simula el entorno: tactil sin hover, o escritorio con hover. */
function setMedia({ touch = false, reduced = false } = {}) {
  window.matchMedia = vi.fn().mockImplementation((query: string) => ({
    matches:
      (query.includes("hover: none") && touch) ||
      (query.includes("prefers-reduced-motion") && reduced),
    media: query,
    onchange: null,
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    addListener: vi.fn(),
    removeListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })) as unknown as typeof window.matchMedia;
}

function videoRef() {
  const video = document.createElement("video");
  document.body.appendChild(video);
  return { current: video };
}

function intersect(isIntersecting: boolean) {
  const callback = observerCallbacks.at(-1);
  if (!callback) throw new Error("No se registro ningun IntersectionObserver");
  act(() => {
    callback(
      [{ isIntersecting } as IntersectionObserverEntry],
      {} as IntersectionObserver,
    );
  });
}

describe("useInViewVideo", () => {
  beforeEach(() => {
    observerCallbacks.length = 0;
    document.body.innerHTML = "";
    vi.clearAllMocks();
  });

  it("en tactil reproduce el video al entrar en pantalla", () => {
    // Sin esto las demos de proyecto no se verian nunca en movil:
    // ahi no hay ni hover ni focus.
    setMedia({ touch: true });
    const ref = videoRef();
    renderHook(() => useInViewVideo(ref));

    intersect(true);

    expect(ref.current.play).toHaveBeenCalled();
  });

  it("en tactil pausa el video al salir de pantalla", () => {
    setMedia({ touch: true });
    const ref = videoRef();
    renderHook(() => useInViewVideo(ref));

    intersect(false);

    expect(ref.current.pause).toHaveBeenCalled();
  });

  it("en escritorio NO observa nada: ahi mandan hover y focus", () => {
    // Reproducir tambien por scroll en escritorio haria que el video
    // arrancase solo, sin que el usuario lo pidiera.
    setMedia({ touch: false });
    renderHook(() => useInViewVideo(videoRef()));

    expect(observerCallbacks).toHaveLength(0);
  });

  it("con prefers-reduced-motion no reproduce nada", () => {
    setMedia({ touch: true, reduced: true });
    renderHook(() => useInViewVideo(videoRef()));

    expect(observerCallbacks).toHaveLength(0);
  });

  it("respeta enabled=false", () => {
    setMedia({ touch: true });
    renderHook(() => useInViewVideo(videoRef(), false));

    expect(observerCallbacks).toHaveLength(0);
  });

  it("no explota si el ref todavia esta vacio", () => {
    setMedia({ touch: true });
    expect(() =>
      renderHook(() => useInViewVideo({ current: null })),
    ).not.toThrow();
  });
});
