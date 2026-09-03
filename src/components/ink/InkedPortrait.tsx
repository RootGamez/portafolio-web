type Props = {
  readonly avif: string;
  readonly webp: string;
  readonly alt: string;
  readonly width: number;
  readonly height: number;
  readonly className?: string;
  readonly imgClassName?: string;
  /** LCP del hero: hay que cargarla con prioridad, no en lazy. */
  readonly priority?: boolean;
};

/**
 * El retrato entintado. Dos capas:
 *   1. la foto pasada por #ink-portrait, que la posteriza a 4 niveles de
 *      tinta y le mete grano — deja de parecer una foto en B/N y pasa a
 *      parecer una plancha entintada;
 *   2. screentone en multiply encima, que es lo que aporta el punteado
 *      caracteristico del manga impreso.
 *
 * En <768px el filtro no se aplica (ink.css): un feTurbulence a pantalla
 * completa se sale del presupuesto de 16ms en GPU movil. Ahi queda el
 * fallback de alto contraste, que sigue leyendose perfectamente.
 */
export function InkedPortrait({
  avif,
  webp,
  alt,
  width,
  height,
  className = "",
  imgClassName = "",
  priority = false,
}: Props) {
  return (
    <div className={`relative isolate overflow-hidden ${className}`}>
      <picture>
        <source srcSet={avif} type="image/avif" />
        <img
          src={webp}
          alt={alt}
          width={width}
          height={height}
          loading={priority ? "eager" : "lazy"}
          decoding={priority ? "sync" : "async"}
          fetchPriority={priority ? "high" : "auto"}
          className={`inked-portrait block h-full w-full object-cover ${imgClassName}`}
        />
      </picture>
      <span aria-hidden="true" className="inked-portrait-tone" />
    </div>
  );
}
