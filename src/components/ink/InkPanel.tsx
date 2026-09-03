import type { ReactNode } from "react";
import { Screentone } from "@/components/ink/Screentone";

export type ToneKind = false | "fine" | "medium" | "coarse" | "lines";

type Props = {
  readonly children: ReactNode;
  /** Rotacion estatica. Whitelist cerrada: mas de 3 grados rompe la lectura. */
  readonly rotate?: -3 | -2 | -1 | 0 | 1 | 2 | 3;
  /** Recuadro de narracion, arriba a la izquierda del koma. */
  readonly caption?: string;
  readonly tone?: ToneKind;
  /** Trama que se desvanece hacia abajo. Da profundidad sin ensuciar el texto. */
  readonly toneFade?: boolean;
  /**
   * Koma nocturno: fondo tinta, borde y texto crema (15.12:1).
   * SOLO valido dentro de una seccion con data-ground="sumi".
   */
  readonly negative?: boolean;
  readonly className?: string;
};

/**
 * El koma (vineta). Radius 0, borde grueso, sombra dura sin blur —
 * las mecanicas brutalistas intactas. Lo que cambia respecto al comic es
 * la TEXTURA: marco y sombra pasan por #ink-rough y el canto tiembla.
 *
 * Tres capas absolutas + contenido:
 *   1. sombra (desplazada, entintada)
 *   2. marco (borde + fondo, entintado)
 *   3. trama opcional — la pinta <Screentone>, que ya es el mapa de clases
 *      de trama del sistema; aqui se delega en vez de duplicarlo
 *   4. contenido — SIN filtro, o el texto saldria ondulado
 *
 * Estatico a proposito: no lleva hover. No se pone hover a algo que no
 * es clicable.
 */
export function InkPanel({
  children,
  rotate = 0,
  caption,
  tone = false,
  toneFade = false,
  negative = false,
  className = "",
}: Props) {
  return (
    <article
      className={`relative isolate ${negative ? "koma--negative" : ""} ${className}`}
      style={{ transform: `rotate(${rotate}deg)` }}
    >
      <span
        aria-hidden="true"
        className="ink-edge absolute inset-0 -z-10 translate-x-2 translate-y-2 bg-[var(--g-shadow)]"
      />
      <span
        aria-hidden="true"
        className="ink-edge absolute inset-0 border-[6px] border-[var(--g-structure)] bg-koma"
      />
      {tone && <Screentone kind={tone} fade={toneFade} />}

      {caption && (
        <span className="absolute -left-1 -top-3 z-20 border-[3px] border-[var(--g-structure)] bg-kin px-3 py-1 font-mono text-caption uppercase text-ink">
          {caption}
        </span>
      )}

      <div className="relative z-10 h-full p-5 text-on-koma sm:p-6">{children}</div>
    </article>
  );
}
