import { Profiler, type ReactNode } from "react";
import { describe, expect, it } from "vitest";
import { act, render, screen, waitFor } from "@testing-library/react";
import { motionValue } from "motion/react";
import { StageContext, type StageContextValue } from "@/components/stage/StageContext";
import { ScrubDraw } from "./ScrubDraw";
import { ScrubErase } from "./ScrubErase";
import { ScrubParallax } from "./ScrubParallax";
import { ScrubReveal } from "./ScrubReveal";

/** Un escenario del deck con su intro y su progreso controlados a mano (ambos en 0). */
function renderInDeck(ui: ReactNode) {
  const progress = motionValue(0);
  const intro = motionValue(0);
  const stage: StageContextValue = { mode: "deck", index: 2, isActive: true, isNear: true, progress, intro };
  const utils = render(<StageContext value={stage}>{ui}</StageContext>);
  return { ...utils, progress, intro };
}

const PATH = "M0 10 C 40 0, 80 20, 120 10";

describe("Scrub* en modo lineal: el sitio clasico, sin rastro de animacion", () => {
  it("ScrubReveal pinta su contenido sin opacidad ni transformacion en linea", () => {
    render(<ScrubReveal range={[0, 0.3]}>Hola</ScrubReveal>);

    const node = screen.getByText("Hola");
    expect(node.style.opacity).toBe("");
    expect(node.style.transform).toBe("");
  });

  it("ScrubReveal respeta la etiqueta pedida (li dentro de una lista)", () => {
    render(
      <ul>
        <ScrubReveal as="li" range={[0, 1]}>
          item
        </ScrubReveal>
      </ul>,
    );

    expect(screen.getByText("item").tagName).toBe("LI");
  });

  it("ScrubDraw pinta el trazo entero: sin pathLength ni opacidad", () => {
    const { container } = render(
      <svg>
        <ScrubDraw range={[0, 1]} d={PATH} className="brush-path" />
      </svg>,
    );

    const path = container.querySelector("path") as SVGPathElement;
    expect(path).toHaveAttribute("d", PATH);
    expect(path).toHaveClass("brush-path");
    expect(path).not.toHaveAttribute("opacity");
    expect(path).not.toHaveAttribute("stroke-dasharray");
  });

  it("ScrubParallax no desplaza nada", () => {
    render(<ScrubParallax distance={60}>foto</ScrubParallax>);

    expect(screen.getByText("foto").style.transform).toBe("");
  });

  it("ScrubErase no borra nada: sin mascara", () => {
    render(<ScrubErase range={[0, 1]}>Anthony</ScrubErase>);

    expect(screen.getByText("Anthony").style.maskImage).toBe("");
  });
});

describe("ScrubReveal en el deck", () => {
  it("por defecto sigue la INTRO: antes de su tramo esta oculto, al recorrerlo aparece y es reversible", async () => {
    const { intro } = renderInDeck(<ScrubReveal range={[0.2, 0.4]}>Hola</ScrubReveal>);
    const node = screen.getByText("Hola");
    // La cadena exacta: `Number("")` tambien da 0 y pasaria aunque no se escribiera.
    expect(node.style.opacity).toBe("0");

    act(() => intro.set(0.5));
    await waitFor(() => expect(node.style.opacity).toBe("1"));

    act(() => intro.set(0.1));
    await waitFor(() => expect(node.style.opacity).toBe("0"));
  });

  it("con over=\"stage\" sigue el progreso del escenario entero y no la intro", async () => {
    const { intro, progress } = renderInDeck(
      <ScrubReveal over="stage" range={[0.2, 0.4]}>
        Hola
      </ScrubReveal>,
    );
    const node = screen.getByText("Hola");

    act(() => intro.set(1));
    await act(() => new Promise<void>((resolve) => setTimeout(resolve, 30)));
    expect(node.style.opacity).toBe("0");

    act(() => progress.set(1));
    await waitFor(() => expect(node.style.opacity).toBe("1"));
  });

  it("si el teclado enfoca algo dentro, se muestra aunque el scroll no haya llegado (foco visible, WCAG 2.4.7)", async () => {
    renderInDeck(
      <ScrubReveal range={[0.6, 0.9]}>
        <a href="#x">Escribeme</a>
      </ScrubReveal>,
    );
    const link = screen.getByRole("link", { name: "Escribeme" });
    const wrapper = link.parentElement as HTMLElement;
    expect(wrapper.style.opacity).toBe("0");

    act(() => link.focus());
    await waitFor(() => expect(wrapper.style.opacity).toBe("1"));

    act(() => link.blur());
    await waitFor(() => expect(wrapper.style.opacity).toBe("0"));
  });
});

describe("ScrubDraw en el deck", () => {
  it("no se pinta al principio de la intro y se dibuja entero al acabar su tramo", async () => {
    const { container, intro } = renderInDeck(
      <svg>
        <ScrubDraw range={[0, 0.5]} d={PATH} />
      </svg>,
    );
    const path = () => container.querySelector("path") as SVGPathElement;
    // En un <path> Motion escribe `opacity` como ATRIBUTO SVG, no como estilo en linea.
    await waitFor(() => expect(path()).toHaveAttribute("opacity", "0"));

    act(() => intro.set(0.5));

    await waitFor(() => expect(path()).toHaveAttribute("opacity", "1"));
  });
});

describe("ScrubParallax en el deck", () => {
  it("por defecto sigue el escenario entero: sube `distance` px al acabarlo", async () => {
    const { progress } = renderInDeck(<ScrubParallax distance={60}>foto</ScrubParallax>);
    const node = screen.getByText("foto");

    act(() => progress.set(1));

    await waitFor(() => expect(node.style.transform).toContain("translateY(-60px)"));
  });

  it("con over=\"intro\" sigue la intro", async () => {
    const { intro } = renderInDeck(
      <ScrubParallax over="intro" distance={30}>
        foto
      </ScrubParallax>,
    );
    const node = screen.getByText("foto");

    act(() => intro.set(1));

    await waitFor(() => expect(node.style.transform).toContain("translateY(-30px)"));
  });
});

describe("ScrubErase en el deck", () => {
  it("al principio no lleva mascara; al acabar su tramo esta borrado; al volver, reaparece", async () => {
    const { intro } = renderInDeck(<ScrubErase range={[0.5, 0.9]}>Anthony</ScrubErase>);
    const node = screen.getByText("Anthony");
    await waitFor(() => expect(node.style.maskImage).toBe("none"));

    act(() => intro.set(1));
    await waitFor(() => expect(node.style.maskImage).toContain("transparent 100%"));

    act(() => intro.set(0));
    await waitFor(() => expect(node.style.maskImage).toBe("none"));
  });

  it("si el teclado enfoca algo dentro, se ve entero aunque el scroll lo haya borrado", async () => {
    const { intro } = renderInDeck(
      <ScrubErase range={[0, 0.5]}>
        <a href="#x">Anthony</a>
      </ScrubErase>,
    );
    const link = screen.getByRole("link", { name: "Anthony" });
    const wrapper = link.parentElement as HTMLElement;
    act(() => intro.set(1));
    await waitFor(() => expect(wrapper.style.maskImage).toContain("transparent 100%"));

    act(() => link.focus());

    await waitFor(() => expect(wrapper.style.maskImage).toBe("none"));
  });
});

describe("rendimiento", () => {
  it("mover la intro y el progreso NO provoca ningun render de React (va todo por MotionValues)", async () => {
    let commits = 0;
    const { progress, intro } = renderInDeck(
      <Profiler id="scrub" onRender={() => (commits += 1)}>
        <ScrubReveal range={[0, 0.5]}>a</ScrubReveal>
        <ScrubParallax distance={40}>b</ScrubParallax>
        <ScrubErase range={[0.5, 1]}>c</ScrubErase>
        <svg>
          <ScrubDraw range={[0.2, 0.8]} d={PATH} />
        </svg>
      </Profiler>,
    );
    const baseline = commits;

    for (let p = 0; p <= 1; p += 0.05) {
      act(() => {
        progress.set(p);
        intro.set(p);
      });
    }
    // Un fotograma de margen: un `setState` diferido por rAF tambien contaria.
    await act(() => new Promise<void>((resolve) => setTimeout(resolve, 50)));

    expect(commits).toBe(baseline);
  });
});
