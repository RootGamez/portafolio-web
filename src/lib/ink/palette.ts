import type { Ground } from "@/sections/meta";
import type { InkPalette } from "./engine";
import type { Rgb } from "./webgl";

/**
 * Colores de la tinta WebGL, leidos de los tokens de app.css: el shader no
 * repite colores (DESIGN_SYSTEM: "un componente nunca elige un color: lee --g-*").
 * La tinta es `--g-bg` del suelo y el pigmento seco del frente, `--g-ink-rim`.
 */

const HEX_LONG = /^#([0-9a-f]{2})([0-9a-f]{2})([0-9a-f]{2})$/i;
const HEX_SHORT = /^#([0-9a-f])([0-9a-f])([0-9a-f])$/i;
const RGB_FUNCTION = /^rgba?\(\s*(\d+)[\s,]+(\d+)[\s,]+(\d+)/i;

function channels(values: readonly string[], radix: number): Rgb {
  const [r, g, b] = values.map((value) => Number.parseInt(value, radix) / 255);
  return [r, g, b];
}

/** `#rrggbb`, `#rgb` o `rgb()` a RGB en 0..1; null con cualquier otra cosa. */
export function parseCssColor(value: string): Rgb | null {
  const text = value.trim();
  const long = HEX_LONG.exec(text);
  if (long) return channels(long.slice(1), 16);
  const short = HEX_SHORT.exec(text);
  if (short) return channels(short.slice(1).map((digit) => digit + digit), 16);
  const rgb = RGB_FUNCTION.exec(text);
  if (rgb) return channels(rgb.slice(1), 10);
  return null;
}

function readGround(host: HTMLElement, ground: Ground): { ink: Rgb; rim: Rgb } | null {
  // Una sonda con el suelo: sus custom properties ya llegan resueltas (sin var()).
  const probe = document.createElement("span");
  probe.dataset.ground = ground;
  host.append(probe);
  const style = getComputedStyle(probe);
  const ink = parseCssColor(style.getPropertyValue("--g-bg"));
  const rim = parseCssColor(style.getPropertyValue("--g-ink-rim"));
  probe.remove();
  return ink && rim ? { ink, rim } : null;
}

/**
 * La paleta de los cuatro suelos, o null si falta alguno (entonces, tinta SVG).
 * Un literal y no un bucle: si `Ground` gana un suelo, esto deja de compilar en
 * vez de devolver una paleta incompleta que reventaria en cada fotograma.
 */
export function readInkPalette(host: HTMLElement): InkPalette | null {
  const washi = readGround(host, "washi");
  const sumi = readGround(host, "sumi");
  const shu = readGround(host, "shu");
  const kin = readGround(host, "kin");
  if (!washi || !sumi || !shu || !kin) return null;
  return { washi, sumi, shu, kin };
}
