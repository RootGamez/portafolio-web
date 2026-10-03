import { describe, expect, it } from "vitest";
import { needsCurtain, isPlainPrimaryClick, stageIndexFromAnchor, stageIndexFromHash } from "./navigation";

const SLUGS = ["inicio", "sobre-mi", "proyectos", "contacto"] as const;

describe("stageIndexFromHash", () => {
  it("encuentra el escenario por su slug, con o sin la almohadilla", () => {
    expect(stageIndexFromHash("#proyectos", SLUGS)).toBe(2);
    expect(stageIndexFromHash("proyectos", SLUGS)).toBe(2);
    expect(stageIndexFromHash("#inicio", SLUGS)).toBe(0);
  });

  it("devuelve -1 para un hash vacio, desconocido o solo '#'", () => {
    expect(stageIndexFromHash("", SLUGS)).toBe(-1);
    expect(stageIndexFromHash("#", SLUGS)).toBe(-1);
    expect(stageIndexFromHash("#no-existe", SLUGS)).toBe(-1);
  });

  it("decodifica el hash codificado como URI", () => {
    expect(stageIndexFromHash("#sobre%2Dmi", SLUGS)).toBe(1);
  });

  it("un hash mal codificado no lanza: -1", () => {
    expect(stageIndexFromHash("#%E0%A4%A", SLUGS)).toBe(-1);
  });

  it("distingue mayusculas: los slugs son exactos", () => {
    expect(stageIndexFromHash("#Proyectos", SLUGS)).toBe(-1);
  });
});

function anchor(href: string | null, target = "") {
  return {
    getAttribute: (name: string) => (name === "href" ? href : null),
    target,
  };
}

describe("stageIndexFromAnchor", () => {
  it("resuelve un enlace interno a un escenario", () => {
    expect(stageIndexFromAnchor(anchor("#contacto"), SLUGS)).toBe(3);
  });

  it("ignora enlaces que no son anclas internas", () => {
    expect(stageIndexFromAnchor(anchor("https://github.com/RootGamez"), SLUGS)).toBe(-1);
    expect(stageIndexFromAnchor(anchor("/cv/CV.pdf"), SLUGS)).toBe(-1);
    expect(stageIndexFromAnchor(anchor("mailto:a@b.c"), SLUGS)).toBe(-1);
    expect(stageIndexFromAnchor(anchor(null), SLUGS)).toBe(-1);
  });

  it("ignora anclas que no son un escenario (p. ej. el skip link a #contenido)", () => {
    expect(stageIndexFromAnchor(anchor("#contenido"), SLUGS)).toBe(-1);
  });

  it("ignora enlaces que abren en otra pestana", () => {
    expect(stageIndexFromAnchor(anchor("#proyectos", "_blank"), SLUGS)).toBe(-1);
    expect(stageIndexFromAnchor(anchor("#proyectos", "_self"), SLUGS)).toBe(2);
  });
});

describe("isPlainPrimaryClick", () => {
  const click = (patch: Partial<Parameters<typeof isPlainPrimaryClick>[0]> = {}) => ({
    button: 0,
    metaKey: false,
    ctrlKey: false,
    shiftKey: false,
    altKey: false,
    defaultPrevented: false,
    ...patch,
  });

  it("acepta el clic izquierdo normal", () => {
    expect(isPlainPrimaryClick(click())).toBe(true);
  });

  it.each([
    ["clic central", { button: 1 }],
    ["clic derecho", { button: 2 }],
    ["Ctrl", { ctrlKey: true }],
    ["Cmd", { metaKey: true }],
    ["Shift", { shiftKey: true }],
    ["Alt", { altKey: true }],
    ["ya cancelado por otro manejador", { defaultPrevented: true }],
  ] as const)("rechaza %s: el navegador debe hacer lo suyo", (_name, patch) => {
    expect(isPlainPrimaryClick(click(patch))).toBe(false);
  });
});

describe("needsCurtain: solo se tapa un salto que de verdad cambia lo que se ve", () => {
  it("un salto lejos necesita cortina, hacia delante y hacia atras", () => {
    expect(needsCurtain(0, 5000)).toBe(true);
    expect(needsCurtain(9000, 1200)).toBe(true);
  });

  it("si el destino es donde ya estas, no hay nada que tapar", () => {
    expect(needsCurtain(1280, 1280)).toBe(false);
  });

  it("una diferencia de redondeo (menos de 1px) tampoco", () => {
    expect(needsCurtain(1280, 1280.4)).toBe(false);
    expect(needsCurtain(1280.4, 1280)).toBe(false);
  });

  it("un valor no finito no abre cortina (se salta directamente)", () => {
    expect(needsCurtain(Number.NaN, 100)).toBe(false);
    expect(needsCurtain(0, Number.POSITIVE_INFINITY)).toBe(false);
  });
});
