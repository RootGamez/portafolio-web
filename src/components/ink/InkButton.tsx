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
 * La invariante que firma el componente: al pulsar, el boton viaja
 * EXACTAMENTE la distancia de su sombra y la sombra colapsa a 0 — aterriza
 * sobre su propia sombra. `active:translate` === offset de `shadow-ink-sm`
 * === --press-offset (4px). No se puede romper una sin romper las otras.
 *
 * Con reduced-motion se quita la TRANSICION, no el hundimiento: el feedback
 * tactil por debajo de 100ms es un requisito de usabilidad, no un adorno.
 *
 * Los tres variantes son seguros en los CUATRO suelos:
 *  - primary: invierte el suelo (bg=--g-text, texto=--g-bg). Es el mismo par
 *    medido del suelo, del reves, asi que hereda su ratio: 15.12 / 15.12 /
 *    5.01 / 9.90 segun donde caiga.
 *  - accent:  bermellon con crema (5.48:1), autocontenido.
 *  - ghost:   papel con tinta (16.54:1), autocontenido.
 */
const VARIANTS: Record<Variant, string> = {
  primary: "bg-[var(--g-text)] text-[var(--g-bg)]",
  accent: "bg-shu text-washi-hi",
  ghost: "bg-koma text-on-koma",
};

const BASE =
  "inline-flex min-h-12 cursor-pointer touch-manipulation items-center justify-center gap-2 " +
  "border-[4px] border-[var(--g-structure)] px-5 py-3 " +
  "font-poster text-[18px] uppercase leading-none tracking-wide " +
  "shadow-ink-sm transition-[transform,box-shadow] duration-[140ms] ease-ink " +
  "hover:-translate-x-0.5 hover:-translate-y-0.5 hover:shadow-ink-md " +
  "active:translate-x-1 active:translate-y-1 active:shadow-ink-none active:duration-[80ms] " +
  "disabled:pointer-events-none disabled:opacity-45 disabled:shadow-ink-none " +
  "motion-reduce:transition-none";

export function InkButton({
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
