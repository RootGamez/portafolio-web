import { memo, useState } from "react";
import { motion, useTransform, type MotionValue } from "motion/react";
import { EdgeMass } from "@/components/ink/EdgeMass";
import { EDGE_VIEWBOX_HEIGHT, EDGE_VIEWBOX_WIDTH } from "@/components/ink/edgeShapes";
import { inkBandHeight, inkBandTop, inkEdgeHeight, isInkBandVisible } from "@/lib/stage/ink";
import { transitionProgress, type Layout } from "@/lib/stage/timeline";
import { frontEdgeOf, type MassEdge, type TransitionSpec } from "@/lib/stage/transitions";
import type { Ground } from "@/sections/meta";
import { ChapterCard } from "./ChapterCard";
import { InkCanvas } from "./InkCanvas";

type Props = {
  /** Las transiciones a pintar, en orden: la i une el escenario i con el i+1. */
  readonly transitions: readonly TransitionSpec[];
  readonly layout: MotionValue<Layout>;
  /** Scroll relativo al inicio de la pista, en px. */
  readonly scrollOffset: MotionValue<number>;
  /** Progreso 0..1 de la cortina de un salto (0 en reposo): lo mueve useJumpCurtain. */
  readonly curtain: MotionValue<number>;
  /** Alto del visor medido, en px: dimensiona el cuerpo y los bordes de la banda. */
  readonly visorHeight: number;
};

type EdgeProps = {
  readonly variant: MassEdge;
  readonly mirror: boolean;
  readonly height: number;
  /** Del reves: el lado liso arriba y el irregular abajo (la cola de la banda). */
  readonly flipped?: boolean;
};

/**
 * Un borde de pincel de la banda. Se estira a lo ancho del visor
 * (`preserveAspectRatio="none"`): una pincelada ya es un barrido horizontal, asi
 * que estirarla la hace mas larga, no la deforma (igual que BrushEdge).
 */
function InkEdge({ variant, mirror, height, flipped = false }: EdgeProps) {
  return (
    <svg
      aria-hidden="true"
      focusable="false"
      viewBox={`0 0 ${EDGE_VIEWBOX_WIDTH} ${EDGE_VIEWBOX_HEIGHT}`}
      preserveAspectRatio="none"
      className="block w-full"
      style={{ height, transform: flipped ? "scaleY(-1)" : undefined }}
    >
      <EdgeMass variant={variant} mirror={mirror} />
    </svg>
  );
}

type BandProps = {
  /** Identificador de la banda en el DOM (`data-ink-band`). */
  readonly bandId: number | "jump";
  /** Color de la tinta, como suelo de la paleta. */
  readonly ink: Ground;
  readonly front: MassEdge;
  readonly mirror: boolean;
  /** Progreso 0..1 de la banda: del scroll en una transicion, del tiempo en un salto. */
  readonly progress: MotionValue<number>;
  readonly layout: MotionValue<Layout>;
  readonly visorHeight: number;
};

/**
 * Una banda de tinta: frente (borde de pincel) + cuerpo + cola (el mismo borde del
 * reves y espejado). Su posicion y su visibilidad son funciones puras del progreso
 * (lib/stage/ink.ts) derivadas con `useTransform`, como las capas de StageLayer:
 * ningun render de React por frame. Da igual de donde venga el progreso: las
 * transiciones de scroll y la cortina de los saltos usan la misma banda.
 *
 * El color sale del suelo de la tinta (`data-ground`): el cuerpo usa `bg-ground` y
 * los bordes rellenan con `--g-bg`, el mismo mecanismo que las secciones.
 */
function InkBand({ bandId, ink, front, mirror, progress, layout, visorHeight }: BandProps) {
  const edgeHeight = inkEdgeHeight(visorHeight);

  // El alto del visor se lee del layout (medido a la vez que `visorHeight`) y no de
  // la prop, para que la funcion solo dependa de MotionValues.
  const y = useTransform(() => {
    const visor = layout.get().viewportHeight;
    return inkBandTop(progress.get(), visor, inkEdgeHeight(visor));
  });
  const visibility = useTransform((): "visible" | "hidden" =>
    isInkBandVisible(progress.get()) ? "visible" : "hidden",
  );

  return (
    <motion.div
      data-ink-band={bandId}
      data-ground={ink}
      className="absolute inset-x-0 top-0"
      style={{ y, visibility, height: inkBandHeight(visorHeight, edgeHeight) }}
    >
      <InkEdge variant={front} mirror={mirror} height={edgeHeight} />
      {/* 1px de solape por cada lado: con la banda en medio pixel no asoma una costura. */}
      <div className="bg-ground" style={{ height: visorHeight + 2, margin: "-1px 0" }} />
      <InkEdge variant={front} mirror={!mirror} height={edgeHeight} flipped />
    </motion.div>
  );
}

type ScrollBandProps = {
  readonly index: number;
  readonly spec: TransitionSpec;
  readonly layout: MotionValue<Layout>;
  readonly scrollOffset: MotionValue<number>;
  readonly visorHeight: number;
};

/** La banda de UNA transicion: lee SU tramo de la linea de tiempo (no hace falta saber cual esta en curso). */
function ScrollInkBand({ index, spec, layout, scrollOffset, visorHeight }: ScrollBandProps) {
  const progress = useTransform(() => transitionProgress(layout.get(), index, scrollOffset.get()));

  return (
    <InkBand
      bandId={index}
      ink={spec.ink}
      front={frontEdgeOf(spec)}
      mirror={spec.mirror}
      progress={progress}
      layout={layout}
      visorHeight={visorHeight}
    />
  );
}

/** La tinta de la cortina de los saltos: siempre sumi, con el barrido limpio. */
const CURTAIN_INK: Ground = "sumi";
const CURTAIN_FRONT: MassEdge = "sweep";

/**
 * La tinta de las transiciones entre escenarios.
 *
 * Dos pintores para las transiciones de SCROLL (docs/PLAN_ESCENARIOS.md §6, tiers):
 * el canvas WebGL (T3/T2, InkCanvas) cuando el dispositivo lo aguanta, y las bandas
 * SVG (T1) mientras no, o si la GPU falla. Nunca los dos a la vez. La tarjeta de
 * capitulo y la cortina de los saltos son siempre DOM, por encima del canvas.
 *
 * Va DENTRO del visor, por encima de las capas: el visor ya empieza bajo la barra
 * de nav, asi que la tinta nunca la tapa. Es decorativo (`aria-hidden`) y no capta
 * el puntero, de modo que ni clics, ni foco, ni lector de pantalla lo notan.
 *
 * `memo`: StageDeck re-renderiza en cada cruce de escenario y todas las props son
 * estables (MotionValues, un numero y una lista memoizada); sin esto arrastraba ~20
 * bandas y 9 tarjetas (~74 `useTransform`) cada vez. Ademas, una lista nueva en
 * cada render reiniciaria el motor WebGL (InkCanvas depende de `transitions`).
 */
export const InkOverlay = memo(function InkOverlay({
  transitions,
  layout,
  scrollOffset,
  curtain,
  visorHeight,
}: Props) {
  // true mientras pinta el WebGL: entonces sobran las bandas SVG de scroll.
  const [glActive, setGlActive] = useState(false);

  return (
    <div
      aria-hidden="true"
      data-ink-overlay=""
      data-ink-renderer={glActive ? "webgl" : "svg"}
      className="pointer-events-none absolute inset-0 z-10 overflow-hidden"
    >
      {/* El canvas, el PRIMERO: debajo de las tarjetas y de la cortina. */}
      <InkCanvas
        transitions={transitions}
        layout={layout}
        scrollOffset={scrollOffset}
        onActiveChange={setGlActive}
      />
      {!glActive &&
        transitions.map((spec, index) => (
          <ScrollInkBand
            key={`${spec.from}-${spec.to}`}
            index={index}
            spec={spec}
            layout={layout}
            scrollOffset={scrollOffset}
            visorHeight={visorHeight}
          />
        ))}
      {/* Las tarjetas, DESPUES de todas las bandas: se leen sobre la tinta. */}
      {transitions.map((spec, index) => (
        <ChapterCard
          key={`card-${spec.from}-${spec.to}`}
          index={index}
          spec={spec}
          layout={layout}
          scrollOffset={scrollOffset}
        />
      ))}
      {/* La cortina de los saltos, la ULTIMA: por encima de bandas y tarjetas, lo tapa todo. */}
      <InkBand
        bandId="jump"
        ink={CURTAIN_INK}
        front={CURTAIN_FRONT}
        mirror={false}
        progress={curtain}
        layout={layout}
        visorHeight={visorHeight}
      />
    </div>
  );
});
