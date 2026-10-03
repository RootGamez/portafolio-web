import type { EdgeVariant } from "@/components/ink/edgeShapes";
import type { Ground } from "@/sections/meta";

/**
 * La tabla de las transiciones de tinta entre escenarios
 * (docs/PLAN_ESCENARIOS.md §7). Una por cada par de escenarios adyacentes.
 *
 * Cada transicion es la version ANIMADA del canto de pincel que la seccion
 * entrante ya lleva en modo lineal (`edge` y `mirror` son los de esa seccion),
 * asi el modo lineal y el de escenarios hablan el mismo idioma visual.
 *
 * Reglas (las comprueba transitions.test.ts contra sectionsMeta):
 *  - cuando cambia el suelo, `ink` es el color del suelo ENTRANTE: la tinta
 *    cubre la pantalla y el cambio de escenario queda oculto detras;
 *  - cuando el suelo es el mismo, `ink` es de ACENTO (distinto del suelo), o
 *    no se veria nada;
 *  - ninguna transicion adyacente repite forma (DESIGN_SYSTEM §5.1).
 */
export type TransitionEffect =
  | "brush-sweep" // pincelada ancha con cerdas que cruza la pantalla y se borra con aguada
  | "vertical-stroke" // trazo vertical que acaba siendo el eje de la linea de tiempo
  | "ink-flood" // gotas que se funden hasta inundar la pantalla
  | "dry-brush" // pincel seco que arrastra el papel
  | "splash" // salpicadura con gotas que saltan lejos
  | "wash" // aguada diluida de lobulos redondeados
  | "tear" // papel rasgado en diagonal
  | "sun" // el disco dorado (enso) sube y lo llena
  | "seal"; // el sello hanko se estampa con una onda de tinta

export type TransitionSpec = {
  /** Slug del escenario que sale. */
  readonly from: string;
  /** Slug del escenario que entra. */
  readonly to: string;
  readonly effect: TransitionEffect;
  /** Color de la tinta, como suelo de la paleta. */
  readonly ink: Ground;
  /** Forma del frente de tinta: el canto de la seccion entrante. */
  readonly edge: EdgeVariant;
  readonly mirror: boolean;
};

export const TRANSITIONS: readonly TransitionSpec[] = [
  { from: "inicio", to: "sobre-mi", effect: "brush-sweep", ink: "sumi", edge: "rule", mirror: false },
  { from: "sobre-mi", to: "trayectoria", effect: "vertical-stroke", ink: "sumi", edge: "rule", mirror: true },
  { from: "trayectoria", to: "proyectos", effect: "ink-flood", ink: "sumi", edge: "sweep", mirror: false },
  { from: "proyectos", to: "mas-proyectos", effect: "dry-brush", ink: "washi", edge: "dry", mirror: false },
  { from: "mas-proyectos", to: "produccion", effect: "splash", ink: "shu", edge: "splash", mirror: false },
  { from: "produccion", to: "poderes", effect: "wash", ink: "washi", edge: "wash", mirror: false },
  { from: "poderes", to: "fuera-del-codigo", effect: "tear", ink: "sumi", edge: "tear", mirror: false },
  { from: "fuera-del-codigo", to: "contacto", effect: "sun", ink: "kin", edge: "sweep", mirror: true },
  { from: "contacto", to: "fin", effect: "seal", ink: "sumi", edge: "dry", mirror: true },
];

/** Un canto que es una MASA de pintura (todos menos `rule`, que es un trazo fino). */
export type MassEdge = Exclude<EdgeVariant, "rule">;

/**
 * Cuando el canto de la seccion es `rule` (mismo suelo en las dos secciones: solo
 * un trazo) no hay masa que usar de frente de tinta; se toma una segun el efecto.
 * Elegidas para que ningun frente se repita en transiciones adyacentes.
 */
const FRONT_FOR_RULE: Readonly<Partial<Record<TransitionEffect, MassEdge>>> = {
  "brush-sweep": "sweep",
  "vertical-stroke": "dry",
};

/**
 * La forma del frente de tinta de una transicion: siempre una MASA, porque la
 * banda de tinta cubre la pantalla. Es el canto de la seccion entrante y, si ese
 * canto es solo un trazo, la forma propia del efecto (`sweep` si no tiene).
 */
export function frontEdgeOf(spec: TransitionSpec): MassEdge {
  if (spec.edge !== "rule") return spec.edge;
  return FRONT_FOR_RULE[spec.effect] ?? "sweep";
}

/** La transicion que sale del escenario `index`; `undefined` en el ultimo o fuera de rango. */
export function transitionAfter(index: number): TransitionSpec | undefined {
  return TRANSITIONS[index];
}
