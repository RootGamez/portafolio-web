export type Ground = "washi" | "sumi" | "shu" | "kin";

export type SectionMeta = {
  readonly slug: string;
  /** Titulo visible. Es el h2 de la seccion (el h1 vive en el hero). */
  readonly title: string;
  /** Titulo japones del riel vertical. Decorativo. */
  readonly jp: string;
  /** Numeral kanji del riel. Decorativo. */
  readonly numeral: string;
  readonly ground: Ground;
  /** Si es false, la seccion no aparece en el riel de navegacion. */
  readonly inNav: boolean;
};

/**
 * El indice del documento. Una sola fuente para el orden de las secciones,
 * el riel de navegacion y el scroll-spy: si esto y el JSX se desincronizan,
 * la navegacion apunta a anclas que no existen.
 *
 * El ritmo de suelos (washi -> sumi -> shu -> kin) es deliberado: es lo que
 * hace que bajar por la pagina se sienta como pasar de plancha a plancha y
 * no como recorrer una lista. Ver docs/DESIGN_SYSTEM.md §5.
 */
export const sectionsMeta: readonly SectionMeta[] = [
  { slug: "inicio", title: "Anthony Gámez", jp: "放浪", numeral: "序", ground: "washi", inNav: true },
  { slug: "sobre-mi", title: "Sobre mí", jp: "自己紹介", numeral: "一", ground: "washi", inNav: true },
  { slug: "trayectoria", title: "Mi trayectoria", jp: "道程", numeral: "二", ground: "washi", inNav: true },
  { slug: "proyectos", title: "Mis proyectos", jp: "作品", numeral: "三", ground: "sumi", inNav: true },
  { slug: "mas-proyectos", title: "Más proyectos", jp: "其他", numeral: "四", ground: "washi", inNav: false },
  { slug: "produccion", title: "Del código a producción", jp: "実戦", numeral: "五", ground: "shu", inNav: true },
  { slug: "poderes", title: "Mis Habilidades", jp: "技", numeral: "六", ground: "washi", inNav: true },
  { slug: "fuera-del-codigo", title: "Fuera del código", jp: "日常", numeral: "七", ground: "sumi", inNav: true },
  { slug: "contacto", title: "Hablemos", jp: "連絡", numeral: "八", ground: "kin", inNav: true },
  { slug: "fin", title: "Fin", jp: "終", numeral: "終", ground: "sumi", inNav: false },
] as const;

/**
 * Lee una fila del indice por su slug.
 *
 * Existe para que ninguna seccion vuelva a copiarse los metadatos a mano: el
 * titulo se pinta en el h2 Y hace de nombre accesible de la <section> via
 * aria-labelledby, asi que una copia desincronizada no es solo una errata
 * visual — cambia lo que anuncia un lector de pantalla.
 *
 * Lanza en vez de devolver undefined: un slug renombrado tiene que reventar al
 * montar, con el nombre del slug en el mensaje, y no propagar un `undefined`
 * silencioso hasta el ancla. Sustituye a los `sectionsMeta.find(...)!`, donde
 * el `!` solo silenciaba a TypeScript.
 */
export function getSectionMeta(slug: string): SectionMeta {
  const meta = sectionsMeta.find((section) => section.slug === slug);
  if (!meta) throw new Error(`sectionsMeta: el slug "${slug}" no existe`);
  return meta;
}
