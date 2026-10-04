import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { INK_FRAME_GAP_MS } from "@/lib/stage/config";
import { triggerResize } from "@/test/setup";
import type { InkFieldFrame } from "./frame";
import { createInkEngine, type InkPalette } from "./engine";
import type { InkQuality, InkRenderer, InkRendererHooks } from "./webgl";

const QUALITY: InkQuality = { dprCap: 1.5, octaves: 5 };

const PALETTE: InkPalette = {
  washi: { ink: [0.9, 0.9, 0.8], rim: [0.7, 0.7, 0.6] },
  sumi: { ink: [0.1, 0.1, 0.1], rim: [0.2, 0.2, 0.2] },
  shu: { ink: [0.7, 0.2, 0.2], rim: [0.5, 0.1, 0.1] },
  kin: { ink: [0.9, 0.7, 0.2], rim: [0.7, 0.5, 0.1] },
};

const FRAME: InkFieldFrame = {
  index: 4,
  effect: 4,
  ink: "shu",
  mirror: false,
  cover: 0.5,
  erase: 0,
  tonePitch: 8,
};

type FakeRenderer = InkRenderer & {
  readonly hooks: InkRendererHooks;
  readonly draw: ReturnType<typeof vi.fn>;
  readonly clear: ReturnType<typeof vi.fn>;
  readonly resize: ReturnType<typeof vi.fn>;
  readonly setQuality: ReturnType<typeof vi.fn>;
  readonly destroy: ReturnType<typeof vi.fn>;
  lostFlag: boolean;
};

function fakeRenderer(hooks: InkRendererHooks): FakeRenderer {
  const renderer = {
    hooks,
    lostFlag: false,
    draw: vi.fn(() => !renderer.lostFlag),
    clear: vi.fn(),
    resize: vi.fn(),
    setQuality: vi.fn(),
    destroy: vi.fn(),
    get lost() {
      return renderer.lostFlag;
    },
  };
  return renderer;
}

/** rAF controlado a mano: `flush(ms)` ejecuta los callbacks pendientes con esa marca de tiempo. */
function controlledFrames() {
  let pending = new Map<number, FrameRequestCallback>();
  let nextId = 1;
  vi.spyOn(window, "requestAnimationFrame").mockImplementation((callback) => {
    const id = nextId++;
    pending.set(id, callback);
    return id;
  });
  vi.spyOn(window, "cancelAnimationFrame").mockImplementation((id) => {
    pending.delete(id);
  });
  return {
    count: () => pending.size,
    flush(timestamp: number) {
      const callbacks = [...pending.values()];
      pending = new Map();
      callbacks.forEach((callback) => callback(timestamp));
    },
  };
}

let hidden = false;
/** Motores creados en el test: se destruyen al acabar para no dejar ResizeObservers vivos. */
const engines: { destroy(): void }[] = [];

function setHidden(value: boolean) {
  hidden = value;
  document.dispatchEvent(new Event("visibilitychange"));
}

beforeEach(() => {
  hidden = false;
  Object.defineProperty(document, "hidden", { configurable: true, get: () => hidden });
});

afterEach(() => {
  engines.splice(0).forEach((engine) => engine.destroy());
  Reflect.deleteProperty(document, "hidden");
});

function setup(initialFrame: InkFieldFrame | null = FRAME) {
  const frames = controlledFrames();
  const canvas = document.createElement("canvas");
  Object.defineProperty(canvas, "clientWidth", { configurable: true, value: 1000 });
  Object.defineProperty(canvas, "clientHeight", { configurable: true, value: 600 });

  let frame = initialFrame;
  let renderer: FakeRenderer | undefined;
  const onStatus = vi.fn();
  const onFrameInterval = vi.fn();
  const engine = createInkEngine({
    canvas,
    quality: QUALITY,
    palette: PALETTE,
    getFrame: () => frame,
    onStatus,
    onFrameInterval,
    createRenderer: (_canvas, _quality, hooks) => {
      renderer = fakeRenderer(hooks);
      return renderer;
    },
  });
  if (engine) engines.push(engine);

  return {
    engine,
    canvas,
    frames,
    onStatus,
    onFrameInterval,
    renderer: () => renderer as FakeRenderer,
    setFrame: (next: InkFieldFrame | null) => {
      frame = next;
    },
  };
}

describe("createInkEngine", () => {
  it("si no hay renderer (sin WebGL) devuelve null", () => {
    const engine = createInkEngine({
      canvas: document.createElement("canvas"),
      quality: QUALITY,
      palette: PALETTE,
      getFrame: () => null,
      onStatus: vi.fn(),
      createRenderer: () => null,
    });

    expect(engine).toBeNull();
  });

  it("dimensiona el renderer con el tamano CSS del canvas y el DPR al arrancar", () => {
    const { renderer } = setup();

    expect(renderer().resize).toHaveBeenCalledWith(1000, 600, window.devicePixelRatio);
  });

  it("render bajo demanda: varias peticiones en el mismo fotograma dibujan UNA vez", () => {
    const { engine, frames, renderer } = setup();

    engine?.requestRender();
    engine?.requestRender();
    engine?.requestRender();
    expect(frames.count()).toBe(1);
    frames.flush(16);

    expect(renderer().draw).toHaveBeenCalledTimes(1);
  });

  it("traduce el fotograma a valores de shader con el color de su tinta", () => {
    const { engine, frames, renderer } = setup();

    engine?.requestRender();
    frames.flush(16);

    expect(renderer().draw).toHaveBeenCalledWith({
      effect: FRAME.effect,
      cover: FRAME.cover,
      erase: FRAME.erase,
      mirror: FRAME.mirror,
      seed: FRAME.index,
      tonePitch: FRAME.tonePitch,
      ink: PALETTE.shu.ink,
      rim: PALETTE.shu.rim,
    });
  });

  it("no vuelve a dibujar un fotograma igual al ultimo (el scroll no cambio la tinta)", () => {
    const { engine, frames, renderer } = setup();
    engine?.requestRender();
    frames.flush(16);

    engine?.requestRender();
    frames.flush(32);

    expect(renderer().draw).toHaveBeenCalledTimes(1);
  });

  it("sin transicion en curso limpia una vez y oculta el canvas; con tinta lo muestra", () => {
    const { engine, canvas, frames, renderer, setFrame } = setup();
    expect(canvas.style.visibility).toBe("hidden");

    engine?.requestRender();
    frames.flush(16);
    expect(canvas.style.visibility).toBe("visible");

    setFrame(null);
    engine?.requestRender();
    frames.flush(32);
    engine?.requestRender();
    frames.flush(48);

    expect(renderer().clear).toHaveBeenCalledTimes(1);
    expect(canvas.style.visibility).toBe("hidden");
  });

  it("con la pestana oculta no dibuja; al volver dibuja lo que quedo pendiente", () => {
    const { engine, frames, renderer } = setup();
    setHidden(true);

    engine?.requestRender();
    frames.flush(16);
    expect(renderer().draw).not.toHaveBeenCalled();

    setHidden(false);
    frames.flush(32);
    expect(renderer().draw).toHaveBeenCalledTimes(1);
  });

  it("al cambiar de tamano redimensiona y vuelve a dibujar aunque el fotograma sea el mismo", () => {
    const { engine, frames, renderer } = setup();
    engine?.requestRender();
    frames.flush(16);

    triggerResize();
    frames.flush(32);

    expect(renderer().resize).toHaveBeenCalledTimes(2);
    expect(renderer().draw).toHaveBeenCalledTimes(2);
  });

  it("avisa de la perdida del contexto y, al restaurarse, avisa y repinta", () => {
    const { engine, frames, onStatus, renderer } = setup();
    engine?.requestRender();
    frames.flush(16);

    renderer().lostFlag = true;
    renderer().hooks.onLost();
    expect(onStatus).toHaveBeenLastCalledWith("lost");

    renderer().lostFlag = false;
    renderer().hooks.onRestored();
    frames.flush(32);

    expect(onStatus).toHaveBeenLastCalledWith("ready");
    expect(renderer().draw).toHaveBeenCalledTimes(2);
  });

  it("mide el tiempo entre fotogramas SEGUIDOS (un hueco largo es reposo, no lentitud)", () => {
    const { engine, frames, onFrameInterval, setFrame } = setup();
    const drawAt = (timestamp: number, cover: number) => {
      setFrame({ ...FRAME, cover });
      engine?.requestRender();
      frames.flush(timestamp);
    };

    drawAt(100, 0.1);
    drawAt(116, 0.2);
    drawAt(150, 0.3);
    drawAt(150 + INK_FRAME_GAP_MS + 1, 0.4);

    expect(onFrameInterval.mock.calls).toEqual([[16], [34]]);
  });

  it("una rueda de muescas (un dibujo cada 100 ms) NO cuenta como lentitud: se mide el fotograma siguiente al dibujo", () => {
    const { engine, frames, onFrameInterval, setFrame } = setup();
    const notch = (timestamp: number, cover: number) => {
      setFrame({ ...FRAME, cover });
      engine?.requestRender();
      frames.flush(timestamp);
      // El fotograma "de cola" que sigue al dibujo: aqui se mide.
      frames.flush(timestamp + 16);
    };

    notch(100, 0.1);
    notch(200, 0.2);
    notch(300, 0.3);

    expect(onFrameInterval.mock.calls).toEqual([[16], [16], [16]]);
    expect(frames.count()).toBe(0);
  });

  it("avisa de que esta listo tras el PRIMER pintado (dibujo o limpieza), no al crearse", () => {
    const { engine, frames, onStatus } = setup(null);
    expect(onStatus).not.toHaveBeenCalled();

    engine?.requestRender();
    frames.flush(16);

    expect(onStatus).toHaveBeenCalledTimes(1);
    expect(onStatus).toHaveBeenCalledWith("ready");
  });

  it("al redimensionar repinta EN EL ACTO: cambiar el tamano del buffer lo borra y no debe verse un fotograma vacio", () => {
    const { engine, frames, renderer } = setup();
    engine?.requestRender();
    frames.flush(16);

    triggerResize();

    expect(renderer().draw).toHaveBeenCalledTimes(2);
  });

  it("si la GPU no se puede restaurar avisa de fallo (para volver a SVG del todo)", () => {
    const { onStatus, renderer } = setup();

    renderer().hooks.onRestoreFailed();

    expect(onStatus).toHaveBeenLastCalledWith("failed");
  });

  it("setQuality pasa la calidad nueva al renderer y repinta", () => {
    const { engine, frames, renderer } = setup();
    engine?.requestRender();
    frames.flush(16);

    engine?.setQuality({ dprCap: 1, octaves: 3 });
    frames.flush(32);

    expect(renderer().setQuality).toHaveBeenCalledWith({ dprCap: 1, octaves: 3 });
    expect(renderer().draw).toHaveBeenCalledTimes(2);
  });

  it("destroy cancela lo pendiente, deja de observar y libera el renderer", () => {
    const { engine, frames, renderer } = setup();
    engine?.requestRender();

    engine?.destroy();
    frames.flush(16);
    triggerResize();
    setHidden(false);

    expect(frames.count()).toBe(0);
    expect(renderer().draw).not.toHaveBeenCalled();
    expect(renderer().resize).toHaveBeenCalledTimes(1);
    expect(renderer().destroy).toHaveBeenCalledTimes(1);
  });
});
