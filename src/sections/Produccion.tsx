import { Section } from "@/components/layout/Section";
import { Reveal } from "@/components/motion/Reveal";
import { pipeline } from "@/data/timeline";
import { STAGGER } from "@/lib/motion";
import { getSectionMeta } from "@/sections/meta";

/** Slug, titulo, kanji y suelo salen del indice: una sola fuente para
    la seccion y para el riel de navegacion. */
const META = getSectionMeta("produccion");

/**
 * Numerales kanji de los seis pasos. Van aria-hidden a proposito: el orden
 * real lo aporta el <ol>, asi que leerlos seria decir el numero dos veces.
 */
const NUMERALES = ["一", "二", "三", "四", "五", "六"] as const;

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
          <Reveal
            key={step.id}
            as="li"
            className="flex gap-5 border-t-[3px] border-[var(--g-rule)] py-7 sm:gap-7 sm:py-9"
            y={18}
            amount={0.35}
            duration={0.4}
            delay={i * STAGGER}
          >
            <span
              aria-hidden="true"
              className="shrink-0 select-none font-brush text-display leading-none text-[var(--g-accent)] [paint-order:stroke_fill] [-webkit-text-stroke:2px_var(--g-structure)]"
            >
              {NUMERALES[i]}
            </span>

            <div className="min-w-0">
              <h3 className="font-poster text-h2 uppercase leading-none text-[var(--g-heading)]">
                {step.title}
              </h3>
              <p className="mt-3 max-w-[46ch] font-body text-body text-on-ground">{step.body}</p>
            </div>
          </Reveal>
        ))}
      </ol>
    </Section>
  );
}
