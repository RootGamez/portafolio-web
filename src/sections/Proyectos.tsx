import { ProjectCard } from "@/components/ProjectCard";
import { Section } from "@/components/layout/Section";
import { Reveal } from "@/components/motion/Reveal";
import { isFeatured, projects } from "@/data/projects";
import { STAGGER } from "@/lib/motion";
import { getSectionMeta } from "@/sections/meta";

/* Los dos protagonistas. Se filtra por id y NO se reordena: el orden del array
   de datos es el que decide cual va arriba. */
const META = getSectionMeta("proyectos");

/* La media alterna de lado entre las dos planchas. Es el mecanismo barato que
   impide que la seccion se lea como una lista: el ojo cruza la pagina en zigzag
   en vez de bajar en linea recta. Ver DESIGN_SYSTEM §5. */
const MEDIA_SIDES = ["start", "end"] as const;

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
        Los construí, los desplegué y los mantengo. Dominio, DNS y servidor incluidos.
      </p>

      <div className="flex flex-col gap-14 lg:gap-20">
        {featured.map((project, index) => (
          <Reveal
            key={project.id}
            y={32}
            delay={index * STAGGER}
            // El solape de koma solo a partir de 768px: en movil, apilado limpio.
            className={index > 0 ? "koma-overlap-up" : ""}
          >
            <ProjectCard
              project={project}
              rotate={index === 0 ? -1 : 1}
              featured
              negative
              mediaSide={MEDIA_SIDES[index % MEDIA_SIDES.length]}
            />
          </Reveal>
        ))}
      </div>
    </Section>
  );
}
