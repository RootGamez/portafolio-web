import { motion, useTransform } from "motion/react";
import { useStage } from "@/components/stage/StageContext";
import { drawFrame, type ScrubRange } from "@/lib/stage/scrub";

type Props = {
  /** Tramo del progreso del escenario (0..1) en el que se dibuja. Se lee al montar. */
  readonly range: ScrubRange;
  readonly d: string;
  readonly className?: string;
  readonly fill?: string;
  readonly stroke?: string;
  readonly strokeWidth?: number | string;
  readonly strokeLinecap?: "butt" | "round" | "square";
};

/**
 * Un trazo SVG que se dibuja con el SCROLL (`pathLength` 0 → 1 a lo largo de su
 * tramo del escenario). Se rebobina al volver atras. Va dentro de un `<svg>` del
 * llamador, que decide el viewBox y el `aria-hidden`.
 *
 * En modo lineal es un `<path>` normal, dibujado entero y sin atributos de
 * animacion.
 */
export function ScrubDraw({ range, ...pathProps }: Props) {
  const { mode, progress } = useStage();
  const pathLength = useTransform(() => drawFrame(progress.get(), range).pathLength);
  const opacity = useTransform(() => drawFrame(progress.get(), range).opacity);

  if (mode === "linear") return <motion.path {...pathProps} />;

  return <motion.path {...pathProps} style={{ pathLength }} opacity={opacity} />;
}
