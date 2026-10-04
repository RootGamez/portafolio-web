import {
  CARD_END,
  COVER_END,
  DEFAULT_INTRO_SCREENS,
  SWAP_AT,
  TRANSITION_SCREENS,
} from "./config";

/**
 * Linea de tiempo del modo escenarios (docs/PLAN_ESCENARIOS.md §6).
 *
 * Es el corazon del modo y por eso es una FUNCION PURA de la posicion del
 * scroll: sin DOM, sin estado, sin efectos. Dado el mismo layout y el mismo
 * scroll devuelve siempre lo mismo, asi que subir y bajar es automaticamente
 * reversible y todo se puede probar sin navegador.
 *
 * La pista de scroll es una secuencia de tramos:
 *
 *   E0 · T01 · E1 · T12 · ... · E(n-1)
 *
 * donde E es un escenario y T la transicion de tinta entre dos escenarios. Un
 * escenario dura `intro + pan`:
 *   - intro: el contenido se compone en su sitio (coreografia) antes de moverse;
 *   - pan:   lo que el contenido desborda del visor, que sube 1:1 con el scroll
 *            para que se sienta como un scroll normal.
 *
 * Todas las longitudes son enteros en px: los tramos son contiguos por
 * construccion y los tests pueden comparar con igualdad exacta.
 */

/** Lo que el motor necesita saber de cada escenario. */
export type StageSpec = {
  /** Alto natural del contenido, en px (offsetHeight de su envoltorio). */
  readonly contentHeight: number;
  /** Pausa inicial en alturas de visor. Por defecto DEFAULT_INTRO_SCREENS. */
  readonly introScreens?: number;
};

export type StageSegment = {
  readonly start: number;
  readonly introLength: number;
  readonly panLength: number;
  /** Alto del contenido, en px (el de la spec, redondeado). */
  readonly contentLength: number;
  /** introLength + panLength. */
  readonly length: number;
  readonly end: number;
};

export type TransitionSegment = {
  readonly start: number;
  readonly length: number;
  readonly end: number;
};

export type Layout = {
  /** Alto del visor con el que se construyo, en px. */
  readonly viewportHeight: number;
  readonly stages: readonly StageSegment[];
  /** Siempre `stages.length - 1` elementos. */
  readonly transitions: readonly TransitionSegment[];
  /** Px de scroll que recorre toda la pista. */
  readonly totalLength: number;
  /** Alto de la pista: el scroll mas lo que ocupa el visor sticky. */
  readonly trackHeight: number;
};

export type TransitionPhase = "cover" | "card" | "reveal";

export type StagePosition = {
  readonly kind: "stage";
  readonly index: number;
  /** 0..1 dentro del tramo del escenario (1 si el tramo mide 0). */
  readonly progress: number;
  /** Px que ha subido el contenido. */
  readonly pan: number;
};

export type TransitionPosition = {
  readonly kind: "transition";
  readonly from: number;
  readonly to: number;
  /** 0..1 dentro de la transicion. */
  readonly t: number;
  readonly phase: TransitionPhase;
  /** 0..1 dentro de la fase actual. */
  readonly phaseT: number;
};

export type Position = StagePosition | TransitionPosition;

/** Layout inicial, antes de medir nada. */
export const EMPTY_LAYOUT: Layout = {
  viewportHeight: 0,
  stages: [],
  transitions: [],
  totalLength: 0,
  trackHeight: 0,
};

const DEFAULT_POSITION: StagePosition = { kind: "stage", index: 0, progress: 0, pan: 0 };

function finiteOr(value: number, fallback: number): number {
  return Number.isFinite(value) ? value : fallback;
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

/**
 * Curva suave 0..1 entre dos bordes (la de GLSL). Con bordes iguales se
 * comporta como un escalon: nunca divide por 0.
 */
export function smoothstep(edge0: number, edge1: number, x: number): number {
  if (edge0 === edge1) return x < edge0 ? 0 : 1;
  const t = clamp((x - edge0) / (edge1 - edge0), 0, 1);
  return t * t * (3 - 2 * t);
}

/**
 * Construye el layout a partir de las alturas medidas. Es inmutable de cara al
 * llamador: no toca `specs` y devuelve estructuras nuevas. `transitionScreens` es
 * el tempo (largo de cada transicion en visores); por defecto el de config.ts.
 */
export function buildLayout(
  specs: readonly StageSpec[],
  viewportHeight: number,
  transitionScreens: number = TRANSITION_SCREENS,
): Layout {
  const vh = Math.max(1, Math.round(finiteOr(viewportHeight, 1)));
  const transitionLength = Math.max(1, Math.round(finiteOr(transitionScreens, TRANSITION_SCREENS) * vh));

  const stages: StageSegment[] = [];
  const transitions: TransitionSegment[] = [];
  let cursor = 0;

  specs.forEach((spec, index) => {
    const introScreens = finiteOr(spec.introScreens ?? DEFAULT_INTRO_SCREENS, DEFAULT_INTRO_SCREENS);
    const introLength = Math.max(0, Math.round(introScreens * vh));
    const contentLength = Math.max(0, Math.round(finiteOr(spec.contentHeight, 0)));
    const panLength = Math.max(0, contentLength - vh);
    const length = introLength + panLength;

    stages.push({ start: cursor, introLength, panLength, contentLength, length, end: cursor + length });
    cursor += length;

    if (index < specs.length - 1) {
      transitions.push({ start: cursor, length: transitionLength, end: cursor + transitionLength });
      cursor += transitionLength;
    }
  });

  return { viewportHeight: vh, stages, transitions, totalLength: cursor, trackHeight: cursor + vh };
}

function stagePosition(segment: StageSegment, index: number, scroll: number): StagePosition {
  const progress =
    segment.length === 0 ? 1 : clamp((scroll - segment.start) / segment.length, 0, 1);
  const pan = clamp(scroll - segment.start - segment.introLength, 0, segment.panLength);
  return { kind: "stage", index, progress, pan };
}

function transitionPosition(
  segment: TransitionSegment,
  from: number,
  scroll: number,
): TransitionPosition {
  const t = clamp((scroll - segment.start) / segment.length, 0, 1);

  if (t < COVER_END) {
    return { kind: "transition", from, to: from + 1, t, phase: "cover", phaseT: t / COVER_END };
  }
  if (t < CARD_END) {
    const phaseT = (t - COVER_END) / (CARD_END - COVER_END);
    return { kind: "transition", from, to: from + 1, t, phase: "card", phaseT };
  }
  const phaseT = (t - CARD_END) / (1 - CARD_END);
  return { kind: "transition", from, to: from + 1, t, phase: "reveal", phaseT };
}

/**
 * Donde esta el scroll dentro de la pista. Cada tramo es [start, end): el
 * limite entre un escenario y su transicion pertenece a la transicion (t = 0),
 * y el de la transicion al siguiente escenario (progreso 0). Solo el final del
 * ultimo escenario es cerrado.
 */
export function locate(layout: Layout, scroll: number): Position {
  const { stages, transitions, totalLength } = layout;
  if (stages.length === 0) return DEFAULT_POSITION;

  const s = clamp(finiteOr(scroll, 0), 0, totalLength);
  const lastIndex = stages.length - 1;

  for (let i = 0; i < stages.length; i += 1) {
    const stage = stages[i];
    if (s < stage.end || (i === lastIndex && s <= stage.end)) {
      return stagePosition(stage, i, s);
    }

    const transition: TransitionSegment | undefined = transitions[i];
    if (transition && s < transition.end) {
      return transitionPosition(transition, i, s);
    }
  }

  // Inalcanzable por el clamp de arriba; se deja un final seguro.
  return stagePosition(stages[lastIndex], lastIndex, totalLength);
}

/**
 * Escenario "activo": el que reciben el riel, el lector de pantalla y los
 * videos. En una transicion cambia en SWAP_AT, justo cuando la tinta lo tapa
 * todo, asi el cambio nunca se ve.
 */
export function activeIndex(position: Position): number {
  if (position.kind === "stage") return position.index;
  return position.t < SWAP_AT ? position.from : position.to;
}

/** Scroll en el que empieza un escenario (donde cae un salto desde el riel). */
export function offsetOfStage(layout: Layout, index: number): number {
  if (layout.stages.length === 0) return 0;
  const safe = clamp(Math.trunc(finiteOr(index, 0)), 0, layout.stages.length - 1);
  return layout.stages[safe].start;
}

/** Px que ha subido el contenido de un escenario para un scroll dado. */
export function panFor(layout: Layout, index: number, scroll: number): number {
  const stage: StageSegment | undefined = layout.stages[index];
  if (!stage) return 0;
  return clamp(finiteOr(scroll, 0) - stage.start - stage.introLength, 0, stage.panLength);
}

/**
 * Scroll en el que el contenido de un escenario ha subido exactamente `pan` px
 * (recortado a 0..panLength). Inversa de `panFor`: sirve para llevar el scroll
 * a donde un elemento enfocado por teclado quede a la vista.
 */
export function scrollForPan(layout: Layout, index: number, pan: number): number {
  const stage: StageSegment | undefined = layout.stages[index];
  if (!stage) return 0;
  return stage.start + stage.introLength + clamp(finiteOr(pan, 0), 0, stage.panLength);
}

/** Avance 0..1 de un escenario: 0 antes de llegar, 1 al dejarlo atras. */
export function stageProgress(layout: Layout, index: number, scroll: number): number {
  const stage: StageSegment | undefined = layout.stages[index];
  if (!stage) return 0;
  const s = finiteOr(scroll, 0);
  if (stage.length === 0) return s >= stage.start ? 1 : 0;
  return clamp((s - stage.start) / stage.length, 0, 1);
}

/**
 * La LINEA DE LECTURA de un escenario, en px de su CONTENIDO (0 = su borde de
 * arriba): hasta donde ha "llegado" el usuario. Sirve para que cada elemento se
 * anime AL ALCANZARLO (Fase 4, `ScrubReach`), igual en cualquier alto de pantalla.
 *
 *   - antes del escenario esta en su arranque (`startRatio * visor`): lo que hay
 *     por encima ya cuenta como leido y no aparece de golpe al destaparse la tinta;
 *   - durante la intro baja en linea recta hasta `lineRatio * visor` (o hasta el
 *     fondo del contenido, si el escenario cabe pero pasa de la linea);
 *   - durante el pan el contenido sube y la linea baja a la vez, del
 *     `lineRatio` del visor a su borde: al acabar el escenario TODO esta leido
 *     (con la linea quieta, lo ultimo nunca se completaria).
 */
export function readingLine(
  layout: Layout,
  index: number,
  scroll: number,
  startRatio: number,
  lineRatio: number,
): number {
  const stage: StageSegment | undefined = layout.stages[index];
  if (!stage) return 0;
  const vh = layout.viewportHeight;
  const start = startRatio * vh;
  const line = lineRatio * vh;
  const introEnd = stage.panLength > 0 ? line : Math.max(line, stage.contentLength);
  const s = finiteOr(scroll, Number.NEGATIVE_INFINITY) - stage.start;
  if (s < 0) return start;
  if (s < stage.introLength) return start + ((introEnd - start) * s) / stage.introLength;
  if (stage.panLength === 0) return introEnd;
  const panT = clamp((s - stage.introLength) / stage.panLength, 0, 1);
  return line + (stage.contentLength - line) * panT;
}

/**
 * Avance 0..1 de la INTRO de un escenario: 0 al empezar, 1 al acabar la intro
 * (y durante todo el pan). La coreografia de cada escena (Fase 4) va aqui y no
 * sobre `stageProgress`: el pan depende del alto del contenido en cada
 * dispositivo, la intro no, asi que un tramo cae en el mismo sitio en movil y
 * en escritorio.
 */
export function introProgress(layout: Layout, index: number, scroll: number): number {
  const stage: StageSegment | undefined = layout.stages[index];
  if (!stage) return 0;
  const s = finiteOr(scroll, 0);
  if (stage.introLength === 0) return s >= stage.start ? 1 : 0;
  return clamp((s - stage.start) / stage.introLength, 0, 1);
}

/**
 * Avance 0..1 de la transicion que sale del escenario `index` (la que lo une con
 * el siguiente): 0 antes de empezar, 1 al acabar. 0 si ese indice no tiene
 * transicion. Es el `t` de `locate`, pero para UNA transicion concreta aunque no
 * sea la que esta en curso: cada banda de tinta lee la suya.
 */
export function transitionProgress(layout: Layout, index: number, scroll: number): number {
  const transition: TransitionSegment | undefined = layout.transitions[index];
  if (!transition) return 0;
  return clamp((finiteOr(scroll, 0) - transition.start) / transition.length, 0, 1);
}

/**
 * Opacidad de la capa de un escenario: 1 si es el ACTIVO y 0 si no. Una sola capa
 * se ve en cada punto del scroll; durante una transicion la saliente se ve hasta
 * SWAP_AT y la entrante desde ahi. El cambio es duro porque queda tapado por la
 * tinta (que lo cubre todo entre COVER_END y CARD_END), y asi el cambio visual y
 * el de estado (`activeIndex`: riel, `inert`, lector de pantalla) son el MISMO.
 *
 * Sin medidas (layout vacio) `locate` da el escenario 0 y su capa se ve: el Hero
 * pinta en el primer fotograma sin esperar a medir (su foto es el LCP).
 */
export function layerOpacity(layout: Layout, index: number, scroll: number): 0 | 1 {
  return activeIndex(locate(layout, scroll)) === index ? 1 : 0;
}
