import { describe, expect, it } from "vitest";
import { render } from "@testing-library/react";
import { BrushEdge } from "./BrushEdge";
import { EDGES, EDGE_VIEWBOX_WIDTH } from "./edgeShapes";

/**
 * Caracterizacion del canto estatico del modo LINEAL: lo que pinta hoy. Existe
 * para poder compartir su dibujo con el frente de tinta (EdgeMass) sin cambiar
 * el aspecto del sitio clasico.
 */
const svg = (container: HTMLElement) => container.querySelector("svg") as SVGSVGElement;

describe("BrushEdge", () => {
  it("es decorativo: aria-hidden, sin foco y sin captar el puntero", () => {
    const { container } = render(<BrushEdge variant="sweep" />);

    expect(svg(container)).toHaveAttribute("aria-hidden", "true");
    expect(svg(container)).toHaveAttribute("focusable", "false");
    expect(svg(container).getAttribute("class")).toContain("pointer-events-none");
  });

  it("una variante de MASA pinta su path relleno con el color del suelo y sus gotas", () => {
    const { container } = render(<BrushEdge variant="splash" />);

    const path = container.querySelector("path") as SVGPathElement;
    expect(path).toHaveAttribute("d", EDGES.splash.d);
    expect(path).toHaveAttribute("fill", "var(--g-bg)");
    expect(container.querySelectorAll("ellipse")).toHaveLength(EDGES.splash.flecks.length);
  });

  it("`rule` NO es una masa: un trazo fino con el color de regla y sin gotas", () => {
    const { container } = render(<BrushEdge variant="rule" />);

    const path = container.querySelector("path") as SVGPathElement;
    expect(path).toHaveAttribute("fill", "none");
    expect(path).toHaveAttribute("stroke", "var(--g-rule)");
    expect(container.querySelectorAll("ellipse")).toHaveLength(0);
  });

  it("espejado: refleja el trazo en horizontal dentro del viewBox", () => {
    const { container } = render(<BrushEdge variant="dry" mirror />);

    expect(container.querySelector("g")).toHaveAttribute(
      "transform",
      `scale(-1,1) translate(-${EDGE_VIEWBOX_WIDTH},0)`,
    );
  });

  it("sin espejar no aplica ninguna transformacion", () => {
    const { container } = render(<BrushEdge variant="dry" />);

    expect(container.querySelector("g")).not.toHaveAttribute("transform");
  });

  it("invade la seccion anterior: sube su propio alto menos 1px y se estira a lo ancho", () => {
    const { container } = render(<BrushEdge variant="wash" height={120} />);

    expect(svg(container).style.height).toBe("120px");
    expect(svg(container).style.transform).toBe("translateY(-119px)");
    expect(svg(container)).toHaveAttribute("preserveAspectRatio", "none");
  });
});
