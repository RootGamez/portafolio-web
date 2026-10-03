import { Fragment, useEffect, useLayoutEffect, useRef, type ComponentType } from "react";
import { InkFilters } from "@/components/ink/InkFilters";
import { InkRail } from "@/components/layout/InkRail";
import { SkipLink } from "@/components/layout/SkipLink";
import { DeckProvider, useDeck } from "@/components/stage/DeckContext";
import { MotionToggle } from "@/components/stage/MotionToggle";
import { StageAnnouncer } from "@/components/stage/StageAnnouncer";
import { StageDeck, type StageDef } from "@/components/stage/StageDeck";
import { useRestoreIndex } from "@/components/stage/useRestoreIndex";
import { useScrollSpy } from "@/hooks/useScrollSpy";
import { jumpToElement } from "@/lib/stage/scroll";

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
import { sectionsMeta } from "@/sections/meta";

/**
 * Componente de cada seccion por slug. El ORDEN no se escribe aqui: lo manda
 * `sectionsMeta` (la unica fuente del orden, del riel y del scroll-spy). Si un
 * slug del indice no tiene componente, revienta al cargar con su nombre, en
 * vez de dejar un hueco silencioso.
 */
const SECTION_COMPONENTS: Readonly<Record<string, ComponentType>> = {
  inicio: Hero,
  "sobre-mi": SobreMi,
  trayectoria: Trayectoria,
  proyectos: Proyectos,
  "mas-proyectos": MasProyectos,
  produccion: Produccion,
  poderes: Poderes,
  "fuera-del-codigo": FueraDelCodigo,
  contacto: Contacto,
  fin: Fin,
};

/**
 * Los elementos se crean UNA vez, a nivel de modulo: su identidad es estable
 * y React no vuelve a renderizar una seccion cuando cambia el escenario activo.
 */
const STAGES: readonly StageDef[] = sectionsMeta.map(({ slug, ground }) => {
  const Component = SECTION_COMPONENTS[slug];
  if (!Component) throw new Error(`App: la seccion "${slug}" de sectionsMeta no tiene componente`);
  return { slug, ground, node: <Component /> };
});

const SLUGS = STAGES.map((stage) => stage.slug);
const TITLES = sectionsMeta.map((section) => section.title);

/**
 * El modo lineal: el documento clasico, las diez secciones en orden y todo
 * visible. Es el fallback (reduced-motion, "Modo simple", sin sticky...).
 *
 * Aqui vive el scroll-spy: en este modo es el quien dice que seccion se ve,
 * y lo escribe en el estado compartido para que el riel lea siempre de un solo
 * sitio. En el modo escenarios esa fuente es el motor, no el IntersectionObserver
 * (que daria por visibles todas las capas apiladas).
 */
function LinearSections({ restoreIndex }: { readonly restoreIndex: number | null }) {
  const { setActiveIndex } = useDeck();
  // Se capturan al montar: son para colocar la pagina UNA vez, no para seguir al usuario.
  const initial = useRef(restoreIndex);
  const spyActive = useScrollSpy(SLUGS, SLUGS[initial.current ?? 0]);

  useLayoutEffect(() => {
    if (initial.current === null) return;
    const section = document.getElementById(SLUGS[initial.current]);
    if (section) jumpToElement(section);
  }, []);

  useEffect(() => {
    const index = SLUGS.indexOf(spyActive);
    if (index !== -1) setActiveIndex(index);
  }, [spyActive, setActiveIndex]);

  return (
    <>
      {STAGES.map((stage) => (
        <Fragment key={stage.slug}>{stage.node}</Fragment>
      ))}
    </>
  );
}

/**
 * Elige el modo. Si el usuario cambia de modo con la pagina ya abierta ("Modo
 * simple"), el arbol nuevo se coloca en el escenario que se estaba viendo, para
 * que no pierda su sitio. En la carga inicial NO se restaura nada: ahi manda
 * el hash de la URL o la restauracion de scroll del navegador.
 */
function Experience() {
  const { mode, activeIndex } = useDeck();
  const restoreIndex = useRestoreIndex(mode, activeIndex);

  return mode === "deck" ? (
    <StageDeck stages={STAGES} restoreIndex={restoreIndex} />
  ) : (
    <LinearSections restoreIndex={restoreIndex} />
  );
}

/**
 * Un solo documento con diez secciones ancladas, en dos modos (ver
 * docs/DESIGN_SYSTEM.md §7.1):
 *   - escenarios: cada seccion es un escenario sticky con transiciones de
 *     tinta ligadas al scroll nativo;
 *   - lineal: el scroll clasico. Es tambien el fallback y lo que ve quien
 *     pide reducir el movimiento.
 */
export default function App() {
  return (
    <DeckProvider>
      <InkFilters />
      <SkipLink />
      <MotionToggle variant="skip" />
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
        <Experience />
      </main>

      <StageAnnouncer titles={TITLES} />
    </DeckProvider>
  );
}
