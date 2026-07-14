import { useEffect, useRef, type ReactNode } from "react";
import { motion } from "motion/react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useComicNavigation } from "@/hooks/useComicNavigation";
import { useTransitionMode } from "@/hooks/useTransitionMode";
import { ComicButton } from "./ComicButton";

export type ComicPageDef = {
  readonly slug: string;
  readonly title: string;
  readonly theme?: "light" | "invert";
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
  const isFirstRender = useRef(true);
  const touchStartX = useRef<number | null>(null);

  // Tras pasar pagina el foco viaja al titulo de la nueva pagina. Sin esto el
  // foco se queda huerfano en el boton y el lector de pantalla no se entera de
  // que el contenido cambio.
  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }
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
      className="relative mx-auto w-full max-w-[1280px] px-3 pb-28 pt-4 sm:px-6"
      onTouchStart={onTouchStart}
      onTouchEnd={onTouchEnd}
    >
      <div className="page-stage relative min-h-[calc(100dvh-11rem)]">
        {pages.map((page, i) => {
          const isCurrent = i === index;
          // Solo se compositan las hojas de la ventana [index-1, index+1]. El
          // resto sigue en el DOM (indexable) pero sin coste de render.
          const inWindow = Math.abs(i - index) <= 1;

          return (
            <motion.section
              key={page.slug}
              id={`pagina-${page.slug}`}
              data-theme={page.theme === "invert" ? "invert" : undefined}
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
              <div className="flex h-full flex-col border-panel border-[var(--color-structure)] bg-[var(--color-canvas)] p-4 shadow-hard-xl sm:p-6 md:p-8">
                <h2
                  ref={(node) => {
                    headingRefs.current[i] = node;
                  }}
                  tabIndex={-1}
                  className="mb-6 font-display text-h1 uppercase text-[var(--color-text)] outline-none"
                >
                  {page.title}
                </h2>

                <div className="min-h-0 flex-1 overflow-y-auto">{page.render()}</div>
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

        <ol className="flex items-center gap-1.5" aria-label="Ir a una página">
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
