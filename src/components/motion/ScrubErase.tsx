import type { ReactNode } from "react";
import { motion, useTransform } from "motion/react";
import { useFocusHold } from "@/hooks/useFocusHold";
import { eraseMask, writeMask, type ScrubOver, type ScrubRange } from "@/lib/stage/scrub";
import { useScrubSource } from "./useScrubSource";

type Props = {
  readonly children: ReactNode;
  /** Tramo (0..1) en el que se borra. Se lee al montar. */
  readonly range: ScrubRange;
  /** Sobre que avance se mide el tramo. Por defecto la intro del escenario. */
  readonly over?: ScrubOver;
  /**
   * `erase` (por defecto): se borra de izquierda a derecha. `write`: lo
   * contrario, se ESCRIBE de izquierda a derecha, como un pincel que avanza.
   */
  readonly direction?: "erase" | "write";
  readonly className?: string;
};

/**
 * El contenido se BORRA con el scroll: una mascara con el borde difuminado lo
 * barre de izquierda a derecha, como tinta que se retira del papel. Es la
 * salida de una escena antes de su transicion; al volver atras reaparece. Con
 * `direction="write"` hace lo contrario: lo ESCRIBE de izquierda a derecha.
 *
 * Solo pinta: el texto sigue en el DOM y en el arbol de accesibilidad. Si el
 * teclado enfoca algo de dentro, se ve entero mientras tenga el foco (WCAG
 * 2.4.7). En modo lineal no lleva mascara.
 */
export function ScrubErase({
  children,
  range,
  over = "intro",
  direction = "erase",
  className = "",
}: Props) {
  const { mode, source: progress } = useScrubSource(over);
  const { focused, onFocus, onBlur } = useFocusHold();
  const mask = direction === "write" ? writeMask : eraseMask;
  const maskImage = useTransform(() => (focused.get() ? "none" : mask(progress.get(), range)));

  if (mode === "linear") return <div className={className}>{children}</div>;

  return (
    <motion.div
      className={className}
      style={{ maskImage }}
      onFocus={onFocus}
      onBlur={onBlur}
    >
      {children}
    </motion.div>
  );
}
