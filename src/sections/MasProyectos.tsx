import { ProjectCard } from "@/components/ProjectCard";
import { Section } from "@/components/layout/Section";
import { CardReach } from "@/components/motion/CardReach";
import { isFeatured, projects } from "@/data/projects";
import { STAGGER } from "@/lib/motion";
import { getSectionMeta } from "@/sections/meta";

const META = getSectionMeta("mas-proyectos");

/**
 * 四 — Mas proyectos. Suelo WASHI.
 *
 * Bento asimetrico, NO tres columnas iguales. Tres mecanismos rompen la lectura
 * de lista (DESIGN_SYSTEM §5):
 *   1. anchos distintos — la columna ancha ocupa 7 de 12 columnas, la estrecha 5;
 *   2. desfase vertical — la estrecha entra 4rem mas abajo, asi que ninguna
 *      fila del grid queda alineada;
 *   3. rotaciones alternas dentro de la whitelist de +-3 grados.
 *
 * El reparto es ALTERNO (pares a la ancha, impares a la estrecha) y no
 * "primera + resto": con cinco vinetas, la version anterior apilaba cuatro en
 * la columna estrecha frente a una sola en la ancha, y el bento se convertia
 * en una torre. Asi escala a cualquier numero sin volver a tocarlo.
 *
 * Todo eso solo a partir de 1024px. Por debajo, apilado limpio de una columna.
 *
 * Modo escenarios (Fase 4.5): es la escena mas larga (~4 pantallas en
 * escritorio, ~6 en movil) y el bento entra TARJETA A TARJETA durante el pan,
 * cada una al alcanzarla la linea de lectura (`CardReach`). Como se mide la
 * posicion real, el orden de entrada es el visual (zigzag entre columnas), no
 * el del DOM.
 */
/** El mismo recorrido de entrada en los dos modos (en lineal es el de siempre). */
const CARD_RISE_PX = 28;
export function MasProyectos() {
  const rest = projects.filter((project) => !isFeatured(project.id));

  // Reparto alterno entre las dos columnas. Los indices pares van a la ancha.
  const wide = rest.filter((_, index) => index % 2 === 0);
  const narrow = rest.filter((_, index) => index % 2 === 1);

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
        {/* Columna ancha: hay sitio para los bullets sin que la medida de
            linea se desmorone. */}
        <div className="flex flex-col gap-10 lg:col-span-7 lg:gap-8">
          {wide.map((project, index) => (
            <CardReach key={project.id} rise={CARD_RISE_PX} delay={index * STAGGER}>
              <ProjectCard project={project} rotate={index % 2 === 0 ? -1 : 1} />
            </CardReach>
          ))}
        </div>

        {/* La columna estrecha entra desfasada hacia abajo. Ese offset es lo
            que impide que las vinetas se lean como filas de una tabla. */}
        <div className="flex flex-col gap-10 lg:col-span-5 lg:mt-16 lg:gap-8">
          {narrow.map((project, index) => (
            <CardReach key={project.id} rise={CARD_RISE_PX} delay={(index + 1) * STAGGER}>
              <ProjectCard
                project={project}
                rotate={index % 2 === 0 ? 1 : -1}
                // Sin demo grabada la vineta se queda corta: ahi si caben los
                // bullets y equilibran la altura de la columna.
                compact={Boolean(project.media)}
              />
            </CardReach>
          ))}
        </div>
      </div>
    </Section>
  );
}
