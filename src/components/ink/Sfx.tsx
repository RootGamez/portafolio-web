type Props = {
  readonly children: string;
  /** Katakana opcional, en vertical junto al SFX latino. Puro adorno. */
  readonly kana?: string;
  readonly rotate?: number;
  readonly className?: string;
};

/**
 * Onomatopeya. SIEMPRE aria-hidden: es decoracion, nunca aporta informacion
 * que no este ya en el texto.
 *
 * El contorno de tinta no es opcional. El acento del suelo (--g-accent) es
 * bermellon sobre papel: 5.01:1 de por si, pero a tamano de display y con
 * contorno de 3px queda separado del fondo pase lo que pase debajo.
 */
export function Sfx({ children, kana, rotate = -8, className = "" }: Props) {
  return (
    <span
      aria-hidden="true"
      className={`pointer-events-none inline-flex select-none items-start gap-1 ${className}`}
      style={{ transform: `rotate(${rotate}deg)` }}
    >
      <span className="font-brush text-[clamp(1.75rem,4.5vw,4rem)] uppercase leading-none text-[var(--g-accent)] [paint-order:stroke_fill] [-webkit-text-stroke:3px_var(--g-structure)]">
        {children}
      </span>
      {kana && (
        <span className="vertical-jp font-brush text-[clamp(0.7rem,1.4vw,1.1rem)] leading-none text-[var(--g-accent)] [paint-order:stroke_fill] [-webkit-text-stroke:1.5px_var(--g-structure)]">
          {kana}
        </span>
      )}
    </span>
  );
}
