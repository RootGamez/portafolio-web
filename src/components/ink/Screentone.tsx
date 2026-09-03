type Props = {
  readonly kind?: "fine" | "medium" | "coarse" | "lines";
  readonly fade?: boolean;
  readonly className?: string;
};

const KIND: Record<string, string> = {
  fine: "screentone screentone--fine",
  medium: "screentone",
  coarse: "screentone screentone--coarse",
  lines: "screentone screentone--lines",
};

/**
 * Capa de trama suelta, para poner sobre un suelo entero en vez de dentro
 * de un koma. El color sale de --g-tone: sobre papel son puntos de tinta,
 * sobre tinta son puntos de papel.
 */
export function Screentone({ kind = "medium", fade = false, className = "" }: Props) {
  return (
    <span
      aria-hidden="true"
      className={`${KIND[kind]} ${fade ? "screentone--fade" : ""} ${className}`}
    />
  );
}
