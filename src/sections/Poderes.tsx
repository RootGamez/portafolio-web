import { Section } from "@/components/layout/Section";
import { InkPanel } from "@/components/ink/InkPanel";
import type { ToneKind } from "@/components/ink/InkPanel";
import { ReachItem } from "@/components/motion/ReachItem";
import { ScrubReveal } from "@/components/motion/ScrubReveal";
import { ScrubStamp } from "@/components/motion/ScrubStamp";
import { alsoWorkedWith, skillGroups } from "@/data/skills";
import { STAGGER } from "@/lib/motion";
import type { ScrubRange } from "@/lib/stage/scrub";
import { getSectionMeta } from "@/sections/meta";

/** Slug, titulo, kanji y suelo salen del indice: una sola fuente para
    la seccion y para el riel de navegacion. */
const META = getSectionMeta("poderes");

/**
 * El bento. Siete grupos, tamanos distintos — si todos midieran igual, esto
 * seria una tabla de habilidades, que es exactamente lo que un poster no es.
 * Frontend y Cloud ocupan dos filas; la IA cierra el bento a lo ancho, porque
 * es como trabajo hoy con todo lo demas.
 *
 * Colocacion resultante en la rejilla de 12 (auto-placement, en este orden):
 *   frontend r1-2 c1-7 · backend r1 c8-12 · datos r2 c8-12
 *   cloud    r3-4 c1-6 · arquitectura r3 c7-12 · infraestructura r4 c7-12
 *   ia       r5   c1-12
 */
const SPAN: readonly string[] = [
  "md:col-span-2 lg:col-span-7 lg:row-span-2",
  "lg:col-span-5",
  "lg:col-span-5",
  "md:col-span-2 lg:col-span-6 lg:row-span-2",
  "lg:col-span-6",
  "lg:col-span-6",
  "md:col-span-2 lg:col-span-12",
];

/** Rotaciones de la whitelist cerrada (+-3 grados). Rompen la cuadricula. */
const ROTATE = [-1, 1, -2, 1, 2, -1, 1] as const;

/*
 * Modo escenarios (Fase 4.7): el bento SE ENSAMBLA — cada panel cae en su hueco
 * (un sello suave, de PANEL_FROM_SCALE a 1) al alcanzarlo la linea de lectura —
 * y sus tags caen EN CASCADA, cada uno con su tramo. El envoltorio del panel
 * lleva `h-full`: sin el, el panel dejaria de estirarse a su celda.
 */
const PANEL_STAMP: ScrubRange = [0, 0.15];
const PANEL_FROM_SCALE = 1.12;
const TAG_START = 0.15;
const TAG_STEP = 0.04;
const TAG_LENGTH = 0.15;
const TAG_LAST_START = 0.75;
const TAG_RISE_PX = 10;

/** El tramo del tag `index`: escalonado, sin pasar del final del bloque. */
function tagRange(index: number): ScrubRange {
  const start = Math.min(TAG_START + index * TAG_STEP, TAG_LAST_START);
  return [start, start + TAG_LENGTH];
}

/** Tramas alternas: ningun koma vecino comparte la misma. */
const TONE = ["fine", false, "lines", "coarse", false, "fine", "lines"] as const satisfies readonly ToneKind[];

/**
 * 06 · Mis Habilidades — suelo WASHI con screentone.
 *
 * Los tags van sobre washi-300 dentro de un koma de washi-100: tinta sobre
 * papel hundido, 12.88:1. A 14px (text-small) y no a 12: son metadatos, pero
 * se leen en un movil.
 */
export function Poderes() {
  return (
    <Section
      id={META.slug}
      title={META.title}
      jp={META.jp}
      numeral={META.numeral}
      ground={META.ground}
      edge="wash"
      tone="fine"
    >
      <p className="max-w-[62ch] font-body text-body-lg text-on-ground">
        Mi stack de hoy — el de los proyectos que acabas de ver, no una lista de deseos.
      </p>

      <div className="mt-10 grid grid-cols-1 gap-7 sm:mt-14 md:grid-cols-2 lg:grid-cols-12 lg:gap-8">
        {skillGroups.map((group, i) => (
          <ReachItem
            key={group.id}
            className={SPAN[i]}
            y={20}
            amount={0.25}
            duration={0.4}
            delay={i * STAGGER}
          >
            <ScrubStamp range={PANEL_STAMP} over="reach" fromScale={PANEL_FROM_SCALE} className="h-full">
              <InkPanel rotate={ROTATE[i]} tone={TONE[i]} toneFade className="h-full">
                <h3 className="font-poster text-h3 uppercase leading-none text-on-koma">
                  {group.title}
                </h3>

                <ul className="mt-4 flex flex-wrap gap-2">
                  {group.items.map((item, j) => (
                    <ScrubReveal
                      key={item}
                      as="li"
                      range={tagRange(j)}
                      over="reach"
                      distance={TAG_RISE_PX}
                      className="border-[3px] border-[var(--g-structure)] bg-washi-deep px-2.5 py-1 font-mono text-small leading-tight text-on-koma"
                    >
                      {item}
                    </ScrubReveal>
                  ))}
                </ul>
              </InkPanel>
            </ScrubStamp>
          </ReachItem>
        ))}
      </div>

      <p className="mt-10 font-mono text-small text-on-ground-muted">
        <strong className="font-bold text-on-ground">También he trabajado con:</strong>{" "}
        {alsoWorkedWith.join(" · ")}
      </p>

      <p className="mt-3 font-mono text-small text-on-ground-muted">
        <strong className="font-bold text-on-ground">Idiomas:</strong> español (nativo) · inglés
        (básico)
      </p>
    </Section>
  );
}
