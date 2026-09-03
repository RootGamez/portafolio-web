/**
 * Los filtros SVG del sistema, montados UNA sola vez en la raiz del arbol.
 * Van en un <svg> de 0x0 porque un filtro solo existe si su <defs> esta en
 * el documento; no pinta nada por si mismo.
 *
 * OJO al usarlos: un `filter` aplicado a un elemento desplaza TAMBIEN su
 * texto. Por eso los componentes nunca filtran el elemento entero: filtran
 * una capa de marco absoluta y dejan el contenido limpio (ver InkPanel).
 */
export function InkFilters() {
  return (
    <svg
      aria-hidden="true"
      focusable="false"
      style={{ position: "absolute", width: 0, height: 0, overflow: "hidden" }}
    >
      <defs>
        {/* Canto de pincel: rompe el borde recto para que tiemble como tinta. */}
        <filter id="ink-rough" x="-6%" y="-6%" width="112%" height="112%">
          <feTurbulence
            type="fractalNoise"
            baseFrequency="0.045"
            numOctaves="3"
            seed="7"
            result="noise"
          />
          <feDisplacementMap
            in="SourceGraphic"
            in2="noise"
            scale="4"
            xChannelSelector="R"
            yChannelSelector="G"
          />
        </filter>

        {/* Version contenida, para elementos pequenos (sellos, botones). */}
        <filter id="ink-rough-soft" x="-4%" y="-4%" width="108%" height="108%">
          <feTurbulence
            type="fractalNoise"
            baseFrequency="0.07"
            numOctaves="2"
            seed="3"
            result="noise"
          />
          <feDisplacementMap
            in="SourceGraphic"
            in2="noise"
            scale="2"
            xChannelSelector="R"
            yChannelSelector="G"
          />
        </filter>

        {/*
          Entintado del retrato. feComponentTransfer con tableValues discretos
          posteriza a 4 niveles: es lo que convierte una foto en algo que parece
          una plancha entintada en vez de un blanco y negro.
        */}
        <filter id="ink-portrait" x="0%" y="0%" width="100%" height="100%">
          <feColorMatrix type="saturate" values="0" result="gray" />
          <feComponentTransfer in="gray" result="posterized">
            <feFuncR type="discrete" tableValues="0.08 0.30 0.62 0.94" />
            <feFuncG type="discrete" tableValues="0.07 0.28 0.60 0.93" />
            <feFuncB type="discrete" tableValues="0.06 0.26 0.57 0.91" />
          </feComponentTransfer>
          <feTurbulence
            type="fractalNoise"
            baseFrequency="0.9"
            numOctaves="1"
            seed="11"
            result="grain"
          />
          <feDisplacementMap
            in="posterized"
            in2="grain"
            scale="1.4"
            xChannelSelector="R"
            yChannelSelector="G"
          />
        </filter>
      </defs>
    </svg>
  );
}
