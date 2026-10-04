import { FIELD_COVER_END, FIELD_ERASE_START, TONE_PITCHES_PX } from "@/lib/stage/config";
import { locate, type Layout } from "@/lib/stage/timeline";
import type { TransitionEffect, TransitionSpec } from "@/lib/stage/transitions";
import type { Ground } from "@/sections/meta";

/**
 * Que tiene que pintar la tinta WebGL en una posicion de scroll
 * (docs/PLAN_ESCENARIOS.md §6, «Shader»).
 *
 * Es una funcion PURA de la posicion, como el resto del motor: el renderer solo
 * traduce este objeto a uniforms. Vive fuera del chunk WebGL a proposito: es
 * pequena y asi se prueba sin GL.
 *
 * El shader no mueve una banda: umbraliza un "campo de llegada" f(x, y) en 0..1.
 * Un pixel esta cubierto cuando `cover` supera su f, y vuelve a verse cuando
 * `erase` supera su g (el campo de salida). Con cover = 1 y erase = 0 no queda un
 * solo pixel sin tinta, sea cual sea el efecto: ahi es donde cambia el escenario.
 */

/** Numero de cada efecto en el shader (uniform `uEffect`). Lo comparten TS y GLSL. */
export const EFFECT_IDS: Readonly<Record<TransitionEffect, number>> = {
  "brush-sweep": 0,
  "vertical-stroke": 1,
  "ink-flood": 2,
  "dry-brush": 3,
  splash: 4,
  wash: 5,
  tear: 6,
  sun: 7,
  seal: 8,
};

export type FieldPhases = {
  /** 0..1: cuanto del campo de llegada esta ya cubierto. */
  readonly cover: number;
  /** 0..1: cuanto del campo de salida se ha borrado ya. */
  readonly erase: number;
};

export type InkFieldFrame = FieldPhases & {
  /** Indice de la transicion (tambien es la semilla del ruido). */
  readonly index: number;
  readonly effect: number;
  readonly ink: Ground;
  readonly mirror: boolean;
  /** Paso de la trama de puntos del frente, en px CSS. */
  readonly tonePitch: number;
};

function clamp01(value: number): number {
  return Math.min(Math.max(value, 0), 1);
}

/** Cubrir y borrar para un `t` (0..1) de la transicion: lineales con el scroll. */
export function fieldPhases(t: number): FieldPhases {
  const progress = Number.isFinite(t) ? clamp01(t) : 0;
  return {
    cover: clamp01(progress / FIELD_COVER_END),
    erase: clamp01((progress - FIELD_ERASE_START) / (1 - FIELD_ERASE_START)),
  };
}

/**
 * El fotograma de tinta para un scroll: `null` si no hay ninguna transicion en
 * curso (o si su `t` es 0, cuando aun no hay nada que pintar).
 */
export function inkFieldFrame(
  layout: Layout,
  scroll: number,
  transitions: readonly TransitionSpec[],
): InkFieldFrame | null {
  const position = locate(layout, scroll);
  if (position.kind !== "transition" || position.t <= 0) return null;

  const spec: TransitionSpec | undefined = transitions[position.from];
  if (!spec) return null;

  return {
    index: position.from,
    effect: EFFECT_IDS[spec.effect],
    ink: spec.ink,
    mirror: spec.mirror,
    ...fieldPhases(position.t),
    tonePitch: TONE_PITCHES_PX[position.from % TONE_PITCHES_PX.length],
  };
}

/**
 * Si dos fotogramas pintan lo mismo (el renderer se ahorra el dibujo). Compara
 * TODOS los campos: si InkFieldFrame gana uno, hay que anadirlo aqui.
 */
export function sameFieldFrame(a: InkFieldFrame | null, b: InkFieldFrame | null): boolean {
  if (a === null || b === null) return a === b;
  return (
    a.index === b.index &&
    a.cover === b.cover &&
    a.erase === b.erase &&
    a.effect === b.effect &&
    a.ink === b.ink &&
    a.mirror === b.mirror &&
    a.tonePitch === b.tonePitch
  );
}
