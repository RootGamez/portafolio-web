import { BrushStroke } from "@/components/ink/BrushStroke";
import { Section } from "@/components/layout/Section";
import { ReachItem } from "@/components/motion/ReachItem";
import { ScrubReveal } from "@/components/motion/ScrubReveal";
import { ScrubStamp } from "@/components/motion/ScrubStamp";
import { useStage } from "@/components/stage/StageContext";
import { pipeline } from "@/data/timeline";
import { STAGGER } from "@/lib/motion";
import type { ScrubRange } from "@/lib/stage/scrub";
import { getSectionMeta } from "@/sections/meta";

/** Slug, titulo, kanji y suelo salen del indice: una sola fuente para
    la seccion y para el riel de navegacion. */
const META = getSectionMeta("produccion");

/**
 * Numerales kanji de los seis pasos. Van aria-hidden a proposito: el orden
 * real lo aporta el <ol>, asi que leerlos seria decir el numero dos veces.
 */
const NUMERALES = ["一", "二", "三", "四", "五", "六"] as const;

/*
 * Modo escenarios (Fase 4.6): cada paso se anima al ALCANZARLO la linea de
 * lectura (`ReachItem`). Su regla de tinta deja de ser un borde y es una
 * pincelada que se dibuja (el tramo del pipeline), el numeral se ESTAMPA y
 * llega el texto. En escritorio los pasos van de dos en dos por fila: la
 * columna derecha va COLUMN_LAG por detras para que se lean en secuencia
 * (1, 2, 3...) y no por parejas. En modo lineal, el borde y el Reveal de siempre.
 */
const RULE_DRAW: ScrubRange = [0, 0.3];
const NUMERAL_STAMP: ScrubRange = [0.2, 0.35];
const TEXT_REVEAL: ScrubRange = [0.25, 0.5];
const COLUMN_LAG = 0.2;
const TEXT_RISE_PX = 18;

/** El tramo de un paso, retrasado si cae en la segunda columna. */
function forStep(range: ScrubRange, index: number): ScrubRange {
  const lag = index % 2 === 1 ? COLUMN_LAG : 0;
  return [range[0] + lag, range[1] + lag];
}

const STEP_CLASS = "flex gap-5 py-7 sm:gap-7 sm:py-9";
/** La regla del modo lineal: un borde. En el deck la sustituye la pincelada. */
const STEP_RULE_CLASS = "border-t-[3px] border-[var(--g-rule)]";

/**
 * 05 · Del codigo a produccion — suelo SHU (campo rojo).
 *
 * La regla que manda aqui (docs/DESIGN_SYSTEM.md §1.2, suelo shu): sobre este
 * bermellon NO existe un tono atenuado que pase AA — washi-300 se queda en
 * 4.27:1. Por eso TODO el texto va en --g-text / --g-faint (5.01 y 5.48:1) y
 * la jerarquia se construye con TAMANO y PESO, nunca bajando el color.
 *
 * Los numerales son la unica pieza en oro: 3.28:1 sobre el rojo solo vale a
 * partir de 24px, y text-display arranca en 40px. Ademas llevan contorno de
 * tinta (la misma tecnica que <Sfx>), asi que se separan del campo pase lo
 * que pase — oro y rojo como formas adyacentes, no como texto sobre texto.
 */
export function Produccion() {
  const { mode } = useStage();
  const deck = mode === "deck";

  return (
    <Section
      id={META.slug}
      title={META.title}
      jp={META.jp}
      numeral={META.numeral}
      ground={META.ground}
      edge="splash"
      tone="lines"
    >
      <p className="max-w-[62ch] font-body text-body-lg text-on-ground">
        No entrego un repositorio y me voy. Hago el ciclo completo — y me quedo a mantenerlo.
      </p>

      {/*
        Dos columnas de ancho DISTINTO (1.1fr / 0.9fr) y una regla de tinta por
        paso, no una rejilla compartida: es lo que evita que seis elementos
        iguales se lean como una tabla en mitad del campo de color.
      */}
      <ol className="mt-10 grid grid-cols-1 gap-x-14 sm:mt-14 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,0.9fr)]">
        {pipeline.map((step, i) => (
          <ReachItem
            key={step.id}
            as="li"
            className={deck ? `relative ${STEP_CLASS}` : `${STEP_CLASS} ${STEP_RULE_CLASS}`}
            y={TEXT_RISE_PX}
            amount={0.35}
            duration={0.4}
            delay={i * STAGGER}
          >
            {deck && (
              <BrushStroke
                className="pointer-events-none absolute inset-x-0 top-0 h-2 w-full -translate-y-1/2"
                strokeWidth={5}
                scrub={{ range: forStep(RULE_DRAW, i), over: "reach" }}
              />
            )}

            <ScrubStamp
              range={forStep(NUMERAL_STAMP, i)}
              over="reach"
              className="shrink-0 select-none font-brush text-display leading-none text-[var(--g-accent)] [paint-order:stroke_fill] [-webkit-text-stroke:2px_var(--g-structure)]"
            >
              <span aria-hidden="true">{NUMERALES[i]}</span>
            </ScrubStamp>

            <ScrubReveal
              range={forStep(TEXT_REVEAL, i)}
              over="reach"
              distance={TEXT_RISE_PX}
              className="min-w-0"
            >
              <h3 className="font-poster text-h2 uppercase leading-none text-[var(--g-heading)]">
                {step.title}
              </h3>
              <p className="mt-3 max-w-[46ch] font-body text-body text-on-ground">{step.body}</p>
            </ScrubReveal>
          </ReachItem>
        ))}
      </ol>
    </Section>
  );
}
