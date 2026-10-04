import { createContext, useContext } from "react";
import type { MotionValue } from "motion/react";
import { useStage } from "@/components/stage/StageContext";
import type { DeckMode } from "@/lib/stage/mode";
import type { ScrubOver } from "@/lib/stage/scrub";

/**
 * Lo que la linea de lectura ha cruzado del `ScrubReach` mas cercano (0..1).
 * null fuera de un `ScrubReach`.
 */
export const ReachContext = createContext<MotionValue<number> | null>(null);

export type ScrubSource = {
  readonly mode: DeckMode;
  /** El avance 0..1 sobre el que se mide el tramo de la primitiva. */
  readonly source: MotionValue<number>;
};

/**
 * El avance que mueve a una primitiva Scrub*: la intro del escenario, el
 * escenario entero o el alcance del `ScrubReach` que la envuelve. Un "reach"
 * sin `ScrubReach` alrededor cae a la intro: la primitiva se sigue viendo y
 * animando, solo que con otro ritmo.
 */
export function useScrubSource(over: ScrubOver): ScrubSource {
  const { mode, progress, intro } = useStage();
  const reach = useContext(ReachContext);
  if (over === "stage") return { mode, source: progress };
  if (over === "reach" && reach) return { mode, source: reach };
  return { mode, source: intro };
}
