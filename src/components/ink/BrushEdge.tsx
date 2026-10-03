import {
  EDGES,
  EDGE_VIEWBOX_HEIGHT,
  EDGE_VIEWBOX_WIDTH,
  type EdgeVariant,
} from "./edgeShapes";

/** Se reexporta: Section y las secciones lo importan de aqui desde siempre. */
export type { EdgeVariant };

type Props = {
  readonly variant: EdgeVariant;
  /** Espeja el trazo en horizontal. Permite reusar una forma sin que se note. */
  readonly mirror?: boolean;
  /** Alto en px del canto. Debe caber en el padding inferior de la seccion previa. */
  readonly height?: number;
};

/**
 * La frontera entre dos secciones en el modo LINEAL.
 *
 * Las formas (el path de cada variante y sus gotas) viven en edgeShapes.ts: las
 * comparte con el frente de tinta animado del modo escenarios.
 *
 * Se posiciona en el borde SUPERIOR de su seccion y se desplaza hacia arriba
 * con translateY, de modo que invade el padding inferior de la seccion anterior
 * y la pinta con el color de la nueva. Como las secciones se apilan en flujo
 * normal, la posterior pinta por encima sin necesidad de z-index.
 *
 * `preserveAspectRatio="none"` es deliberado: el trazo se estira a lo ancho de
 * la ventana. Una pincelada ya es un barrido horizontal, asi que estirarla la
 * hace mas larga, no la deforma.
 *
 * Decorativo -> aria-hidden. La frontera no aporta informacion.
 */
export function BrushEdge({ variant, mirror = false, height = 84 }: Props) {
  const edge = EDGES[variant];
  const transform = mirror
    ? `scale(-1,1) translate(-${EDGE_VIEWBOX_WIDTH},0)`
    : undefined;

  return (
    <svg
      aria-hidden="true"
      focusable="false"
      viewBox={`0 0 ${EDGE_VIEWBOX_WIDTH} ${EDGE_VIEWBOX_HEIGHT}`}
      preserveAspectRatio="none"
      className="pointer-events-none absolute inset-x-0 top-0 w-full"
      style={{ height, transform: `translateY(-${height - 1}px)` }}
    >
      <g transform={transform}>
        {variant === "rule" ? (
          /* Trazo fino de tinta, no masa de color: el suelo no cambia. */
          <path
            d="M40,58 C 260,34 420,70 660,50 C 900,30 1080,66 1400,44"
            fill="none"
            stroke="var(--g-rule)"
            strokeWidth="7"
            strokeLinecap="round"
            opacity="0.5"
            vectorEffect="non-scaling-stroke"
          />
        ) : (
          <>
            <path d={edge.d} fill="var(--g-bg)" />
            {edge.flecks.map(([cx, cy, rx, ry]) => (
              <ellipse key={`${cx}-${cy}`} cx={cx} cy={cy} rx={rx} ry={ry} fill="var(--g-bg)" />
            ))}
          </>
        )}
      </g>
    </svg>
  );
}
