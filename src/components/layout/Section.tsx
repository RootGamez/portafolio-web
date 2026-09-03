import type { ReactNode } from "react";
import { Screentone } from "@/components/ink/Screentone";
import { VerticalKanji } from "@/components/ink/VerticalKanji";
import { BrushStroke } from "@/components/ink/BrushStroke";
import { BrushEdge, type EdgeVariant } from "@/components/ink/BrushEdge";
import type { Ground } from "@/sections/meta";

type Props = {
  readonly id: string;
  readonly title: string;
  readonly jp: string;
  readonly numeral: string;
  readonly ground: Ground;
  readonly children: ReactNode;
  /** El hero pinta su propio titulo gigante: no quiere el h2 estandar. */
  readonly hideHeading?: boolean;
  readonly tone?: false | "fine" | "medium" | "coarse" | "lines";
  /**
   * Canto pintado con el que esta seccion se come a la anterior. Sin esto la
   * frontera entre dos suelos es una linea recta, que es justo lo que el
   * sistema evita. `false` solo para la primera seccion del documento.
   */
  readonly edge?: EdgeVariant | false;
  readonly edgeMirror?: boolean;
  readonly edgeHeight?: number;
  /** Quita el ancho maximo para composiciones que sangran a la ventana. */
  readonly bleed?: boolean;
  readonly className?: string;
  readonly innerClassName?: string;
};

/**
 * El contenedor de seccion. Aporta cuatro cosas y nada mas:
 *   1. el suelo (data-ground) del que cuelga toda la paleta;
 *   2. el ancla con scroll-margin para la navegacion;
 *   3. el canto pintado que la separa de la seccion anterior;
 *   4. el riel de kanji vertical y el h2 con su trazo de pincel.
 *
 * La COMPOSICION la decide cada seccion: aqui no se impone rejilla, porque el
 * punto del diseno es que cada plancha se componga distinto.
 */
export function Section({
  id,
  title,
  jp,
  numeral,
  ground,
  children,
  hideHeading = false,
  tone = false,
  edge = false,
  edgeMirror = false,
  edgeHeight = 84,
  bleed = false,
  className = "",
  innerClassName = "",
}: Props) {
  return (
    <section
      id={id}
      data-ground={ground}
      aria-labelledby={`${id}-titulo`}
      className={`relative isolate bg-ground text-on-ground ${className}`}
    >
      {edge && <BrushEdge variant={edge} mirror={edgeMirror} height={edgeHeight} />}

      {tone && <Screentone kind={tone} fade />}

      {/* Riel vertical del canalon. Solo hay sitio a partir de 1280px. */}
      <VerticalKanji
        numeral={numeral}
        className="absolute right-4 top-24 z-10 hidden text-[0.9rem] xl:block"
      >
        {jp}
      </VerticalKanji>

      <div
        className={`relative z-[1] ${bleed ? "" : "mx-auto max-w-[1440px] px-4 sm:px-6 lg:px-10"} py-16 sm:py-24 lg:py-28 ${innerClassName}`}
      >
        {!hideHeading && (
          <header className={`mb-10 ${bleed ? "px-4 sm:px-6 lg:px-10" : ""}`}>
            <h2
              id={`${id}-titulo`}
              className="font-poster text-display uppercase leading-none text-[var(--g-heading)]"
            >
              {title}
            </h2>
            <BrushStroke className="mt-2 h-3 w-40 sm:w-56" strokeWidth={5} />
          </header>
        )}

        {children}

        {/*
          Con hideHeading el h2 va DESPUES del contenido, no antes. Es el nombre
          accesible de la <section> via aria-labelledby, pero si se pintara
          arriba el primer encabezado del documento seria un h2 seguido del h1
          del hero — jerarquia invertida en el arbol de accesibilidad.
        */}
        {hideHeading && (
          <h2 id={`${id}-titulo`} className="sr-only">
            {title}
          </h2>
        )}
      </div>
    </section>
  );
}
