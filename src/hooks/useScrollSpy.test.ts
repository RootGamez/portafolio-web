import { describe, expect, it, beforeEach } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useScrollSpy } from "./useScrollSpy";
import { observerCallbacks } from "@/test/setup";

/** Crea las secciones en el DOM: el hook busca por getElementById. */
function mountSections(ids: readonly string[]) {
  document.body.innerHTML = ids
    .map((id) => `<section id="${id}"></section>`)
    .join("");
}

/** Dispara una interseccion en el observer que monto el hook. */
function intersect(entries: readonly { id: string; ratio: number }[]) {
  const callback = observerCallbacks.at(-1);
  if (!callback) throw new Error("El hook no registro ningun IntersectionObserver");

  const records = entries.map(({ id, ratio }) => ({
    target: document.getElementById(id) as Element,
    isIntersecting: ratio > 0,
    intersectionRatio: ratio,
  })) as unknown as IntersectionObserverEntry[];

  act(() => {
    callback(records, {} as IntersectionObserver);
  });
}

describe("useScrollSpy", () => {
  beforeEach(() => {
    observerCallbacks.length = 0;
    document.body.innerHTML = "";
  });

  it("arranca en la primera seccion antes de cualquier scroll", () => {
    mountSections(["inicio", "sobre-mi"]);
    const { result } = renderHook(() => useScrollSpy(["inicio", "sobre-mi"]));

    expect(result.current).toBe("inicio");
  });

  it("marca como activa la seccion que entra en la banda central", () => {
    mountSections(["inicio", "sobre-mi", "contacto"]);
    const { result } = renderHook(() =>
      useScrollSpy(["inicio", "sobre-mi", "contacto"]),
    );

    intersect([{ id: "sobre-mi", ratio: 0.9 }]);

    expect(result.current).toBe("sobre-mi");
  });

  it("elige la seccion MAS visible cuando entran varias en el mismo callback", () => {
    // Es el caso de un scroll rapido: si ganase la ultima del array en vez de
    // la mas visible, el riel marcaria una seccion que apenas asoma.
    mountSections(["inicio", "sobre-mi", "contacto"]);
    const { result } = renderHook(() =>
      useScrollSpy(["inicio", "sobre-mi", "contacto"]),
    );

    intersect([
      { id: "inicio", ratio: 0.2 },
      { id: "contacto", ratio: 0.85 },
      { id: "sobre-mi", ratio: 0.4 },
    ]);

    expect(result.current).toBe("contacto");
  });

  it("mantiene la ultima activa cuando ninguna seccion interseca", () => {
    // Entre dos secciones no debe quedarse sin estado: el riel parpadearia.
    mountSections(["inicio", "sobre-mi"]);
    const { result } = renderHook(() => useScrollSpy(["inicio", "sobre-mi"]));

    intersect([{ id: "sobre-mi", ratio: 0.8 }]);
    expect(result.current).toBe("sobre-mi");

    intersect([{ id: "sobre-mi", ratio: 0 }]);
    expect(result.current).toBe("sobre-mi");
  });

  it("no explota si las secciones todavia no estan en el DOM", () => {
    expect(() =>
      renderHook(() => useScrollSpy(["no-existe", "tampoco"])),
    ).not.toThrow();
  });
});
