import { Section } from "@/components/layout/Section";
import { InkPanel } from "@/components/ink/InkPanel";
import { Sfx } from "@/components/ink/Sfx";
import { Reveal } from "@/components/motion/Reveal";
import { STAGGER } from "@/lib/motion";
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
 */
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
        <Reveal className="relative lg:col-span-7" y={22}>
          <Sfx kana="パク" rotate={-9} className="absolute -top-7 right-2 z-20">
            ¡ÑAM!
          </Sfx>

          <InkPanel negative rotate={-1} tone="coarse" toneFade className="h-full">
            <h3 className="font-poster text-h3 uppercase leading-none text-[var(--g-accent)]">
              Pizzería Sabor Llanero
            </h3>
            <p className="mt-2 font-mono text-caption uppercase text-on-koma-faint">
              Encargado multifuncional &amp; marketing · Dic 2020 – actualidad
            </p>
            <p className="mt-4 max-w-[52ch] font-body text-body text-on-koma-muted">
              Antes de liderar equipos de desarrollo llevaba el turno de la pizzería familiar:
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
        </Reveal>

        <Reveal className="lg:col-span-5 lg:mt-20" y={22} delay={STAGGER * 2}>
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
        </Reveal>
      </div>
    </Section>
  );
}
