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
    <p className="mb-3 max-w-[70ch] text-small font-medium text-[var(--color-canvas-text)] sm:text-body">
      {children}
    </p>
  );
}

/* ──────────────── Pliego 1 · pag 1: Portada (foto) ──────────────── */
function Portada() {
  return (
    <div className="flex h-full flex-col gap-3">
      <Panel rotate={-1} caption="El protagonista" className="min-h-0 flex-1">
        <picture className="block h-full">
          <source srcSet="/media/img/anthony.avif" type="image/avif" />
          <img
            src="/media/img/anthony.webp"
            alt="Anthony Gámez, desarrollador full stack, retrato dentro de un panel de cómic"
            width={900}
            height={1200}
            className="block h-full w-full border-comic-md border-ink object-cover object-top"
          />
        </picture>
      </Panel>

      <div className="mt-2 shrink-0">
        <p className="font-mono text-caption uppercase tracking-widest text-[var(--color-canvas-muted)]">
          Pisco · Ica · Perú
        </p>
        <p className="font-display text-[clamp(2rem,4vw,3.5rem)] uppercase leading-[0.95] text-[var(--color-canvas-text)]">
          Anthony Gámez
        </p>
      </div>
    </div>
  );
}

/* ──────────────── Pliego 1 · pag 2: Sobre mi ──────────────── */
function SobreMi() {
  return (
    <div className="relative flex h-full flex-col justify-center gap-4">
      <Onomatopoeia tone="bam" rotate={-8} className="absolute right-1 top-0 z-20 hidden lg:block">
        ¡POW!
      </Onomatopoeia>

      <SpeechBubble>
        <p className="font-bold">«De la idea al deploy — y me quedo a mantenerlo.»</p>
      </SpeechBubble>

      <Panel rotate={1} halftone="fine">
        <p className="text-body text-ink-soft">
          Soy desarrollador Full Stack (React + Django) y{" "}
          <strong className="text-ink">lidero el equipo de desarrollo en Screen IA</strong>.
          Diseño, construyo, despliego y mantengo software real en producción — no solo demos.
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
  );
}

/* ──────────────── Pliego 2 · pag 3: Trayectoria ──────────────── */
function Trayectoria() {
  return (
    <div className="flex h-full flex-col">
      <Intro>
        Estudio Ingeniería de Software en SENATI y soy autodidacta: aprendí a desplegar antes
        de que nadie me lo pidiera.
      </Intro>

      <ol className="flex min-h-0 flex-1 flex-col justify-evenly gap-3">
        {timeline.map((milestone, i) => (
          <li key={milestone.id} className="relative">
            <Onomatopoeia
              tone={milestone.tone}
              rotate={i % 2 === 0 ? -8 : 7}
              className="absolute -top-5 right-0 z-20 text-[clamp(1.1rem,2vw,1.75rem)]"
            >
              {milestone.pow}
            </Onomatopoeia>

            <Panel rotate={i % 2 === 0 ? -1 : 1}>
              <p className="font-mono text-caption uppercase tracking-widest text-ink-subtle">
                {milestone.period}
              </p>
              <h3 className="font-display text-h3 uppercase text-ink">{milestone.org}</h3>
              <p className="font-mono text-small font-bold text-zap">{milestone.role}</p>
              <p className="mt-1 text-small text-ink-soft">{milestone.body}</p>
            </Panel>
          </li>
        ))}
      </ol>
    </div>
  );
}

/* ──────────────── Pliego 2 · pag 4: Proyectos destacados ──────────────── */
function ProyectosDestacados() {
  const featured = projects.filter((p) => p.id === "jaw-project" || p.id === "adflow");

  return (
    <div>
      <Intro>Los construí, los desplegué y los mantengo. Dominio, DNS y servidor incluidos.</Intro>

      <div className="space-y-5">
        {featured.map((project, i) => (
          <ProjectCard
            key={project.id}
            project={project}
            rotate={i === 0 ? -1 : 1}
            featured
            compact
          />
        ))}
      </div>
    </div>
  );
}

/* ──────────────── Pliego 3 · pag 5: Mas proyectos ──────────────── */
function MasProyectos() {
  const rest = projects.filter((p) => p.id !== "jaw-project" && p.id !== "adflow");

  return (
    <div>
      <Intro>Clientes reales y proyectos propios — mismos estándares, misma entrega.</Intro>

      <div className="space-y-4">
        {rest.map((project, i) => (
          <ProjectCard key={project.id} project={project} rotate={i % 2 === 0 ? -1 : 1} compact />
        ))}
      </div>
    </div>
  );
}

/* ──────────────── Pliego 3 · pag 6: Del codigo a produccion ──────────────── */
function Produccion() {
  return (
    <div className="flex h-full flex-col">
      <Intro>
        No entrego un repositorio y me voy. Hago el ciclo completo — y me quedo a mantenerlo.
      </Intro>

      <ol className="grid min-h-0 flex-1 grid-cols-1 content-evenly gap-3 sm:grid-cols-2">
        {pipeline.map((step, i) => (
          <li key={step.id}>
            <Panel rotate={i % 2 === 0 ? -1 : 1} className="h-full">
              <span aria-hidden="true" className="font-display text-h3 leading-none text-bam">
                {String(i + 1).padStart(2, "0")}
              </span>
              <h3 className="font-display text-body-lg uppercase text-ink">{step.title}</h3>
              <p className="mt-1 text-small text-ink-soft">{step.body}</p>
            </Panel>
          </li>
        ))}
      </ol>
    </div>
  );
}

/* ──────────────── Pliego 4 · pag 7: Poderes ──────────────── */
function Poderes() {
  return (
    <div className="flex h-full flex-col">
      <Intro>Mi stack de hoy — el de los proyectos que acabas de ver, no una lista de deseos.</Intro>

      <div className="grid min-h-0 flex-1 grid-cols-1 content-evenly gap-3 sm:grid-cols-2">
        {skillGroups.map((group, i) => (
          <Panel key={group.id} rotate={i % 2 === 0 ? -1 : 1} className="h-full">
            <h3 className="font-display text-body-lg uppercase text-ink">{group.title}</h3>
            <ul className="mt-1.5 flex flex-wrap gap-1">
              {group.items.map((item) => (
                <li
                  key={item}
                  className="border-2 border-ink bg-canvas-deep px-1.5 py-0.5 font-mono text-caption text-ink"
                >
                  {item}
                </li>
              ))}
            </ul>
          </Panel>
        ))}
      </div>

      <p className="mt-2 shrink-0 font-mono text-small text-[var(--color-canvas-text)]">
        <strong>Idiomas:</strong> español (nativo) · inglés (básico)
      </p>
    </div>
  );
}

/* ──────────────── Pliego 4 · pag 8: Fuera del codigo ──────────────── */
function FueraDelCodigo() {
  return (
    <div className="flex h-full flex-col">
      <Intro>No todo es código. Y resulta que todo lo demás también me enseñó a programar.</Intro>

      <div className="flex min-h-0 flex-1 flex-col justify-evenly gap-4">
        <div className="relative">
          <Onomatopoeia tone="pow" rotate={-9} className="absolute -top-6 right-0 z-20 text-[clamp(1.5rem,2.5vw,2.25rem)]">
            ¡ÑAM!
          </Onomatopoeia>
          <Panel rotate={-1} halftone="coarse">
            <h3 className="font-display text-h3 uppercase text-boom">Pizzería Sabor Llanero</h3>
            <p className="font-mono text-caption text-ink-subtle">
              Encargado multifuncional &amp; marketing · Dic 2020 – actualidad
            </p>
            <p className="mt-2 text-small text-ink-soft">
              Antes de liderar equipos de desarrollo llevaba el turno de la pizzería familiar:
              diseño las artes, gestiono las redes y corro las campañas en Facebook.
            </p>
            <p className="mt-2 text-small font-bold text-ink">
              Cuando la pizzería necesitó su web, la construí yo mismo.{" "}
              <button
                type="button"
                onClick={() => goTo("proyectos")}
                className="cursor-pointer font-display uppercase text-zap underline decoration-2 underline-offset-[3px] hover:text-zap-deep"
              >
                Verla →
              </button>
            </p>
          </Panel>
        </div>

        <Panel rotate={1}>
          <h3 className="font-display text-h3 uppercase text-ink">Radisson Paracas Resort</h3>
          <p className="font-mono text-caption text-ink-subtle">
            Staff de hotel · Jul 2022 – Jul 2023
          </p>
          <p className="mt-2 text-small text-ink-soft">
            Fui botones, almacenista y mantenimiento. Ahí aprendí algo que ninguna clase enseña:
            a resolver problemas reales, rápido y sin excusas.
          </p>
          <p className="mt-2 text-small font-bold text-ink">
            Es la misma actitud que llevo hoy a cada sprint.
          </p>
        </Panel>
      </div>
    </div>
  );
}

/* ──────────────── Pliego 5 · pag 9: Contacto ──────────────── */
function Contacto() {
  return (
    <div className="relative flex h-full flex-col items-start justify-center gap-5">
      <Onomatopoeia
        tone="pow"
        rotate={-10}
        className="absolute right-1 top-2 z-20 hidden text-[clamp(2.5rem,5vw,4.5rem)] lg:block"
      >
        ¡ZAS!
      </Onomatopoeia>

      <SpeechBubble>
        <p className="font-bold">
          ¿Tienes un proyecto real, un equipo que necesita liderazgo técnico, o solo quieres
          hablar de código?
        </p>
      </SpeechBubble>

      <p className="font-display text-[clamp(2.5rem,5vw,4.5rem)] uppercase leading-none text-[var(--color-canvas-text)]">
        Escríbeme
      </p>

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
        <span className="flex items-center gap-2 font-mono text-small text-[var(--color-canvas-muted)]">
          <MapPin size={16} strokeWidth={3} aria-hidden="true" />
          Pisco, Ica, Perú
        </span>
      </address>
    </div>
  );
}

/* ──────────────── Pliego 5 · pag 10: Contraportada ──────────────── */
function Fin() {
  return (
    <div className="flex h-full flex-col items-center justify-center gap-5 text-center">
      <p className="font-display text-[clamp(4rem,9vw,8rem)] uppercase leading-none text-pow [text-shadow:6px_6px_0_#2563EB]">
        ¿FIN?
      </p>

      <SpeechBubble>
        <p className="font-bold">Eso depende de ti. La siguiente página la escribimos juntos.</p>
      </SpeechBubble>

      <ul className="flex flex-wrap justify-center gap-3">
        <li>
          <ComicButton variant="primary" href={`mailto:${EMAIL}`}>
            <Mail size={18} strokeWidth={3} aria-hidden="true" />
            Escríbeme
          </ComicButton>
        </li>
        <li>
          <ComicButton variant="ghost" href={GITHUB} ariaLabel="Perfil de GitHub de Anthony Gámez">
            <GithubIcon size={18} />
            GitHub
          </ComicButton>
        </li>
      </ul>

      <p className="font-mono text-caption text-[var(--color-canvas-muted)]">
        © 2026 Anthony Gámez — hecho con React, Tailwind y mucha tinta.
      </p>
    </div>
  );
}

/* ─────────────────────────── El cómic (5 pliegos) ─────────────────────────── */
export const comicPages: readonly ComicPageDef[] = [
  { slug: "portada", title: "Portada", tone: "pow", render: () => <Portada /> },
  { slug: "sobre-mi", title: "Sobre mí", tone: "zing", render: () => <SobreMi /> },
  { slug: "trayectoria", title: "Mi trayectoria", tone: "zap", render: () => <Trayectoria /> },
  { slug: "proyectos", title: "Mis proyectos", tone: "bam", render: () => <ProyectosDestacados /> },
  { slug: "mas-proyectos", title: "Más proyectos", tone: "pow", render: () => <MasProyectos /> },
  { slug: "produccion", title: "Del código a producción", tone: "ink", render: () => <Produccion /> },
  { slug: "poderes", title: "Mis poderes", tone: "zing", render: () => <Poderes /> },
  { slug: "fuera-del-codigo", title: "Fuera del código", tone: "boom", render: () => <FueraDelCodigo /> },
  { slug: "contacto", title: "Hablemos", tone: "blue", render: () => <Contacto /> },
  { slug: "fin", title: "Contraportada", tone: "ink", render: () => <Fin /> },
] as const;
