import { useCallback, useEffect, useMemo, useRef } from "react";
import type { MotionValue } from "motion/react";
import { FOCUS_RETRY_FRAMES } from "@/lib/stage/config";
import {
  isPlainPrimaryClick,
  needsCurtain,
  stageIndexFromAnchor,
  stageIndexFromHash,
} from "@/lib/stage/navigation";
import { offsetOfStage, type Layout } from "@/lib/stage/timeline";

type Options = {
  readonly slugs: readonly string[];
  readonly layout: MotionValue<Layout>;
  readonly origin: MotionValue<number>;
  /** El scroll de la ventana como MotionValue: se sincroniza justo tras cada salto. */
  readonly scrollY: MotionValue<number>;
  /** Escenario activo ahora mismo. */
  readonly active: number;
  /** Envoltorio del contenido de un escenario (para localizar su titulo). */
  readonly getContent: (index: number) => HTMLElement | null;
  /** Abre la cortina de tinta y llama a su argumento cuando la pantalla ya esta tapada. */
  readonly runCurtain: (onCovered: () => void) => void;
  /** Cancela el salto que espera a la cortina: un salto directo posterior manda. */
  readonly cancelCurtain: () => void;
};

export type TeleportOptions = {
  /** Da el foco al titulo del escenario al llegar (por defecto, si). */
  readonly focus?: boolean;
  /** Tapa el salto con la cortina de tinta (por defecto, no): solo los saltos que pide el usuario. */
  readonly curtain?: boolean;
};

export type StageNavigation = {
  /** Lleva el scroll al inicio de un escenario y, por defecto, le da el foco. */
  readonly teleportTo: (index: number, options?: TeleportOptions) => void;
  /** Coloca la pista segun `location.hash`. Para llamar una vez, al abrir la pagina. */
  readonly applyInitialHash: () => void;
};

/** Clase con la que `Section` esconde el titulo de las secciones que pintan el suyo. */
const HIDDEN_HEADING_CLASS = "sr-only";

/**
 * A donde va el foco al llegar a un escenario, listo para recibirlo por programa
 * (tabindex -1): su titulo VISIBLE o, si no lo tiene, la propia seccion.
 *
 * "Hablemos" y "Fin" solo tienen un h2 `sr-only` y va DESPUES del contenido:
 * enfocarlo haria que `revealFocused` subiese el pan hasta el final y el usuario
 * llegaria sin ver el arranque del escenario. La seccion esta al principio y ya
 * tiene nombre (`aria-labelledby`).
 */
function findFocusTarget(root: HTMLElement | null): HTMLElement | null {
  if (!root) return null;
  const heading = Array.from(root.querySelectorAll<HTMLElement>("h1, h2")).find(
    (candidate) => !candidate.classList.contains(HIDDEN_HEADING_CLASS),
  );
  const target = heading ?? root.querySelector<HTMLElement>("section");
  if (target && !target.hasAttribute("tabindex")) target.setAttribute("tabindex", "-1");
  return target;
}

/**
 * Navegacion del modo escenarios: anclas, hash y salto del riel.
 *
 * Es NAVEGACION, no secuestro del scroll: el usuario pidio ir a un sitio. No se
 * escucha ni se frena la rueda, el tacto ni el teclado. Lo unico que se
 * intercepta es el clic en un `<a href="#slug">`, porque con las capas
 * apiladas el salto nativo no mueve la pista.
 *
 * El foco (guia `focus-on-route-change`): tras saltar, el titulo del escenario
 * recibe el foco para que lector de pantalla y teclado sepan donde estan. Hay
 * que esperar a que el escenario sea el activo, porque hasta entonces su capa
 * va `inert` y no admite foco; por eso es un "foco pendiente" que se cumple en
 * cuanto `active` coincide.
 *
 * Los clics en el riel o en un ancla se tapan con una cortina de tinta
 * (`runCurtain`): el scroll se mueve cuando la pantalla ya esta cubierta. Son
 * directos el salto inicial (hash al abrir, volver desde el modo lineal: no hay nada
 * que tapar) y Atras/Adelante (el navegador ya movio el scroll antes de avisar).
 */
export function useStageNavigation({
  slugs,
  layout,
  origin,
  scrollY,
  active,
  getContent,
  runCurtain,
  cancelCurtain,
}: Options): StageNavigation {
  const activeRef = useRef(active);
  const pendingFocus = useRef<number | null>(null);
  const focusFrame = useRef<number | null>(null);

  useEffect(
    () => () => {
      if (focusFrame.current !== null) cancelAnimationFrame(focusFrame.current);
    },
    [],
  );

  const focusPending = useCallback(() => {
    const index = pendingFocus.current;
    if (index === null || index !== activeRef.current) return;
    pendingFocus.current = null;

    // Fallo visto en vivo: tras el salto la capa ya no es `inert`, pero sigue con
    // `visibility: hidden` hasta el siguiente frame de Motion, y un elemento
    // oculto NO admite foco (focus() no hace nada, sin error). Se espera un frame
    // y se reintenta unos pocos mas en vez de dar el foco por perdido.
    const attempt = (framesLeft: number) => {
      focusFrame.current = null;
      const target = findFocusTarget(getContent(index));
      if (!target) return;

      target.focus({ preventScroll: true });
      if (document.activeElement === target || framesLeft <= 0) return;
      focusFrame.current = requestAnimationFrame(() => attempt(framesLeft - 1));
    };

    if (focusFrame.current !== null) cancelAnimationFrame(focusFrame.current);
    focusFrame.current = requestAnimationFrame(() => attempt(FOCUS_RETRY_FRAMES));
  }, [getContent]);

  const jumpNow = useCallback(
    (index: number, focus: boolean) => {
      // `behavior: "auto"` y no "instant": Safari antiguo rechaza "instant", y
      // con `html[data-deck] { scroll-behavior: auto }` "auto" ya es instantaneo.
      window.scrollTo({ top: origin.get() + offsetOfStage(layout.get(), index), behavior: "auto" });
      // El navegador entrega el evento `scroll` un frame DESPUES del salto; sin
      // esto, ese frame se pintaria con el escenario anterior (un parpadeo del
      // primero al volver desde el modo lineal o al abrir con un hash). Leer
      // `scrollY` tras un salto instantaneo ya devuelve el valor nuevo.
      scrollY.set(window.scrollY);
      if (!focus) return;

      pendingFocus.current = index;
      // El foco pendiente CADUCA: si el salto no acaba en ese escenario (scroll
      // recortado, pagina que cambia de alto), no debe quedarse esperando y robar
      // el foco cuando el usuario llegue ahi, mucho despues, por un scroll normal.
      let framesLeft = FOCUS_RETRY_FRAMES;
      const expire = () => {
        if (pendingFocus.current !== index) return;
        if (framesLeft <= 0) pendingFocus.current = null;
        else {
          framesLeft -= 1;
          requestAnimationFrame(expire);
        }
      };
      requestAnimationFrame(expire);
      // Si el destino ya es el activo, `active` no cambiara y el efecto de abajo
      // no se dispararia: se cumple aqui mismo.
      focusPending();
    },
    [layout, origin, scrollY, focusPending],
  );

  const teleportTo = useCallback<StageNavigation["teleportTo"]>(
    (index, { focus = true, curtain = false } = {}) => {
      const destination = origin.get() + offsetOfStage(layout.get(), index);
      if (curtain && needsCurtain(window.scrollY, destination)) {
        runCurtain(() => jumpNow(index, focus));
        return;
      }
      // Lo ultimo que pide el usuario manda: un salto directo anula uno que espera.
      cancelCurtain();
      jumpNow(index, focus);
    },
    [layout, origin, runCurtain, cancelCurtain, jumpNow],
  );

  useEffect(() => {
    activeRef.current = active;
    focusPending();
  }, [active, focusPending]);

  useEffect(() => {
    const onClick = (event: MouseEvent) => {
      if (!isPlainPrimaryClick(event)) return;

      const anchor = event.target instanceof Element ? event.target.closest("a") : null;
      if (!anchor) return;

      const index = stageIndexFromAnchor(anchor, slugs);
      if (index === -1) return;

      event.preventDefault();
      // Lo que haria el navegador: una entrada nueva en el historial, salvo que
      // el hash ya sea ese.
      const href = anchor.getAttribute("href") ?? "";
      if (window.location.hash !== href) window.history.pushState(null, "", href);
      teleportTo(index, { curtain: true });
    };

    // Atras/adelante o editar el hash a mano. SIN cortina: con Atras/Adelante el
    // navegador ya repuso el scroll de esa entrada antes de avisar, asi que el salto
    // ya se vio y taparlo despues solo anade un segundo corte.
    const onHashChange = () => {
      const index = stageIndexFromHash(window.location.hash, slugs);
      if (index !== -1) teleportTo(index);
    };

    document.addEventListener("click", onClick);
    window.addEventListener("hashchange", onHashChange);
    return () => {
      document.removeEventListener("click", onClick);
      window.removeEventListener("hashchange", onHashChange);
    };
  }, [slugs, teleportTo]);

  const applyInitialHash = useCallback(() => {
    const index = stageIndexFromHash(window.location.hash, slugs);
    // Al abrir no se roba el foco: solo se posiciona.
    if (index !== -1) teleportTo(index, { focus: false });
  }, [slugs, teleportTo]);

  return useMemo(() => ({ teleportTo, applyInitialHash }), [teleportTo, applyInitialHash]);
}
