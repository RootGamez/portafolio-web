import { describe, expect, it } from "vitest";
import { readFileSync, readdirSync, statSync } from "node:fs";
import { join } from "node:path";

/**
 * Yuji Syuku se pide a Google Fonts con `?text=`, que descarga UN solo woff2
 * con los glifos exactos que usa el sitio en vez de los 21 chunks por
 * unicode-range que sirve por defecto (554 KB frente a 21 KB).
 *
 * El precio de esa optimizacion es que la lista de glifos vive en index.html,
 * lejos del codigo que la necesita. Si alguien anade una seccion con un kanji
 * nuevo, o un SFX con un katakana nuevo, ese caracter NO estara en la fuente y
 * caera al fallback sin ningun error: un fallo silencioso y dificil de ver.
 *
 * Este test recalcula el conjunto desde el codigo fuente y falla si index.html
 * se ha quedado corto.
 */
const CJK = /[\u3000-\u303F\u3040-\u309F\u30A0-\u30FF\u4E00-\u9FFF]/gu;

function sourceFiles(dir: string): string[] {
  return readdirSync(dir).flatMap((entry) => {
    const path = join(dir, entry);
    if (statSync(path).isDirectory()) return sourceFiles(path);
    return /\.tsx?$/.test(entry) ? [path] : [];
  });
}

function glyphsUsedInSource(): Set<string> {
  const glyphs = new Set<string>();
  for (const file of sourceFiles("src")) {
    const text = readFileSync(file, "utf-8");
    for (const match of text.match(CJK) ?? []) glyphs.add(match);
  }
  return glyphs;
}

describe("subset de Yuji Syuku", () => {
  it("index.html pide todos los glifos CJK que usa el codigo", () => {
    const html = readFileSync("index.html", "utf-8");
    const match = html.match(/family=Yuji\+Syuku&text=([^&"]+)/);
    expect(match, "no se encontro el <link> de Yuji Syuku con ?text=").toBeTruthy();

    const requested = new Set(decodeURIComponent(match![1]));
    const missing = [...glyphsUsedInSource()].filter((g) => !requested.has(g));

    expect(
      missing,
      `Faltan glifos en el subset de index.html: ${missing.join(" ")}. ` +
        "Anadelos al parametro text= del <link> de Yuji Syuku.",
    ).toEqual([]);
  });
});
