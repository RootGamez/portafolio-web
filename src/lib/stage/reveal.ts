import { FOCUS_MARGIN_PX } from "./config";

/** Lo unico que importa de una caja para decidir si se ve: sus bordes en la ventana. */
export type Box = { readonly top: number; readonly bottom: number };

/**
 * Cuanto hay que subir (>0) o bajar (<0) el pan del escenario para mostrar un
 * elemento que ha recibido foco por teclado; 0 si ya se ve.
 *
 * Se deja `margin` px de aire entre el elemento y el borde del visor.
 *
 * Un elemento MAS ALTO que el visor no cabe entero (pasa al enfocar una seccion
 * completa): lo que lo identifica es su borde superior, asi que solo se corrige
 * si ese borde queda fuera. Bajar el pan para ver su borde inferior llevaria al
 * usuario al final del escenario sin que viese su arranque.
 */
export function revealDelta(frame: Box, target: Box, margin: number = FOCUS_MARGIN_PX): number {
  const overTop = target.top - (frame.top + margin);
  const overBottom = target.bottom - (frame.bottom - margin);

  const isTallerThanFrame = target.bottom - target.top > frame.bottom - frame.top - 2 * margin;
  if (isTallerThanFrame) {
    // Sin margen por arriba: pegado al borde ya se ve, y moverlo 24px no aporta.
    const isTopOutOfView = target.top < frame.top || target.top > frame.bottom - margin;
    return isTopOutOfView ? overTop : 0;
  }

  if (overBottom > 0) return overBottom;
  if (overTop < 0) return overTop;
  return 0;
}
