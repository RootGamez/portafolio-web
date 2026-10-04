import type { ReactNode } from "react";
import { motion, useTransform } from "motion/react";
import { useFocusHold } from "@/hooks/useFocusHold";
import { SCRUB_STAMP_FROM_SCALE } from "@/lib/stage/config";
import { stampFrame, type ScrubOver, type ScrubRange } from "@/lib/stage/scrub";
import { useScrubSource } from "./useScrubSource";

type Props = {
  readonly children: ReactNode;
  /** Tramo (0..1) en el que cae y golpea. Se lee al montar. */
  readonly range: ScrubRange;
  /** Sobre que avance se mide el tramo. Por defecto la intro del escenario. */
  readonly over?: ScrubOver;
  /** Escala desde la que cae. */
  readonly fromScale?: number;
  readonly className?: string;
};

/**
 * Se ESTAMPA con el scroll: cae grande y transparente, golpea (se aplasta un
 * poco) y se asienta, como un hanko o una onomatopeya de manga. Reversible: al
 * volver atras se levanta por el mismo camino. Solo `opacity` y `transform`.
 *
 * En modo lineal no lleva estilos. Si el teclado enfoca algo dentro, se pinta
 * quieto y entero (WCAG 2.4.7).
 */
export function ScrubStamp({
  children,
  range,
  over = "intro",
  fromScale = SCRUB_STAMP_FROM_SCALE,
  className = "",
}: Props) {
  const { mode, source: progress } = useScrubSource(over);
  const { focused, onFocus, onBlur } = useFocusHold();
  const opacity = useTransform(() =>
    focused.get() ? 1 : stampFrame(progress.get(), range, fromScale).opacity,
  );
  const scale = useTransform(() =>
    focused.get() ? 1 : stampFrame(progress.get(), range, fromScale).scale,
  );

  if (mode === "linear") return <div className={className}>{children}</div>;

  return (
    <motion.div className={className} style={{ opacity, scale }} onFocus={onFocus} onBlur={onBlur}>
      {children}
    </motion.div>
  );
}
