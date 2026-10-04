import type { ReactNode } from "react";
import { motion, useTransform } from "motion/react";
import { useStage } from "@/components/stage/StageContext";
import { parallaxY, type ScrubRange } from "@/lib/stage/scrub";

/** El escenario entero: de que empieza hasta que se va. */
const WHOLE_STAGE: ScrubRange = [0, 1];

type Props = {
  readonly children: ReactNode;
  /** Px que sube a lo largo del tramo (negativo: baja). */
  readonly distance: number;
  /** Tramo del progreso del escenario (0..1). Por defecto, todo el escenario. Se lee al montar. */
  readonly range?: ScrubRange;
  readonly className?: string;
};

/**
 * Paralaje ligado al scroll: el contenido sube `distance` px mas que el resto a
 * lo largo de su tramo. Arranca en 0, asi que el primer fotograma del escenario
 * es el mismo que en el modo lineal; solo `transform` (no toca el layout).
 *
 * En modo lineal no se desplaza nada.
 */
export function ScrubParallax({ children, distance, range = WHOLE_STAGE, className = "" }: Props) {
  const { mode, progress } = useStage();
  const y = useTransform(() => parallaxY(progress.get(), range, distance));

  if (mode === "linear") return <div className={className}>{children}</div>;

  return (
    <motion.div className={className} style={{ y }}>
      {children}
    </motion.div>
  );
}
