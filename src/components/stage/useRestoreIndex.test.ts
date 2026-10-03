import { describe, expect, it } from "vitest";
import { renderHook } from "@testing-library/react";
import type { DeckMode } from "@/lib/stage/mode";
import { useRestoreIndex } from "./useRestoreIndex";

type Props = { mode: DeckMode; activeIndex: number };

function setup(initial: Props) {
  return renderHook((props: Props) => useRestoreIndex(props.mode, props.activeIndex), {
    initialProps: initial,
  });
}

describe("useRestoreIndex", () => {
  it("en la carga inicial no hay nada que restaurar (manda el hash o el scroll del navegador)", () => {
    const { result } = setup({ mode: "deck", activeIndex: 4 });

    expect(result.current).toBeNull();
  });

  it("al cambiar de modo devuelve el escenario que se estaba viendo en ese momento", () => {
    const { result, rerender } = setup({ mode: "deck", activeIndex: 3 });

    rerender({ mode: "linear", activeIndex: 3 });

    expect(result.current).toBe(3);
  });

  it("lo FIJA: si el activo cambia despues, el destino a restaurar no se mueve", () => {
    // Es el fallo visto en vivo: el arbol nuevo escribe su propio escenario inicial
    // (0) en el contexto nada mas montarse, y el destino se pisaba por 0.
    const { result, rerender } = setup({ mode: "deck", activeIndex: 3 });
    rerender({ mode: "linear", activeIndex: 3 });

    rerender({ mode: "linear", activeIndex: 0 });

    expect(result.current).toBe(3);
  });

  it("en cada nuevo cambio de modo vuelve a capturar el escenario de ese momento", () => {
    const { result, rerender } = setup({ mode: "deck", activeIndex: 3 });
    rerender({ mode: "linear", activeIndex: 3 });
    rerender({ mode: "linear", activeIndex: 5 });

    rerender({ mode: "deck", activeIndex: 5 });

    expect(result.current).toBe(5);
  });

  it("sin cambio de modo no cambia nada aunque el activo se mueva", () => {
    const { result, rerender } = setup({ mode: "deck", activeIndex: 0 });

    rerender({ mode: "deck", activeIndex: 2 });
    rerender({ mode: "deck", activeIndex: 7 });

    expect(result.current).toBeNull();
  });
});
