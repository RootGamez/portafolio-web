import { InkFilters } from "@/components/ink/InkFilters";
import { InkRail } from "@/components/layout/InkRail";
import { SkipLink } from "@/components/layout/SkipLink";

import { Hero } from "@/sections/Hero";
import { SobreMi } from "@/sections/SobreMi";
import { Trayectoria } from "@/sections/Trayectoria";
import { Proyectos } from "@/sections/Proyectos";
import { MasProyectos } from "@/sections/MasProyectos";
import { Produccion } from "@/sections/Produccion";
import { Poderes } from "@/sections/Poderes";
import { FueraDelCodigo } from "@/sections/FueraDelCodigo";
import { Contacto } from "@/sections/Contacto";
import { Fin } from "@/sections/Fin";

/**
 * Un solo documento, scroll real, diez secciones ancladas.
 *
 * Lo que desaparecio respecto al comic: el motor de paso de pagina, el
 * posicionado absoluto de las hojas, el `inert` por pagina y el truco de
 * html[data-js] para los crawlers. Con un documento lineal nada de eso
 * hace falta: el contenido esta en el HTML y se indexa solo.
 */
export default function App() {
  return (
    <>
      <InkFilters />
      <SkipLink />
      <InkRail />

      {/* La nav es fija (barra arriba en movil, riel a la izquierda en desktop),
          asi que el contenido tiene que reservar su hueco o queda debajo.
          Ambos valores viven en app.css y son responsive. */}
      {/* tabIndex={-1}: sin el, "Saltar al contenido" mueve la VISTA pero no el
          FOCO — el siguiente Tab volveria al riel y el skip link no serviria
          de nada. -1 lo hace enfocable por programa sin meterlo en el orden de
          tabulacion, y focus:outline-none evita que el <main> entero pinte un
          anillo al recibir un foco que el usuario no ha pedido ver. */}
      <main
        id="contenido"
        tabIndex={-1}
        className="focus:outline-none"
        style={{ paddingTop: "var(--nav-height)", paddingLeft: "var(--rail-width)" }}
      >
        <Hero />
        <SobreMi />
        <Trayectoria />
        <Proyectos />
        <MasProyectos />
        <Produccion />
        <Poderes />
        <FueraDelCodigo />
        <Contacto />
        <Fin />
      </main>
    </>
  );
}
