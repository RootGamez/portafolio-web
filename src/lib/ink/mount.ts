import { INK_GL_LOAD_DELAY_MS } from "@/lib/stage/config";
import type { InkEngine, InkEngineStatus } from "./engine";
import type { InkFieldFrame } from "./frame";
import { EMPTY_MONITOR, lowerTier, recordFrame, TIER_QUALITY, type GlTier } from "./tiers";

/**
 * Arranque de la tinta WebGL (tiers T3/T2) sobre un canvas ya montado. Va en el
 * bundle inicial, pero es pequeno: el GL vive en el chunk de glChunk.ts.
 *
 *   1. espera al evento `load` y al reposo (no compite con el LCP);
 *   2. descarga el chunk con `import()`; lee la paleta y crea el motor;
 *   3. cada cambio de scroll/layout pide un fotograma (bajo demanda);
 *   4. el monitor de frame-time baja de T3 a T2 y de ahi a SVG (T1).
 *
 * Cualquier fallo (chunk que no llega, sin paleta, sin WebGL) acaba en `onFail`:
 * la tinta SVG sigue ahi, el usuario no ve ningun error.
 */
export type InkGlModule = typeof import("./glChunk");

/** Lo minimo de un MotionValue que hace falta: avisar de que cambio. */
export type ChangeSource = { on(event: "change", callback: () => void): () => void };

export type MountInkOptions = {
  readonly canvas: HTMLCanvasElement;
  readonly tier: GlTier;
  readonly load: () => Promise<InkGlModule>;
  readonly getFrame: () => InkFieldFrame | null;
  /** Lo que, al cambiar, obliga a repintar (scroll y layout). */
  readonly sources: readonly ChangeSource[];
  /** true: la tinta WebGL ya pinta (ocultar la SVG); false: se ve la SVG. */
  readonly onActive: (active: boolean) => void;
  /** WebGL descartado para siempre en esta pagina: quitar el canvas. */
  readonly onFail: () => void;
};

/** Reposo del navegador: `requestIdleCallback` SIN timeout, o una espera fija en Safari. */
function afterIdle(callback: () => void): () => void {
  if (typeof window.requestIdleCallback === "function") {
    // Sin `timeout` a proposito: con la CPU lenta forzaria la descarga y la
    // compilacion del shader en plena carga, encima del LCP (medido en 3.4).
    const id = window.requestIdleCallback(callback);
    return () => window.cancelIdleCallback(id);
  }
  const id = window.setTimeout(callback, INK_GL_LOAD_DELAY_MS);
  return () => window.clearTimeout(id);
}

/**
 * Ejecuta `callback` cuando la pagina ya cargo (evento `load`) y el navegador
 * queda en reposo; devuelve como cancelarlo en cualquier punto.
 */
function whenIdle(callback: () => void): () => void {
  if (document.readyState === "complete") return afterIdle(callback);

  let cancelIdle: (() => void) | null = null;
  const onLoad = () => {
    cancelIdle = afterIdle(callback);
  };
  window.addEventListener("load", onLoad, { once: true });
  return () => {
    window.removeEventListener("load", onLoad);
    cancelIdle?.();
  };
}

/**
 * El monitor de calidad: apunta lo que tarda cada fotograma y, con lentitud
 * sostenida, baja un tier. Devuelve el tier nuevo cuando hay que bajar.
 */
function createDegrader(initial: GlTier) {
  let tier: GlTier = initial;
  let monitor = EMPTY_MONITOR;
  return {
    get tier() {
      return tier;
    },
    /** null = sigue igual; "T2" = bajar la calidad; "T1" = quitar WebGL. */
    record(ms: number): "T2" | "T1" | null {
      const result = recordFrame(monitor, ms);
      monitor = result.monitor;
      if (!result.slow) return null;
      const next = lowerTier(tier);
      if (next === "T2") tier = next;
      return next;
    },
  };
}

type Running = { readonly engine: InkEngine; readonly unsubscribe: () => void };

type EngineHandlers = {
  readonly onStatus: (status: InkEngineStatus) => void;
  readonly onFrameInterval: (ms: number) => void;
};

/** Crea el motor con la paleta leida junto al canvas y lo ata al scroll; null si no se puede. */
function startEngine(
  module: InkGlModule,
  options: MountInkOptions,
  tier: GlTier,
  handlers: EngineHandlers,
): Running | null {
  const { canvas, getFrame, sources } = options;
  const palette = module.readInkPalette(canvas.parentElement ?? document.body);
  if (!palette) return null;
  const engine = module.createInkEngine({ canvas, quality: TIER_QUALITY[tier], palette, getFrame, ...handlers });
  if (!engine) return null;

  // Para QA en el navegador: que tier esta pintando ahora.
  canvas.dataset.inkTier = tier;
  const stops = sources.map((source) => source.on("change", engine.requestRender));
  // La tinta SVG se quita cuando el motor avisa "ready" (tras su primer pintado).
  engine.requestRender();
  return { engine, unsubscribe: () => stops.forEach((stop) => stop()) };
}

/** Monta la tinta WebGL; devuelve la funcion que la desmonta. */
export function mountInkEngine(options: MountInkOptions): () => void {
  const { canvas, load, onActive, onFail } = options;
  const degrader = createDegrader(options.tier);
  let disposed = false;
  let active = false;
  let running: Running | null = null;

  const setActive = (next: boolean) => {
    active = next;
    onActive(next);
  };
  const shutDown = () => {
    running?.unsubscribe();
    running?.engine.destroy();
    running = null;
  };
  const fail = () => {
    if (disposed) return;
    shutDown();
    setActive(false);
    onFail();
  };
  const handlers: EngineHandlers = {
    onStatus: (status) => (status === "failed" ? fail() : setActive(status === "ready")),
    onFrameInterval: (ms) => {
      const next = degrader.record(ms);
      if (next === "T1") return fail();
      if (next === null) return;
      canvas.dataset.inkTier = next;
      running?.engine.setQuality(TIER_QUALITY[next]);
    },
  };
  const start = (module: InkGlModule) => {
    if (disposed) return;
    running = startEngine(module, options, degrader.tier, handlers);
    if (!running) fail();
  };

  // `.catch` y no el 2.o argumento de `then`: asi tambien llega a `fail` lo que
  // lance `start` (paleta, motor, suscripciones), no solo el import() rechazado.
  const cancelIdle = whenIdle(() => load().then(start).catch(fail));

  return () => {
    disposed = true;
    cancelIdle();
    shutDown();
    // Si el efecto se rehace, que no quede la SVG apagada sin nadie que pinte.
    if (active) setActive(false);
  };
}
