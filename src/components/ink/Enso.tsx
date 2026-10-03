import { motion } from "motion/react";
import { usePrefersReducedMotion } from "@/hooks/usePrefersReducedMotion";
import { useStageInView } from "@/hooks/useStageInView";
import { EASE_INK } from "@/lib/motion";

type Props = {
  /** Color de relleno del disco. Por defecto el oro de los posters. */
  readonly fill?: string;
  readonly className?: string;
  /** Si es true dibuja solo el trazo del circulo, sin disco relleno. */
  readonly outline?: boolean;
};

/**
 * El enso (円相): el circulo de un solo trazo. En los posters de referencia
 * es el disco de oro que hace de sol detras de la figura.
 *
 * Decorativo -> aria-hidden. Se dibuja una vez al entrar en viewport con su
 * escenario activo (useStageInView). El observer va en el <svg> raiz y no en
 * la forma: asi vale igual para el disco que para el trazo.
 */
export function Enso({ fill = "var(--kin-500)", className = "", outline = false }: Props) {
  const reduced = usePrefersReducedMotion();
  const { ref, shown } = useStageInView<SVGSVGElement>(0.4);
  const drawn = reduced || shown;

  return (
    <svg
      ref={ref}
      aria-hidden="true"
      focusable="false"
      viewBox="0 0 100 100"
      className={className}
    >
      {!outline && (
        <motion.circle
          cx="50"
          cy="50"
          r="46"
          fill={fill}
          initial={reduced ? false : { scale: 0.82, opacity: 0 }}
          animate={drawn ? { scale: 1, opacity: 1 } : { scale: 0.82, opacity: 0 }}
          transition={{ duration: 0.7, ease: EASE_INK }}
          style={{ transformOrigin: "50% 50%" }}
        />
      )}
      {outline && (
        <motion.path
          d="M50 6 A44 44 0 1 1 49 6"
          fill="none"
          stroke={fill}
          strokeWidth="7"
          strokeLinecap="round"
          initial={reduced ? false : { pathLength: 0 }}
          animate={{ pathLength: drawn ? 1 : 0 }}
          transition={{ duration: 0.9, ease: EASE_INK }}
        />
      )}
    </svg>
  );
}
