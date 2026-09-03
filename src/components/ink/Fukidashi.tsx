import type { ReactNode } from "react";

type Props = {
  readonly children: ReactNode;
  /** `shout` usa el globo dentado de grito manga en vez del redondeado. */
  readonly variant?: "speech" | "shout";
  readonly className?: string;
};

/**
 * El globo de dialogo (fukidashi). La cola son dos triangulos apilados
 * (::before = borde, ::after = relleno) definidos en ink.css — es la unica
 * tecnica que produce una cola CON BORDE real en CSS puro.
 *
 * El texto va en la fuente de cuerpo, NO en la de pincel: un parrafo entero
 * en Yuji Syuku es ilegible.
 */
export function Fukidashi({ children, variant = "speech", className = "" }: Props) {
  const shape =
    variant === "shout"
      ? "fukidashi--shout rounded-none"
      : "fukidashi rounded-fukidashi";

  return (
    <div
      role="figure"
      className={`relative max-w-[46ch] border-[3px] border-[var(--g-structure)] bg-koma px-6 py-4 text-body-lg text-on-koma shadow-ink-sm ${shape} ${className}`}
    >
      {children}
    </div>
  );
}
