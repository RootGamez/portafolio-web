import type { ReactNode } from "react";
import { motion, useTransform } from "motion/react";
import { useFocusHold } from "@/hooks/useFocusHold";
import { SCRUB_REVEAL_DISTANCE_PX } from "@/lib/stage/config";
import { revealFrame, type ScrubOver, type ScrubRange } from "@/lib/stage/scrub";
import { useScrubSource } from "./useScrubSource";

/** Etiquetas que de verdad se usan como envoltorio de revelado. */
type ScrubTag = "div" | "li" | "span";

type Props = {
  readonly children: ReactNode;
  /** Tramo (0..1) en el que aparece. Se lee al montar. */
  readonly range: ScrubRange;
  /** Sobre que avance se mide el tramo. Por defecto la intro del escenario. */
  readonly over?: ScrubOver;
  /** Px que sube al aparecer. */
  readonly distance?: number;
  /** Etiqueta a renderizar. `li` cuando el padre es una lista, o el HTML se rompe. */
  readonly as?: ScrubTag;
  readonly className?: string;
};

const TAG: Record<ScrubTag, typeof motion.div> = {
  div: motion.div,
  li: motion.li as typeof motion.div,
  span: motion.span as typeof motion.div,
};

/**
 * Aparece con el SCROLL dentro de su escenario (Fase 4): la opacidad y la subida
 * son funcion pura del progreso del escenario, asi que el gesto se rebobina al
 * volver atras y cualquier posicion es un fotograma legible. Es el hermano
 * ligado al scroll de `Reveal` (que va por tiempo y una sola vez).
 *
 * En modo lineal (reduced-motion, "Modo simple", impresion) no lleva NINGUN
 * estilo: el contenido se ve tal cual, como en el sitio clasico (ley n.º 2 de
 * DESIGN_SYSTEM §7).
 *
 * Foco: si el teclado entra en algo de dentro antes de que el scroll lo haya
 * revelado, se muestra mientras tenga el foco. Un enlace enfocado e invisible
 * incumple el foco visible (WCAG 2.4.7).
 */
export function ScrubReveal({
  children,
  range,
  over = "intro",
  distance = SCRUB_REVEAL_DISTANCE_PX,
  as = "div",
  className = "",
}: Props) {
  const { mode, source: progress } = useScrubSource(over);
  const { focused, onFocus, onBlur } = useFocusHold();
  const opacity = useTransform(() =>
    focused.get() ? 1 : revealFrame(progress.get(), range, distance).opacity,
  );
  const y = useTransform(() => (focused.get() ? 0 : revealFrame(progress.get(), range, distance).y));
  const Component = TAG[as];

  if (mode === "linear") return <Component className={className}>{children}</Component>;

  return (
    <Component
      className={className}
      style={{ opacity, y }}
      onFocus={onFocus}
      onBlur={onBlur}
    >
      {children}
    </Component>
  );
}
