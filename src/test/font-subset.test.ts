import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
// @ts-expect-error — modulo .mjs sin tipos, compartido con scripts/
import { collectGlyphs, requestedGlyphs } from "../../scripts/font-subset.mjs";

/**
 * Yuji Syuku se pide con `?text=`: un solo woff2 con los glifos exactos del
 * sitio en vez de los 21 chunks por unicode-range de Google (554 KB -> ~21 KB).
 *
 * El fallo que esto vigila es SILENCIOSO. Un caracter que no este en la lista
 * no da error: cae al fallback, y se ve como una onomatopeya con dos
 * tipografias mezcladas o un kanji con otra forma.
 *
 * Cubre CJK y tambien el LATIN de las onomatopeyas, porque van en `font-brush`.
 * La primera version solo miraba CJK y por eso no vio venir un `¡FLASH!` cuyas
 * F y L no estaban en el subset.
 *
 * La regla vive en scripts/font-subset.mjs y la comparten este test y el
 * regenerador (`node scripts/font-subset.mjs --write`), para que no puedan
 * discrepar.
 */
describe("subset de Yuji Syuku", () => {
  it("index.html pide todos los glifos que el codigo pinta a pincel", () => {
    const requested = requestedGlyphs(readFileSync("index.html", "utf-8"));
    expect(requested, "no se encontro el <link> de Yuji Syuku con ?text=").not.toBeNull();

    const missing = [...collectGlyphs("src")].filter((g: string) => !requested!.has(g));

    expect(
      missing,
      `Faltan glifos en el subset de index.html: ${missing.join(" ")}. ` +
        "Regeneralo con: node scripts/font-subset.mjs --write",
    ).toEqual([]);
  });
});
