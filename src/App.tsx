import { ComicBook } from "@/components/comic/ComicBook";
import { comicPages } from "@/pages/pages";

export default function App() {
  return (
    <>
      <a
        href="#pagina-portada"
        className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-[100] focus:border-comic-md focus:border-ink focus:bg-pow focus:px-4 focus:py-2 focus:font-display focus:uppercase focus:text-ink focus:shadow-hard-sm"
      >
        Saltar al contenido
      </a>

      {/* Unico h1 del sitio. Visualmente oculto: la portada ya muestra el nombre
          en grande, pero el documento necesita su encabezado real. */}
      <h1 className="sr-only">Anthony Gámez — Desarrollador Full Stack y Líder Técnico</h1>

      <main>
        <ComicBook pages={comicPages} />
      </main>
    </>
  );
}
