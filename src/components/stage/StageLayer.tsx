import { useMemo, type ReactNode, type Ref } from "react";
import { motion, useTransform, type MotionValue } from "motion/react";
import { READING_LINE_RATIO, READING_LINE_START } from "@/lib/stage/config";
import {
  introProgress,
  layerOpacity,
  panFor,
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
 */
export function StageLayer({
  index,
  layout,
  scrollOffset,
  isActive,
  isNear,
  contentRef,
  onFocusInside,
  children,
}: Props) {
  const y = useTransform(() => {
    const pan = panFor(layout.get(), index, scrollOffset.get());
    return pan === 0 ? 0 : -pan;
  });
  const opacity = useTransform(() => layerOpacity(layout.get(), index, scrollOffset.get()));
  const visibility = useTransform((): "visible" | "hidden" =>
    opacity.get() > 0 ? "visible" : "hidden",
  );
  const progress = useTransform(() => stageProgress(layout.get(), index, scrollOffset.get()));
  const intro = useTransform(() => introProgress(layout.get(), index, scrollOffset.get()));
  const reading = useTransform(() =>
    readingLine(layout.get(), index, scrollOffset.get(), READING_LINE_START, READING_LINE_RATIO),
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
        <motion.div ref={contentRef} data-stage-content="" style={{ y }}>
          {children}
        </motion.div>
      </motion.div>
    </StageContext>
  );
}
