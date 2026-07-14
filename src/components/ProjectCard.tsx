import { useRef } from "react";
import { ExternalLink } from "lucide-react";
import { GithubIcon } from "@/components/icons/Brand";
import type { Project } from "@/data/projects";
import { StatusBadge } from "@/components/comic/StatusBadge";
import { Onomatopoeia } from "@/components/comic/Onomatopoeia";
import { usePrefersReducedMotion } from "@/hooks/usePrefersReducedMotion";

type Props = {
  readonly project: Project;
  readonly rotate?: -3 | -2 | -1 | 0 | 1 | 2 | 3;
  readonly featured?: boolean;
};

const MAX_TILT = 6;

export function ProjectCard({ project, rotate = 0, featured = false }: Props) {
  const cardRef = useRef<HTMLElement | null>(null);
  const frame = useRef<number | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const reduced = usePrefersReducedMotion();

  // El tilt lee getBoundingClientRect() una sola vez por frame, dentro de un
  // requestAnimationFrame. Leerlo en cada mousemove forzaria layout thrashing.
  const onMouseMove = (event: React.MouseEvent<HTMLElement>) => {
    if (reduced || !cardRef.current) return;
    const { clientX, clientY } = event;

    if (frame.current !== null) return;
    frame.current = requestAnimationFrame(() => {
      frame.current = null;
      const node = cardRef.current;
      if (!node) return;

      const rect = node.getBoundingClientRect();
      const px = (clientX - rect.left) / rect.width - 0.5;
      const py = (clientY - rect.top) / rect.height - 0.5;

      node.style.setProperty("--tilt-x", `${(-py * MAX_TILT).toFixed(2)}deg`);
      node.style.setProperty("--tilt-y", `${(px * MAX_TILT).toFixed(2)}deg`);
    });
  };

  const onMouseLeave = () => {
    const node = cardRef.current;
    if (!node) return;
    node.style.setProperty("--tilt-x", "0deg");
    node.style.setProperty("--tilt-y", "0deg");
    videoRef.current?.pause();
  };

  const onMouseEnter = () => {
    if (reduced) return;
    void videoRef.current?.play().catch(() => {
      // Autoplay bloqueado por el navegador: se queda el poster, sin romper nada.
    });
  };

  return (
    <article
      ref={cardRef}
      onMouseMove={onMouseMove}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
      className="group relative border-panel border-[var(--color-structure)] bg-[var(--color-surface)] p-4 shadow-hard-lg transition-[transform,box-shadow] duration-200 ease-comic-out hover:shadow-hard-xl motion-reduce:transition-none sm:p-5"
      style={{
        transform: `rotate(${rotate}deg) perspective(900px) rotateX(var(--tilt-x, 0deg)) rotateY(var(--tilt-y, 0deg))`,
      }}
    >
      {featured && (
        <Onomatopoeia
          tone="bam"
          rotate={-10}
          className="absolute -right-2 -top-8 z-20 text-[clamp(1.75rem,3.5vw,3rem)]"
        >
          {project.pow}
        </Onomatopoeia>
      )}

      {project.media && (
        <div className="mb-4 border-comic-md border-ink bg-ink">
          <video
            ref={videoRef}
            muted
            loop
            playsInline
            preload="metadata"
            poster={`/media/poster/${project.media}.webp`}
            aria-label={project.alt}
            width={1280}
            height={620}
            className="block h-auto w-full"
          >
            <source src={`/media/video/${project.media}.mp4`} type="video/mp4" />
          </video>
        </div>
      )}

      <div className="mb-3 flex flex-wrap items-center gap-2">
        <StatusBadge status={project.status} />
      </div>

      <h3 className="font-display text-h3 uppercase text-[var(--color-text)]">
        {project.title}
      </h3>

      <p className="mt-2 text-body text-[var(--color-text-muted)]">{project.tagline}</p>

      <p className="mt-3 font-mono text-small font-bold text-[var(--color-text)]">
        {project.role}
      </p>

      <ul className="mt-3 space-y-1.5">
        {project.bullets.map((bullet) => (
          <li key={bullet} className="flex gap-2 text-small text-[var(--color-text-muted)]">
            <span aria-hidden="true" className="font-bold text-zap">
              ▸
            </span>
            {bullet}
          </li>
        ))}
      </ul>

      <ul className="mt-4 flex flex-wrap gap-1.5">
        {project.stack.map((tech) => (
          <li
            key={tech}
            className="border-2 border-ink bg-canvas-deep px-2 py-0.5 font-mono text-caption text-ink"
          >
            {tech}
          </li>
        ))}
      </ul>

      <div className="mt-4 flex flex-wrap gap-3">
        {project.liveUrl && (
          <a
            href={project.liveUrl}
            target="_blank"
            rel="noreferrer noopener"
            className="inline-flex items-center gap-1.5 font-display text-small uppercase text-[var(--color-link)] underline decoration-2 underline-offset-[3px] hover:text-[var(--color-link-hover)]"
          >
            <ExternalLink size={16} strokeWidth={3} aria-hidden="true" />
            Ver en vivo
          </a>
        )}
        {project.repoUrl && (
          <a
            href={project.repoUrl}
            target="_blank"
            rel="noreferrer noopener"
            className="inline-flex items-center gap-1.5 font-display text-small uppercase text-[var(--color-link)] underline decoration-2 underline-offset-[3px] hover:text-[var(--color-link-hover)]"
          >
            <GithubIcon size={16} />
            Código
          </a>
        )}
      </div>
    </article>
  );
}
