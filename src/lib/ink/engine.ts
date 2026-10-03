import { INK_FRAME_GAP_MS } from "@/lib/stage/config";
import type { Ground } from "@/sections/meta";
import { sameFieldFrame, type InkFieldFrame } from "./frame";
import { createInkRenderer, type InkDrawInput, type InkQuality, type Rgb } from "./webgl";

/**
 * Motor de la tinta WebGL: decide CUANDO dibujar (docs/PLAN_ESCENARIOS.md §6).
 *
 *   - bajo demanda: solo dibuja si alguien lo pide (el scroll cambio) y el
 *     fotograma es distinto del ultimo; varias peticiones en un fotograma = un dibujo;
 *   - en pausa con la pestana oculta: lo pendiente se dibuja al volver;
 *   - fuera de una transicion limpia una vez y oculta el canvas (el compositor
 *     no tiene que mezclar una capa transparente a pantalla completa);
 *   - mide el tiempo entre dibujos seguidos para el monitor de calidad (tiers).
 *
 * El QUE dibujar lo da `getFrame` (lib/ink/frame.ts, puro) y el COMO, el renderer.
 */

export type InkPalette = Readonly<Record<Ground, { readonly ink: Rgb; readonly rim: Rgb }>>;

export type InkEngineStatus = "ready" | "lost";

export type InkEngineOptions = {
  readonly canvas: HTMLCanvasElement;
  readonly quality: InkQuality;
  readonly palette: InkPalette;
  /** El fotograma de ahora; se llama en el rAF, no en cada evento de scroll. */
  readonly getFrame: () => InkFieldFrame | null;
  /** "lost": la GPU se perdio (mostrar la tinta SVG); "ready": vuelve a estar. */
  readonly onStatus: (status: InkEngineStatus) => void;
  /** Ms entre dos dibujos seguidos (para degradar la calidad si va lento). */
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

export function createInkEngine(options: InkEngineOptions): InkEngine | null {
  const { canvas, palette, getFrame, onStatus, onFrameInterval } = options;
  const create = options.createRenderer ?? createInkRenderer;
  const renderer = create(canvas, options.quality, {
    onLost: () => onStatus("lost"),
    onRestored: () => {
      onStatus("ready");
      invalidate();
    },
  });
  if (!renderer) return null;

  let pending = 0;
  let last: InkFieldFrame | null | typeof NOTHING_DRAWN = NOTHING_DRAWN;
  let lastDrawAt = Number.NEGATIVE_INFINITY;

  const paint = (timestamp: number) => {
    pending = 0;
    if (document.hidden) return;
    const frame = getFrame();
    if (last !== NOTHING_DRAWN && sameFieldFrame(last, frame)) return;

    if (frame === null) {
      renderer.clear();
      canvas.style.visibility = "hidden";
      last = frame;
      return;
    }
    if (!renderer.draw(toDrawInput(frame, palette))) return;
    canvas.style.visibility = "visible";
    last = frame;
    if (timestamp - lastDrawAt <= INK_FRAME_GAP_MS) onFrameInterval?.(timestamp - lastDrawAt);
    lastDrawAt = timestamp;
  };

  function requestRender() {
    if (pending === 0) pending = window.requestAnimationFrame(paint);
  }

  function invalidate() {
    last = NOTHING_DRAWN;
    requestRender();
  }

  const resize = () => {
    renderer.resize(canvas.clientWidth, canvas.clientHeight, window.devicePixelRatio);
    invalidate();
  };
  const onVisibility = () => {
    if (!document.hidden) requestRender();
  };

  canvas.style.visibility = "hidden";
  renderer.resize(canvas.clientWidth, canvas.clientHeight, window.devicePixelRatio);
  const observer = new ResizeObserver(resize);
  observer.observe(canvas);
  document.addEventListener("visibilitychange", onVisibility);

  return {
    requestRender,
    setQuality(quality) {
      renderer.setQuality(quality);
      invalidate();
    },
    destroy() {
      window.cancelAnimationFrame(pending);
      pending = 0;
      observer.disconnect();
      document.removeEventListener("visibilitychange", onVisibility);
      renderer.destroy();
    },
  };
}
