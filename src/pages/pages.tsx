import { Mail, MapPin, FileDown } from "lucide-react";
import { GithubIcon, LinkedinIcon } from "@/components/icons/Brand";
import type { ComicPageDef } from "@/components/comic/ComicBook";
import { Panel } from "@/components/comic/Panel";
import { SpeechBubble } from "@/components/comic/SpeechBubble";
import { Onomatopoeia } from "@/components/comic/Onomatopoeia";
import { ComicButton } from "@/components/comic/ComicButton";
import { ProjectCard } from "@/components/ProjectCard";
import { projects } from "@/data/projects";
import { timeline, pipeline } from "@/data/timeline";
import { skillGroups } from "@/data/skills";

const EMAIL = "anthonygamez2858@gmail.com";
const GITHUB = "https://github.com/RootGamez";
const LINKEDIN = "https://www.linkedin.com/in/anthony-gamez-2bab19242";

function goTo(slug: string) {
  window.location.hash = `#/${slug}`;
}

/** Entradilla de pagina: va DIRECTO sobre el canvas de color, no dentro de una vineta. */
function Intro({ children }: { readonly children: React.ReactNode }) {
  return (
    <p className="mb-4 max-w-[70ch] text-body font-medium text-[var(--color-canvas-text)] sm:text-body-lg">
      {children}
    </p>
  );
}

/* ───────────────────────────── 1. Portada ───────────────────────────── */
function Portada() {
  return (
    <div className="grid h-full gap-4 lg:grid-cols-[minmax(0,4fr)_minmax(0,6fr)] lg:gap-6">
      <Panel rotate={-2} caption="El protagonista" className="hidden min-h-0 lg:block">
        <picture>
          <source srcSet="/media/img/anthony.avif" type="image/avif" />
          <img
            src="/media/img/anthony.webp"
            alt="Anthony Gámez, desarrollador full stack, retrato dentro de un panel de cómic"
            width={900}
            height={1200}
            className="block h-full w-full border-comic-md border-ink object-cover"
          />
        </picture>
      </Panel>

      <div className="flex flex-col justify-center gap-4">
        <div className="relative">
          <Onomatopoeia
            tone="bam"
            rotate={-8}
            className="absolute -right-1 -top-8 z-20 hidden md:block"
          >
            ¡POW!
          </Onomatopoeia>
          <p className="font-mono text-caption uppercase tracking-widest text-[var(--color-canvas-text)]">
            Pisco · Ica · Perú
          </p>
          <p className="mt-1 font-display text-display uppercase leading-[0.9] text-[var(--color-canvas-text)]">
            Anthony Gámez
          </p>
        </div>

        <SpeechBubble>
          <p className="font-bold">«De la idea al deploy — y me quedo a mantenerlo.»</p>
        </SpeechBubble>

        <Panel rotate={1} halftone="fine">
          <p className="text-body text-ink-soft">
            Soy desarrollador Full Stack (React + Django) y{" "}
            <strong className="text-ink">
              lidero el equipo de desarrollo en Screen IA
            </strong>
            . Diseño, construyo, despliego y mantengo software real en producción — no solo
            demos.
          </p>
        </Panel>

        <div className="flex flex-wrap gap-3">
          <ComicButton variant="primary" onClick={() => goTo("proyectos")}>
            Ver mis proyectos
          </ComicButton>
          <ComicButton
            variant="accent"
            href="/cv/CV-Anthony-Gamez.pdf"
            download
            ariaLabel="Descargar el currículum de Anthony Gámez en PDF"
          >
            <FileDown size={18} strokeWidth={3} aria-hidden="true" />
            Mi CV
          </ComicButton>
          <ComicButton variant="ghost" onClick={() => goTo("contacto")}>
            Hablemos
          </ComicButton>
        </div>
      </div>
    </div>
  );
}

/* ─────────────────────────── 2. Trayectoria ─────────────────────────── */
function Trayectoria() {
  return (
    <div>
      <Intro>
        Estudio Ingeniería de Software en SENATI y soy autodidacta: aprendí a desplegar antes
        de que nadie me lo pidiera.
      </Intro>

      <ol className="grid gap-5 md:grid-cols-3">
        {timeline.map((milestone, i) => (
          <li key={milestone.id} className="relative">
            <Onomatopoeia
              tone={milestone.tone}
              rotate={i % 2 === 0 ? -8 : 7}
              className="absolute -right-2 -top-6 z-20 text-[clamp(1.25rem,2.5vw,2rem)]"
            >
              {milestone.pow}
            </Onomatopoeia>

            <Panel rotate={i % 2 === 0 ? -1 : 2} className="h-full">
              <p className="font-mono text-caption uppercase tracking-widest text-ink-subtle">
                {milestone.period}
              </p>
              <h3 className="mt-1 font-display text-h3 uppercase text-ink">{milestone.org}</h3>
              <p className="font-mono text-small font-bold text-zap">{milestone.role}</p>
              <p className="mt-2 text-small text-ink-soft">{milestone.body}</p>
              {milestone.badge && (
                <span className="mt-3 inline-block rounded-full border-comic border-ink bg-pow px-3 py-1 font-display text-caption uppercase text-ink shadow-hard-xs">
                  {milestone.badge}
                </span>
              )}
            </Panel>
          </li>
        ))}
      </ol>
    </div>
  );
}

/* ──────────────────────────── 3. Proyectos ──────────────────────────── */
function Proyectos() {
  const featured = projects.filter((p) => p.id === "jaw-project" || p.id === "adflow");
  const rest = projects.filter((p) => !featured.includes(p));

  return (
    <div>
      <Intro>
        Los construí, los desplegué y los mantengo. Dominio, DNS y servidor incluidos.
      </Intro>

      <div className="grid gap-5 lg:grid-cols-2">
        {featured.map((project, i) => (
          <ProjectCard key={project.id} project={project} rotate={i === 0 ? -1 : 1} featured />
        ))}
      </div>

      <div className="mt-5 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {rest.map((project, i) => (
          <ProjectCard key={project.id} project={project} rotate={i === 1 ? 1 : -1} compact />
        ))}
      </div>
    </div>
  );
}

/* ─────────────────── 4. Del código a producción ─────────────────── */
function Produccion() {
  return (
    <div>
      <Intro>
        No entrego un repositorio y me voy. Hago el ciclo completo — y me quedo a mantenerlo.
      </Intro>

      <ol className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {pipeline.map((step, i) => (
          <li key={step.id}>
            <Panel rotate={i % 2 === 0 ? -1 : 1} className="h-full">
              <span aria-hidden="true" className="font-display text-h2 leading-none text-bam">
                {String(i + 1).padStart(2, "0")}
              </span>
              <h3 className="mt-1 font-display text-h3 uppercase text-ink">{step.title}</h3>
              <p className="mt-1 text-small text-ink-soft">{step.body}</p>
            </Panel>
          </li>
        ))}
      </ol>
    </div>
  );
}

/* ───────────────────────────── 5. Poderes ───────────────────────────── */
function Poderes() {
  return (
    <div>
      <Intro>
        Mi stack de hoy — el de los proyectos que acabas de ver, no una lista de deseos.
      </Intro>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {skillGroups.map((group, i) => (
          <Panel key={group.id} rotate={i % 2 === 0 ? -1 : 1} className="h-full">
            <h3 className="font-display text-h3 uppercase text-ink">{group.title}</h3>
            <p className="mt-0.5 font-mono text-small text-zap">{group.hook}</p>
            <ul className="mt-2 flex flex-wrap gap-1.5">
              {group.items.map((item) => (
                <li
                  key={item}
                  className="border-2 border-ink bg-canvas-deep px-2 py-0.5 font-mono text-caption text-ink"
                >
                  {item}
                </li>
              ))}
            </ul>
          </Panel>
        ))}
      </div>

      <p className="mt-4 font-mono text-small text-[var(--color-canvas-text)]">
        <strong>Idiomas:</strong> español (nativo) · inglés (básico)
      </p>
    </div>
  );
}

/* ─────────────────────── 6. Fuera del código ─────────────────────── */
function FueraDelCodigo() {
  return (
    <div>
      <Intro>No todo es código. Y resulta que todo lo demás también me enseñó a programar.</Intro>

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="relative">
          <Onomatopoeia tone="pow" rotate={-9} className="absolute -right-2 -top-7 z-20">
            ¡ÑAM!
          </Onomatopoeia>
          <Panel rotate={-2} halftone="coarse" className="h-full">
            <h3 className="font-display text-h3 uppercase text-boom">
              Pizzería Sabor Llanero
            </h3>
            <p className="font-mono text-small text-ink-subtle">
              Encargado multifuncional &amp; marketing · Dic 2020 – actualidad
            </p>
            <p className="mt-2 text-small text-ink-soft">
              Antes de liderar equipos de desarrollo llevaba el turno de la pizzería familiar:
              diseño las artes, gestiono las redes, corro las campañas en Facebook y, sí, a
              veces también atiendo el mostrador.
            </p>
            <p className="mt-2 text-body font-bold text-ink">
              Cuando la pizzería necesitó su web, la construí yo mismo.
            </p>
            <button
              type="button"
              onClick={() => goTo("proyectos")}
              className="mt-2 cursor-pointer font-display text-small uppercase text-zap underline decoration-2 underline-offset-[3px] hover:text-zap-deep"
            >
              Ver el proyecto →
            </button>
          </Panel>
        </div>

        <Panel rotate={2} className="h-full">
          <h3 className="font-display text-h3 uppercase text-ink">Radisson Paracas Resort</h3>
          <p className="font-mono text-small text-ink-subtle">
            Staff de hotel · Jul 2022 – Jul 2023
          </p>
          <p className="mt-2 text-small text-ink-soft">
            Fui botones, almacenista y mantenimiento de áreas públicas. Ahí aprendí algo que
            ninguna clase enseña: a resolver problemas reales, rápido y sin excusas.
          </p>
          <p className="mt-2 text-body font-bold text-ink">
            Es la misma actitud que llevo hoy a cada sprint.
          </p>
        </Panel>
      </div>
    </div>
  );
}

/* ──────────────────────── 7. Contacto ──────────────────────── */
function Contacto() {
  return (
    <div className="flex h-full flex-col items-start justify-center gap-6">
      <SpeechBubble>
        <p className="font-bold">
          ¿Tienes un proyecto real, un equipo que necesita liderazgo técnico, o solo quieres
          hablar de código?
        </p>
      </SpeechBubble>

      <div className="relative">
        <Onomatopoeia tone="pow" rotate={-6} className="absolute -right-16 -top-4 z-20 hidden md:block">
          ¡ZAS!
        </Onomatopoeia>
        <p className="font-display text-display uppercase text-[var(--color-canvas-text)]">
          Escríbeme
        </p>
      </div>

      <ul className="flex flex-wrap gap-3">
        <li>
          <ComicButton variant="primary" href={`mailto:${EMAIL}`}>
            <Mail size={18} strokeWidth={3} aria-hidden="true" />
            Email
          </ComicButton>
        </li>
        <li>
          <ComicButton variant="ghost" href={LINKEDIN}>
            <LinkedinIcon size={18} />
            LinkedIn
          </ComicButton>
        </li>
        <li>
          <ComicButton variant="ghost" href={GITHUB}>
            <GithubIcon size={18} />
            GitHub
          </ComicButton>
        </li>
        <li>
          <ComicButton
            variant="ghost"
            href="/cv/CV-Anthony-Gamez.pdf"
            download
            ariaLabel="Descargar el currículum de Anthony Gámez en PDF"
          >
            <FileDown size={18} strokeWidth={3} aria-hidden="true" />
            Mi CV
          </ComicButton>
        </li>
      </ul>

      <address className="flex flex-col gap-1 not-italic">
        <a
          href={`mailto:${EMAIL}`}
          className="font-mono text-body font-bold text-[var(--color-canvas-text)] underline decoration-2 underline-offset-[3px]"
        >
          {EMAIL}
        </a>
        <span className="flex items-center gap-2 font-mono text-small text-[var(--color-canvas-text)]">
          <MapPin size={16} strokeWidth={3} aria-hidden="true" />
          Pisco, Ica, Perú
        </span>
      </address>
    </div>
  );
}

/* ─────────────────────────── El cómic ─────────────────────────── */
export const comicPages: readonly ComicPageDef[] = [
  { slug: "portada", title: "Portada", tone: "pow", render: () => <Portada /> },
  { slug: "trayectoria", title: "Mi trayectoria", tone: "zing", render: () => <Trayectoria /> },
  { slug: "proyectos", title: "Mis proyectos", tone: "bam", render: () => <Proyectos /> },
  {
    slug: "produccion",
    title: "Del código a producción",
    tone: "ink",
    render: () => <Produccion />,
  },
  { slug: "poderes", title: "Mis poderes", tone: "zap", render: () => <Poderes /> },
  {
    slug: "fuera-del-codigo",
    title: "Fuera del código",
    tone: "boom",
    render: () => <FueraDelCodigo />,
  },
  { slug: "contacto", title: "Hablemos", tone: "blue", render: () => <Contacto /> },
] as const;
