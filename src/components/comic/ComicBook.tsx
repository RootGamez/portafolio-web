import { useEffect, useRef, type ReactNode } from "react";
import { motion } from "motion/react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useComicNavigation } from "@/hooks/useComicNavigation";
import { useTransitionMode } from "@/hooks/useTransitionMode";
import { ComicButton } from "./ComicButton";

/** Cada pagina del comic tiene su propio color de canvas. Ver [data-tone] en app.css. */
export type PageTone = "pow" | "zing" | "bam" | "ink" | "zap" | "boom" | "blue";

export type ComicPageDef = {
  readonly slug: string;
  readonly title: string;
  readonly tone: PageTone;
  readonly render: () => ReactNode;
};

type Props = {
  readonly pages: readonly ComicPageDef[];
};

const DURATION_FORWARD = 0.48; // 480ms — techo utilizable (< 500ms)
const DURATION_BACK = 0.32; // salir mas rapido que entrar
const EASE = [0.22, 1, 0.36, 1] as const;

/**
 * El libro. Las 7 hojas estan SIEMPRE montadas en el DOM (requisito de
 * indexacion: Googlebot no hace click en "siguiente", asi que una pagina que
 * solo se monta tras la interaccion nunca se indexa).
 *
 * Las hojas inactivas se ocultan con `visibility`, NUNCA con `opacity`:
 * segun la spec de `transform-style`, un `opacity < 1` fuerza `flat` y mata
 * el 3D de toda la escena. Lo mismo harian `filter`, `clip-path` u
 * `overflow != visible` aplicados sobre la hoja.
 */
export function ComicBook({ pages }: Props) {
  const slugs = pages.map((page) => page.slug);
  const { index, direction, next, prev, goTo, isFirst, isLast, total } =
    useComicNavigation(slugs);
  const mode = useTransitionMode();

  const headingRefs = useRef<(HTMLElement | null)[]>([]);
  const focusedIndex = useRef(index);
  const touchStartX = useRef<number | null>(null);

  // Tras pasar pagina el foco viaja al titulo de la nueva pagina. Sin esto el
  // foco se queda huerfano en el boton y el lector de pantalla no se entera de
  // que el contenido cambio.
  //
  // Se compara contra el indice ya enfocado en vez de usar un flag de "primer
  // render": StrictMode ejecuta los efectos dos veces en dev y un flag se
  // consumiria en la primera pasada, disparando un foco espurio al cargar.
  useEffect(() => {
    if (focusedIndex.current === index) return;
    focusedIndex.current = index;
    headingRefs.current[index]?.focus();
  }, [index]);

  // Swipe horizontal (movil). Las flechas siguen visibles: nunca dependas solo
  // del gesto.
  const onTouchStart = (event: React.TouchEvent) => {
    touchStartX.current = event.touches[0].clientX;
  };

  const onTouchEnd = (event: React.TouchEvent) => {
    if (touchStartX.current === null) return;
    const delta = event.changedTouches[0].clientX - touchStartX.current;
    const THRESHOLD = 60;
    if (delta < -THRESHOLD) next();
    else if (delta > THRESHOLD) prev();
    touchStartX.current = null;
  };

  const duration = direction === 1 ? DURATION_FORWARD : DURATION_BACK;

  const animateFor = (i: number) => {
    const isPast = i < index;
    const isCurrent = i === index;

    if (mode === "fade") {
      return { opacity: isCurrent ? 1 : 0, rotateY: 0, x: "0%" };
    }
    if (mode === "slide") {
      return { x: isPast ? "-100%" : isCurrent ? "0%" : "100%", rotateY: 0, opacity: 1 };
    }
    // flip3d: la hoja gira sobre el lomo (transform-origin: left center).
    return { rotateY: isPast ? -180 : 0, x: "0%", opacity: 1 };
  };

  return (
    <div
      className="relative mx-auto w-full px-2 pb-[4.75rem] pt-2 sm:px-4 sm:pb-[5.5rem] sm:pt-3"
      onTouchStart={onTouchStart}
      onTouchEnd={onTouchEnd}
    >
      {/* La hoja ocupa practicamente toda la pantalla: en desktop el contenido
          debe caber sin scroll. El unico alto reservado es el del pager. */}
      <div className="page-stage relative h-[calc(100dvh-5.5rem)] sm:h-[calc(100dvh-6.5rem)]">
        {pages.map((page, i) => {
          const isCurrent = i === index;
          // Solo se compositan las hojas de la ventana [index-1, index+1]. El
          // resto sigue en el DOM (indexable) pero sin coste de render.
          const inWindow = Math.abs(i - index) <= 1;

          return (
            <motion.section
              key={page.slug}
              id={`pagina-${page.slug}`}
              data-tone={page.tone}
              className="page-leaf absolute inset-0"
              aria-hidden={!isCurrent}
              inert={!isCurrent}
              initial={false}
              animate={animateFor(i)}
              transition={mode === "fade" ? { duration: 0.12 } : { duration, ease: EASE }}
              style={{
                zIndex: total - i,
                visibility: inWindow ? "visible" : "hidden",
                pointerEvents: isCurrent ? "auto" : "none",
              }}
            >
              <div className="flex h-full flex-col border-panel border-ink bg-[var(--color-canvas)] p-3 shadow-hard-lg sm:p-5 lg:p-7">
                <h2
                  ref={(node) => {
                    headingRefs.current[i] = node;
                  }}
                  tabIndex={-1}
                  className="mb-3 shrink-0 font-display text-h2 uppercase text-[var(--color-canvas-text)] outline-none sm:mb-4"
                >
                  {page.title}
                </h2>

                <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain">
                  {page.render()}
                </div>
              </div>
            </motion.section>
          );
        })}
      </div>

      {/* Pager fijo. El pb-28 del contenedor reserva su alto. */}
      <nav
        aria-label="Páginas del cómic"
        className="fixed inset-x-0 bottom-0 z-40 flex items-center justify-between gap-3 border-t-4 border-ink bg-canvas px-3 py-3 pb-[calc(0.75rem+env(safe-area-inset-bottom))] sm:px-6"
      >
        <ComicButton variant="ghost" onClick={prev} disabled={isFirst} ariaLabel="Página anterior">
          <ChevronLeft size={20} strokeWidth={3} aria-hidden="true" />
          <span className="hidden sm:inline">Anterior</span>
        </ComicButton>

        {/* En movil los 7 botones no caben junto a Anterior/Siguiente:
            se sustituyen por el contador. */}
        <span className="border-comic border-ink bg-pow px-3 py-1 font-display text-caption tabular-nums text-ink shadow-hard-xs sm:hidden">
          {index + 1} / {total}
        </span>

        <ol className="hidden items-center gap-1.5 sm:flex" aria-label="Ir a una página">
          {pages.map((page, i) => (
            <li key={page.slug}>
              <button
                type="button"
                onClick={() => goTo(i)}
                aria-label={`Página ${i + 1}: ${page.title}`}
                aria-current={i === index ? "true" : undefined}
                className={`h-8 w-8 cursor-pointer border-comic border-ink font-display text-caption tabular-nums shadow-hard-xs transition-transform duration-[120ms] hover:-translate-y-0.5 active:translate-y-0.5 active:shadow-hard-none motion-reduce:transition-none ${
                  i === index ? "bg-pow text-ink" : "bg-paper text-ink-soft"
                }`}
              >
                {i + 1}
              </button>
            </li>
          ))}
        </ol>

        <ComicButton variant="primary" onClick={next} disabled={isLast} ariaLabel="Página siguiente">
          <span className="hidden sm:inline">Siguiente</span>
          <ChevronRight size={20} strokeWidth={3} aria-hidden="true" />
        </ComicButton>
      </nav>

      <div aria-live="polite" className="sr-only">
        Página {index + 1} de {total}: {pages[index]?.title}
      </div>
    </div>
  );
}
