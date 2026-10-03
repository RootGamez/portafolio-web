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
  /** true: se ve la tinta WebGL (ocultar la SVG); false: se ve la SVG. */
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

/** Monta la tinta WebGL; devuelve la funcion que la desmonta. */
export function mountInkEngine(options: MountInkOptions): () => void {
  const { canvas, load, getFrame, sources, onActive, onFail } = options;
  let disposed = false;
  let tier: GlTier = options.tier;
  let monitor = EMPTY_MONITOR;
  let engine: InkEngine | null = null;
  let unsubscribe: (() => void)[] = [];

  const shutDown = () => {
    unsubscribe.forEach((stop) => stop());
    unsubscribe = [];
    engine?.destroy();
    engine = null;
  };

  const fail = () => {
    if (disposed) return;
    shutDown();
    onActive(false);
    onFail();
  };

  const onFrameInterval = (ms: number) => {
    const result = recordFrame(monitor, ms);
    monitor = result.monitor;
    if (!result.slow) return;
    const next = lowerTier(tier);
    if (next === "T1") return fail();
    tier = next;
    canvas.dataset.inkTier = next;
    engine?.setQuality(TIER_QUALITY[next]);
  };

  const start = (module: InkGlModule) => {
    if (disposed) return;
    const palette = module.readInkPalette(canvas.parentElement ?? document.body);
    const created = palette
      ? module.createInkEngine({
          canvas,
          quality: TIER_QUALITY[tier],
          palette,
          getFrame,
          onStatus: (status: InkEngineStatus) => onActive(status === "ready"),
          onFrameInterval,
        })
      : null;
    if (!created) return fail();

    engine = created;
    // Para QA en el navegador: que tier esta pintando ahora.
    canvas.dataset.inkTier = tier;
    unsubscribe = sources.map((source) => source.on("change", created.requestRender));
    onActive(true);
    created.requestRender();
  };

  const cancelIdle = whenIdle(() => {
    load().then(start, fail);
  });

  return () => {
    disposed = true;
    cancelIdle();
    shutDown();
  };
}
