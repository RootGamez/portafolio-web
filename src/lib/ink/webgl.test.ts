import { describe, expect, it, vi } from "vitest";
import { canvasWithGL, createFakeGL, type FakeGL } from "@/test/fakeWebGL";
import { createInkRenderer, type InkDrawInput, type InkQuality } from "./webgl";

const HIGH: InkQuality = { dprCap: 1.5, octaves: 5 };
const LOW: InkQuality = { dprCap: 1, octaves: 3 };

const INPUT: InkDrawInput = {
  effect: 4,
  cover: 0.25,
  erase: 0,
  mirror: true,
  seed: 3,
  tonePitch: 8,
  ink: [0.1, 0.2, 0.3],
  rim: [0.4, 0.5, 0.6],
};

function setup(quality: InkQuality = HIGH, gl: FakeGL | null = createFakeGL()) {
  const canvas = canvasWithGL(gl);
  const hooks = { onLost: vi.fn(), onRestored: vi.fn() };
  const renderer = createInkRenderer(canvas, quality, hooks);
  return { canvas, gl: gl as FakeGL, hooks, renderer };
}

function loseContext(canvas: HTMLCanvasElement): Event {
  const event = new Event("webglcontextlost", { cancelable: true });
  canvas.dispatchEvent(event);
  return event;
}

describe("createInkRenderer: contexto", () => {
  it("pide WebGL rechazando el rasterizador por software y sin buffers que no usa", () => {
    const { canvas } = setup();

    expect(canvas.getContext).toHaveBeenCalledWith(
      "webgl",
      expect.objectContaining({
        failIfMajorPerformanceCaveat: true,
        premultipliedAlpha: true,
        antialias: false,
        depth: false,
        stencil: false,
      }),
    );
  });

  it("sin WebGL (o con un rasterizador lento) devuelve null: el llamador se queda en SVG", () => {
    expect(setup(HIGH, null).renderer).toBeNull();
  });

  it("sin derivadas (OES_standard_derivatives: bordes medidos en px) devuelve null", () => {
    const gl = createFakeGL();
    gl.failures.derivatives = true;

    expect(setup(HIGH, gl).renderer).toBeNull();
    expect(gl.createProgram).not.toHaveBeenCalled();
  });

  it("si un shader no compila devuelve null y borra lo creado", () => {
    const gl = createFakeGL();
    gl.failures.compile = true;

    const { renderer } = setup(HIGH, gl);

    expect(renderer).toBeNull();
    expect(gl.deleteShader).toHaveBeenCalled();
  });

  it("si el programa no enlaza devuelve null y borra el programa", () => {
    const gl = createFakeGL();
    gl.failures.link = true;

    const { renderer } = setup(HIGH, gl);

    expect(renderer).toBeNull();
    expect(gl.deleteProgram).toHaveBeenCalled();
  });
});

describe("createInkRenderer: tamano", () => {
  it("dimensiona el buffer con el DPR recortado al tope de la calidad", () => {
    const { canvas, gl, renderer } = setup(HIGH);

    renderer?.resize(1000, 600, 2);

    expect([canvas.width, canvas.height]).toEqual([1500, 900]);
    expect(gl.viewport).toHaveBeenLastCalledWith(0, 0, 1500, 900);
  });

  it("no sube un DPR menor que el tope", () => {
    const { canvas, renderer } = setup(HIGH);

    renderer?.resize(1000, 600, 1);

    expect([canvas.width, canvas.height]).toEqual([1000, 600]);
  });

  it("un DPR no valido cuenta como 1 y el buffer nunca mide 0", () => {
    const { canvas, renderer } = setup(HIGH);

    renderer?.resize(0, 0, Number.NaN);

    expect([canvas.width, canvas.height]).toEqual([1, 1]);
  });

  it("al bajar la calidad redimensiona con el tope nuevo sin esperar a otro resize", () => {
    const { canvas, renderer } = setup(HIGH);
    renderer?.resize(1000, 600, 2);

    renderer?.setQuality(LOW);

    expect([canvas.width, canvas.height]).toEqual([1000, 600]);
  });
});

describe("createInkRenderer: dibujo", () => {
  it("dibuja un triangulo a pantalla completa con los uniforms del fotograma", () => {
    const { gl, renderer } = setup(HIGH);
    renderer?.resize(1000, 600, 2);

    expect(renderer?.draw(INPUT)).toBe(true);

    expect(gl.drawArrays).toHaveBeenCalledWith(gl.TRIANGLES, 0, 3);
    expect(gl.uniforms.get("uEffect")).toEqual([4]);
    expect(gl.uniforms.get("uCover")).toEqual([0.25]);
    expect(gl.uniforms.get("uErase")).toEqual([0]);
    expect(gl.uniforms.get("uMirror")).toEqual([1]);
    expect(gl.uniforms.get("uSeed")).toEqual([3]);
    expect(gl.uniforms.get("uInk")).toEqual([0.1, 0.2, 0.3]);
    expect(gl.uniforms.get("uRim")).toEqual([0.4, 0.5, 0.6]);
    expect(gl.uniforms.get("uResolution")).toEqual([1500, 900]);
  });

  it("la trama se escala al DPR efectivo: sus px son px CSS", () => {
    const { gl, renderer } = setup(HIGH);
    renderer?.resize(1000, 600, 2);

    renderer?.draw(INPUT);

    expect(gl.uniforms.get("uTonePitch")).toEqual([8 * 1.5]);
  });

  it("las octavas del ruido salen de la calidad (T3 = 5, T2 = 3)", () => {
    const { gl, renderer } = setup(HIGH);
    renderer?.draw(INPUT);
    expect(gl.uniforms.get("uOctaves")).toEqual([5]);

    renderer?.setQuality(LOW);
    renderer?.draw(INPUT);
    expect(gl.uniforms.get("uOctaves")).toEqual([3]);
  });

  it("clear() deja el canvas transparente", () => {
    const { gl, renderer } = setup(HIGH);

    renderer?.clear();

    expect(gl.clearColor).toHaveBeenLastCalledWith(0, 0, 0, 0);
    expect(gl.clear).toHaveBeenCalledWith(gl.COLOR_BUFFER_BIT);
  });
});

describe("createInkRenderer: perdida del contexto", () => {
  it("al perder el contexto pide restaurarlo (preventDefault) y avisa", () => {
    const { canvas, hooks, renderer } = setup();

    const event = loseContext(canvas);

    expect(event.defaultPrevented).toBe(true);
    expect(renderer?.lost).toBe(true);
    expect(hooks.onLost).toHaveBeenCalledTimes(1);
  });

  it("sin contexto no dibuja ni limpia (devuelve false)", () => {
    const { canvas, gl, renderer } = setup();
    loseContext(canvas);

    expect(renderer?.draw(INPUT)).toBe(false);
    renderer?.clear();

    expect(gl.drawArrays).not.toHaveBeenCalled();
    expect(gl.clear).not.toHaveBeenCalled();
  });

  it("al restaurarse rehace el programa y el buffer, recupera el tamano y vuelve a dibujar", () => {
    const { canvas, gl, hooks, renderer } = setup();
    renderer?.resize(1000, 600, 2);
    loseContext(canvas);

    canvas.dispatchEvent(new Event("webglcontextrestored"));

    expect(gl.createProgram).toHaveBeenCalledTimes(2);
    expect(gl.createBuffer).toHaveBeenCalledTimes(2);
    expect(gl.viewport).toHaveBeenLastCalledWith(0, 0, 1500, 900);
    expect(renderer?.lost).toBe(false);
    expect(hooks.onRestored).toHaveBeenCalledTimes(1);
    expect(renderer?.draw(INPUT)).toBe(true);
  });

  it("si al restaurar el programa ya no compila, sigue perdido y no avisa de restaurado", () => {
    const { canvas, gl, hooks, renderer } = setup();
    loseContext(canvas);
    gl.failures.compile = true;

    canvas.dispatchEvent(new Event("webglcontextrestored"));

    expect(renderer?.lost).toBe(true);
    expect(hooks.onRestored).not.toHaveBeenCalled();
  });
});

describe("createInkRenderer: destroy", () => {
  it("libera la GPU y deja de escuchar al canvas", () => {
    const { canvas, gl, hooks, renderer } = setup();

    renderer?.destroy();
    loseContext(canvas);

    expect(gl.deleteProgram).toHaveBeenCalled();
    expect(gl.deleteBuffer).toHaveBeenCalled();
    expect(gl.loseContext).toHaveBeenCalledTimes(1);
    expect(hooks.onLost).not.toHaveBeenCalled();
  });

  it("despues de destroy no dibuja", () => {
    const { gl, renderer } = setup();

    renderer?.destroy();

    expect(renderer?.draw(INPUT)).toBe(false);
    expect(gl.drawArrays).not.toHaveBeenCalled();
  });
});
