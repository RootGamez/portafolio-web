import { Profiler } from "react";
import { describe, expect, it } from "vitest";
import { act, render, waitFor } from "@testing-library/react";
import { motionValue } from "motion/react";
import { buildLayout, type StageSpec } from "@/lib/stage/timeline";
import { TRANSITIONS } from "@/lib/stage/transitions";
import { ChapterCard } from "./ChapterCard";

/** La misma linea de tiempo de prueba que InkOverlay.test: T0 va de 480 a 1280. */
const SPECS: readonly StageSpec[] = [{ contentHeight: 600 }, { contentHeight: 1400 }, { contentHeight: 800 }];
const LAYOUT = buildLayout(SPECS, 800);
const T0_START = 480;
const T0_LENGTH = 800;

function setup(index = 0, scroll = 0) {
  const scrollOffset = motionValue(scroll);
  const utils = render(
    <ChapterCard index={index} spec={TRANSITIONS[index]} layout={motionValue(LAYOUT)} scrollOffset={scrollOffset} />,
  );
  const card = utils.container.querySelector("[data-chapter-card]") as HTMLElement;
  return { ...utils, scrollOffset, card };
}

describe("ChapterCard", () => {
  it("anuncia el capitulo que ENTRA: numeral, titulo japones y titulo de la seccion siguiente", () => {
    const { card } = setup(0); // inicio -> sobre-mi

    expect(card).toHaveTextContent("一");
    expect(card).toHaveTextContent("自己紹介");
    expect(card).toHaveTextContent("Sobre mí");
    expect(card).not.toHaveTextContent("Anthony Gámez");
  });

  it("la ultima transicion presenta el cierre (終 / Fin)", () => {
    const { card } = setup(TRANSITIONS.length - 1);

    expect(card).toHaveTextContent("終");
    expect(card).toHaveTextContent("Fin");
  });

  it("es decorativa: aria-hidden y no capta el puntero (la seccion ya se anuncia por el lector)", () => {
    const { card } = setup();

    expect(card).toHaveAttribute("aria-hidden", "true");
    expect(card.className).toContain("pointer-events-none");
  });

  it("usa el color de la tinta de su transicion (el suelo de la tabla)", () => {
    const { card } = setup(0);

    expect(card).toHaveAttribute("data-ground", TRANSITIONS[0].ink);
  });

  it("el titulo y el numeral NO son encabezados: no ensucian el arbol de accesibilidad", () => {
    const { container } = setup();

    expect(container.querySelector("h1, h2, h3, h4, h5, h6")).toBeNull();
  });

  it("fuera de la transicion esta oculta", () => {
    const { card } = setup(0, 100);

    expect(card.style.visibility).toBe("hidden");
    // La cadena exacta: `Number("")` tambien da 0 y pasaria aunque no se escribiera.
    expect(card.style.opacity).toBe("0");
  });

  it("al principio de la transicion (la tinta aun no llega al centro) sigue oculta", async () => {
    const { card } = setup(0, T0_START + T0_LENGTH * 0.1);

    await waitFor(() => expect(card.style.visibility).toBe("hidden"));
  });

  it("a mitad de la transicion se ve entera", async () => {
    const { card } = setup(0, T0_START + T0_LENGTH * 0.5);

    await waitFor(() => expect(card.style.visibility).toBe("visible"));
    expect(Number(card.style.opacity)).toBe(1);
  });

  it("es reversible: al volver atras se va igual que vino", async () => {
    const { card, scrollOffset } = setup(0, T0_START + T0_LENGTH * 0.5);
    await waitFor(() => expect(card.style.visibility).toBe("visible"));

    act(() => scrollOffset.set(T0_START + T0_LENGTH * 0.05));

    await waitFor(() => expect(card.style.visibility).toBe("hidden"));
  });

  it("dibuja un subrayado de pincel con `pathLength` (el gesto firma del sitio)", () => {
    const { card } = setup();

    const stroke = card.querySelector("path.brush-path");
    expect(stroke).not.toBeNull();
    expect(stroke?.closest("svg")).toHaveAttribute("aria-hidden", "true");
  });

  it("el subrayado no se pinta mientras vale 0 (con puntas redondas dejaria dos puntos en los extremos)", async () => {
    // Visto en vivo a t=0,3: con pathLength ~0 y stroke-linecap round asoma un punto
    // en cada extremo antes de que el trazo empiece a dibujarse.
    const { card, scrollOffset } = setup(0, T0_START + T0_LENGTH * 0.28);
    const stroke = () => card.querySelector("path.brush-path") as SVGPathElement;
    // En un <path> Motion escribe `opacity` como ATRIBUTO SVG, no como estilo en linea.
    await waitFor(() => expect(stroke()).toHaveAttribute("opacity", "0"));

    act(() => scrollOffset.set(T0_START + T0_LENGTH * 0.5));

    await waitFor(() => expect(stroke()).toHaveAttribute("opacity", "1"));
  });

  it("mover el scroll NO provoca ningun render de React (va todo por MotionValues)", async () => {
    let commits = 0;
    const scrollOffset = motionValue(0);
    render(
      <Profiler id="card" onRender={() => (commits += 1)}>
        <ChapterCard index={0} spec={TRANSITIONS[0]} layout={motionValue(LAYOUT)} scrollOffset={scrollOffset} />
      </Profiler>,
    );
    const baseline = commits;

    for (let scroll = 0; scroll <= 1400; scroll += 70) act(() => scrollOffset.set(scroll));
    // Un fotograma de margen: un `setState` diferido por rAF tambien contaria.
    await act(() => new Promise<void>((resolve) => setTimeout(resolve, 50)));

    expect(commits).toBe(baseline);
  });
});
