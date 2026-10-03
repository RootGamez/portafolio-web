import { vi } from "vitest";

/**
 * Doble de WebGLRenderingContext para jsdom, que no trae WebGL (su `getContext`
 * devuelve null o avisa de "not implemented"). Implementa solo lo que usa
 * lib/ink/webgl.ts y apunta lo que importa a los tests: los uniforms escritos,
 * los dibujos y los recursos creados y borrados.
 *
 * No pinta nada: lo que se ve se comprueba en el navegador real (§13 del plan).
 */
export type FakeGL = WebGLRenderingContext & {
  /** Ultimo valor escrito en cada uniform, por nombre. */
  readonly uniforms: Map<string, readonly number[]>;
  /** Ajustes de fallo: un test los cambia antes de crear el renderer. */
  readonly failures: { compile: boolean; link: boolean; derivatives: boolean };
  readonly loseContext: ReturnType<typeof vi.fn>;
};

type Named = { readonly name: string };

const CONSTANTS = {
  VERTEX_SHADER: 0x8b31,
  FRAGMENT_SHADER: 0x8b30,
  COMPILE_STATUS: 0x8b81,
  LINK_STATUS: 0x8b82,
  ARRAY_BUFFER: 0x8892,
  STATIC_DRAW: 0x88e4,
  FLOAT: 0x1406,
  TRIANGLES: 0x0004,
  COLOR_BUFFER_BIT: 0x4000,
  BLEND: 0x0be2,
  ONE: 1,
  ONE_MINUS_SRC_ALPHA: 0x0303,
};

export function createFakeGL(): FakeGL {
  const uniforms = new Map<string, readonly number[]>();
  const failures = { compile: false, link: false, derivatives: false };
  const loseContext = vi.fn();
  const writeUniform = (location: Named | null, ...values: number[]) => {
    if (location) uniforms.set(location.name, values);
  };

  const gl = {
    ...CONSTANTS,
    uniforms,
    failures,
    loseContext,
    createShader: vi.fn((type: number) => ({ type })),
    shaderSource: vi.fn(),
    compileShader: vi.fn(),
    getShaderParameter: vi.fn(() => !failures.compile),
    getShaderInfoLog: vi.fn(() => "error de compilacion simulado"),
    deleteShader: vi.fn(),
    createProgram: vi.fn(() => ({})),
    attachShader: vi.fn(),
    linkProgram: vi.fn(),
    getProgramParameter: vi.fn(() => !failures.link),
    getProgramInfoLog: vi.fn(() => "error de enlazado simulado"),
    deleteProgram: vi.fn(),
    useProgram: vi.fn(),
    createBuffer: vi.fn(() => ({})),
    deleteBuffer: vi.fn(),
    bindBuffer: vi.fn(),
    bufferData: vi.fn(),
    getAttribLocation: vi.fn(() => 0),
    enableVertexAttribArray: vi.fn(),
    vertexAttribPointer: vi.fn(),
    getUniformLocation: vi.fn((_program: unknown, name: string): Named => ({ name })),
    uniform1f: vi.fn(writeUniform),
    uniform2f: vi.fn(writeUniform),
    uniform3f: vi.fn(writeUniform),
    uniform1i: vi.fn(writeUniform),
    viewport: vi.fn(),
    clearColor: vi.fn(),
    clear: vi.fn(),
    enable: vi.fn(),
    blendFunc: vi.fn(),
    drawArrays: vi.fn(),
    isContextLost: vi.fn(() => false),
    getExtension: vi.fn((name: string) => {
      if (name === "WEBGL_lose_context") return { loseContext };
      if (name === "OES_standard_derivatives") return failures.derivatives ? null : {};
      return null;
    }),
  };

  return gl as unknown as FakeGL;
}

/** Un canvas cuyo `getContext("webgl")` devuelve `gl` (o null para simular "sin WebGL"). */
export function canvasWithGL(gl: FakeGL | null): HTMLCanvasElement {
  const canvas = document.createElement("canvas");
  canvas.getContext = vi.fn(() => gl) as unknown as HTMLCanvasElement["getContext"];
  return canvas;
}
