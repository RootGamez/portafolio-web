import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { useMotionValue, useMotionValueEvent, useTransform } from "motion/react";
import { useWindowScrollY } from "@/hooks/useWindowScrollY";
import { NEAR_RANGE, REANCHOR_TOLERANCE_PX } from "@/lib/stage/config";
import { revealDelta } from "@/lib/stage/reveal";
import { TRANSITIONS } from "@/lib/stage/transitions";
import {
  activeIndex as activeIndexOf,
  buildLayout,
  EMPTY_LAYOUT,
  locate,
  panFor,
  scrollForPan,
  type Layout,
} from "@/lib/stage/timeline";
import type { Ground } from "@/sections/meta";
import { useDeck } from "./DeckContext";
import { InkOverlay } from "./InkOverlay";
import { StageLayer } from "./StageLayer";
import { useJumpCurtain } from "./useJumpCurtain";
import { useStageNavigation } from "./useStageNavigation";

export type StageDef = {
  readonly slug: string;
  readonly node: ReactNode;
  /** Suelo del escenario: la pista lo pinta mientras es el activo. */
  readonly ground?: Ground;
};

type Props = {
  readonly stages: readonly StageDef[];
  /**
   * Escenario donde colocar la pista al montar, cuando se llega desde el modo
   * lineal (el usuario pulso "Modo simple" y lo volvio a quitar: que no pierda
   * su sitio). Si no se pasa, manda el hash de la URL.
   */
  readonly restoreIndex?: number | null;
};

/**
 * El modo escenarios (docs/PLAN_ESCENARIOS.md §6).
 *
 *   pista alta ........ su alto es el recorrido de scroll de TODO el sitio
 *     visor sticky .... una pantalla fija que no se mueve mientras se hace scroll
 *       capas ......... un escenario cada una, apiladas; solo se ve la que toca
 *
 * El usuario hace scroll NATIVO sobre la pista; el visor se queda quieto y lo
 * que cambia dentro es funcion pura de la posicion (lib/stage/timeline.ts).
 * Este componente no escucha ni intercepta rueda, tacto ni teclado: lee la
 * posicion y pinta. Es la salvaguarda 1 de DESIGN_SYSTEM §7.1.
 *
 * Dos canales a proposito:
 *   - el ESTADO (escenario activo, `inert`, anunciador) se actualiza sincrono en
 *     el evento de scroll y solo cuando cruza un limite: re-renderiza poco;
 *   - lo VISUAL (pan, opacidad) va por MotionValues: sin render de React por frame.
 */
/**
 * Saca el foco de la capa que deja de ser la activa ANTES de que pase a `inert`.
 *
 * Una capa `inert` no admite foco: si lo tenia (el usuario tabulo a un enlace y
 * luego hizo scroll con Espacio o AvPag), el navegador lo suelta al <body> y quien
 * navega con teclado pierde su posicion (WCAG 2.4.3). Se deja en el visor, que es
 * estable y no desaparece: desde ahi el siguiente Tab entra en el escenario nuevo.
 * Se llama desde el evento de scroll, cuando el elemento aun esta enfocado.
 */
function holdFocusInVisor(visor: HTMLElement | null, nextIndex: number): void {
  const leaving = document.activeElement?.closest<HTMLElement>("[data-stage]");
  if (!visor || !leaving || leaving.dataset.stage === String(nextIndex)) return;
  visor.focus({ preventScroll: true });
}

export function StageDeck({ stages, restoreIndex = null }: Props) {
  const { setActiveIndex } = useDeck();
  const trackRef = useRef<HTMLDivElement | null>(null);
  const visorRef = useRef<HTMLDivElement | null>(null);
  // Sonda de `100lvh` (ver `measure`): un elemento invisible solo para leer su alto.
  const lvhProbeRef = useRef<HTMLDivElement | null>(null);
  const contentRefs = useRef<(HTMLDivElement | null)[]>([]);
  // true cuando la pista ya se coloco en su posicion inicial (ver mas abajo).
  const initialised = useRef(false);
  // Re-anclaje: donde empezaba el escenario visible antes de volver a medir.
  const anchor = useRef<{ index: number; start: number } | null>(null);
  const [anchorTick, setAnchorTick] = useState(0);

  const layout = useMotionValue<Layout>(EMPTY_LAYOUT);
  // Scroll en el que empieza la pista (donde el visor queda pegado).
  const origin = useMotionValue(0);
  const scrollY = useWindowScrollY();
  const scrollOffset = useTransform(() => scrollY.get() - origin.get());

  const [trackHeight, setTrackHeight] = useState(0);
  // Alto medido del visor: dimensiona las bandas de tinta (cambia solo al redimensionar).
  const [visorHeight, setVisorHeight] = useState(0);
  // Si se llega desde el modo lineal se arranca YA en ese escenario: escribir un 0
  // inicial en el estado compartido haria perder el sitio (ver useRestoreIndex).
  const [active, setActive] = useState(restoreIndex ?? 0);
  const count = stages.length;

  const measure = useCallback(() => {
    const visor = visorRef.current;
    const track = trackRef.current;
    if (!visor || !track) return;

    const specs = Array.from({ length: count }, (_, index) => ({
      contentHeight: contentRefs.current[index]?.offsetHeight ?? 0,
    }));
    const next = buildLayout(specs, visor.clientHeight);

    // Si ya estaba colocada, se apunta DONDE empezaba (en el documento) el
    // escenario que el usuario esta viendo, para reponer el scroll si cambia.
    // En una transicion no hay un escenario concreto que conservar.
    const before = locate(layout.get(), scrollY.get() - origin.get());
    const viewedStage = before.kind === "stage" ? layout.get().stages[before.index] : undefined;
    const anchoredStart =
      initialised.current && before.kind === "stage" && viewedStage
        ? { index: before.index, start: origin.get() + viewedStage.start }
        : null;

    // El visor se pega a `top` (la altura de la barra de nav en movil): el
    // scroll 0 de la pista es cuando el tope de la pista llega ahi.
    const stickyTop = Number.parseFloat(getComputedStyle(visor).top) || 0;
    origin.set(track.getBoundingClientRect().top + window.scrollY - stickyTop);
    layout.set(next);

    // El visor mide `100svh` (viewport pequeno, con la barra del navegador a la
    // vista), pero con la barra replegada la ventana mide `100lvh`: el scroll
    // maximo del documento baja en `lvh - svh` y esa cola de la pista quedaria
    // inalcanzable (el ultimo escenario no llegaria a su final). Se le suma.
    const largeViewport = lvhProbeRef.current?.offsetHeight ?? 0;
    const dynamicBarSlack = Math.max(0, largeViewport - (visor.clientHeight + stickyTop));
    setTrackHeight(next.trackHeight + dynamicBarSlack);
    setVisorHeight(visor.clientHeight);

    if (anchoredStart) {
      anchor.current = anchoredStart;
      setAnchorTick((tick) => tick + 1);
    }
  }, [count, layout, origin, scrollY]);

  const syncActive = useCallback(() => {
    // Hasta que la pista se coloca (hash, restauracion), el scroll todavia es el
    // de ANTES y daria el escenario 0: pisaria el escenario con el que arranca.
    if (!initialised.current) return;
    const position = locate(layout.get(), scrollY.get() - origin.get());
    const next = activeIndexOf(position);
    holdFocusInVisor(visorRef.current, next);
    setActive((previous) => (previous === next ? previous : next));
  }, [layout, scrollY, origin]);

  useMotionValueEvent(scrollY, "change", syncActive);
  useMotionValueEvent(layout, "change", syncActive);

  // Layout effect: la pista tiene que medirse ANTES del primer pintado, o la
  // pagina saldria un frame sin alto.
  useLayoutEffect(() => {
    measure();

    const observer = new ResizeObserver(measure);
    if (visorRef.current) observer.observe(visorRef.current);
    contentRefs.current.forEach((node) => {
      if (node) observer.observe(node);
    });
    return () => observer.disconnect();
  }, [measure]);

  // Re-anclaje: al cambiar las alturas (las fuentes o las imagenes llegan tarde)
  // un escenario anterior puede crecer o encogerse, y el scroll se quedaria en el
  // mismo px pero sobre OTRO sitio. Se desplaza lo que se haya movido el inicio
  // del escenario visible. Es un desplazamiento RELATIVO al scroll real de ahora
  // (no un destino absoluto): asi no pelea con un scroll en curso. Va tras el
  // commit porque la pista aun no tiene su alto nuevo cuando `measure` termina.
  useLayoutEffect(() => {
    const anchored = anchor.current;
    if (!anchored) return;
    anchor.current = null;

    const stage = layout.get().stages[anchored.index];
    if (!stage) return;
    const shift = origin.get() + stage.start - anchored.start;
    if (Math.abs(shift) <= REANCHOR_TOLERANCE_PX) return;
    window.scrollTo({ top: window.scrollY + shift, behavior: "auto" });
    scrollY.set(window.scrollY);
  }, [anchorTick, layout, origin, scrollY]);

  useEffect(() => {
    setActiveIndex(active);
  }, [active, setActiveIndex]);

  // Marca el documento: `html[data-deck="on"]` apaga el `scroll-behavior: smooth`
  // de CSS, que haria que un salto del riel recorriese todos los escenarios
  // intermedios en vez de llegar directo. Es un efecto de LAYOUT y va ANTES del
  // que coloca la pista: si no, el primer salto saldria con el smooth aun activo.
  useLayoutEffect(() => {
    const root = document.documentElement;
    root.dataset.deck = "on";
    return () => {
      delete root.dataset.deck;
    };
  }, []);

  // Foco por teclado en un elemento que queda fuera del visor: se sube o baja el
  // pan (con el scroll NATIVO) lo justo para que se vea, en vez de dejar que el
  // navegador desplace la capa. Ver StageLayer.
  const revealFocused = useCallback(
    (index: number, target: Element) => {
      const visor = visorRef.current;
      if (!visor) return;
      const delta = revealDelta(visor.getBoundingClientRect(), target.getBoundingClientRect());
      if (delta === 0) return;

      const current = layout.get();
      const pan = panFor(current, index, scrollY.get() - origin.get());
      const revealScroll = scrollForPan(current, index, pan + delta);
      // En la intro, o en un escenario que cabe, el pan no puede cambiar: mover la
      // ventana no mostraria nada y solo saltaria al final de la intro.
      if (revealScroll === scrollForPan(current, index, pan)) return;
      window.scrollTo({ top: origin.get() + revealScroll, behavior: "auto" });
      scrollY.set(window.scrollY);
    },
    [layout, origin, scrollY],
  );

  // La transicion i une el escenario i con el i+1: una menos que escenarios.
  const inkTransitions = useMemo(() => TRANSITIONS.slice(0, Math.max(0, count - 1)), [count]);
  const slugs = useMemo(() => stages.map((stage) => stage.slug), [stages]);
  const getContent = useCallback((index: number) => contentRefs.current[index] ?? null, []);
  const jump = useJumpCurtain();
  const navigation = useStageNavigation({
    slugs,
    layout,
    origin,
    scrollY,
    active,
    getContent,
    runCurtain: jump.run,
    cancelCurtain: jump.cancel,
  });

  // Posicion inicial (escenario a restaurar o, si no, hash de la URL): hay que
  // esperar a que la pista tenga ALTO (el primer render la deja en 0 hasta
  // medir); antes de eso el navegador no puede hacer scroll. Sin foco: solo se
  // posiciona, el usuario no ha pedido moverse.
  useLayoutEffect(() => {
    if (initialised.current || trackHeight === 0) return;
    initialised.current = true;

    if (restoreIndex !== null) navigation.teleportTo(restoreIndex, { focus: false });
    else navigation.applyInitialHash();

    // Alinea el estado con el scroll REAL (el del salto, o el que restauro el
    // navegador): hasta ahora syncActive estaba en pausa.
    syncActive();
  }, [trackHeight, navigation, restoreIndex, syncActive]);

  return (
    <div
      ref={trackRef}
      // `data-ground` + `bg-ground`: en movil, con la barra del navegador replegada,
      // el viewport es mas alto que el visor (100svh) y asoma una franja de la
      // pista; con el suelo del escenario activo no se ve el fondo del body.
      className="relative bg-ground"
      data-ground={stages[active]?.ground}
      style={{ height: trackHeight }}
      data-stage-track=""
      data-stage-active={active}
      data-stage-count={count}
    >
      {/* Sonda de `100lvh`: solo se lee su alto (ver `measure`). */}
      <div
        ref={lvhProbeRef}
        data-stage-lvh=""
        aria-hidden="true"
        className="pointer-events-none invisible absolute left-0 top-0 w-0"
        style={{ height: "100lvh" }}
      />
      <div
        ref={visorRef}
        data-stage-visor=""
        // -1: recibe foco por programa (ver holdFocusInVisor) sin entrar en el orden de Tab.
        tabIndex={-1}
        className="sticky overflow-hidden"
        style={{ top: "var(--nav-height)", height: "calc(100svh - var(--nav-height))" }}
      >
        {stages.map((stage, index) => (
          <StageLayer
            key={stage.slug}
            index={index}
            layout={layout}
            scrollOffset={scrollOffset}
            isActive={index === active}
            isNear={Math.abs(index - active) <= NEAR_RANGE}
            onFocusInside={revealFocused}
            contentRef={(node) => {
              contentRefs.current[index] = node;
            }}
          >
            {stage.node}
          </StageLayer>
        ))}
        <InkOverlay
          transitions={inkTransitions}
          layout={layout}
          scrollOffset={scrollOffset}
          curtain={jump.curtain}
          visorHeight={visorHeight}
        />
      </div>
    </div>
  );
}
