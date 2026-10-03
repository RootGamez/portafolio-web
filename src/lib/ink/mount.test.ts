import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { motionValue } from "motion/react";
import { INK_FRAME_BUDGET_MS, INK_GL_LOAD_DELAY_MS, INK_MONITOR_WINDOW } from "@/lib/stage/config";
import type { InkEngine, InkEngineOptions, InkPalette } from "./engine";
import { mountInkEngine, type InkGlModule } from "./mount";
import { TIER_QUALITY } from "./tiers";

const PALETTE = { sumi: { ink: [0, 0, 0], rim: [0, 0, 0] } } as unknown as InkPalette;

type FakeEngine = InkEngine & {
  readonly requestRender: ReturnType<typeof vi.fn>;
  readonly setQuality: ReturnType<typeof vi.fn>;
  readonly destroy: ReturnType<typeof vi.fn>;
};

function fakeModule(options: { palette?: InkPalette | null; engine?: "ok" | "null" } = {}) {
  let created: { engine: FakeEngine; options: InkEngineOptions } | null = null;
  const module: InkGlModule = {
    readInkPalette: vi.fn(() => (options.palette === undefined ? PALETTE : options.palette)),
    createInkEngine: vi.fn((engineOptions: InkEngineOptions) => {
      if (options.engine === "null") return null;
      const engine: FakeEngine = { requestRender: vi.fn(), setQuality: vi.fn(), destroy: vi.fn() };
      created = { engine, options: engineOptions };
      return engine;
    }),
  };
  return { module, created: () => created };
}

function setup(loaded: ReturnType<typeof fakeModule> | "reject" = fakeModule()) {
  const host = document.createElement("div");
  const canvas = document.createElement("canvas");
  host.append(canvas);
  const layout = motionValue(0);
  const scroll = motionValue(0);
  const onActive = vi.fn();
  const onFail = vi.fn();
  const load = vi.fn(() =>
    loaded === "reject" ? Promise.reject(new Error("chunk no encontrado")) : Promise.resolve(loaded.module),
  );
  const dispose = mountInkEngine({
    canvas,
    tier: "T3",
    load,
    getFrame: () => null,
    sources: [layout, scroll],
    onActive,
    onFail,
  });
  return { canvas, host, scroll, onActive, onFail, load, dispose, loaded };
}

/** Pasa la espera de reposo y deja resolver el import(). */
async function idle() {
  await vi.advanceTimersByTimeAsync(INK_GL_LOAD_DELAY_MS);
}

beforeEach(() => {
  vi.useFakeTimers();
});

afterEach(() => {
  vi.useRealTimers();
});

describe("mountInkEngine", () => {
  it("no descarga el chunk WebGL hasta que el navegador queda en reposo tras el primer pintado", async () => {
    const { load } = setup();
    expect(load).not.toHaveBeenCalled();

    await idle();

    expect(load).toHaveBeenCalledTimes(1);
  });

  it("si la pagina aun esta cargando espera al evento load: no compite con el LCP", async () => {
    Object.defineProperty(document, "readyState", { configurable: true, get: () => "loading" });
    try {
      const { load } = setup();
      await idle();
      await idle();
      expect(load).not.toHaveBeenCalled();

      window.dispatchEvent(new Event("load"));
      await idle();

      expect(load).toHaveBeenCalledTimes(1);
    } finally {
      Reflect.deleteProperty(document, "readyState");
    }
  });

  it("no fuerza la descarga con un timeout de requestIdleCallback (con CPU lenta caeria en plena carga)", async () => {
    const requestIdle = vi.fn((callback: IdleRequestCallback) => window.setTimeout(() => callback({} as IdleDeadline), 1));
    // A mano y no con vi.stubGlobal: unstubAllGlobals quitaria tambien los dobles de setup.ts.
    Object.assign(window, { requestIdleCallback: requestIdle, cancelIdleCallback: window.clearTimeout });
    try {
      const { load } = setup();
      await idle();

      expect(requestIdle).toHaveBeenCalledWith(expect.any(Function));
      expect(requestIdle.mock.calls[0]).toHaveLength(1);
      expect(load).toHaveBeenCalledTimes(1);
    } finally {
      Reflect.deleteProperty(window, "requestIdleCallback");
      Reflect.deleteProperty(window, "cancelIdleCallback");
    }
  });

  it("crea el motor con la calidad del tier y la paleta leida junto al canvas, y avisa de que esta activo", async () => {
    const { host, onActive, loaded } = setup();
    await idle();

    const created = (loaded as ReturnType<typeof fakeModule>).created();
    expect((loaded as ReturnType<typeof fakeModule>).module.readInkPalette).toHaveBeenCalledWith(host);
    expect(created?.options.quality).toEqual(TIER_QUALITY.T3);
    expect(created?.options.palette).toBe(PALETTE);
    expect(onActive).toHaveBeenLastCalledWith(true);
    expect(created?.engine.requestRender).toHaveBeenCalledTimes(1);
  });

  it("cada cambio del scroll o del layout pide un fotograma (render bajo demanda)", async () => {
    const { scroll, loaded } = setup();
    await idle();
    const engine = (loaded as ReturnType<typeof fakeModule>).created()?.engine;

    scroll.set(120);

    expect(engine?.requestRender).toHaveBeenCalledTimes(2);
  });

  it.each([
    ["sin paleta legible", fakeModule({ palette: null })],
    ["sin WebGL utilizable (el motor es null)", fakeModule({ engine: "null" })],
  ])("%s: se queda en SVG sin activarse", async (_label, loaded) => {
    const { onActive, onFail } = setup(loaded);
    await idle();

    expect(onActive).not.toHaveBeenCalledWith(true);
    expect(onFail).toHaveBeenCalledTimes(1);
  });

  it("si el chunk no se puede descargar se queda en SVG (sin errores sin manejar)", async () => {
    const { onActive, onFail } = setup("reject");
    await idle();

    expect(onActive).not.toHaveBeenCalledWith(true);
    expect(onFail).toHaveBeenCalledTimes(1);
  });

  it("con la GPU perdida vuelve a la tinta SVG y, al restaurarse, a WebGL", async () => {
    const { onActive, loaded } = setup();
    await idle();
    const { options } = (loaded as ReturnType<typeof fakeModule>).created() ?? {};

    options?.onStatus("lost");
    expect(onActive).toHaveBeenLastCalledWith(false);

    options?.onStatus("ready");
    expect(onActive).toHaveBeenLastCalledWith(true);
  });

  it("con lentitud sostenida baja a T2 y, si sigue lenta, apaga WebGL y vuelve a SVG", async () => {
    const { canvas, onActive, onFail, scroll, loaded } = setup();
    await idle();
    const { engine, options } = (loaded as ReturnType<typeof fakeModule>).created() ?? {};
    const slowWindow = () => {
      for (let i = 0; i < INK_MONITOR_WINDOW; i += 1) options?.onFrameInterval?.(INK_FRAME_BUDGET_MS + 20);
    };

    expect(canvas.dataset.inkTier).toBe("T3");
    slowWindow();
    expect(engine?.setQuality).toHaveBeenCalledWith(TIER_QUALITY.T2);
    expect(canvas.dataset.inkTier).toBe("T2");
    expect(onFail).not.toHaveBeenCalled();

    slowWindow();
    expect(engine?.destroy).toHaveBeenCalledTimes(1);
    expect(onActive).toHaveBeenLastCalledWith(false);
    expect(onFail).toHaveBeenCalledTimes(1);

    // Ya no escucha el scroll.
    scroll.set(500);
    expect(engine?.requestRender).toHaveBeenCalledTimes(1);
  });

  it("desmontar antes del reposo no descarga nada", async () => {
    const { load, dispose } = setup();

    dispose();
    await idle();

    expect(load).not.toHaveBeenCalled();
  });

  it("desmontar mientras se descarga no crea el motor ni avisa", async () => {
    const loaded = fakeModule();
    let resolve: (module: InkGlModule) => void = () => {};
    const { dispose, load, onActive, onFail } = setup(loaded);
    load.mockImplementation(() => new Promise<InkGlModule>((done) => (resolve = done)));

    await idle();
    dispose();
    resolve(loaded.module);
    await vi.advanceTimersByTimeAsync(0);

    expect(loaded.module.createInkEngine).not.toHaveBeenCalled();
    expect(onActive).not.toHaveBeenCalled();
    expect(onFail).not.toHaveBeenCalled();
  });

  it("desmontar con el motor en marcha lo destruye y deja de escuchar el scroll", async () => {
    const { dispose, scroll, loaded } = setup();
    await idle();
    const engine = (loaded as ReturnType<typeof fakeModule>).created()?.engine;

    dispose();
    scroll.set(300);

    expect(engine?.destroy).toHaveBeenCalledTimes(1);
    expect(engine?.requestRender).toHaveBeenCalledTimes(1);
  });
});
