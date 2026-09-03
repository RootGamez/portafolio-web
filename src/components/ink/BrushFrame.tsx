import type { ReactNode } from "react";

type Props = {
  readonly children: ReactNode;
  /** Grosor del borde entintado que rodea la forma, en px. */
  readonly border?: number;
  readonly className?: string;
};

/**
 * Empaqueta cualquier media en una forma de PINCELADA: los cuatro cantos
 * quedan irregulares, como una mancha de tinta sobre la que se ha pegado la
 * imagen, en vez de un rectangulo recortado.
 *
 * Tres capas, y el orden importa:
 *   1. la MISMA mascara, un poco mas grande y rellena de tinta -> hace de
 *      borde pintado que sigue el contorno irregular;
 *   2. el contenido, recortado por la mascara;
 *   3. grano de papel en multiply, para que la foto no parezca pegada encima
 *      del washi sino impresa sobre el.
 *
 * La mascara es un data-URI en ink.css (.brush-mask) y no un <mask> de SVG
 * referenciado por id: `mask-image: url(#id)` sobre elementos HTML tiene
 * soporte irregular en Safari, y el data-URI funciona en todas partes.
 */
export function BrushFrame({ children, border = 7, className = "" }: Props) {
  return (
    <div className={`relative ${className}`}>
      <span
        aria-hidden="true"
        className="brush-mask absolute bg-[var(--g-structure)]"
        style={{ inset: -border }}
      />
      <div className="brush-mask relative h-full w-full">
        {children}
        <span aria-hidden="true" className="paper-grain" />
      </div>
    </div>
  );
}
