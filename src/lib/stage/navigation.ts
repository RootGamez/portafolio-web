/**
 * Navegacion por anclas en el modo escenarios (docs/PLAN_ESCENARIOS.md §6).
 *
 * Con las capas apiladas, el salto nativo a `#slug` no sirve: el navegador
 * intenta llevar el elemento a la vista, pero esta dentro de un visor sticky y
 * el scroll de la pagina no cambia. Hay que traducir cada ancla a un scroll de
 * la pista. Esto es NAVEGACION (el usuario pidio ir a un sitio), no secuestro
 * del scroll: no toca rueda, tacto ni teclado.
 *
 * Aqui solo viven las funciones puras; el cableado al DOM esta en
 * components/stage/useStageNavigation.ts.
 */

import { CURTAIN_MIN_DISTANCE_PX } from "./config";

/**
 * Indice del escenario al que apunta un hash (`#proyectos` o `proyectos`), o -1
 * si esta vacio, es desconocido o esta mal codificado.
 */
export function stageIndexFromHash(hash: string, slugs: readonly string[]): number {
  const raw = hash.startsWith("#") ? hash.slice(1) : hash;
  if (raw === "") return -1;

  try {
    return slugs.indexOf(decodeURIComponent(raw));
  } catch {
    // Secuencia %XX invalida: no es ningun slug nuestro.
    return -1;
  }
}

type AnchorLike = {
  readonly getAttribute: (name: string) => string | null;
  readonly target: string;
};

/**
 * Indice del escenario al que apunta un <a>. Solo cuentan las anclas internas
 * (`#slug`) que abren en la misma pestana: un enlace externo, un `mailto:`, el
 * skip link a `#contenido` o un `target="_blank"` se dejan al navegador.
 */
export function stageIndexFromAnchor(anchor: AnchorLike, slugs: readonly string[]): number {
  const href = anchor.getAttribute("href");
  if (!href || !href.startsWith("#")) return -1;
  if (anchor.target && anchor.target !== "_self") return -1;
  return stageIndexFromHash(href, slugs);
}

type ClickLike = Pick<
  MouseEvent,
  "button" | "metaKey" | "ctrlKey" | "shiftKey" | "altKey" | "defaultPrevented"
>;

/**
 * ¿Es un clic "normal" que el sitio puede gestionar? Con Ctrl/Cmd/Shift/Alt o
 * con el boton central o derecho el usuario pide algo distinto (abrir en otra
 * pestana, copiar el enlace...) y el navegador debe hacerlo. Si otro manejador
 * ya cancelo el evento, tampoco se pisa.
 */
export function isPlainPrimaryClick(event: ClickLike): boolean {
  return (
    event.button === 0 &&
    !event.metaKey &&
    !event.ctrlKey &&
    !event.shiftKey &&
    !event.altKey &&
    !event.defaultPrevented
  );
}

/**
 * ¿Hace falta tapar un salto con la cortina de tinta? Solo si de verdad cambia lo
 * que se ve: si el destino es donde ya estas (o la diferencia es de redondeo) no hay
 * nada que ocultar y se salta directamente. Un valor no finito tampoco abre cortina.
 */
export function needsCurtain(currentScroll: number, destinationScroll: number): boolean {
  if (!Number.isFinite(currentScroll) || !Number.isFinite(destinationScroll)) return false;
  return Math.abs(destinationScroll - currentScroll) >= CURTAIN_MIN_DISTANCE_PX;
}
