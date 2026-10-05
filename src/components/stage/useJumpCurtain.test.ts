import { afterEach, describe, expect, it, vi } from "vitest";
import { renderHook, waitFor } from "@testing-library/react";
import { JUMP_SWAP_AT } from "@/lib/stage/config";
import { useJumpCurtain } from "./useJumpCurtain";

// La cortina real dura 420 ms; en los tests, lo justo para que corra por frames. Es un
// getter para que un test que mira el INTERIOR de la animacion la alargue: con 60 ms un
// timer retrasado en una maquina cargada se salta la ventana que el test necesita.
const duration = vi.hoisted(() => ({ ms: 60 }));
vi.mock("@/lib/stage/config", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@/lib/stage/config")>()),
  get JUMP_CURTAIN_MS() {
    return duration.ms;
  },
  // Este mock sustituye al de setup.ts: repite su geometria de referencia.
  TRANSITION_SCREENS: 1,
}));

const wait = (ms: number) => new Promise<void>((resolve) => setTimeout(resolve, ms));

describe("useJumpCurtain", () => {
  afterEach(() => {
    duration.ms = 60;
  });

  it("arranca en reposo: progreso 0, nada que pintar", () => {
    const { result } = renderHook(() => useJumpCurtain());

    expect(result.current.curtain.get()).toBe(0);
  });

  it("NO salta al instante: `onCovered` espera a que la cortina cubra", () => {
    const { result } = renderHook(() => useJumpCurtain());
    const onCovered = vi.fn();

    result.current.run(onCovered);

    expect(onCovered).not.toHaveBeenCalled();
  });

  it("llama a `onCovered` UNA vez, con la cortina ya cubriendo (progreso >= JUMP_SWAP_AT)", async () => {
    const { result } = renderHook(() => useJumpCurtain());
    let progressWhenCalled = -1;
    const onCovered = vi.fn(() => {
      progressWhenCalled = result.current.curtain.get();
    });

    result.current.run(onCovered);

    await waitFor(() => expect(onCovered).toHaveBeenCalledTimes(1));
    expect(progressWhenCalled).toBeGreaterThanOrEqual(JUMP_SWAP_AT);
    await wait(120);
    expect(onCovered).toHaveBeenCalledTimes(1);
  });

  it("al terminar vuelve a 0: la banda desaparece y queda lista para la siguiente", async () => {
    const { result } = renderHook(() => useJumpCurtain());
    // Se anota el maximo con una suscripcion: sondear con waitFor es una carrera, la
    // animacion de prueba (60 ms) puede acabar entre dos sondeos.
    let highest = 0;
    result.current.curtain.on("change", (value) => {
      highest = Math.max(highest, value);
    });

    result.current.run(() => {});

    await waitFor(() => expect(highest).toBeGreaterThan(0.9));
    await waitFor(() => expect(result.current.curtain.get()).toBe(0), { timeout: 1000 });
  });

  it("un salto nuevo ANTES de que cubra solo cambia el destino: la cortina no se reinicia", async () => {
    // Larga a proposito (cubre a ~1 s): con la suite entera en paralelo los
    // fotogramas llegan tarde, y con 400 ms una espera FIJA de 100 ms caia a
    // veces antes de que la cortina arrancase o despues de cubrir (intermitente).
    // Aqui se espera a que haya ARRANCADO de verdad, y el margen hasta cubrir es
    // de casi un segundo.
    duration.ms = 2000;
    const { result } = renderHook(() => useJumpCurtain());
    const first = vi.fn();
    const second = vi.fn();
    const values: number[] = [];
    result.current.curtain.on("change", (value) => values.push(value));

    result.current.run(first);
    await waitFor(() => expect(Math.max(0, ...values)).toBeGreaterThan(0.1), { interval: 5 });
    const beforeSecond = values.length;
    expect(first).not.toHaveBeenCalled(); // aun no ha cubierto
    result.current.run(second);
    await waitFor(() => expect(second).toHaveBeenCalledTimes(1));

    // Desde el segundo `run` hasta cubrir NINGUN valor vuelve a 0: no se reinicio.
    const afterSecond = values.slice(beforeSecond);
    expect(Math.min(...afterSecond)).toBeGreaterThan(0.1);
    expect(first).not.toHaveBeenCalled();
  });

  it("un salto nuevo DESPUES de cubrir abre una cortina nueva y hace los dos saltos", async () => {
    const { result } = renderHook(() => useJumpCurtain());
    const first = vi.fn();
    const second = vi.fn();

    result.current.run(first);
    await waitFor(() => expect(first).toHaveBeenCalledTimes(1));
    result.current.run(second);

    await waitFor(() => expect(second).toHaveBeenCalledTimes(1));
    expect(first).toHaveBeenCalledTimes(1);
  });

  it("un salto nuevo DESPUES de cubrir rebobina a 'cubierto': la banda no se apaga entre medias", async () => {
    duration.ms = 400;
    const { result } = renderHook(() => useJumpCurtain());
    const first = vi.fn();
    const second = vi.fn();
    const values: number[] = [];
    result.current.curtain.on("change", (value) => values.push(value));

    result.current.run(first);
    await waitFor(() => expect(first).toHaveBeenCalledTimes(1));
    await wait(60); // ya destapandose
    const beforeSecond = values.length;
    result.current.run(second);
    await waitFor(() => expect(second).toHaveBeenCalledTimes(1));

    // La banda vuelve a cubrir desde JUMP_SWAP_AT, nunca baja a 0 (un fotograma limpio
    // del escenario nuevo con tinta que reaparece desde abajo es un parpadeo).
    const afterSecond = values.slice(beforeSecond);
    expect(Math.min(...afterSecond)).toBeGreaterThanOrEqual(JUMP_SWAP_AT);
  });

  it("al desmontar cancela el salto pendiente: no hay scroll fantasma", async () => {
    const { result, unmount } = renderHook(() => useJumpCurtain());
    const onCovered = vi.fn();

    result.current.run(onCovered);
    unmount();
    await wait(150);

    expect(onCovered).not.toHaveBeenCalled();
  });

  describe("cancel: lo ultimo que pide el usuario manda", () => {
    it("antes de cubrir, cancela el salto pendiente y apaga la cortina", async () => {
      const { result } = renderHook(() => useJumpCurtain());
      const onCovered = vi.fn();

      result.current.run(onCovered);
      result.current.cancel();
      await wait(150);

      expect(onCovered).not.toHaveBeenCalled();
      expect(result.current.curtain.get()).toBe(0);
    });

    it("despues de cubrir NO corta la cortina a medias: deja que acabe de destaparse", async () => {
      const { result } = renderHook(() => useJumpCurtain());
      const onCovered = vi.fn();
      let highest = 0;
      result.current.curtain.on("change", (value) => {
        highest = Math.max(highest, value);
      });

      result.current.run(onCovered);
      await waitFor(() => expect(onCovered).toHaveBeenCalledTimes(1));
      result.current.cancel();

      // Sigue hasta el final (llega casi a 1) y solo entonces vuelve a 0.
      await waitFor(() => expect(highest).toBeGreaterThan(0.9));
      await waitFor(() => expect(result.current.curtain.get()).toBe(0), { timeout: 1000 });
    });

    it("sin cortina en marcha no hace nada", () => {
      const { result } = renderHook(() => useJumpCurtain());

      expect(() => result.current.cancel()).not.toThrow();
      expect(result.current.curtain.get()).toBe(0);
    });
  });
});
