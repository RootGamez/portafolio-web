type Props = {
  readonly children: string;
  /** Numeral kanji de la seccion (一, 二, 三...). Se pinta sobre el texto. */
  readonly numeral?: string;
  readonly className?: string;
};

/**
 * Riel de texto japones vertical para los canalones. Es lo que ocupa el
 * espacio horizontal muerto y evita que la pagina se lea como una columna.
 *
 * Decorativo -> aria-hidden. El titulo real de la seccion ya esta en el h2;
 * duplicarlo aqui para un lector de pantalla solo seria ruido.
 */
export function VerticalKanji({ children, numeral, className = "" }: Props) {
  return (
    <span
      aria-hidden="true"
      className={`vertical-jp pointer-events-none select-none font-brush text-[var(--g-faint)] ${className}`}
    >
      {numeral && (
        <span className="mb-4 block text-[1.6em] text-[var(--g-accent)]">{numeral}</span>
      )}
      {children}
    </span>
  );
}
