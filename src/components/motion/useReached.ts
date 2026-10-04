import { useContext, useState } from "react";
import { motionValue, useMotionValueEvent } from "motion/react";
import { ReachContext } from "./useScrubSource";

/** Fuera de un `ScrubReach` no hay alcance que escuchar: un valor fijo y "alcanzado". */
const ALWAYS_REACHED = motionValue(1);

/**
 * true cuando la linea de lectura ha cruzado al menos `threshold` (0..1) del
 * `ScrubReach` que envuelve al componente. Fuera de un `ScrubReach` (modo
 * lineal, o un componente que no esta en una escena larga) es siempre true.
 *
 * Es ESTADO de React a proposito, para decisiones discretas (reproducir o no un
 * video): solo re-renderiza al cruzar el umbral, no en cada fotograma.
 */
export function useReached(threshold: number): boolean {
  const reach = useContext(ReachContext);
  const [reached, setReached] = useState(() => !reach || reach.get() >= threshold);
  useMotionValueEvent(reach ?? ALWAYS_REACHED, "change", (value) => setReached(value >= threshold));
  return !reach || reached;
}
