import type { ReactNode } from "react";

type Props = {
  readonly children: ReactNode;
  readonly className?: string;
};

/**
 * Globo de dialogo. La cola son dos triangulos apilados (::before = borde,
 * ::after = relleno) definidos en app.css — es la unica tecnica que produce
 * una cola con borde real en CSS puro.
 *
 * El texto va en Space Grotesk, NO en Comic Shanns: un parrafo en la fuente
 * display es ilegible.
 */
export function SpeechBubble({ children, className = "" }: Props) {
  return (
    <div
      role="figure"
      className={`bubble relative max-w-[42ch] rounded-[28px] border-comic border-[var(--color-structure)] bg-[var(--color-surface)] px-6 py-4 text-body-lg text-[var(--color-text)] shadow-hard-sm ${className}`}
    >
      {children}
    </div>
  );
}
