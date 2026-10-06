import { useMemo, type ReactNode, type Ref } from "react";
import { motion, useTransform, type MotionStyle, type MotionValue } from "motion/react";
import { READING_LINE_START } from "@/lib/stage/config";
import {
  introProgress,
  layerOpacity,
  panFor,
  panSpan,
  readingLine,
  stageProgress,
  type Layout,
} from "@/lib/stage/timeline";
import { StageContext, type StageContextValue } from "./StageContext";

type Props = {
  readonly index: number;
  readonly layout: MotionValue<Layout>;
  /** Scroll relativo al inicio de la pista, en px. */
  readonly scrollOffset: MotionValue<number>;
  /** Scroll del documento en el que empieza la pista (el 0 de `scrollOffset`). */
  readonly origin: MotionValue<number>;
  /**
   * true: el pan lo anima el navegador con una linea de tiempo de scroll
   * (`.stage-pan`, app.css), en el compositor. false: lo escribe JS en cada
   * fotograma, como siempre (navegadores sin `animation-timeline`).
   *
   * NO puede cambiar tras montar: Motion no borra del DOM un estilo que deja de
   * pasarse, y quedaria una transform o unas variables viejas. Si algun dia
   * cambia en caliente, darle al contenido una `key` distinta por camino.
   */
  readonly compositorPan: boolean;
  /**
   * Linea de lectura, en alturas de visor (ver `readingLine`): depende del ancho
   * de pantalla. Un cambio llega a `reading` porque Motion vuelve a evaluar
   * `useTransform(() => ...)` en cada render con la funcion nueva.
   */
  readonly readingLineRatio: number;
  readonly isActive: boolean;
  readonly isNear: boolean;
  /** Ref del envoltorio del contenido: el deck mide su alto natural con ella. */
  readonly contentRef: Ref<HTMLDivElement>;
  /** Un elemento de esta capa recibio foco (teclado): el deck lo muestra subiendo o bajando el pan. */
  readonly onFocusInside: (index: number, target: Element) => void;
  readonly children: ReactNode;
};

/** Anula cualquier desplazamiento propio de la capa (vertical y horizontal). */
function resetLayerScroll(layer: HTMLElement): void {
  layer.scrollTop = 0;
  layer.scrollLeft = 0;
}

type PanVars = Readonly<Record<"--pan-start" | "--pan-distance", MotionValue<string>>>;

/**
 * El tramo del pan (`panSpan`) como variables CSS de `.stage-pan`, en px del
 * DOCUMENTO (la linea de tiempo es el scroll de la raiz). Dependen solo del
 * layout y del origen: cambian al volver a medir, nunca por fotograma. El final
 * del tramo lo suma el CSS (`inicio + distancia`). Un escenario que cabe
 * recorre 0 px (la animacion no mueve nada).
 */
function usePanVars(layout: MotionValue<Layout>, origin: MotionValue<number>, index: number): PanVars {
  const start = useTransform(() => `${origin.get() + (panSpan(layout.get(), index)?.start ?? 0)}px`);
  const distance = useTransform(() => {
    const span = panSpan(layout.get(), index);
    return `${span ? span.end - span.start : 0}px`;
  });
  return { "--pan-start": start, "--pan-distance": distance };
}

/**
 * La capa de UN escenario dentro del visor sticky.
 *
 * Las diez capas se apilan en el mismo sitio (`absolute inset-0`); solo se ve
 * la que toca. Cada capa deriva su posicion y su opacidad del scroll con
 * `useTransform(() => ...)`: son MotionValues, asi que NO hay un render de
 * React por frame de scroll. Solo `transform` y `opacity` (mas `visibility`,
 * que saca del pintado a las capas que no participan).
 *
 *   - inert:      una capa que no es la activa no recibe foco, clics ni lector
 *                 de pantalla (y tampoco se ve: el cambio de capa es duro, en
 *                 SWAP_AT, y lo tapa la tinta de la transicion);
 *   - overflow:   el contenido que no cabe en el visor se recorta aqui y sube
 *                 con el scroll (pan), asi que la capa no necesita altura propia.
 *                 Donde el navegador tiene lineas de tiempo de scroll, ese pan
 *                 lo anima CSS en el compositor (`compositorPan`); si no, la `y`
 *                 de Motion.
 */
export function StageLayer({
  index,
  layout,
  scrollOffset,
  origin,
  compositorPan,
  readingLineRatio,
  isActive,
  isNear,
  contentRef,
  onFocusInside,
  children,
}: Props) {
  // Con el pan en CSS sale ANTES de leer ningun MotionValue: Motion no le apunta
  // dependencias y no se recalcula en cada fotograma de scroll.
  const y = useTransform(() => {
    if (compositorPan) return 0;
    const pan = panFor(layout.get(), index, scrollOffset.get());
    return pan === 0 ? 0 : -pan;
  });
  const panVars = usePanVars(layout, origin, index);
  const opacity = useTransform(() => layerOpacity(layout.get(), index, scrollOffset.get()));
  const visibility = useTransform((): "visible" | "hidden" =>
    opacity.get() > 0 ? "visible" : "hidden",
  );
  const progress = useTransform(() => stageProgress(layout.get(), index, scrollOffset.get()));
  const intro = useTransform(() => introProgress(layout.get(), index, scrollOffset.get()));
  const reading = useTransform(() =>
    readingLine(layout.get(), index, scrollOffset.get(), READING_LINE_START, readingLineRatio),
  );

  const stage = useMemo<StageContextValue>(
    () => ({ mode: "deck", index, isActive, isNear, progress, intro, reading }),
    [index, isActive, isNear, progress, intro, reading],
  );

  return (
    <StageContext value={stage}>
      <motion.div
        data-stage={index}
        className="absolute inset-0 overflow-hidden"
        style={{ opacity, visibility }}
        inert={!isActive}
        // Una capa `overflow:hidden` SIGUE siendo desplazable por programa: al
        // enfocar un elemento oculto por debajo, el navegador mueve su scrollTop,
        // algo que no corresponde a ninguna posicion del scroll nativo y se
        // sumaria al pan. Se anula siempre y el pan se ajusta con el scroll real.
        onScroll={(event) => resetLayerScroll(event.currentTarget)}
        onFocus={(event) => {
          resetLayerScroll(event.currentTarget);
          onFocusInside(index, event.target);
        }}
      >
        {/* Con `compositorPan` NO se enlaza `y`: una transform escrita por JS en
            cada fotograma es justo lo que llegaba tarde al dedo en movil. */}
        <motion.div
          ref={contentRef}
          data-stage-content=""
          className={compositorPan ? "stage-pan" : undefined}
          // Motion aplica las variables CSS de `style` (setProperty), pero su tipo no las declara.
          style={compositorPan ? (panVars as MotionStyle) : { y }}
        >
          {children}
        </motion.div>
      </motion.div>
    </StageContext>
  );
}
