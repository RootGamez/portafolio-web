import { Section } from "@/components/layout/Section";
import { InkPanel } from "@/components/ink/InkPanel";
import { Sfx } from "@/components/ink/Sfx";
import { ReachItem } from "@/components/motion/ReachItem";
import { ScrubReveal } from "@/components/motion/ScrubReveal";
import { ScrubStamp } from "@/components/motion/ScrubStamp";
import { STAGGER } from "@/lib/motion";
import type { ScrubRange } from "@/lib/stage/scrub";
import { getSectionMeta } from "@/sections/meta";

/** Slug, titulo, kanji y suelo salen del indice: una sola fuente para
    la seccion y para el riel de navegacion. */
const META = getSectionMeta("fuera-del-codigo");

/**
 * 07 · Fuera del codigo — suelo SUMI (tinta).
 *
 * Decision de contraste que manda sobre la composicion: el enlace "Verla" va
 * en ORO (--g-link = kin-500, 9.90:1 sobre tinta), porque el bermellon sobre
 * tinta se queda en 3.02:1 y falla. Pero el oro sobre papel es 1.53:1, asi
 * que ese enlace NO puede vivir en un koma de papel — de ahi que la Pizzeria
 * use el koma negativo (fondo tinta, borde crema, 15.12:1), la unica variante
 * que el suelo sumi permite. El Radisson se queda en papel: los dos paneles
 * en negativo serian monotonos, y asi la plancha tiene claro y oscuro.
 *
 * Modo escenarios (Fase 4.8), sobre la intro: los dos paneles entran desde
 * LADOS OPUESTOS — la pizzeria por la izquierda y, un poco despues, el hotel
 * por la derecha — y el ¡ÑAM! se estampa cuando la pizzeria se asienta. Los
 * envoltorios llevan `h-full` para que los paneles sigan estirandose a su celda.
 * En modo lineal, el Reveal por tiempo de siempre (`ReachItem`).
 */
const PIZZERIA_IN: ScrubRange = [0.05, 0.4];
const HOTEL_IN: ScrubRange = [0.25, 0.6];
const SFX_STAMP: ScrubRange = [0.4, 0.52];
const SLIDE_PX = 96;
export function FueraDelCodigo() {
  return (
    <Section
      id={META.slug}
      title={META.title}
      jp={META.jp}
      numeral={META.numeral}
      ground={META.ground}
      edge="tear"
      tone="fine"
    >
      <p className="max-w-[62ch] font-body text-body-lg text-on-ground">
        No todo es código. Y resulta que todo lo demás también me enseñó a programar.
      </p>

      {/* Asimetria: 7 columnas para la pizzeria, 5 para el hotel, y el segundo
          panel baja 5rem para que los dos komas no arranquen en la misma linea. */}
      <div className="mt-12 grid grid-cols-1 gap-10 sm:mt-16 lg:grid-cols-12 lg:gap-8">
        <ReachItem className="relative lg:col-span-7" y={22}>
          <ScrubStamp range={SFX_STAMP} className="absolute -top-7 right-2 z-20">
            <Sfx kana="パク" rotate={-9}>
              ¡ÑAM!
            </Sfx>
          </ScrubStamp>

          <ScrubReveal axis="x" range={PIZZERIA_IN} distance={-SLIDE_PX} className="h-full">
            <InkPanel negative rotate={-1} tone="coarse" toneFade className="h-full">
              <h3 className="font-poster text-h3 uppercase leading-none text-[var(--g-accent)]">
                Pizzería Sabor Llanero
              </h3>
              <p className="mt-2 font-mono text-caption uppercase text-on-koma-faint">
                Encargado multifuncional &amp; marketing · Dic 2020 – actualidad
              </p>
              <p className="mt-4 max-w-[52ch] font-body text-body text-on-koma-muted">
                Antes de dedicarme al software llevaba el turno de la pizzería familiar:
                diseño las artes, gestiono las redes y corro las campañas en Facebook.
              </p>
              <p className="mt-4 max-w-[52ch] font-body text-body font-bold text-on-koma">
                Cuando la pizzería necesitó su web, la construí yo mismo.{" "}
                <a
                  href="#proyectos"
                  className="inline-flex min-h-11 items-center font-poster uppercase text-link underline decoration-2 underline-offset-4 hover:text-link-hover"
                >
                  Verla →
                </a>
              </p>
            </InkPanel>
          </ScrubReveal>
        </ReachItem>

        <ReachItem className="lg:col-span-5 lg:mt-20" y={22} delay={STAGGER * 2}>
          <ScrubReveal axis="x" range={HOTEL_IN} distance={SLIDE_PX} className="h-full">
            <InkPanel rotate={1} className="h-full">
              <h3 className="font-poster text-h3 uppercase leading-none text-on-koma">
                Radisson Paracas Resort
              </h3>
              <p className="mt-2 font-mono text-caption uppercase text-on-koma-faint">
                Staff de hotel · Jul 2022 – Jul 2023
              </p>
              <p className="mt-4 max-w-[46ch] font-body text-body text-on-koma-muted">
                Fui botones, almacenista y mantenimiento. Ahí aprendí algo que ninguna clase enseña:
                a resolver problemas reales, rápido y sin excusas.
              </p>
              <p className="mt-4 max-w-[46ch] font-body text-body font-bold text-on-koma">
                Es la misma actitud que llevo hoy a cada sprint.
              </p>
            </InkPanel>
          </ScrubReveal>
        </ReachItem>
      </div>
    </Section>
  );
}
