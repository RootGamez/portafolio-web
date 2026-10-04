import { INK_FRAME_GAP_MS } from "@/lib/stage/config";
import type { Ground } from "@/sections/meta";
import { sameFieldFrame, type InkFieldFrame } from "./frame";
import { createInkRenderer, type InkDrawInput, type InkQuality, type InkRenderer, type Rgb } from "./webgl";

/**
 * Motor de la tinta WebGL: decide CUANDO dibujar (docs/PLAN_ESCENARIOS.md §6).
 *
 *   - bajo demanda: solo dibuja si alguien lo pide (el scroll cambio) y el
 *     fotograma es distinto del ultimo; varias peticiones en un fotograma = un dibujo;
 *   - en pausa con la pestana oculta: lo pendiente se dibuja al volver;
 *   - fuera de una transicion limpia una vez y oculta el canvas (el compositor
 *     no tiene que mezclar una capa transparente a pantalla completa);
 *   - mide lo que tarda el fotograma de cada dibujo (del dibujo al fotograma
 *     siguiente) para el monitor de calidad (tiers). NO el tiempo entre dibujos:
 *     eso es la cadencia del scroll (una rueda de muescas dibuja cada 100 ms y
 *     pareceria lentitud con la GPU parada).
 *
 * El QUE dibujar lo da `getFrame` (lib/ink/frame.ts, puro) y el COMO, el renderer.
 */

export type InkPalette = Readonly<Record<Ground, { readonly ink: Rgb; readonly rim: Rgb }>>;

/**
 * "ready": ya pinta (tras el primer pintado, para no dejar un hueco sin tinta);
 * "lost": la GPU se perdio un momento; "failed": no volvera (quitar WebGL).
 */
export type InkEngineStatus = "ready" | "lost" | "failed";

export type InkEngineOptions = {
  readonly canvas: HTMLCanvasElement;
  readonly quality: InkQuality;
  readonly palette: InkPalette;
  /** El fotograma de ahora; se llama en el rAF, no en cada evento de scroll. */
  readonly getFrame: () => InkFieldFrame | null;
  readonly onStatus: (status: InkEngineStatus) => void;
  /** Ms que tardo el fotograma de un dibujo (para degradar la calidad si va lento). */
  readonly onFrameInterval?: (ms: number) => void;
  /** Para los tests; por defecto, el renderer WebGL de verdad. */
  readonly createRenderer?: typeof createInkRenderer;
};

export type InkEngine = {
  requestRender(): void;
  setQuality(quality: InkQuality): void;
  destroy(): void;
};

function toDrawInput(frame: InkFieldFrame, palette: InkPalette): InkDrawInput {
  const colors = palette[frame.ink];
  return {
    effect: frame.effect,
    cover: frame.cover,
    erase: frame.erase,
    mirror: frame.mirror,
    seed: frame.index,
    tonePitch: frame.tonePitch,
    ink: colors.ink,
    rim: colors.rim,
  };
}

/** Sin pintar nada todavia: obliga a dibujar el siguiente fotograma, sea cual sea. */
const NOTHING_DRAWN = Symbol("nada dibujado");

type PaintResult = "drawn" | "cleared" | "skipped" | "failed";

type Painter = {
  /** Pinta el fotograma de ahora si cambio. */
  paint(): PaintResult;
  /** Olvida lo pintado: el siguiente `paint` dibuja aunque el fotograma sea igual. */
  invalidate(): void;
  /** Tras perder la GPU: el proximo pintado vuelve a avisar de "ready". */
  resetReady(): void;
};

/** El QUE: traduce el fotograma a un dibujo (o a limpiar) y avisa del primero. */
function createPainter(options: InkEngineOptions, renderer: InkRenderer): Painter {
  const { canvas, palette, getFrame, onStatus } = options;
  let last: InkFieldFrame | null | typeof NOTHING_DRAWN = NOTHING_DRAWN;
  let announced = false;

  const announce = () => {
    if (announced) return;
    announced = true;
    onStatus("ready");
  };

  return {
    paint() {
      const frame = getFrame();
      if (last !== NOTHING_DRAWN && sameFieldFrame(last, frame)) return "skipped";
      if (frame === null) {
        renderer.clear();
        canvas.style.visibility = "hidden";
        last = frame;
        announce();
        return "cleared";
      }
      if (!renderer.draw(toDrawInput(frame, palette))) return "failed";
      canvas.style.visibility = "visible";
      last = frame;
      announce();
      return "drawn";
    },
    invalidate() {
      last = NOTHING_DRAWN;
    },
    resetReady() {
      announced = false;
    },
  };
}

/** El CUANDO: rAF bajo demanda + un fotograma de cola tras cada dibujo para medirlo. */
function createScheduler(painter: Painter, onFrameInterval: ((ms: number) => void) | undefined) {
  let pending = 0;
  let drawnAt: number | null = null;

  const tick = (timestamp: number) => {
    pending = 0;
    if (document.hidden) {
      drawnAt = null;
      return;
    }
    if (drawnAt !== null && timestamp - drawnAt <= INK_FRAME_GAP_MS) onFrameInterval?.(timestamp - drawnAt);
    drawnAt = null;
    if (painter.paint() !== "drawn") return;
    drawnAt = timestamp;
    request();
  };

  function request() {
    if (pending === 0) pending = window.requestAnimationFrame(tick);
  }

  return {
    request,
    cancel() {
      window.cancelAnimationFrame(pending);
      pending = 0;
    },
  };
}

export function createInkEngine(options: InkEngineOptions): InkEngine | null {
  const { canvas, onStatus, onFrameInterval } = options;
  let painter: Painter | null = null;
  const create = options.createRenderer ?? createInkRenderer;
  const renderer = create(canvas, options.quality, {
    onLost: () => {
      painter?.resetReady();
      onStatus("lost");
    },
    onRestored: () => invalidate(),
    onRestoreFailed: () => onStatus("failed"),
  });
  if (!renderer) return null;

  painter = createPainter(options, renderer);
  const scheduler = createScheduler(painter, onFrameInterval);
  function invalidate() {
    painter?.invalidate();
    scheduler.request();
  }
  // Cambiar el tamano del buffer lo BORRA: se repinta en el acto (no en el rAF).
  const resize = () => {
    renderer.resize(canvas.clientWidth, canvas.clientHeight, window.devicePixelRatio);
    painter?.invalidate();
    if (!document.hidden) painter?.paint();
  };
  const onVisibility = () => {
    if (!document.hidden) scheduler.request();
  };

  canvas.style.visibility = "hidden";
  renderer.resize(canvas.clientWidth, canvas.clientHeight, window.devicePixelRatio);
  const observer = new ResizeObserver(resize);
  observer.observe(canvas);
  document.addEventListener("visibilitychange", onVisibility);

  return {
    requestRender: scheduler.request,
    setQuality(quality) {
      renderer.setQuality(quality);
      invalidate();
    },
    destroy() {
      scheduler.cancel();
      observer.disconnect();
      document.removeEventListener("visibilitychange", onVisibility);
      renderer.destroy();
    },
  };
}
