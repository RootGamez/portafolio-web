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

/* ───────────────────────────── 1. Portada ───────────────────────────── */
function Portada() {
  return (
    <div className="grid gap-6 md:grid-cols-[minmax(0,5fr)_minmax(0,7fr)]">
      <Panel rotate={-2} caption="El protagonista" className="self-start">
        <picture>
          <source srcSet="/media/img/anthony.avif" type="image/avif" />
          <img
            src="/media/img/anthony.webp"
            alt="Anthony Gámez, desarrollador full stack, retrato dentro de un panel de cómic"
            width={900}
            height={1200}
            className="block h-auto w-full border-comic-md border-ink"
          />
        </picture>
      </Panel>

      <div className="flex flex-col justify-center gap-6">
        <div className="relative">
          <Onomatopoeia
            tone="pow"
            rotate={-8}
            className="absolute -right-1 -top-10 z-20 hidden sm:block"
          >
            ¡POW!
          </Onomatopoeia>
          <p className="font-mono text-caption uppercase tracking-widest text-ink-soft">
            Pisco · Ica · Perú
          </p>
          <p className="mt-2 font-display text-display uppercase leading-[0.9] text-ink">
            Anthony Gámez
          </p>
          <p className="mt-2 font-display text-h3 uppercase text-zap">
            Full Stack · React + Django · Cloud
          </p>
        </div>

        <SpeechBubble>
          <p className="font-bold">«De la idea al deploy — y me quedo a mantenerlo.»</p>
        </SpeechBubble>

        <Panel rotate={1} halftone="fine">
          <p className="text-body text-ink-soft">
            Desarrollador Full Stack y{" "}
            <strong className="text-ink">
              Líder de Equipo de Desarrollo en Screen IA
            </strong>
            . Diseño, construyo, despliego y mantengo software real en producción — no solo
            demos.
          </p>
        </Panel>

        <div className="flex flex-wrap gap-3">
          <ComicButton variant="primary" onClick={() => goTo("proyectos")}>
            Ver proyectos
          </ComicButton>
          <ComicButton
            variant="accent"
            href="/cv/CV-Anthony-Gamez.pdf"
            download
            ariaLabel="Descargar el currículum de Anthony Gámez en PDF"
          >
            <FileDown size={18} strokeWidth={3} aria-hidden="true" />
            Descargar CV
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
    <div className="space-y-6">
      <p className="max-w-[65ch] text-body-lg text-ink-soft">
        Estudiante de Ingeniería de Software en SENATI (5.º semestre) y autodidacta: aprendí a
        desplegar antes de que nadie me lo pidiera.
      </p>

      <ol className="space-y-8">
        {timeline.map((milestone, i) => (
          <li
            key={milestone.id}
            className={i === 1 ? "md:ml-[12%]" : i === 2 ? "md:ml-[24%]" : ""}
          >
            <div className="relative md:max-w-[76%]">
              <Onomatopoeia
                tone={milestone.tone}
                rotate={i % 2 === 0 ? -8 : 7}
                className="absolute -right-3 -top-7 z-20 text-[clamp(1.5rem,3vw,2.5rem)]"
              >
                {milestone.pow}
              </Onomatopoeia>

              <Panel rotate={i % 2 === 0 ? -1 : 2} halftone={i === 2 ? "fine" : false}>
                <p className="font-mono text-caption uppercase tracking-widest text-ink-subtle">
                  {milestone.period}
                </p>
                <h3 className="mt-1 font-display text-h3 uppercase text-ink">
                  {milestone.org}
                </h3>
                <p className="font-mono text-small font-bold text-zap">{milestone.role}</p>
                <p className="mt-3 text-body text-ink-soft">{milestone.body}</p>
                {milestone.badge && (
                  <span className="mt-3 inline-block rounded-full border-comic border-ink bg-pow px-3 py-1 font-display text-caption uppercase text-ink shadow-hard-xs">
                    {milestone.badge}
                  </span>
                )}
              </Panel>
            </div>
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
    <div className="space-y-8">
      <p className="max-w-[65ch] text-body-lg text-ink-soft">
        Productos reales, en producción, con dominio propio y despliegue gestionado por mí.
      </p>

      <div className="grid gap-8 md:grid-cols-2">
        {featured.map((project, i) => (
          <ProjectCard key={project.id} project={project} rotate={i === 0 ? -1 : 1} featured />
        ))}
      </div>

      <div className="grid gap-8 md:grid-cols-3">
        {rest.map((project, i) => (
          <ProjectCard key={project.id} project={project} rotate={i === 1 ? 1 : -1} />
        ))}
      </div>
    </div>
  );
}

/* ───────────── 4. Del código a producción (página en negativo) ───────────── */
function Produccion() {
  return (
    <div className="space-y-6">
      <p className="max-w-[65ch] text-body-lg text-[var(--color-text-muted)]">
        No entrego un repositorio y me voy. Hago el ciclo completo — y me quedo a mantenerlo.
      </p>

      <ol className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {pipeline.map((step, i) => (
          <li key={step.id}>
            <Panel rotate={i % 2 === 0 ? -1 : 1} className="h-full">
              <span aria-hidden="true" className="font-display text-h2 leading-none text-pow">
                {String(i + 1).padStart(2, "0")}
              </span>
              <h3 className="mt-1 font-display text-h3 uppercase text-[var(--color-text)]">
                {step.title}
              </h3>
              <p className="mt-2 text-small text-[var(--color-text-muted)]">{step.body}</p>
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
    <div className="space-y-6">
      <p className="max-w-[65ch] text-body-lg text-ink-soft">
        El stack con el que trabajo hoy — el de los proyectos que están dos páginas atrás, no
        una lista de deseos.
      </p>

      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {skillGroups.map((group, i) => (
          <Panel
            key={group.id}
            rotate={i % 2 === 0 ? -1 : 1}
            halftone={i === 3 ? "fine" : false}
            className="h-full"
          >
            <h3 className="font-display text-h3 uppercase text-ink">{group.title}</h3>
            <p className="mt-1 font-mono text-small text-zap">{group.hook}</p>
            <ul className="mt-3 flex flex-wrap gap-1.5">
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

      <Panel rotate={0}>
        <p className="text-small text-ink-soft">
          <strong className="text-ink">Idiomas:</strong> Español (nativo) · Inglés (básico)
        </p>
      </Panel>
    </div>
  );
}

/* ─────────────────────── 6. Fuera del código ─────────────────────── */
function FueraDelCodigo() {
  return (
    <div className="space-y-6">
      <p className="max-w-[65ch] text-body-lg text-ink-soft">
        No todo es código. Y resulta que todo lo demás también enseña a programar.
      </p>

      <div className="grid gap-8 md:grid-cols-2">
        <div className="relative">
          <Onomatopoeia tone="boom" rotate={-9} className="absolute -right-2 -top-8 z-20">
            ¡ÑAM!
          </Onomatopoeia>
          <Panel rotate={-2} halftone="coarse" className="h-full">
            <h3 className="font-display text-h3 uppercase text-boom">
              Pizzería Sabor Llanero
            </h3>
            <p className="font-mono text-small text-ink-subtle">
              Encargado multifuncional &amp; marketing · Dic 2020 – actualidad
            </p>
            <p className="mt-3 text-body text-ink-soft">
              Antes de liderar equipos de desarrollo, ayudaba a llevar el turno de la pizzería
              familiar: diseño las artes, gestiono las redes, corro las campañas en Facebook y,
              sí, a veces también atiendo el mostrador.
            </p>
            <p className="mt-3 text-body font-bold text-ink">
              Cuando la pizzería necesitó su propia web, la construí yo mismo.
            </p>
            <button
              type="button"
              onClick={() => goTo("proyectos")}
              className="mt-3 cursor-pointer font-display text-small uppercase text-zap underline decoration-2 underline-offset-[3px] hover:text-zap-deep"
            >
              Ver el proyecto →
            </button>
          </Panel>
        </div>

        <Panel rotate={2} className="h-full self-start">
          <h3 className="font-display text-h3 uppercase text-ink">Radisson Paracas Resort</h3>
          <p className="font-mono text-small text-ink-subtle">
            Staff de hotel · Jul 2022 – Jul 2023
          </p>
          <p className="mt-3 text-body text-ink-soft">
            Botones, almacén y mantenimiento de áreas públicas. Ahí aprendí algo que ninguna
            clase enseña: a resolver problemas reales, rápido y sin excusas.
          </p>
          <p className="mt-3 text-body font-bold text-ink">
            La misma actitud que llevo hoy a cada sprint.
          </p>
        </Panel>
      </div>
    </div>
  );
}

/* ──────────────────── 7. Contacto (página en negativo) ──────────────────── */
function Contacto() {
  return (
    <div className="flex flex-col items-start gap-8">
      <SpeechBubble className="!bg-paper !text-ink">
        <p className="font-bold">
          ¿Un proyecto real, un equipo que necesita liderazgo técnico, o simplemente quieres
          hablar de código?
        </p>
      </SpeechBubble>

      <p className="font-display text-display uppercase text-pow">Hablemos</p>

      <ul className="flex flex-col gap-4 sm:flex-row sm:flex-wrap">
        <li>
          <ComicButton variant="primary" href={`mailto:${EMAIL}`}>
            <Mail size={18} strokeWidth={3} aria-hidden="true" />
            Email
          </ComicButton>
        </li>
        <li>
          <ComicButton variant="accent" href={LINKEDIN}>
            <LinkedinIcon size={18} />
            LinkedIn
          </ComicButton>
        </li>
        <li>
          <ComicButton variant="accent" href={GITHUB}>
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
            Descargar CV
          </ComicButton>
        </li>
      </ul>

      <address className="flex flex-col gap-2 not-italic">
        <a
          href={`mailto:${EMAIL}`}
          className="font-mono text-body text-[var(--color-link)] underline decoration-2 underline-offset-[3px] hover:text-[var(--color-link-hover)]"
        >
          {EMAIL}
        </a>
        <span className="flex items-center gap-2 font-mono text-small text-[var(--color-text-muted)]">
          <MapPin size={16} strokeWidth={3} aria-hidden="true" />
          Pisco, Ica, Perú
        </span>
      </address>
    </div>
  );
}

/* ─────────────────────────── El cómic ─────────────────────────── */
export const comicPages: readonly ComicPageDef[] = [
  { slug: "portada", title: "Portada", render: () => <Portada /> },
  { slug: "trayectoria", title: "Trayectoria", render: () => <Trayectoria /> },
  { slug: "proyectos", title: "Proyectos", render: () => <Proyectos /> },
  {
    slug: "produccion",
    title: "Del código a producción",
    theme: "invert",
    render: () => <Produccion />,
  },
  { slug: "poderes", title: "Poderes", render: () => <Poderes /> },
  { slug: "fuera-del-codigo", title: "Fuera del código", render: () => <FueraDelCodigo /> },
  { slug: "contacto", title: "Hablemos", theme: "invert", render: () => <Contacto /> },
] as const;
