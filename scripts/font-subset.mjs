import { readFileSync, readdirSync, statSync, writeFileSync } from "node:fs";
import { join } from "node:path";

/**
 * Fuente unica de la regla del subset de Yuji Syuku.
 *
 * La fuente se pide a Google con `?text=`, que devuelve UN solo woff2 con los
 * glifos exactos que usa el sitio en vez de los 21 chunks por unicode-range
 * que sirve por defecto (554 KB frente a ~21 KB).
 *
 * El precio es que la lista vive en index.html, lejos del codigo que la
 * necesita: si alguien anade una seccion con un kanji nuevo o una onomatopeya
 * con una letra nueva, ese caracter NO esta en la fuente y cae al fallback SIN
 * ningun error. Se ve como un SFX con dos tipografias mezcladas.
 *
 * Este modulo lo usan DOS consumidores, y por eso vive aparte:
 *   - `src/test/font-subset.test.ts`, que falla si index.html se queda corto;
 *   - `node scripts/font-subset.mjs --write`, que regenera el parametro.
 * Si la regla estuviera duplicada en los dos, podrian discrepar en silencio,
 * que es exactamente el fallo que este archivo existe para evitar.
 */

const CJK = /[　-〿぀-ゟ゠-ヿ一-鿿]/gu;

/** Onomatopeyas: van en `font-brush`, asi que su LATIN tambien necesita subset. */
const POW_FIELD = /pow:\s*"([^"]+)"/gu;
const SFX_LITERAL = /<Sfx[^>]*>\s*([^<{][^<]*?)\s*<\/Sfx>/gu;

/** Kanji que se escriben sueltos en el JSX y no vienen de un dato. */
const ALWAYS = "放浪終";

function sourceFiles(dir) {
  return readdirSync(dir).flatMap((entry) => {
    const path = join(dir, entry);
    if (statSync(path).isDirectory()) return sourceFiles(path);
    return /\.tsx?$/u.test(entry) ? [path] : [];
  });
}

export function collectGlyphs(root = "src") {
  const glyphs = new Set(ALWAYS);

  for (const file of sourceFiles(root)) {
    const text = readFileSync(file, "utf-8");

    for (const match of text.match(CJK) ?? []) glyphs.add(match);

    for (const [, value] of text.matchAll(POW_FIELD)) {
      for (const ch of value) if (!/\s/u.test(ch)) glyphs.add(ch);
    }
    for (const [, value] of text.matchAll(SFX_LITERAL)) {
      for (const ch of value) if (!/\s/u.test(ch)) glyphs.add(ch);
    }
  }

  return glyphs;
}

export function subsetParam(glyphs = collectGlyphs()) {
  return encodeURIComponent([...glyphs].sort().join(""));
}

export function requestedGlyphs(html) {
  const match = html.match(/family=Yuji\+Syuku&text=([^&"]+)/u);
  return match ? new Set(decodeURIComponent(match[1])) : null;
}

/* CLI: `node scripts/font-subset.mjs --write` reescribe el parametro. */
if (process.argv[1]?.endsWith("font-subset.mjs")) {
  const glyphs = collectGlyphs();
  const param = subsetParam(glyphs);

  if (process.argv.includes("--write")) {
    const html = readFileSync("index.html", "utf-8");
    const next = html.replace(/(family=Yuji\+Syuku&text=)[^&"]+/u, `$1${param}`);
    if (next === html) {
      console.error("No se encontro el <link> de Yuji Syuku con ?text= en index.html");
      process.exit(1);
    }
    writeFileSync("index.html", next);
    console.log(`index.html actualizado: ${glyphs.size} glifos`);
  } else {
    console.log([...glyphs].sort().join(""));
    console.log(`\n${glyphs.size} glifos. Usa --write para escribir index.html.`);
  }
}
