import type { ReactNode } from "react";
import { motion } from "motion/react";
import { EASE_INK } from "@/lib/motion";
import { usePrefersReducedMotion } from "@/hooks/usePrefersReducedMotion";

/** Etiquetas que de verdad se usan como envoltorio de revelado. */
type RevealTag = "div" | "li" | "span";

type Props = {
  readonly children: ReactNode;
  /** Distancia de entrada en px. Cuanto mas grande el bloque, mas recorrido. */
  readonly y?: number;
  readonly delay?: number;
  /** Fraccion visible que dispara la entrada (viewport.amount de Motion). */
  readonly amount?: number;
  readonly duration?: number;
  /** Etiqueta a renderizar. `li` cuando el padre es una lista, o el HTML se rompe. */
  readonly as?: RevealTag;
  readonly className?: string;
};

const TAG: Record<RevealTag, typeof motion.div> = {
  div: motion.div,
  li: motion.li as typeof motion.div,
  span: motion.span as typeof motion.div,
};

/**
 * El revelado al entrar en viewport, en UN solo sitio.
 *
 * POR QUE EXISTE — el guard de `reduced`. Con `prefers-reduced-motion` Motion
 * no ejecuta la animacion, asi que un `initial={{ opacity: 0 }}` incondicional
 * dejaria el contenido en opacidad 0 PARA SIEMPRE: invisible, no solo quieto.
 * Es la trampa numero uno del proyecto (docs/DESIGN_SYSTEM.md §7, restriccion
 * 2). El patron correcto es `initial={reduced ? false : {...}}` — arrancar
 * VISIBLE y saltarse la animacion — y estaba escrito a mano en once sitios,
 * dependiendo de que cada autor se acordara. Aqui se escribe una vez.
 *
 * `once: true` en el viewport: el contenido no vuelve a desaparecer al subir.
 */
export function Reveal({
  children,
  y = 20,
  delay = 0,
  amount = 0.2,
  duration = 0.45,
  as = "div",
  className = "",
}: Props) {
  const reduced = usePrefersReducedMotion();
  const Component = TAG[as];

  return (
    <Component
      className={className}
      initial={reduced ? false : { opacity: 0, y }}
      whileInView={reduced ? undefined : { opacity: 1, y: 0 }}
      viewport={{ once: true, amount }}
      transition={{ duration, ease: EASE_INK, delay }}
    >
      {children}
    </Component>
  );
}
