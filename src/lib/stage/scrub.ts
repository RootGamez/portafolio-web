import { SCRUB_DRAW_MIN_VISIBLE, SCRUB_ERASE_FEATHER_PCT } from "./config";
import { smoothstep } from "./timeline";

/**
 * Coreografia ligada al scroll dentro de un escenario (docs/PLAN_ESCENARIOS.md,
 * Fase 4). Todo es funcion PURA del progreso del escenario (0..1, `useStage()`):
 * reversible, sin estado y sin tiempo; cualquier posicion del scroll es un
 * fotograma legible.
 *
 * Un `ScrubRange` es el tramo de ese progreso en el que ocurre la animacion:
 * antes esta en su estado inicial y despues en el final.
 */
export type ScrubRange = readonly [start: number, end: number];

/**
 * Sobre que avance se mide el tramo: la INTRO del escenario (`useStage().intro`,
 * igual en todos los dispositivos) o el escenario ENTERO (`progress`, intro +
 * pan, que depende del alto del contenido).
 */
export type ScrubOver = "intro" | "stage";

/** Avance lineal 0..1 dentro del tramo. Un progreso no finito cuenta como 0. */
export function scrubT(progress: number, [start, end]: ScrubRange): number {
  const p = Number.isFinite(progress) ? progress : 0;
  if (end <= start) return p < start ? 0 : 1;
  return Math.min(1, Math.max(0, (p - start) / (end - start)));
}

export type RevealFrame = { readonly opacity: number; readonly y: number };

/**
 * Aparece subiendo `distance` px. Curva suave (smoothstep) en vez de recta:
 * arranca y termina despacio, como el gesto de `EASE_INK` pero simetrica,
 * porque se recorre igual hacia delante que hacia atras.
 */
export function revealFrame(progress: number, [start, end]: ScrubRange, distance: number): RevealFrame {
  const p = Number.isFinite(progress) ? progress : 0;
  const opacity = smoothstep(start, end, p);
  return { opacity, y: (1 - opacity) * distance };
}

export type DrawFrame = { readonly pathLength: number; readonly opacity: 0 | 1 };

/**
 * Trazo que se dibuja: la longitud es LINEAL (el pincel va a velocidad
 * constante). No se pinta hasta un minimo: con `stroke-linecap: round` un trazo
 * casi nulo deja un punto en cada extremo (visto en vivo en la tarjeta, 2.4).
 */
export function drawFrame(progress: number, range: ScrubRange): DrawFrame {
  const pathLength = scrubT(progress, range);
  return { pathLength, opacity: pathLength >= SCRUB_DRAW_MIN_VISIBLE ? 1 : 0 };
}

/**
 * Desplazamiento vertical de paralaje: 0 al empezar (asi el primer fotograma
 * coincide con el modo lineal) y `-distance` al acabar el tramo.
 */
export function parallaxY(progress: number, range: ScrubRange, distance: number): number {
  const t = scrubT(progress, range);
  return t === 0 ? 0 : -distance * t;
}

/**
 * Mascara con la que un texto se BORRA de izquierda a derecha: la zona ya
 * borrada es transparente y el borde se difumina `SCRUB_ERASE_FEATHER_PCT` %,
 * como tinta que se retira. Antes del tramo no hay mascara ("none"): el texto
 * se pinta nitido y sin el coste de componer una mascara.
 */
export function eraseMask(progress: number, range: ScrubRange): string {
  const t = scrubT(progress, range);
  if (t === 0) return "none";
  const to = t * (100 + SCRUB_ERASE_FEATHER_PCT);
  const from = to - SCRUB_ERASE_FEATHER_PCT;
  return `linear-gradient(to right, transparent ${round2(from)}%, #000 ${round2(to)}%)`;
}

/** Dos decimales: el navegador no distingue mas y la cadena queda corta. */
function round2(value: number): number {
  return Math.round(value * 100) / 100;
}
