import { ProjectCard } from "@/components/ProjectCard";
import { Section } from "@/components/layout/Section";
import { Reveal } from "@/components/motion/Reveal";
import { projects } from "@/data/projects";
import { STAGGER } from "@/lib/motion";
import { getSectionMeta } from "@/sections/meta";

/* Los dos que ya tienen su propia plancha en 三. Aqui va todo lo demas. */
const FEATURED_IDS = ["jaw-project", "adflow"] as const;

const META = getSectionMeta("mas-proyectos");

/**
 * 四 — Mas proyectos. Suelo WASHI.
 *
 * Bento asimetrico, NO tres columnas iguales. Tres mecanismos rompen la lectura
 * de lista (DESIGN_SYSTEM §5):
 *   1. anchos distintos — la plancha guia ocupa 7 de 12 columnas, la pila
 *      lateral 5;
 *   2. desfase vertical — la pila lateral entra 4rem mas abajo, asi que ninguna
 *      fila del grid queda alineada;
 *   3. rotaciones alternas dentro de la whitelist de +-3 grados.
 *
 * Todo eso solo a partir de 1024px. Por debajo, apilado limpio de una columna.
 */
export function MasProyectos() {
  const rest = projects.filter(
    (project) => !FEATURED_IDS.some((id) => id === project.id),
  );

  const [lead, ...aside] = rest;

  return (
    <Section
      id={META.slug}
      title={META.title}
      jp={META.jp}
      numeral={META.numeral}
      ground={META.ground}
      edge="dry"
    >
      <p className="mb-12 max-w-[60ch] text-body-lg text-on-ground-muted lg:mb-16">
        Clientes reales y proyectos propios — mismos estándares, misma entrega.
      </p>

      <div className="flex flex-col gap-10 lg:grid lg:grid-cols-12 lg:items-start lg:gap-8">
        {lead && (
          <Reveal y={28} className="lg:col-span-7">
            {/* La plancha guia es la unica que muestra bullets: es la que tiene
                ancho para que la medida de linea no se desmorone. */}
            <ProjectCard project={lead} rotate={-1} />
          </Reveal>
        )}

        {/* La pila lateral entra desfasada hacia abajo. Ese offset es lo que
            impide que las tres vinetas se lean como una fila. */}
        <div className="flex flex-col gap-10 lg:col-span-5 lg:mt-16 lg:gap-8">
          {aside.map((project, index) => (
            <Reveal key={project.id} y={28} delay={(index + 1) * STAGGER}>
              <ProjectCard
                project={project}
                rotate={index % 2 === 0 ? 1 : -1}
                // Sin demo grabada la vineta se queda corta: ahi si caben los
                // bullets y equilibran la altura de la pila.
                compact={Boolean(project.media)}
              />
            </Reveal>
          ))}
        </div>
      </div>
    </Section>
  );
}
