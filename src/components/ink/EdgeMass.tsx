import { EDGES, EDGE_VIEWBOX_WIDTH, type EdgeVariant } from "./edgeShapes";

type Props = {
  /** Una forma de MASA: `rule` no lo es (es un trazo fino y no tiene path de relleno). */
  readonly variant: Exclude<EdgeVariant, "rule">;
  /** Espeja la forma en horizontal dentro de su viewBox. */
  readonly mirror?: boolean;
};

/**
 * La masa de pintura de un canto: su path relleno y las gotas sueltas que deja el
 * pincel. Se rellena con el color del suelo (`--g-bg`) que haya por encima en el
 * arbol, asi que quien lo use decide el color con `data-ground`.
 *
 * Es un fragmento de SVG (un `<g>`): va dentro de un `<svg viewBox="0 0 1440 100">`.
 * Lo comparten el canto estatico del modo lineal (BrushEdge) y el frente de tinta
 * del modo escenarios (InkOverlay), asi las dos formas de pintar la frontera
 * salen de la misma fuente.
 */
export function EdgeMass({ variant, mirror = false }: Props) {
  const edge = EDGES[variant];
  const transform = mirror ? `scale(-1,1) translate(-${EDGE_VIEWBOX_WIDTH},0)` : undefined;

  return (
    <g transform={transform}>
      <path d={edge.d} fill="var(--g-bg)" />
      {edge.flecks.map(([cx, cy, rx, ry]) => (
        <ellipse key={`${cx}-${cy}`} cx={cx} cy={cy} rx={rx} ry={ry} fill="var(--g-bg)" />
      ))}
    </g>
  );
}
