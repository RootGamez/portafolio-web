import { FileDown } from "lucide-react";
import { Section } from "@/components/layout/Section";
import { Fukidashi } from "@/components/ink/Fukidashi";
import { InkPanel } from "@/components/ink/InkPanel";
import { InkButton } from "@/components/ink/InkButton";
import { Sfx } from "@/components/ink/Sfx";
import { ScrubReveal } from "@/components/motion/ScrubReveal";
import { ScrubStamp } from "@/components/motion/ScrubStamp";
import type { ScrubRange } from "@/lib/stage/scrub";
import { getSectionMeta } from "@/sections/meta";

/**
 * Plancha 01 — Sobre mi.
 *
 * Composicion de docs/DESIGN_SYSTEM.md §5, fila 01: el fukidashi ocupa las
 * columnas 1-8 y el koma las 4-13, y el panel sube 2rem con `koma-overlap-up`
 * para meterse debajo del globo. El solape es lo que convierte dos cajas
 * apiladas en dos vinetas de manga.
 *
 * Dos cuidados que no son obvios:
 *  - el solape solo existe en >=768px (asi esta escrito .koma-overlap-up en
 *    ink.css); en movil las dos cajas se apilan limpias y nada se tapa;
 *  - el koma lleva `md:pt-10` extra para que el parrafo arranque POR DEBAJO
 *    de la zona que pisa el globo. Sin eso, la primera linea queda oculta.
 *
 * Los botones eran goTo() del router de paginas; ahora son anclas reales,
 * que ademas hacen la seccion enlazable y navegable con teclado.
 */

/** Slug, titulo, kanji y suelo salen del indice: una sola fuente para
    la seccion y para el riel de navegacion. */
const META = getSectionMeta("sobre-mi");

/*
 * Coreografia del modo escenarios (Fase 4.2), sobre la INTRO del escenario
 * (STAGE_TIMING["sobre-mi"]). Se lee como una plancha: primero el globo, luego
 * la vineta que sube a pisarlo, la onomatopeya REVIENTA cuando la vineta se
 * asienta y los botones caen de uno en uno. En modo lineal todo esta quieto.
 *
 *   globo 0 ─ 0,22 · panel 0,15 ─ 0,42 · ¡POW! 0,42 ─ 0,55
 *   botones 0,55 ─ 0,68 / 0,62 ─ 0,75 / 0,69 ─ 0,82 · pausa hasta 1
 */
const BALLOON: ScrubRange = [0, 0.22];
const PANEL: ScrubRange = [0.15, 0.42];
const SFX_STAMP: ScrubRange = [0.42, 0.55];
const BUTTONS: readonly ScrubRange[] = [
  [0.55, 0.68],
  [0.62, 0.75],
  [0.69, 0.82],
];

export function SobreMi() {
  return (
    <Section
      id={META.slug}
      title={META.title}
      jp={META.jp}
      numeral={META.numeral}
      ground={META.ground}
      edge="rule"
    >
      <div className="grid gap-6 md:grid-cols-12 md:gap-x-6 md:gap-y-0">
        {/* Fila 1 — el globo, mordiendo la mitad izquierda. z-20 para quedar
            SIEMPRE por encima del koma que sube a pisarlo. */}
        <div className="relative z-20 md:col-span-8 md:col-start-1">
          <ScrubReveal range={BALLOON}>
            <Fukidashi>
              <p className="font-semibold">
                «Un problema no es un obstáculo: es un reto.»
              </p>
            </Fukidashi>
          </ScrubReveal>
        </div>

        {/* La onomatopeya ocupa el hueco muerto a la derecha del globo.
            Decorativa y aria-hidden por dentro; se oculta en movil porque
            ahi no hay canalon donde ponerla sin robarle sitio al texto.
            Va envuelta: el `hidden` vive en el contenedor para no pelearse
            con el `inline-flex` que Sfx trae de serie.

            Se alinea ARRIBA y lleva z-30 por un motivo concreto: centrada en
            la fila caia justo donde el koma sube 2rem a solaparse, y como el
            koma tiene z-10 lo tapaba por debajo. Arriba queda libre, y el
            z-30 garantiza que si algun dia se rozan, el SFX reviente por
            encima de la vineta — que es como se comporta en una plancha
            impresa, nunca por detras. */}
        <div className="hidden md:col-span-4 md:col-start-9 md:row-start-1 md:z-30 md:flex md:items-start md:justify-end md:pt-1">
          <ScrubStamp range={SFX_STAMP}>
            <Sfx kana="ドン" rotate={-8}>
              ¡POW!
            </Sfx>
          </ScrubStamp>
        </div>

        {/* Fila 2 — el koma, desplazado a la derecha y solapado hacia arriba. */}
        <div className="koma-overlap-up relative z-10 md:col-span-9 md:col-start-4 md:row-start-2">
          <ScrubReveal range={PANEL} distance={40}>
            <InkPanel rotate={1} tone="fine" toneFade className="md:pt-10">
              <p className="text-body text-on-koma-muted">
                Soy ingeniero de software full stack, enfocado en arquitecturas cloud-native y
                serverless: el edge de Cloudflare (Workers, Pages, R2) y servicios backend en AWS.{" "}
                <strong className="text-on-koma">Lo que más disfruto es resolver problemas</strong>:
                diseño, construyo, despliego y mantengo software real en producción — no solo demos.
              </p>
            </InkPanel>
          </ScrubReveal>
        </div>

        {/* Fila 3 — acciones, alineadas con el borde izquierdo del koma. */}
        <div className="flex flex-wrap gap-3 sm:gap-4 md:col-span-9 md:col-start-4 md:row-start-3 md:mt-8">
          <ScrubReveal range={BUTTONS[0]}>
            <InkButton variant="primary" href="#proyectos">
              Ver mis proyectos
            </InkButton>
          </ScrubReveal>
          <ScrubReveal range={BUTTONS[1]}>
            <InkButton
              variant="accent"
              href="/cv/CV-Anthony-Gamez.pdf"
              download
              ariaLabel="Descargar el currículum de Anthony Gámez en PDF"
            >
              <FileDown size={18} strokeWidth={3} aria-hidden="true" />
              Mi CV
            </InkButton>
          </ScrubReveal>
          <ScrubReveal range={BUTTONS[2]}>
            <InkButton variant="ghost" href="#contacto">
              Hablemos
            </InkButton>
          </ScrubReveal>
        </div>
      </div>
    </Section>
  );
}
