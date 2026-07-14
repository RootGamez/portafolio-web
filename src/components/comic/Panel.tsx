import type { ReactNode } from "react";

type Props = {
  readonly children: ReactNode;
  /** Rotacion estatica. Whitelist cerrada: -3..+3. Mas de 3 grados rompe la lectura. */
  readonly rotate?: -3 | -2 | -1 | 0 | 1 | 2 | 3;
  /** Etiqueta de narracion (el recuadro amarillo arriba-izquierda de la vineta). */
  readonly caption?: string;
  readonly halftone?: false | "fine" | "medium" | "coarse";
  readonly className?: string;
};

const HALFTONE_CLASS: Record<string, string> = {
  fine: "halftone halftone--fine",
  medium: "halftone",
  coarse: "halftone halftone--coarse",
};

/**
 * La vineta. Borde 6px, sombra dura sin blur, radius 0.
 * Estatica: no lleva hover (no se pone hover a algo que no es clicable).
 */
export function Panel({
  children,
  rotate = 0,
  caption,
  halftone = false,
  className = "",
}: Props) {
  return (
    <article
      className={`relative border-panel border-[var(--color-structure)] bg-[var(--color-surface)] p-4 shadow-hard-lg sm:p-6 ${className}`}
      style={{ transform: `rotate(${rotate}deg)` }}
    >
      {halftone && <div aria-hidden="true" className={HALFTONE_CLASS[halftone]} />}

      {caption && (
        <span className="absolute -left-1 -top-1 z-10 border-comic border-[var(--color-structure)] bg-pow px-3 py-1 font-display text-caption uppercase text-ink shadow-hard-xs">
          {caption}
        </span>
      )}

      <div className="relative z-[1] h-full">{children}</div>
    </article>
  );
}
