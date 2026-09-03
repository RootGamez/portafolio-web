import { FileDown } from "lucide-react";
import { Section } from "@/components/layout/Section";
import { Fukidashi } from "@/components/ink/Fukidashi";
import { InkPanel } from "@/components/ink/InkPanel";
import { InkButton } from "@/components/ink/InkButton";
import { Sfx } from "@/components/ink/Sfx";
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
          <Fukidashi>
            <p className="font-semibold">
              «De la idea al despliegue — y del despliegue al mantenimiento.»
            </p>
          </Fukidashi>
        </div>

        {/* La onomatopeya ocupa el hueco muerto a la derecha del globo.
            Decorativa y aria-hidden por dentro; se oculta en movil porque
            ahi no hay canalon donde ponerla sin robarle sitio al texto.
            Va envuelta: el `hidden` vive en el contenedor para no pelearse
            con el `inline-flex` que Sfx trae de serie. */}
        <div className="hidden md:col-span-4 md:col-start-9 md:row-start-1 md:flex md:items-center md:justify-end">
          <Sfx kana="ドン" rotate={-8}>
            ¡POW!
          </Sfx>
        </div>

        {/* Fila 2 — el koma, desplazado a la derecha y solapado hacia arriba. */}
        <div className="koma-overlap-up relative z-10 md:col-span-9 md:col-start-4 md:row-start-2">
          <InkPanel rotate={1} tone="fine" toneFade className="md:pt-10">
            <p className="text-body text-on-koma-muted">
              Soy desarrollador Full Stack (React + Django) y{" "}
              <strong className="text-on-koma">
                lidero el equipo de desarrollo en Screen IA
              </strong>
              . Diseño, construyo, despliego y mantengo software real en producción — no solo
              demos.
            </p>
          </InkPanel>
        </div>

        {/* Fila 3 — acciones, alineadas con el borde izquierdo del koma. */}
        <div className="flex flex-wrap gap-3 sm:gap-4 md:col-span-9 md:col-start-4 md:row-start-3 md:mt-8">
          <InkButton variant="primary" href="#proyectos">
            Ver mis proyectos
          </InkButton>
          <InkButton
            variant="accent"
            href="/cv/CV-Anthony-Gamez.pdf"
            download
            ariaLabel="Descargar el currículum de Anthony Gámez en PDF"
          >
            <FileDown size={18} strokeWidth={3} aria-hidden="true" />
            Mi CV
          </InkButton>
          <InkButton variant="ghost" href="#contacto">
            Hablemos
          </InkButton>
        </div>
      </div>
    </Section>
  );
}
