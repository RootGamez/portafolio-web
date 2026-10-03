import type { ReactNode } from "react";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { act, renderHook } from "@testing-library/react";
import { DeckProvider, useDeck } from "./DeckContext";
import { MOTION_OFF_VALUE, MOTION_STORAGE_KEY } from "@/lib/stage/config";
import { restoreCss, stubCssSupports } from "@/test/doubles";

const wrapper = ({ children }: { children: ReactNode }) => <DeckProvider>{children}</DeckProvider>;

describe("useDeck fuera de un proveedor", () => {
  it("devuelve un estado lineal inerte, para que el riel y demas se puedan montar solos", () => {
    const { result } = renderHook(() => useDeck());

    expect(result.current.mode).toBe("linear");
    expect(result.current.eligible).toBe(false);
    expect(result.current.activeIndex).toBe(0);
    expect(() => result.current.setActiveIndex(4)).not.toThrow();
    expect(() => result.current.setOptedOut(true)).not.toThrow();
  });
});

describe("DeckProvider", () => {
  beforeEach(() => {
    window.localStorage.clear();
    stubCssSupports(true);
  });

  afterEach(() => {
    restoreCss();
  });

  it("expone el modo resuelto por useDeckMode y arranca en el escenario 0", () => {
    const { result } = renderHook(() => useDeck(), { wrapper });

    expect(result.current.mode).toBe("deck");
    expect(result.current.eligible).toBe(true);
    expect(result.current.activeIndex).toBe(0);
  });

  it("setActiveIndex cambia el escenario activo para todos los consumidores", () => {
    const { result } = renderHook(() => useDeck(), { wrapper });

    act(() => result.current.setActiveIndex(5));

    expect(result.current.activeIndex).toBe(5);
  });

  it("setOptedOut pasa a lineal, lo recuerda, y conserva el escenario activo", () => {
    const { result } = renderHook(() => useDeck(), { wrapper });
    act(() => result.current.setActiveIndex(3));

    act(() => result.current.setOptedOut(true));

    expect(result.current.mode).toBe("linear");
    expect(result.current.optedOut).toBe(true);
    expect(window.localStorage.getItem(MOTION_STORAGE_KEY)).toBe(MOTION_OFF_VALUE);
    // Hace falta para reposicionar el scroll al cambiar de modo.
    expect(result.current.activeIndex).toBe(3);
  });

  it("sin sticky el proveedor se queda en lineal y no ofrece el interruptor", () => {
    stubCssSupports(false);
    const { result } = renderHook(() => useDeck(), { wrapper });

    expect(result.current.mode).toBe("linear");
    expect(result.current.eligible).toBe(false);
  });
});
