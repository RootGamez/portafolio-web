import { describe, expect, it } from "vitest";
import { render } from "@testing-library/react";
import { EdgeMass } from "./EdgeMass";
import { EDGES, EDGE_VIEWBOX_WIDTH } from "./edgeShapes";

/** Una masa de pintura es un trozo de SVG: se prueba dentro de un <svg>. */
function renderMass(props: Parameters<typeof EdgeMass>[0]) {
  return render(
    <svg>
      <EdgeMass {...props} />
    </svg>,
  );
}

describe("EdgeMass: la masa de pintura de un canto", () => {
  it("pinta el path de la variante relleno con el color del suelo", () => {
    const { container } = renderMass({ variant: "sweep" });

    const path = container.querySelector("path") as SVGPathElement;
    expect(path).toHaveAttribute("d", EDGES.sweep.d);
    expect(path).toHaveAttribute("fill", "var(--g-bg)");
  });

  it("pinta una gota por cada `fleck` de la variante, con su posicion y su radio", () => {
    const { container } = renderMass({ variant: "splash" });

    const drops = [...container.querySelectorAll("ellipse")];
    expect(drops).toHaveLength(EDGES.splash.flecks.length);
    const [cx, cy, rx, ry] = EDGES.splash.flecks[0];
    expect(drops[0]).toHaveAttribute("cx", String(cx));
    expect(drops[0]).toHaveAttribute("cy", String(cy));
    expect(drops[0]).toHaveAttribute("rx", String(rx));
    expect(drops[0]).toHaveAttribute("ry", String(ry));
    expect(drops[0]).toHaveAttribute("fill", "var(--g-bg)");
  });

  it("espejado, refleja todo en horizontal dentro del viewBox", () => {
    const { container } = renderMass({ variant: "tear", mirror: true });

    expect(container.querySelector("g")).toHaveAttribute(
      "transform",
      `scale(-1,1) translate(-${EDGE_VIEWBOX_WIDTH},0)`,
    );
  });

  it("sin espejar no aplica ninguna transformacion", () => {
    const { container } = renderMass({ variant: "tear" });

    expect(container.querySelector("g")).not.toHaveAttribute("transform");
  });
});
