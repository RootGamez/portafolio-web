import { motion, useTransform, type MotionValue } from "motion/react";
import { chapterCardOpacity, chapterStrokeProgress, isChapterStrokeVisible } from "@/lib/stage/ink";
import { transitionProgress, type Layout } from "@/lib/stage/timeline";
import type { TransitionSpec } from "@/lib/stage/transitions";
import { getSectionMeta } from "@/sections/meta";

type Props = {
  readonly index: number;
  readonly spec: TransitionSpec;
  readonly layout: MotionValue<Layout>;
  /** Scroll relativo al inicio de la pista, en px. */
  readonly scrollOffset: MotionValue<number>;
};

/** El subrayado de pincel de BrushStroke: irregular, como a mano (viewBox 100x12). */
const STROKE_D = "M2 8 C 18 3, 34 10, 52 6 S 84 3, 98 7";

/**
 * La tarjeta de capitulo: lo que se lee sobre la tinta mientras el escenario
 * cambia. Es el "pasar de pagina" del manga: numeral grande, titulo japones y
 * titulo del capitulo que ENTRA, con un subrayado de pincel que se dibuja con el
 * scroll (`pathLength`, el gesto firma del sitio).
 *
 * Todo es funcion pura del scroll (lib/stage/ink.ts) derivada con `useTransform`:
 * ningun render de React por frame. El color sale del suelo de la tinta
 * (`data-ground`), asi que el contraste es el medido para ese suelo: titular y
 * numeral (display >= 24px) con `--g-heading` y `--g-accent`.
 *
 * El numeral escala con el ancho Y con el alto (`26svh`): en un movil apaisado el visor
 * mide ~330 px y una tarjeta de 356 no cabria.
 *
 * Es decorativa (`aria-hidden`): el escenario nuevo ya se anuncia por el lector
 * de pantalla (StageAnnouncer + foco). Por eso no usa encabezados.
 */
export function ChapterCard({ index, spec, layout, scrollOffset }: Props) {
  const chapter = getSectionMeta(spec.to);

  const t = useTransform(() => transitionProgress(layout.get(), index, scrollOffset.get()));
  const opacity = useTransform(() => chapterCardOpacity(t.get()));
  const visibility = useTransform((): "visible" | "hidden" => (opacity.get() > 0 ? "visible" : "hidden"));
  const pathLength = useTransform(() => chapterStrokeProgress(t.get()));
  // Con pathLength ~0 y `stroke-linecap: round` asoma un punto en cada extremo: el
  // trazo no se pinta hasta que es una raya de verdad (ver isChapterStrokeVisible).
  const strokeOpacity = useTransform(() => (isChapterStrokeVisible(pathLength.get()) ? 1 : 0));

  return (
    <motion.div
      aria-hidden="true"
      data-chapter-card={index}
      data-ground={spec.ink}
      className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center gap-3 px-6 text-center"
      style={{ opacity, visibility }}
    >
      <span className="font-brush text-[clamp(5rem,min(18vw,26svh),12rem)] leading-none text-[var(--g-accent)]">
        {chapter.numeral}
      </span>
      <span className="font-brush text-h2 text-[var(--g-text)]">{chapter.jp}</span>
      <span className="font-poster text-display uppercase text-balance text-[var(--g-heading)]">
        {chapter.title}
      </span>
      <svg
        aria-hidden="true"
        focusable="false"
        viewBox="0 0 100 12"
        preserveAspectRatio="none"
        className="mt-2 h-3 w-48 sm:w-64"
      >
        <motion.path
          d={STROKE_D}
          className="brush-path"
          strokeWidth={5}
          style={{ pathLength, opacity: strokeOpacity }}
        />
      </svg>
    </motion.div>
  );
}
