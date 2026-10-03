import { vi } from "vitest";

/**
 * Geometria simulada del modo escenarios: jsdom no tiene layout, asi que
 * `clientHeight` y `offsetHeight` valen siempre 0. Con un visor de 800px la
 * linea de tiempo de este escenario de prueba es la misma que la de
 * src/lib/stage/timeline.test.ts:
 *
 *   E0 (600)  0 -> 480 · T0 480 -> 1280 · E1 (1400) 1280 -> 2360
 *   T1 2360 -> 3160 · E2 (800) 3160 -> 3640 · pista = 3640 + 800 = 4440
 */
export const VISOR = 800;
export const HEIGHTS = [600, 1400, 800] as const;

/**
 * Una escena de prueba: un encabezado y un boton. La altura simulada vive en el
 * DOM (`data-height`): `offsetHeight` del envoltorio mira a este hijo, y un test
 * puede cambiarla con setAttribute para simular un redimensionado.
 */
export function Scene({
  id,
  height,
  hiddenHeading = false,
}: {
  readonly id: string;
  readonly height: number;
  /** Como "Hablemos" y "Fin": el unico h2 es `sr-only` y va DESPUES del contenido. */
  readonly hiddenHeading?: boolean;
}) {
  return (
    <section id={id} data-height={height}>
      {!hiddenHeading && <h2>{`titulo ${id}`}</h2>}
      <button type="button">{`boton ${id}`}</button>
      {hiddenHeading && <h2 className="sr-only">{`titulo ${id}`}</h2>}
    </section>
  );
}

const GROUNDS = ["washi", "sumi", "kin"] as const;

export const STAGES = ["uno", "dos", "tres"].map((slug, index) => ({
  slug,
  ground: GROUNDS[index],
  node: <Scene id={slug} height={HEIGHTS[index]} />,
}));

/** El original, capturado ANTES de cualquier espia: re-espiar no debe encadenarse a un doble. */
const realRect = Element.prototype.getBoundingClientRect;

type GeometryOptions = {
  /** Donde esta el tope de la pista en el DOCUMENTO (una cabecera encima la empuja). */
  readonly trackTop?: number;
  /** Alto de `100lvh` (viewport grande, con la barra del navegador replegada). 0 = sin soporte. */
  readonly lvh?: number;
};

/**
 * Sustituye las alturas de jsdom por las simuladas. Se deshace con vi.restoreAllMocks().
 *
 * Tambien hace que la pista (`[data-stage-track]`) tenga un `getBoundingClientRect`
 * COHERENTE con el scroll simulado: su tope esta en el documento en `trackTop`
 * (0 por defecto), asi que en ventana vale `trackTop - window.scrollY`. Sin esto
 * jsdom devuelve siempre 0 aunque `window.scrollY` valga 2560, y el origen de la
 * pista sale contaminado.
 */
export function stubStageGeometry({ trackTop = 0, lvh = 0 }: GeometryOptions = {}): void {
  vi.spyOn(Element.prototype, "getBoundingClientRect").mockImplementation(function (
    this: Element,
  ) {
    if (this.hasAttribute("data-stage-visor")) {
      return { x: 0, y: 0, top: 0, left: 0, right: 0, bottom: VISOR, width: 0, height: VISOR, toJSON: () => ({}) } as DOMRect;
    }
    if (!this.hasAttribute("data-stage-track")) return realRect.call(this);
    const top = trackTop - window.scrollY;
    return {
      x: 0,
      y: top,
      top,
      left: 0,
      right: 0,
      bottom: top,
      width: 0,
      height: 0,
      toJSON: () => ({}),
    } as DOMRect;
  });

  vi.spyOn(Element.prototype, "clientHeight", "get").mockImplementation(function (this: Element) {
    return this.hasAttribute("data-stage-visor") ? VISOR : 0;
  });
  vi.spyOn(HTMLElement.prototype, "offsetHeight", "get").mockImplementation(function (
    this: HTMLElement,
  ) {
    if (this.hasAttribute("data-stage-lvh")) return lvh;
    if (!this.hasAttribute("data-stage-content")) return 0;
    return Number(this.firstElementChild?.getAttribute("data-height") ?? 0);
  });
}
