/**
 * Lleva un elemento al borde superior de la ventana SIN animacion.
 *
 * El sitio lineal tiene `html { scroll-behavior: smooth }`, y `scrollIntoView`
 * (incluso con `behavior: "auto"`) lo respeta: al cambiar de modo el usuario
 * veria un viaje animado en vez de quedarse donde estaba. Se apaga el smooth
 * solo durante el salto y se restaura despues; asi no hace falta
 * `behavior: "instant"`, que Safari antiguo rechaza.
 *
 * Respeta `scroll-margin-top` (la barra de navegacion en movil).
 */
export function jumpToElement(element: HTMLElement): void {
  const root = document.documentElement;
  const previous = root.style.scrollBehavior;

  root.style.scrollBehavior = "auto";
  try {
    element.scrollIntoView({ block: "start" });
  } finally {
    // Siempre se restaura: dejar el documento con scroll-behavior roto seria peor
    // que cualquier fallo del salto.
    root.style.scrollBehavior = previous;
  }
}
