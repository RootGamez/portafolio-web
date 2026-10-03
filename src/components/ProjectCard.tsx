import { useEffect, useRef, useState } from "react";
import { ExternalLink } from "lucide-react";
import { GithubIcon } from "@/components/icons/Brand";
import { SealBadge } from "@/components/ink/SealBadge";
import { Screentone } from "@/components/ink/Screentone";
import { Sfx } from "@/components/ink/Sfx";
import { useStage } from "@/components/stage/StageContext";
import type { Project } from "@/data/projects";
import { useInViewVideo } from "@/hooks/useInViewVideo";
import { usePrefersReducedMotion } from "@/hooks/usePrefersReducedMotion";

/** Donde cae la media respecto al texto. `start`/`end` solo parten en >=1024px. */
type MediaSide = "top" | "start" | "end";

type Props = {
  readonly project: Project;
  /** Rotacion estatica. Whitelist cerrada: mas de 3 grados rompe la lectura. */
  readonly rotate?: -3 | -2 | -1 | 0 | 1 | 2 | 3;
  /** Vineta protagonista: anade la onomatopeya y sube la escala tipografica. */
  readonly featured?: boolean;
  /** Oculta los bullets. Se usa cuando la tarjeta cae en una columna estrecha. */
  readonly compact?: boolean;
  /**
   * Koma nocturno (fondo tinta, borde y texto crema, 15.12:1).
   * SOLO valido dentro de una seccion con data-ground="sumi".
   */
  readonly negative?: boolean;
  readonly mediaSide?: MediaSide;
  readonly className?: string;
};

const MAX_TILT = 6;

/* Dimensiones reales de las demos grabadas. Van como width/height Y como
   aspect-ratio: el hueco queda reservado antes de que baje un solo byte de
   video, asi que la tarjeta no salta al cargar (CLS). Ver DESIGN_SYSTEM §9. */
const MEDIA_W = 1280;
const MEDIA_H = 620;
const MEDIA_RATIO = "aspect-[1280/620]";

/**
 * El enlace NO puede usar la utilidad `text-link`: esa lee --g-link, que lo
 * fija el SUELO de la seccion, no el fondo del koma. Un koma de papel sobre
 * suelo sumi heredaria el oro sobre crema (1.53:1, ilegible).
 *
 * El enlace sigue al KOMA, no al suelo:
 *   - koma negativo (tinta):  kin-500 sobre ink-900   = 9.90:1  / hover 12.25:1
 *   - koma de papel (crema):  shu-700 sobre washi-100 = 6.74:1  / hover 16.54:1
 * Ver DESIGN_SYSTEM §1.2 y §1.3, ley 3.
 */
const LINK_CLASS: Record<"negative" | "paper", string> = {
  negative: "text-kin hover:text-kin-hi",
  paper: "text-shu-deep hover:text-ink",
};

/* Objetivo tactil >=44x44 con >=8px de aire (DESIGN_SYSTEM §8). */
const LINK_BASE =
  "inline-flex min-h-11 touch-manipulation items-center gap-2 font-poster " +
  "text-[16px] uppercase leading-none tracking-wide underline decoration-2 " +
  "underline-offset-[5px] transition-colors duration-150 motion-reduce:transition-none";

/**
 * La vineta de proyecto.
 *
 * ESTRUCTURA (la de InkPanel, replicada aqui a proposito): el <article> lleva
 * el transform 3D y NADA MAS; el canto entintado vive en capas absolutas
 * hermanas. Un `filter` sobre el propio elemento transformado aplastaria el
 * contexto 3D y el tilt dejaria de verse — por eso `.ink-edge` nunca toca al
 * <article>.
 *
 * REPRODUCCION DEL VIDEO — cuatro caminos, un unico punto de decision:
 *   1. hover del raton        -> onMouseEnter / onMouseLeave
 *   2. foco de teclado        -> onFocus / onBlur en el <article>. React los
 *      propaga con semantica focusin/focusout, asi que tabular hasta un enlace
 *      INTERNO de la tarjeta tambien enciende el video. La tarjeta NO es un
 *      tab-stop artificial: el foco burbujea desde sus propios enlaces.
 *   3. tactil (sin hover)     -> useInViewVideo, por visibilidad
 *   4. prefers-reduced-motion -> no se reproduce nada, se queda el poster.
 */
export function ProjectCard({
  project,
  rotate = 0,
  featured = false,
  compact = false,
  negative = false,
  mediaSide = "top",
  className = "",
}: Props) {
  const cardRef = useRef<HTMLElement | null>(null);
  const frame = useRef<number | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);

  // Hover y foco son dos fuentes independientes que piden lo mismo. Van en
  // refs y no en estado: mueven un elemento imperativo del DOM, no la UI.
  // Meterlos en useState provocaria un render por cada entrada del raton.
  const hovering = useRef(false);
  const focused = useRef(false);

  const reduced = usePrefersReducedMotion();

  // Modo escenarios (docs/PLAN_ESCENARIOS.md §6). Fuera de un deck (modo
  // lineal) el contexto vale "activo y cerca", asi que nada de esto cambia.
  const { isActive, isNear } = useStage();

  // Los medios pesados no se piden hasta que el escenario esta cerca (activo o
  // adyacente): con las capas apiladas los 7 videos y sus posters se bajaban
  // todos al cargar. Una vez pedidos no se sueltan, para no volver a bajarlos.
  const [loadMedia, setLoadMedia] = useState(isNear);
  if (isNear && !loadMedia) setLoadMedia(true);

  // Camino tactil. El hook ya comprueba (hover: none), reduced-motion y el
  // umbral de visibilidad; aqui solo se le dice si hay video que mirar. Y solo
  // el del escenario ACTIVO: el IntersectionObserver da por visible hasta lo
  // que esta en una capa oculta.
  useInViewVideo(videoRef, Boolean(project.media) && isActive);

  // Si el escenario deja de ser el activo, el hover y el foco de esta tarjeta ya
  // no cuentan (su capa pasa a inert y puede que nunca llegue el mouseleave):
  // se olvidan y el video se para.
  useEffect(() => {
    if (isActive) return;
    hovering.current = false;
    focused.current = false;
    videoRef.current?.pause();
  }, [isActive]);

  // El rAF del tilt sobrevive al componente si nadie lo cancela: al desmontar
  // con un frame en vuelo, el callback escribiria sobre un nodo ya desechado.
  // Es el UNICO cleanup necesario aqui; la cancelacion del parpadeo al salir
  // el raton se hace en onMouseLeave, no aqui.
  useEffect(
    () => () => {
      if (frame.current !== null) cancelAnimationFrame(frame.current);
    },
    [],
  );

  /** Unico punto de decision: suena si hay hover O foco dentro de la tarjeta. */
  const syncPlayback = () => {
    const video = videoRef.current;
    if (!video || reduced) return;

    if (hovering.current || focused.current) {
      void video.play().catch(() => {
        // Autoplay bloqueado por el navegador: se queda el poster. No rompe nada.
      });
      return;
    }

    video.pause();
    video.currentTime = 0; // reset: la proxima entrada arranca desde el principio
  };

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

  const onMouseEnter = () => {
    hovering.current = true;
    syncPlayback();
  };

  const onMouseLeave = () => {
    hovering.current = false;

    // Cancelar ANTES de resetear. Si el raton sale justo despues de un
    // mousemove queda un frame en cola: se ejecutaria DESPUES de escribir
    // "0deg" y volveria a inclinar la tarjeta — un parpadeo al salir.
    if (frame.current !== null) {
      cancelAnimationFrame(frame.current);
      frame.current = null;
    }

    const node = cardRef.current;
    if (node) {
      node.style.setProperty("--tilt-x", "0deg");
      node.style.setProperty("--tilt-y", "0deg");
    }
    syncPlayback();
  };

  const onFocus = () => {
    if (focused.current) return;
    focused.current = true;
    syncPlayback();
  };

  const onBlur = (event: React.FocusEvent<HTMLElement>) => {
    // focusout tambien salta al mover el foco ENTRE dos enlaces de la MISMA
    // tarjeta. Si el destino sigue dentro no es una salida: pausar ahi daria un
    // parpadeo al tabular de "Ver en vivo" a "Codigo".
    if (event.currentTarget.contains(event.relatedTarget)) return;
    focused.current = false;
    syncPlayback();
  };

  const linkClass = `${LINK_BASE} ${LINK_CLASS[negative ? "negative" : "paper"]}`;
  const split = mediaSide !== "top";

  const media = project.media ? (
    <div className={`relative border-[3px] border-[var(--g-structure)] bg-ink ${MEDIA_RATIO}`}>
      <video
        ref={videoRef}
        muted
        loop
        playsInline
        preload="metadata"
        poster={loadMedia ? `/media/poster/${project.media}.webp` : undefined}
        aria-label={project.alt}
        width={MEDIA_W}
        height={MEDIA_H}
        className="block h-full w-full object-cover"
      >
        {loadMedia && <source src={`/media/video/${project.media}.mp4`} type="video/mp4" />}
      </video>
    </div>
  ) : (
    // Sin demo grabada: koma vacio con trama y la onomatopeya. En manga una
    // vineta puede ser solo un SFX. Mantiene el MISMO aspect-ratio que los
    // videos para que el ritmo del grid no se rompa.
    <div
      className={`relative grid place-items-center overflow-hidden border-[3px] border-[var(--g-structure)] bg-koma ${MEDIA_RATIO}`}
    >
      <Screentone kind="coarse" />
      <Sfx rotate={-6} className="relative z-10">
        {project.pow}
      </Sfx>
    </div>
  );

  const body = (
    <div className="flex h-full flex-col">
      <div className="flex flex-wrap items-center gap-2">
        <SealBadge status={project.status} />
      </div>

      <h3
        className={`mt-3 font-poster uppercase leading-tight text-on-koma ${
          featured ? "text-h2" : "text-h3"
        }`}
      >
        {project.title}
      </h3>

      {/* max-w en ch: la medida de linea se controla aqui, no con el ancho del
          koma, que en split ya viene marcado por la rejilla. */}
      <p
        className={`mt-2 max-w-[62ch] text-on-koma-muted ${featured ? "text-body-lg" : "text-body"}`}
      >
        {project.tagline}
      </p>

      <p className="mt-3 font-mono text-small font-bold text-on-koma">{project.role}</p>

      {!compact && (
        <ul className="mt-4 space-y-2">
          {project.bullets.map((bullet) => (
            <li key={bullet} className="flex max-w-[62ch] gap-2 text-body text-on-koma-muted">
              <span aria-hidden="true" className="font-bold text-[var(--g-accent)]">
                &#9656;
              </span>
              {bullet}
            </li>
          ))}
        </ul>
      )}

      <ul className="mt-4 flex flex-wrap gap-1.5">
        {project.stack.map((tech) => (
          <li
            key={tech}
            className="border-2 border-[var(--g-structure)] px-2 py-0.5 font-mono text-caption text-on-koma-muted"
          >
            {tech}
          </li>
        ))}
      </ul>

      {/* mt-auto: los enlaces se van al pie aunque las tarjetas hermanas del
          grid tengan distinta cantidad de texto. */}
      <div className="mt-auto flex flex-wrap items-center gap-x-6 gap-y-1 pt-4">
        {project.liveUrl && (
          <a href={project.liveUrl} target="_blank" rel="noreferrer noopener" className={linkClass}>
            <ExternalLink size={18} strokeWidth={3} aria-hidden="true" />
            Ver en vivo
          </a>
        )}
        {project.repoUrl && (
          <a href={project.repoUrl} target="_blank" rel="noreferrer noopener" className={linkClass}>
            <GithubIcon size={18} />
            Código
          </a>
        )}
      </div>
    </div>
  );

  return (
    <article
      ref={cardRef}
      onMouseMove={onMouseMove}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
      onFocus={onFocus}
      onBlur={onBlur}
      className={`group relative isolate h-full ${negative ? "koma--negative" : ""} ${className}`}
      style={{
        transform: `rotate(${rotate}deg) perspective(900px) rotateX(var(--tilt-x, 0deg)) rotateY(var(--tilt-y, 0deg))`,
      }}
    >
      {/* Capa 1 — sombra dura entintada. Va aparte para poder filtrarla sin
          meter un `filter` en el <article>, que aplastaria su contexto 3D. */}
      <span
        aria-hidden="true"
        className="ink-edge absolute inset-0 -z-10 translate-x-2 translate-y-2 bg-[var(--g-shadow)] transition-transform duration-200 ease-ink group-hover:translate-x-3 group-hover:translate-y-3 motion-reduce:transition-none"
      />
      {/* Capa 2 — marco de tinta y fondo del koma. */}
      <span
        aria-hidden="true"
        className="ink-edge absolute inset-0 border-[6px] border-[var(--g-structure)] bg-koma"
      />
      {/* Capa 3 — trama que se desvanece. Solo en las vinetas protagonistas:
          en las pequenas ensuciaria el texto sin aportar profundidad. */}
      {featured && <Screentone kind="fine" fade />}

      {/* La onomatopeya cuelga por fuera del marco, como en una plancha impresa.
          El tamano lo fija el propio Sfx; aqui solo se coloca. Cuelga a partir
          de 768px: a 375px la tarjeta ya toca el borde de la ventana y ese
          `-right-3` sacaba 5px fuera del viewport (medido, no supuesto). */}
      {featured && (
        <Sfx rotate={-10} className="absolute right-0 -top-7 z-20 md:-right-3">
          {project.pow}
        </Sfx>
      )}

      {/* Capa 4 — contenido. SIN filtro, o el texto saldria ondulado. */}
      <div className="relative z-10 h-full p-4 sm:p-6 lg:p-7">
        {split ? (
          <div className="grid items-center gap-6 lg:grid-cols-12 lg:gap-8">
            <div className={`lg:col-span-7 ${mediaSide === "end" ? "lg:order-2" : ""}`}>{media}</div>
            <div className="lg:col-span-5">{body}</div>
          </div>
        ) : (
          <div className="flex h-full flex-col gap-5">
            {media}
            {body}
          </div>
        )}
      </div>
    </article>
  );
}
