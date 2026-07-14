type Tone = "pow" | "bam" | "zing" | "boom";

type Props = {
  readonly children: string;
  readonly tone?: Tone;
  readonly rotate?: number;
  readonly className?: string;
};

const FILL: Record<Tone, string> = {
  pow: "text-pow", // amarillo — logro / hito
  bam: "text-bam", // rojo pop — proyecto en produccion
  zing: "text-zing", // cian — skill tecnico
  boom: "text-boom", // violeta — panel "fuera del codigo"
};

/**
 * Decorativa: SIEMPRE aria-hidden. Nunca aporta informacion.
 *
 * El contorno negro de 3px NO es opcional: el rojo #FF3B3B sobre crema es
 * 3.34:1 y fallaria AA por si solo. A >=40px, con contorno de tinta y
 * aria-hidden, califica como texto grande decorativo y cumple.
 */
export function Onomatopoeia({
  children,
  tone = "pow",
  rotate = -8,
  className = "",
}: Props) {
  return (
    <span
      aria-hidden="true"
      className={`pointer-events-none select-none font-display text-[clamp(2rem,5vw,4.5rem)] uppercase leading-none [paint-order:stroke_fill] [-webkit-text-stroke:3px_#0A0A0A] [text-shadow:4px_4px_0_#0A0A0A] animate-pop-in motion-reduce:animate-none ${FILL[tone]} ${className}`}
      style={{ ["--sfx-rot" as string]: `${rotate}deg`, transform: `rotate(${rotate}deg)` }}
    >
      {children}
    </span>
  );
}
