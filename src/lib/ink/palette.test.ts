import { afterEach, describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { TONE_PITCHES_PX } from "@/lib/stage/config";
import { parseCssColor, readInkPalette } from "./palette";

// Con `?raw` vitest entrega un .css vacio (lo procesa aparte): se lee del disco.
const appCss = readFileSync("src/styles/app.css", "utf-8");

describe("parseCssColor", () => {
  it("lee hexadecimales largos y cortos como RGB en 0..1", () => {
    expect(parseCssColor("#ff8000")).toEqual([1, 128 / 255, 0]);
    expect(parseCssColor("  #F80 ")).toEqual([1, 136 / 255, 0]);
  });

  it("lee rgb() con comas o con espacios (lo que devuelve getComputedStyle)", () => {
    expect(parseCssColor("rgb(255, 0, 51)")).toEqual([1, 0, 51 / 255]);
    expect(parseCssColor("rgb(255 0 51)")).toEqual([1, 0, 51 / 255]);
  });

  it("devuelve null con lo que no sabe leer (el llamador cae a la tinta SVG)", () => {
    expect(parseCssColor("")).toBeNull();
    expect(parseCssColor("var(--ink-900)")).toBeNull();
    expect(parseCssColor("#12")).toBeNull();
    expect(parseCssColor("oklch(0.5 0.1 30)")).toBeNull();
  });
});

describe("readInkPalette", () => {
  let style: HTMLStyleElement | null = null;

  afterEach(() => {
    style?.remove();
    style = null;
  });

  function installGrounds(css: string) {
    style = document.createElement("style");
    style.textContent = css;
    document.head.append(style);
  }

  const GROUNDS_CSS = `
    [data-ground="washi"] { --g-bg: #ede6d6; --g-ink-rim: #c9bfa6; }
    [data-ground="sumi"]  { --g-bg: #14110f; --g-ink-rim: #3a3430; }
    [data-ground="shu"]   { --g-bg: #b0342b; --g-ink-rim: #8e2a22; }
    [data-ground="kin"]   { --g-bg: #e5b62c; --g-ink-rim: #b8901c; }
  `;

  it("lee la tinta (--g-bg) y el pigmento seco (--g-ink-rim) de cada suelo, sin dejar sondas", () => {
    installGrounds(GROUNDS_CSS);
    const host = document.createElement("div");
    document.body.append(host);

    const palette = readInkPalette(host);

    expect(palette?.sumi).toEqual({ ink: parseCssColor("#14110f"), rim: parseCssColor("#3a3430") });
    expect(palette?.kin).toEqual({ ink: parseCssColor("#e5b62c"), rim: parseCssColor("#b8901c") });
    expect(host.childElementCount).toBe(0);
    host.remove();
  });

  it("si falta un color devuelve null: mejor SVG que una tinta del color equivocado", () => {
    installGrounds(GROUNDS_CSS.replace("--g-ink-rim: #8e2a22;", ""));
    const host = document.createElement("div");
    document.body.append(host);

    expect(readInkPalette(host)).toBeNull();
    expect(host.childElementCount).toBe(0);
    host.remove();
  });

  it("los cuatro suelos de app.css declaran su --g-ink-rim", () => {
    const declarations = appCss.match(/--g-ink-rim:/g) ?? [];

    expect(declarations).toHaveLength(4);
  });

  it("los pasos de la trama WebGL son los tokens --tone-* de app.css", () => {
    const tokens = ["fine", "med", "coarse"].map((name) => {
      const match = new RegExp(`--tone-${name}:\\s*(\\d+)px`).exec(appCss);
      return Number(match?.[1]);
    });

    expect(tokens).toEqual([...TONE_PITCHES_PX]);
  });
});
