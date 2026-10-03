import {
  CARD_END,
  CARD_HIDE_END,
  CARD_HIDE_START,
  CARD_SHOW_FULL,
  CARD_SHOW_START,
  CARD_STROKE_MIN_VISIBLE,
  CARD_STROKE_START,
  COVER_END,
  INK_EDGE_MAX_PX,
  INK_EDGE_MIN_PX,
  INK_EDGE_RATIO,
  SWAP_AT,
} from "./config";
import { smoothstep } from "./timeline";

/**
 * Geometria de la tinta de una transicion (docs/PLAN_ESCENARIOS.md §7).
 *
 * La tinta es UNA banda que sube por el visor:
 *
 *      ┌────────────┐  frente  ← borde de pincel (la forma del canto entrante)
 *      │ ▓▓▓▓▓▓▓▓▓▓ │
 *      │ ▓ cuerpo ▓ │  cuerpo  ← un visor de alto, color solido
 *      │ ▓▓▓▓▓▓▓▓▓▓ │
 *      └────────────┘  cola    ← el mismo borde, del reves: es el que "borra"
 *
 * Todo es funcion pura de `t` (0..1 dentro de la transicion), asi que el scroll
 * la mueve en los dos sentidos y cualquier posicion es un fotograma legible:
 *   - cubrir  (0 .. COVER_END): el frente cruza el visor de abajo a arriba;
 *   - tarjeta (COVER_END .. CARD_END): el cuerpo lo cubre todo y la banda se queda quieta;
 *   - borrar  (CARD_END .. 1): la cola cruza el visor y descubre el escenario nuevo.
 * El cambio de escenario ocurre en SWAP_AT (dentro de la fase de tarjeta), oculto.
 *
 * Los valores son px respecto al tope del visor; se calculan para que la banda
 * entre y salga entera por los bordes, sin cortes ni huecos.
 */

function finiteOr(value: number, fallback: number): number {
  return Number.isFinite(value) ? value : fallback;
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

/** Alto, en px enteros, de cada borde de pincel de la banda para un visor dado. */
export function inkEdgeHeight(visorHeight: number): number {
  const scaled = Math.round(finiteOr(visorHeight, 0) * INK_EDGE_RATIO);
  return clamp(scaled, INK_EDGE_MIN_PX, INK_EDGE_MAX_PX);
}

/** Alto total de la banda: frente + cuerpo (un visor) + cola. */
export function inkBandHeight(visorHeight: number, edgeHeight: number): number {
  return visorHeight + 2 * edgeHeight;
}

/**
 * Posicion vertical del borde SUPERIOR de la banda, en px respecto al tope del
 * visor: `visorHeight` (entera debajo) al empezar y `-alto de banda` (entera
 * encima) al acabar. Solo sube, de forma lineal con el scroll en las fases de
 * cubrir y borrar, y se queda quieta durante la tarjeta.
 */
export function inkBandTop(t: number, visorHeight: number, edgeHeight: number): number {
  const progress = clamp(finiteOr(t, 0), 0, 1);

  if (progress <= COVER_END) {
    // Cubrir: de "justo debajo del visor" a "el frente ya salio por arriba".
    return visorHeight - (progress / COVER_END) * (visorHeight + edgeHeight);
  }

  if (progress <= CARD_END) return -edgeHeight;

  // Borrar: la cola recorre el visor y la banda acaba entera por encima.
  const erased = (progress - CARD_END) / (1 - CARD_END);
  return -edgeHeight - erased * (inkBandHeight(visorHeight, edgeHeight) - edgeHeight);
}

/**
 * Opacidad 0..1 de la tarjeta de capitulo. Solo se ve cuando la tinta cubre el
 * centro del visor, que es donde se lee: aparece y se va con un fundido corto,
 * simetrico alrededor de SWAP_AT, y esta del todo opaca durante la fase de tarjeta
 * (el cambio de escenario queda tapado por la tinta Y por la tarjeta).
 */
export function chapterCardOpacity(t: number): number {
  const progress = clamp(finiteOr(t, 0), 0, 1);
  const entering = smoothstep(CARD_SHOW_START, CARD_SHOW_FULL, progress);
  const leaving = smoothstep(CARD_HIDE_START, CARD_HIDE_END, progress);
  return entering * (1 - leaving);
}

/**
 * Cuanto del subrayado de pincel de la tarjeta esta dibujado (0..1, para
 * `pathLength`). Se dibuja con el scroll hasta SWAP_AT y ahi se queda: al irse la
 * tarjeta se va entera, no se "desdibuja".
 */
export function chapterStrokeProgress(t: number): number {
  return smoothstep(CARD_STROKE_START, SWAP_AT, clamp(finiteOr(t, 0), 0, 1));
}

/**
 * Si el subrayado debe pintarse con ese `pathLength`. Una raya de longitud casi
 * nula con `stroke-linecap: round` dibuja un PUNTO en cada extremo (no una raya):
 * hasta que no es una raya de verdad, no se pinta.
 */
export function isChapterStrokeVisible(progress: number): boolean {
  return Number.isFinite(progress) && progress >= CARD_STROKE_MIN_VISIBLE;
}

/**
 * Progreso 0..1 de la cortina de un salto a los `elapsedMs` de empezar: lineal en el
 * tiempo (el movimiento lo da la banda, no una curva). Una duracion nula o negativa
 * acaba ya, sin dividir por 0; un tiempo no finito no avanza.
 */
export function curtainProgress(elapsedMs: number, durationMs: number): number {
  if (durationMs <= 0) return 1;
  return clamp(finiteOr(elapsedMs, 0) / durationMs, 0, 1);
}

/** Hay algo que pintar solo DENTRO de la transicion: en los extremos la banda esta fuera del visor. */
export function isInkBandVisible(t: number): boolean {
  return Number.isFinite(t) && t > 0 && t < 1;
}
