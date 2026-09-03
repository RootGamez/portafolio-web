export type EdgeVariant = "sweep" | "dry" | "wash" | "splash" | "tear" | "rule";

type Props = {
  readonly variant: EdgeVariant;
  /** Espeja el trazo en horizontal. Permite reusar una forma sin que se note. */
  readonly mirror?: boolean;
  /** Alto en px del canto. Debe caber en el padding inferior de la seccion previa. */
  readonly height?: number;
};

/**
 * Forma de cada canto, en un viewBox de 1440x100 que se estira a lo ancho.
 *
 * `d` cierra SIEMPRE por abajo (L1440,100 L0,100 Z): el trazo no es una linea,
 * es una MASA de pintura rellena con el color del suelo de la seccion. Por eso
 * tapa lo que haya debajo y produce la frontera.
 *
 * `flecks` son gotas sueltas por encima del trazo — lo que separa una pincelada
 * de un simple borde ondulado. Son las salpicaduras que deja el pincel al
 * levantarlo.
 */
const EDGES: Record<
  EdgeVariant,
  { readonly d: string; readonly flecks: readonly (readonly [number, number, number, number])[] }
> = {
  // Barrido ancho: grueso a la izquierda, se adelgaza al llegar a la derecha.
  sweep: {
    d:
      "M0,58 C 130,22 250,72 372,48 C 494,24 604,68 728,42 " +
      "C 852,16 962,62 1086,44 C 1198,28 1320,60 1440,34 " +
      "L1440,100 L0,100 Z",
    flecks: [
      [214, 30, 26, 5],
      [656, 24, 34, 4],
      [1148, 26, 22, 4],
    ],
  },

  // Pincel seco: la carga se acaba y el trazo se rompe en cerdas sueltas.
  dry: {
    d:
      "M0,44 C 96,38 150,54 236,46 C 300,40 340,56 420,50 " +
      "C 512,43 560,58 648,52 C 742,45 790,60 884,54 " +
      "C 980,47 1030,62 1124,55 C 1230,47 1330,60 1440,52 " +
      "L1440,100 L0,100 Z",
    flecks: [
      [92, 30, 44, 4],
      [318, 26, 30, 3],
      [530, 32, 52, 4],
      [806, 24, 26, 3],
      [1042, 30, 40, 4],
      [1296, 26, 34, 3],
    ],
  },

  // Aguada: lobulos redondeados, como tinta muy diluida que se extiende sola.
  wash: {
    d:
      "M0,52 Q 104,12 208,44 T 416,40 Q 528,6 640,46 T 856,42 " +
      "Q 968,10 1080,48 T 1296,44 Q 1372,20 1440,46 " +
      "L1440,100 L0,100 Z",
    flecks: [
      [352, 20, 18, 8],
      [900, 16, 14, 7],
    ],
  },

  // Salpicadura: el trazo suelta gotas que saltan lejos del canto.
  splash: {
    d:
      "M0,50 C 88,20 168,62 262,44 C 356,26 420,64 520,46 " +
      "C 628,26 700,60 812,48 C 918,36 990,66 1102,50 " +
      "C 1214,34 1330,58 1440,42 L1440,100 L0,100 Z",
    flecks: [
      [148, 18, 12, 9],
      [470, 10, 8, 7],
      [762, 22, 15, 10],
      [1046, 12, 9, 7],
      [1258, 20, 11, 8],
      [612, 30, 6, 5],
      [1372, 26, 7, 6],
    ],
  },

  // Desgarro: angular y seco, papel arrancado mas que pintado.
  tear: {
    d:
      "M0,46 L 74,26 L 148,52 L 228,22 L 306,50 L 388,28 L 470,56 " +
      "L 552,24 L 636,50 L 720,20 L 802,48 L 884,26 L 968,54 " +
      "L 1052,22 L 1136,50 L 1220,28 L 1304,52 L 1386,24 L 1440,44 " +
      "L1440,100 L0,100 Z",
    flecks: [
      [268, 12, 9, 5],
      [846, 14, 7, 4],
      [1176, 10, 8, 5],
    ],
  },

  // Regla: NO es una masa, es un trazo fino. Para cuando dos secciones
  // comparten suelo y un canto de color seria invisible: aun asi tiene que
  // haber una pincelada que separe, no una linea recta.
  rule: { d: "", flecks: [] },
};

/**
 * La frontera entre dos secciones.
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
  const transform = mirror ? "scale(-1,1) translate(-1440,0)" : undefined;

  return (
    <svg
      aria-hidden="true"
      focusable="false"
      viewBox="0 0 1440 100"
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
