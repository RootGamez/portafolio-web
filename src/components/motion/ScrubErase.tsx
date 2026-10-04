import type { ReactNode } from "react";
import { motion, useMotionValue, useTransform } from "motion/react";
import { useStage } from "@/components/stage/StageContext";
import { eraseMask, type ScrubOver, type ScrubRange } from "@/lib/stage/scrub";

type Props = {
  readonly children: ReactNode;
  /** Tramo (0..1) en el que se borra. Se lee al montar. */
  readonly range: ScrubRange;
  /** Sobre que avance se mide el tramo. Por defecto la intro del escenario. */
  readonly over?: ScrubOver;
  readonly className?: string;
};

/**
 * El contenido se BORRA con el scroll: una mascara con el borde difuminado lo
 * barre de izquierda a derecha, como tinta que se retira del papel. Es la
 * salida de una escena antes de su transicion; al volver atras reaparece.
 *
 * Solo pinta: el texto sigue en el DOM y en el arbol de accesibilidad. Si el
 * teclado enfoca algo de dentro, se ve entero mientras tenga el foco (WCAG
 * 2.4.7). En modo lineal no lleva mascara.
 */
export function ScrubErase({ children, range, over = "intro", className = "" }: Props) {
  const { mode, progress: stageProgress, intro } = useStage();
  const progress = over === "intro" ? intro : stageProgress;
  const focused = useMotionValue(false);
  const maskImage = useTransform(() => (focused.get() ? "none" : eraseMask(progress.get(), range)));

  if (mode === "linear") return <div className={className}>{children}</div>;

  return (
    <motion.div
      className={className}
      style={{ maskImage }}
      onFocus={() => focused.set(true)}
      onBlur={() => focused.set(false)}
    >
      {children}
    </motion.div>
  );
}
