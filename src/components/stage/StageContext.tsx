import { createContext, useContext } from "react";
import { motionValue, type MotionValue } from "motion/react";
import type { DeckMode } from "@/lib/stage/mode";

/**
 * Lo que cada escenario le cuenta a su contenido (docs/PLAN_ESCENARIOS.md §6).
 *
 * Existe por una razon medida: `IntersectionObserver` ignora `visibility`,
 * `opacity`, `inert` y `clip-path`, asi que con las capas apiladas TODO el
 * contenido "esta en vista" desde el primer frame. Los reveals por
 * `whileInView` dispararian todos a la vez, fuera de pantalla. Con esto cada
 * reveal y cada video sabe si su escenario es el que de verdad se ve.
 */
export type StageContextValue = {
  readonly mode: DeckMode;
  /** Posicion del escenario en la pista; -1 fuera de un deck. */
  readonly index: number;
  /** El escenario que el usuario esta viendo (cambia en el punto medio de la transicion). */
  readonly isActive: boolean;
  /** Activo o adyacente: lo bastante cerca para precargar medios pesados. */
  readonly isNear: boolean;
  /** Progreso 0..1 del escenario. En modo lineal vale 1: todo en su estado final. */
  readonly progress: MotionValue<number>;
};

/**
 * Valor por defecto = el modo lineal. Un componente montado fuera de un deck
 * (modo lineal, o un test) ve un escenario siempre activo y ya completado, que
 * es exactamente el comportamiento del sitio clasico: todo visible.
 *
 * Es una constante de modulo para que sea SIEMPRE el mismo objeto y un
 * consumidor no se re-renderice por una identidad nueva en cada render.
 */
export const LINEAR_STAGE: StageContextValue = {
  mode: "linear",
  index: -1,
  isActive: true,
  isNear: true,
  progress: motionValue(1),
};

export const StageContext = createContext<StageContextValue>(LINEAR_STAGE);

export function useStage(): StageContextValue {
  return useContext(StageContext);
}
