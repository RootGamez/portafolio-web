import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useComicNavigation } from "@/hooks/useComicNavigation";
import { useTransitionMode } from "@/hooks/useTransitionMode";
import { usePageTurnSound } from "@/hooks/usePageTurnSound";

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

const HALF_TURN_MS = 240; // giro completo = 480ms, bajo el techo de 500ms
const SLIDE_MS = 320;
const EASE_IN = "cubic-bezier(0.64, 0, 0.78, 0)";
const EASE_OUT = "cubic-bezier(0.22, 1, 0.36, 1)";
const SWIPE_THRESHOLD = 60;

/**
 * El libro a pantalla completa. En modo `book` se ven DOS paginas a la vez
 * (pliego, como un comic abierto) y el giro es en dos fases sobre el lomo:
 * la pagina que sale se pliega hasta quedar de canto (rotateY 90) y la nueva
 * se despliega desde el lomo. En movil, una pagina y slide horizontal.
 *
 * Todas las paginas estan SIEMPRE montadas en el DOM (Googlebot no pulsa
 * "siguiente": lo que no esta en el DOM inicial no se indexa). Las ocultas
 * usan `visibility` — nunca `opacity`, que aplastaria el 3D de la escena
 * (spec de transform-style) — ademas de `inert` + `aria-hidden`.
 *
 * La animacion es imperativa (refs + transiciones CSS): girar una hoja exige
 * encadenar dos fases y z-index por hoja; hacerlo declarativo con re-renders
 * a mitad de giro recargaria los videos y perderia los handlers.
 */
export function ComicBook({ pages }: Props) {
  const slugs = useMemo(() => pages.map((page) => page.slug), [pages]);
  const { index, goTo, total } = useComicNavigation(slugs);
  const mode = useTransitionMode();
  const isBook = mode === "book";
  const playPageTurn = usePageTurnSound();

  const leafRefs = useRef<(HTMLElement | null)[]>([]);
  const headingRefs = useRef<(HTMLElement | null)[]>([]);
  const [visual, setVisual] = useState(index);
  const busy = useRef(false);
  const timeouts = useRef<number[]>([]);
  const touchStartX = useRef<number | null>(null);

  const spreadOf = (i: number) => Math.floor(i / 2);
  const isFirst = isBook ? spreadOf(index) === 0 : index === 0;
  const isLast = isBook ? spreadOf(index) === spreadOf(total - 1) : index === total - 1;

  const next = useCallback(() => {
    if (isBook) goTo(Math.min(2 * (spreadOf(index) + 1), total - 1));
    else goTo(index + 1);
  }, [goTo, index, isBook, total]);

  const prev = useCallback(() => {
    if (isBook) goTo(Math.max(2 * (spreadOf(index) - 1), 0));
    else goTo(index - 1);
  }, [goTo, index, isBook]);

  /** Estado de reposo: solo el pliego (o la pagina) visible, sin transiciones. */
  const applyStatic = useCallback(
    (v: number) => {
      const s = Math.floor(v / 2);
      pages.forEach((_, i) => {
        const leaf = leafRefs.current[i];
        if (!leaf) return;
        const shown = isBook ? i === 2 * s || i === 2 * s + 1 : i === v;
        leaf.style.transition = "none";
        leaf.style.transform = "none";
        leaf.style.visibility = shown ? "visible" : "hidden";
        leaf.style.zIndex = shown ? "2" : "0";
      });
    },
    [isBook, pages],
  );

  useEffect(() => {
    applyStatic(visual);
  }, [applyStatic, visual]);

  // Teclado: flechas y AvPag/RePag pasan pagina.
  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement | null;
      if (target && /^(INPUT|TEXTAREA|SELECT)$/.test(target.tagName)) return;
      if (event.key === "ArrowRight" || event.key === "PageDown") {
        event.preventDefault();
        next();
      } else if (event.key === "ArrowLeft" || event.key === "PageUp") {
        event.preventDefault();
        prev();
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [next, prev]);

  // Tras el giro, el foco viaja al titulo de la pagina recien abierta.
  const focusedRef = useRef(visual);
  useEffect(() => {
    if (focusedRef.current === visual) return;
    focusedRef.current = visual;
    const target = isBook ? 2 * Math.floor(visual / 2) : visual;
    headingRefs.current[target]?.focus();
  }, [visual, isBook]);

  // El giro: reacciona al cambio de indice (hash) y anima de `visual` a `index`.
  useEffect(() => {
    if (index === visual) return;
    playPageTurn();

    if (mode === "fade" || busy.current) {
      timeouts.current.forEach(clearTimeout);
      busy.current = false;
      setVisual(index);
      return;
    }

    const leaf = (n: number) => leafRefs.current[n];
    const from = visual;
    const to = index;

    if (isBook) {
      const fs = Math.floor(from / 2);
      const ts = Math.floor(to / 2);
      if (fs === ts) {
        setVisual(to);
        return;
      }
      const fwd = ts > fs;
      // fase A: `lift` se pliega hasta el lomo · fase B: `land` se despliega.
      const lift = fwd ? leaf(2 * fs + 1) : leaf(2 * fs);
      const land = fwd ? leaf(2 * ts) : leaf(2 * ts + 1);
      const under = fwd ? leaf(2 * ts + 1) : leaf(2 * ts);
      if (!lift || !land) {
        setVisual(to);
        return;
      }
      busy.current = true;

      if (under) {
        under.style.transition = "none";
        under.style.transform = "none";
        under.style.visibility = "visible";
        under.style.zIndex = "1";
      }
      lift.style.transition = "none";
      lift.style.transform = "none";
      lift.style.zIndex = "4";
      land.style.transition = "none";
      land.style.transform = `rotateY(${fwd ? 90 : -90}deg)`;
      land.style.visibility = "visible";
      land.style.zIndex = "5";
      void land.offsetWidth; // reflow: fija el estado inicial antes de animar

      lift.style.transition = `transform ${HALF_TURN_MS}ms ${EASE_IN}`;
      lift.style.transform = `rotateY(${fwd ? -90 : 90}deg)`;

      timeouts.current = [
        window.setTimeout(() => {
          lift.style.visibility = "hidden";
          land.style.transition = `transform ${HALF_TURN_MS}ms ${EASE_OUT}`;
          land.style.transform = "rotateY(0deg)";
        }, HALF_TURN_MS),
        window.setTimeout(() => {
          busy.current = false;
          setVisual(to);
        }, HALF_TURN_MS * 2 + 40),
      ];
      return;
    }

    // slide (movil)
    const oldLeaf = leaf(from);
    const newLeaf = leaf(to);
    if (!oldLeaf || !newLeaf) {
      setVisual(to);
      return;
    }
    busy.current = true;
    const fwd = to > from;
    newLeaf.style.transition = "none";
    newLeaf.style.transform = `translateX(${fwd ? 100 : -100}%)`;
    newLeaf.style.visibility = "visible";
    newLeaf.style.zIndex = "3";
    oldLeaf.style.zIndex = "2";
    void newLeaf.offsetWidth;
    oldLeaf.style.transition = `transform ${SLIDE_MS}ms ${EASE_OUT}`;
    newLeaf.style.transition = `transform ${SLIDE_MS}ms ${EASE_OUT}`;
    oldLeaf.style.transform = `translateX(${fwd ? -100 : 100}%)`;
    newLeaf.style.transform = "translateX(0)";
    timeouts.current = [
      window.setTimeout(() => {
        busy.current = false;
        setVisual(to);
      }, SLIDE_MS + 30),
    ];
  }, [index, visual, mode, isBook, playPageTurn]);

  useEffect(() => () => timeouts.current.forEach(clearTimeout), []);

  const onTouchStart = (event: React.TouchEvent) => {
    touchStartX.current = event.touches[0].clientX;
  };

  const onTouchEnd = (event: React.TouchEvent) => {
    if (touchStartX.current === null) return;
    const delta = event.changedTouches[0].clientX - touchStartX.current;
    if (delta < -SWIPE_THRESHOLD) next();
    else if (delta > SWIPE_THRESHOLD) prev();
    touchStartX.current = null;
  };

  const visualSpread = Math.floor(visual / 2);

  return (
    <div className="fixed inset-0 bg-ink" onTouchStart={onTouchStart} onTouchEnd={onTouchEnd}>
      <div
        className="page-stage relative h-full w-full"
        style={{ perspective: "2600px", transformStyle: "preserve-3d" }}
      >
        {pages.map((page, i) => {
          const shown = isBook ? spreadOf(i) === visualSpread : i === visual;
          const isRightHalf = i % 2 === 1;

          return (
            <section
              key={page.slug}
              id={`pagina-${page.slug}`}
              data-tone={page.tone}
              ref={(node) => {
                leafRefs.current[i] = node;
              }}
              aria-hidden={!shown}
              inert={!shown}
              className="page-leaf absolute top-0 h-full"
              style={{
                left: isBook && isRightHalf ? "50%" : "0",
                width: isBook ? "50%" : "100%",
                // La hoja gira siempre sobre el lomo (el centro del libro).
                transformOrigin: isRightHalf ? "left center" : "right center",
              }}
            >
              <div className="flex h-full flex-col bg-[var(--color-canvas)] p-3 sm:p-4 lg:p-6">
                <h2
                  ref={(node) => {
                    headingRefs.current[i] = node;
                  }}
                  tabIndex={-1}
                  className="mb-2 shrink-0 font-display text-h2 uppercase text-[var(--color-canvas-text)] outline-none sm:mb-3"
                >
                  {page.title}
                </h2>

                <div className="no-scrollbar min-h-0 flex-1 overflow-y-auto overscroll-contain">
                  {page.render()}
                </div>
              </div>
            </section>
          );
        })}

        {/* El lomo del libro */}
        {isBook && (
          <div
            aria-hidden="true"
            className="pointer-events-none absolute left-1/2 top-0 z-10 h-full w-2 -translate-x-1/2 bg-ink"
          />
        )}
      </div>

      {/* Zonas de paso de pagina: texto semi-transparente, se revela al acercarse (desktop). */}
      <button
        type="button"
        onClick={prev}
        aria-label="Pulsa para retroceder de página"
        className={`group absolute left-0 top-0 z-30 hidden h-full w-14 cursor-pointer items-center justify-start lg:flex ${
          isFirst ? "pointer-events-none opacity-0" : ""
        }`}
      >
        <span className="border-y-2 border-r-2 border-ink/60 bg-ink/45 px-1 py-4 font-display text-caption uppercase tracking-widest text-paper/90 opacity-40 transition-opacity duration-150 [writing-mode:vertical-rl] group-hover:opacity-100 group-focus-visible:opacity-100">
          ◀ pulsa para retroceder
        </span>
      </button>
      <button
        type="button"
        onClick={next}
        aria-label="Pulsa para avanzar de página"
        className={`group absolute right-0 top-0 z-30 hidden h-full w-14 cursor-pointer items-center justify-end lg:flex ${
          isLast ? "pointer-events-none opacity-0" : ""
        }`}
      >
        <span className="border-y-2 border-l-2 border-ink/60 bg-ink/45 px-1 py-4 font-display text-caption uppercase tracking-widest text-paper/90 opacity-40 transition-opacity duration-150 [writing-mode:vertical-rl] group-hover:opacity-100 group-focus-visible:opacity-100">
          pulsa para avanzar ▶
        </span>
      </button>

      {/* Flechas discretas (movil/tablet) — el swipe es el gesto principal,
          pero nunca se depende solo del gesto. */}
      <div className="pointer-events-none absolute inset-x-0 bottom-2 z-30 flex justify-between px-2 lg:hidden">
        <button
          type="button"
          onClick={prev}
          aria-label="Página anterior"
          className={`pointer-events-auto flex h-11 w-11 cursor-pointer items-center justify-center border-2 border-paper/40 bg-ink/60 text-paper opacity-50 active:opacity-100 ${
            isFirst ? "invisible" : ""
          }`}
        >
          <ChevronLeft size={22} strokeWidth={3} aria-hidden="true" />
        </button>
        <button
          type="button"
          onClick={next}
          aria-label="Página siguiente"
          className={`pointer-events-auto flex h-11 w-11 cursor-pointer items-center justify-center border-2 border-paper/40 bg-ink/60 text-paper opacity-50 active:opacity-100 ${
            isLast ? "invisible" : ""
          }`}
        >
          <ChevronRight size={22} strokeWidth={3} aria-hidden="true" />
        </button>
      </div>

      <div aria-live="polite" className="sr-only">
        Página {visual + 1} de {total}: {pages[visual]?.title}
      </div>
    </div>
  );
}
