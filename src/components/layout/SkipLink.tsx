/**
 * Primer elemento enfocable del documento. Invisible hasta que recibe foco:
 * quien navega con teclado no deberia recorrer diez secciones de riel antes
 * de llegar al contenido.
 */
export function SkipLink() {
  return (
    <a
      href="#contenido"
      className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-[100] focus:border-ink focus:border-ink-thin focus:bg-kin focus:px-4 focus:py-2 focus:font-poster focus:uppercase focus:text-ink"
    >
      Saltar al contenido
    </a>
  );
}
