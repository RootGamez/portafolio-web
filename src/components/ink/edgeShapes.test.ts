import { describe, expect, it } from "vitest";
import { EDGES, EDGE_VIEWBOX_HEIGHT, EDGE_VIEWBOX_WIDTH, type EdgeVariant } from "./edgeShapes";

const VARIANTS = Object.keys(EDGES) as EdgeVariant[];
const MASS_VARIANTS = VARIANTS.filter((variant) => variant !== "rule");

/**
 * Invariantes de las formas de canto. Las comentaba BrushEdge.tsx en prosa
 * ("cierra SIEMPRE por abajo"); ahora que el overlay de tinta las reutiliza,
 * se comprueban para que un path nuevo no las rompa en silencio.
 */
describe("EDGES", () => {
  it("define las seis variantes del sistema", () => {
    expect([...VARIANTS].sort()).toEqual(["dry", "rule", "splash", "sweep", "tear", "wash"]);
  });

  it.each(MASS_VARIANTS)("%s es una MASA de pintura: cierra por abajo con L1440,100 L0,100 Z", (variant) => {
    expect(EDGES[variant].d.endsWith("L1440,100 L0,100 Z")).toBe(true);
  });

  it.each(MASS_VARIANTS)("%s empieza en el borde izquierdo y llega al borde derecho del viewBox", (variant) => {
    const { d } = EDGES[variant];
    expect(d.startsWith("M0,")).toBe(true);
    expect(d).toMatch(new RegExp(`${EDGE_VIEWBOX_WIDTH},\\d+ L${EDGE_VIEWBOX_WIDTH},`));
  });

  it.each(MASS_VARIANTS)("%s tiene gotas sueltas dentro del viewBox y con radios positivos", (variant) => {
    EDGES[variant].flecks.forEach(([cx, cy, rx, ry]) => {
      expect(cx).toBeGreaterThanOrEqual(0);
      expect(cx).toBeLessThanOrEqual(EDGE_VIEWBOX_WIDTH);
      expect(cy).toBeGreaterThanOrEqual(0);
      expect(cy).toBeLessThanOrEqual(EDGE_VIEWBOX_HEIGHT);
      expect(rx).toBeGreaterThan(0);
      expect(ry).toBeGreaterThan(0);
    });
  });

  it("rule NO es una masa: no tiene path de relleno ni gotas (es un trazo fino)", () => {
    expect(EDGES.rule.d).toBe("");
    expect(EDGES.rule.flecks).toEqual([]);
  });

  it("el viewBox es el de BrushEdge: 1440x100", () => {
    expect([EDGE_VIEWBOX_WIDTH, EDGE_VIEWBOX_HEIGHT]).toEqual([1440, 100]);
  });
});
