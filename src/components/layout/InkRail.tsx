import { useState } from "react";
import { Menu, X } from "lucide-react";
import { useScrollSpy } from "@/hooks/useScrollSpy";
import { sectionsMeta } from "@/sections/meta";

const NAV = sectionsMeta.filter((section) => section.inNav);
const NAV_IDS = sectionsMeta.map((section) => section.slug);

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
  const active = useScrollSpy(NAV_IDS);
  const [open, setOpen] = useState(false);

  return (
    <>
      {/* ---- Riel vertical (desktop) ---- */}
      <nav
        aria-label="Secciones"
        className="fixed left-0 top-0 z-40 hidden h-dvh w-16 flex-col items-center justify-center gap-1 border-r-4 border-[4px] bg-washi lg:flex"
      >
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
      </nav>

      {/* ---- Barra superior (movil / tablet) ---- */}
      <nav
        aria-label="Secciones"
        className="fixed inset-x-0 top-0 z-40 border-b-4 border-[4px] bg-washi lg:hidden"
        style={{ height: "var(--nav-height)" }}
      >
        <div className="flex h-full items-center justify-between px-4">
          <a
            href="#inicio"
            className="inline-flex min-h-11 items-center font-poster text-[18px] uppercase tracking-wide text-ink"
          >
            A. Gámez
          </a>
          <button
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
        </ul>
      </nav>
    </>
  );
}
