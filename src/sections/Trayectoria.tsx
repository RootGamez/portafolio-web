import { Section } from "@/components/layout/Section";
import { BrushStroke } from "@/components/ink/BrushStroke";
import { InkPanel } from "@/components/ink/InkPanel";
import { Sfx } from "@/components/ink/Sfx";
import { ReachItem } from "@/components/motion/ReachItem";
import { ScrubReveal } from "@/components/motion/ScrubReveal";
import { ScrubStamp } from "@/components/motion/ScrubStamp";
import { timeline } from "@/data/timeline";
import { STAGGER } from "@/lib/motion";
import type { ScrubRange } from "@/lib/stage/scrub";
import { getSectionMeta } from "@/sections/meta";

/**
 * Plancha 02 — la trayectoria.
 *
 * Es una SECUENCIA cronologica, asi que va en <ol>/<li>: un lector de pantalla
 * anuncia "lista de 3 elementos" y el orden significa algo. La decoracion
 * (trazo, nodo, onomatopeya) es toda aria-hidden.
 *
 * Composicion (docs/DESIGN_SYSTEM.md §5, fila 02): un eje de pincel vertical
 * con los hitos alternando lado. En movil el eje se va a la izquierda y todo
 * cae en una columna — alternar lados a 375px solo produciria dos columnas
 * de 150px ilegibles.
 *
 * MODO ESCENARIOS (Fase 4.3): cada hito se anima AL ALCANZARLO, cuando la linea
 * de lectura del escenario lo cruza (`ScrubReach`): su tramo de eje se dibuja con
 * el scroll, el nodo de oro se estampa ("se enciende"), llega el panel y revienta
 * su onomatopeya. El eje se dibuja de hito en hito, asi que en conjunto es un
 * solo trazo que avanza con la lectura. En modo lineal, el Reveal de siempre.
 *
 * POR QUE UN TRAZO POR HITO Y NO UNO SOLO PARA TODO EL EJE:
 * BrushStroke dispara con `viewport={{ amount: 0.6 }}`. Un unico trazo que
 * cubriera los tres hitos mediria mas que la ventana, ese 60% no se cumpliria
 * nunca y el path se quedaria con pathLength 0 — es decir, invisible. Troceado
 * por hito, cada segmento entra de sobra y ademas se dibuja al ritmo del scroll.
 */

/** Slug, titulo, kanji y suelo salen del indice: una sola fuente para
    la seccion y para el riel de navegacion. */
const META = getSectionMeta("trayectoria");

/**
 * Eje vertical. viewBox estrecho y alto porque BrushStroke pinta con
 * preserveAspectRatio="none": la X no se estira (el temblor del pincel
 * conserva su amplitud en px) y la Y se adapta a lo que mida el hito.
 */
const AXIS_D = "M6 1 C 3.4 14, 8.6 27, 5.4 40 S 8.8 66, 6 78 S 4.4 92, 6.6 99";
const AXIS_VIEWBOX = "0 0 12 100";

/*
 * Tramos de cada hito sobre lo que la linea de lectura lo ha cruzado (0..1).
 * El nodo esta arriba del hito (top-9): se enciende casi al llegar.
 */
const AXIS_DRAW: ScrubRange = [0, 1];
const NODE_STAMP: ScrubRange = [0.04, 0.16];
const PANEL_REVEAL: ScrubRange = [0.08, 0.42];
const PANEL_RISE_PX = 32;
const SFX_STAMP: ScrubRange = [0.36, 0.5];

export function Trayectoria() {
  return (
    <Section
      id={META.slug}
      title={META.title}
      jp={META.jp}
      numeral={META.numeral}
      ground={META.ground}
      edge="rule"
      edgeMirror
    >
      <p className="mb-10 max-w-[62ch] text-body-lg text-on-ground-muted">
        Estudio Ingeniería de Software en SENATI y soy autodidacta: aprendí a
        desplegar antes de que nadie me lo pidiera.
      </p>

      <ol className="relative space-y-10 md:space-y-16">
        {timeline.map((milestone, i) => {
          const isLeft = i % 2 === 0;

          return (
            <ReachItem
              key={milestone.id}
              as="li"
              className="relative pl-14 md:pl-0"
              y={20}
              amount={0.3}
              delay={i * STAGGER}
            >
              {/* Eje: a la izquierda en movil, al centro a partir de 768px. */}
              <span
                aria-hidden="true"
                className="absolute left-2 top-0 h-full w-4 -translate-x-1/2 md:left-1/2"
              >
                <BrushStroke
                  d={AXIS_D}
                  viewBox={AXIS_VIEWBOX}
                  className="h-full w-full"
                  strokeWidth={3.2}
                  delay={i * 0.05}
                  scrub={{ range: AXIS_DRAW, over: "reach" }}
                />
              </span>

              {/* Nodo del hito. Oro girado 45 grados con canto de tinta: es FORMA,
                  nunca lleva texto (el oro sobre papel da 1.53:1). Estatico a
                  proposito — el presupuesto de movimiento del hito ya se lo
                  llevan el trazo y la entrada del panel. */}
              <ScrubStamp
                range={NODE_STAMP}
                over="reach"
                className="absolute left-2 top-9 h-3.5 w-3.5 -translate-x-1/2 md:left-1/2"
              >
                <span
                  aria-hidden="true"
                  className="block h-full w-full rotate-45 border-2 border-[var(--g-structure)] bg-kin"
                />
              </ScrubStamp>

              <div
                className={`relative ${isLeft ? "md:w-[calc(50%-2.75rem)]" : "md:ml-auto md:w-[calc(50%-2.75rem)]"}`}
              >
                {/* La onomatopeya se queda DENTRO del ancho del panel para no
                    invadir el eje cuando el hito cae a la izquierda. */}
                <ScrubStamp
                  range={SFX_STAMP}
                  over="reach"
                  className="absolute -top-7 right-3 z-20"
                >
                  <Sfx rotate={isLeft ? -8 : 7}>{milestone.pow}</Sfx>
                </ScrubStamp>

                <ScrubReveal
                  range={PANEL_REVEAL}
                  over="reach"
                  distance={PANEL_RISE_PX}
                >
                  <InkPanel rotate={isLeft ? -1 : 1} caption={milestone.badge}>
                    <p className="font-mono text-caption uppercase text-on-koma-faint">
                      {milestone.period}
                    </p>
                    <h3 className="mt-1 font-poster text-h3 uppercase text-on-koma">
                      {milestone.org}
                    </h3>
                    <p className="font-mono text-small font-bold text-[var(--g-accent)]">
                      {milestone.role}
                    </p>
                    <p className="mt-2 text-body text-on-koma-muted">
                      {milestone.body}
                    </p>
                  </InkPanel>
                </ScrubReveal>
              </div>
            </ReachItem>
          );
        })}
      </ol>
    </Section>
  );
}
