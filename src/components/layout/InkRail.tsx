import { useRef, useState } from "react";
import { Menu, X } from "lucide-react";
import { useDeck } from "@/components/stage/DeckContext";
import { MotionToggle } from "@/components/stage/MotionToggle";
import { sectionsMeta } from "@/sections/meta";

const NAV = sectionsMeta.filter((section) => section.inNav);

/**
 * La navegacion del documento. El comic no tenia: el paso de pagina hacia de
 * navegacion. Al quedarse en una sola pagina hace falta una explicita.
 *
 * Dos formas segun el ancho, como pide la guia de navegacion adaptativa:
 *  - >=1024px: riel fijo a la izquierda con el titulo japones en vertical.
 *  - <1024px:  barra superior con menu desplegable (no hay sitio para el riel).
 *
 * El estado activo NO se comunica solo por color: el item activo suma un
 * cambio de peso y una marca de tinta, para que se distinga sin depender
 * de la percepcion cromatica. En ARIA se marca con aria-current="location"
 * y no con "true": "page" y "true" hablan de navegacion entre documentos, y
 * aqui todo vive en uno solo — "location" es el valor que las WAI-ARIA
 * Authoring Practices dan al scrollspy de una sola pagina.
 *
 * Los enlaces son objetivos tactiles: min-h-11 Y min-w-11. En el riel el
 * ancho no es opcional — con writing-mode vertical la caja se queda en
 * 24-30px de ancho por mucho alto que tenga (DESIGN_SYSTEM §8, >=44x44).
 */
export function InkRail() {
  // La fuente del escenario activo es UNA, en ambos modos: en deck la fija el
  // motor y en lineal el scroll-spy (ver App.tsx).
  const { activeIndex, eligible } = useDeck();
  const active = sectionsMeta[activeIndex]?.slug ?? "";
  const [open, setOpen] = useState(false);
  const menuButton = useRef<HTMLButtonElement>(null);

  // Cerrar el menu desde DENTRO (Esc, o el interruptor de animaciones) esconde el
  // elemento enfocado y el foco caeria al <body> (WCAG 2.4.3): vuelve al boton
  // que lo abrio. Un clic en un enlace no lo necesita: el salto ya mueve el foco.
  const closeMenuAndRestoreFocus = () => {
    setOpen(false);
    menuButton.current?.focus();
  };

  return (
    <>
      {/* ---- Riel vertical (desktop) ---- */}
      {/*
        Rejilla de dos filas: los enlaces centrados y, debajo, el interruptor EN el
        flujo. Antes iba `absolute bottom-4` y en ventanas de menos de ~650px de
        alto (portatil con barra del navegador, zoom 200 %) tapaba el ultimo
        enlace (WCAG 2.4.11). Si ni asi caben, el riel hace scroll.
      */}
      <nav
        aria-label="Secciones"
        className="fixed left-0 top-0 z-40 hidden h-dvh w-16 grid-rows-[1fr_auto] justify-items-center gap-4 overflow-y-auto border-r-4 border-[4px] bg-washi py-4 lg:grid"
      >
        <div className="flex items-center">
          <ul className="flex flex-col items-center gap-5">
            {NAV.map((section) => {
              const isActive = active === section.slug;
              return (
                <li key={section.slug}>
                  <a
                    href={`#${section.slug}`}
                    aria-current={isActive ? "location" : undefined}
                    className={`vertical-jp flex min-h-11 min-w-11 items-center justify-center px-1 py-2 font-brush text-[0.95rem] transition-colors duration-150 ${
                      isActive
                        ? "border-l-4 border-shu font-bold text-ink"
                        : "text-ink-dim hover:text-ink"
                    }`}
                  >
                    <span className="sr-only">{section.title}</span>
                    <span aria-hidden="true">{section.jp}</span>
                  </a>
                </li>
              );
            })}
          </ul>
        </div>

        {/* "Modo simple": solo aparece si el modo escenarios es posible aqui. */}
        <MotionToggle variant="rail" />
      </nav>

      {/* ---- Barra superior (movil / tablet) ---- */}
      <nav
        aria-label="Secciones"
        className="fixed inset-x-0 top-0 z-40 border-b-4 border-[4px] bg-washi lg:hidden"
        style={{ height: "var(--nav-height)" }}
        onKeyDown={(event) => {
          if (event.key === "Escape" && open) closeMenuAndRestoreFocus();
        }}
      >
        <div className="flex h-full items-center justify-between px-4">
          <a
            href="#inicio"
            className="inline-flex min-h-11 items-center font-poster text-[18px] uppercase tracking-wide text-ink"
          >
            A. Gámez
          </a>
          <button
            ref={menuButton}
            type="button"
            onClick={() => setOpen((value) => !value)}
            aria-expanded={open}
            aria-controls="menu-secciones"
            className="flex h-11 w-11 cursor-pointer items-center justify-center border-[3px] border-[4px] bg-kin text-ink"
          >
            <span className="sr-only">{open ? "Cerrar menu" : "Abrir menu"}</span>
            {open ? (
              <X size={20} strokeWidth={3} aria-hidden="true" />
            ) : (
              <Menu size={20} strokeWidth={3} aria-hidden="true" />
            )}
          </button>
        </div>

        <ul
          id="menu-secciones"
          hidden={!open}
          className="max-h-[70dvh] overflow-y-auto border-t-4 border-[4px] bg-washi"
        >
          {NAV.map((section) => (
            <li key={section.slug} className="border-b-2 border-washi-edge">
              <a
                href={`#${section.slug}`}
                onClick={() => setOpen(false)}
                aria-current={active === section.slug ? "location" : undefined}
                className={`flex min-h-12 items-center gap-3 px-4 py-3 text-body ${
                  active === section.slug ? "bg-kin font-bold text-ink" : "text-ink"
                }`}
              >
                <span aria-hidden="true" className="font-brush text-shu">
                  {section.numeral}
                </span>
                {section.title}
              </a>
            </li>
          ))}
          {eligible && (
            <li className="border-b-2 border-washi-edge">
              <MotionToggle variant="menu" onToggle={closeMenuAndRestoreFocus} />
            </li>
          )}
        </ul>
      </nav>
    </>
  );
}
