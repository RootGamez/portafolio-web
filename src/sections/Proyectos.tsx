import { ProjectCard } from "@/components/ProjectCard";
import { Section } from "@/components/layout/Section";
import { ReachItem } from "@/components/motion/ReachItem";
import { ScrubReveal } from "@/components/motion/ScrubReveal";
import { isFeatured, projects } from "@/data/projects";
import { STAGGER } from "@/lib/motion";
import { CARD_VIDEO_READY_REACH } from "@/lib/stage/config";
import type { ScrubRange } from "@/lib/stage/scrub";
import { getSectionMeta } from "@/sections/meta";

/* Los dos protagonistas. Se filtra por id y NO se reordena: el orden del array
   de datos es el que decide cual va arriba. */
const META = getSectionMeta("proyectos");

/* La media alterna de lado entre las dos planchas. Es el mecanismo barato que
   impide que la seccion se lea como una lista: el ojo cruza la pagina en zigzag
   en vez de bajar en linea recta. Ver DESIGN_SYSTEM §5. */
const MEDIA_SIDES = ["start", "end"] as const;

/*
 * Modo escenarios (Fase 4.4): las tarjetas entran DE UNA EN UNA, cada una al
 * alcanzarla la linea de lectura (`ReachItem`). El video sigue su regla de
 * siempre (hover/foco en escritorio; en tactil, al ocupar la pantalla, y solo
 * en el escenario activo, y nunca antes de que la tarjeta haya entrado):
 * arrancarlo con el scroll en escritorio seria un video que se pone en marcha
 * solo (WCAG 2.2.2, decision pendiente del usuario).
 */
// Termina justo donde la tarjeta puede empezar a reproducir su video.
const CARD_REVEAL: ScrubRange = [0, CARD_VIDEO_READY_REACH];
const CARD_RISE_PX = 48;

/**
 * 三 — Mis proyectos. Suelo SUMI (tinta, negativo).
 *
 * Dos komas nocturnos casi a sangre con el video de protagonista. Sobre tinta
 * el enlace es ORO: el bermellon da 3.02:1 y falla AA (DESIGN_SYSTEM §1.3,
 * ley 3). Por eso las dos vinetas van en variante `negative` — asi el fondo del
 * koma coincide con el suelo y el acento dorado es el par medido.
 */
export function Proyectos() {
  const featured = projects.filter((project) => isFeatured(project.id));

  return (
    <Section
      id={META.slug}
      title={META.title}
      jp={META.jp}
      numeral={META.numeral}
      ground={META.ground}
      edge="sweep"
      tone="fine"
    >
      <p className="mb-12 max-w-[60ch] text-body-lg text-on-ground-muted lg:mb-16">
        Los construí, los desplegué y los mantengo. Dominio, DNS y servidor
        incluidos.
      </p>

      <div className="flex flex-col gap-14 lg:gap-20">
        {featured.map((project, index) => (
          <ReachItem
            key={project.id}
            y={32}
            delay={index * STAGGER}
            // El solape de koma solo a partir de 768px: en movil, apilado limpio.
            className={index > 0 ? "koma-overlap-up" : ""}
          >
            <ScrubReveal
              range={CARD_REVEAL}
              over="reach"
              distance={CARD_RISE_PX}
            >
              <ProjectCard
                project={project}
                rotate={index === 0 ? -1 : 1}
                featured
                negative
                mediaSide={MEDIA_SIDES[index % MEDIA_SIDES.length]}
              />
            </ScrubReveal>
          </ReachItem>
        ))}
      </div>
    </Section>
  );
}
