import type { ReactNode } from "react";

type Variant = "primary" | "accent" | "ghost";

type Props = {
  readonly children: ReactNode;
  readonly variant?: Variant;
  readonly href?: string;
  readonly onClick?: () => void;
  readonly disabled?: boolean;
  readonly ariaLabel?: string;
  readonly download?: boolean;
  readonly className?: string;
};

/**
 * El componente firma: al presionar, el boton viaja EXACTAMENTE la distancia de
 * su sombra y la sombra colapsa a 0 -> "aterriza" sobre su propia sombra.
 * La invariante `active-translate === shadow-offset` (4px) no se puede romper.
 *
 * Con reduced-motion se quita la TRANSICION, no el hundimiento: el feedback
 * tactil por debajo de 100ms es un requisito de usabilidad.
 */
const VARIANTS: Record<Variant, string> = {
  // amarillo + tinta = 14.02:1
  primary: "bg-pow text-ink",
  // azul + papel = 5.17:1  (PROHIBIDO: rojo #FF3B3B + blanco = 3.53:1)
  accent: "bg-zap text-paper",
  ghost: "bg-transparent text-[var(--color-text)]",
};

const BASE =
  "inline-flex min-h-12 cursor-pointer touch-manipulation items-center justify-center gap-2 " +
  "border-comic-md border-[var(--color-structure)] px-6 py-3 " +
  "font-display text-[18px] uppercase leading-none " +
  "shadow-hard-sm transition-[transform,box-shadow] duration-[120ms] ease-comic-out " +
  "hover:-translate-x-0.5 hover:-translate-y-0.5 hover:shadow-hard-md " +
  "active:translate-x-1 active:translate-y-1 active:shadow-hard-none active:duration-[80ms] " +
  "disabled:pointer-events-none disabled:opacity-45 disabled:shadow-hard-none " +
  "motion-reduce:transition-none";

export function ComicButton({
  children,
  variant = "primary",
  href,
  onClick,
  disabled = false,
  ariaLabel,
  download = false,
  className = "",
}: Props) {
  const classes = `${BASE} ${VARIANTS[variant]} ${className}`;

  if (href) {
    const external = href.startsWith("http");
    return (
      <a
        href={href}
        aria-label={ariaLabel}
        className={classes}
        {...(download ? { download: "" } : {})}
        {...(external ? { target: "_blank", rel: "noreferrer noopener" } : {})}
      >
        {children}
      </a>
    );
  }

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-label={ariaLabel}
      className={classes}
    >
      {children}
    </button>
  );
}
