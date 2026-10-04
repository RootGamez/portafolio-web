import fragmentSource from "./shaders/ink.frag.glsl?raw";
import vertexSource from "./shaders/ink.vert.glsl?raw";

/**
 * Renderer WebGL de la tinta (docs/PLAN_ESCENARIOS.md §6, tiers T3/T2).
 *
 * Solo sabe de GL: crear el contexto, compilar el shader, ajustar el tamano del
 * buffer y dibujar un fotograma con sus uniforms. Cuando y que dibujar lo decide
 * engine.ts. Va en el chunk perezoso: nada de esto se descarga hasta despues del
 * primer pintado.
 *
 * Cualquier fallo (sin WebGL, rasterizador por software, shader que no compila)
 * devuelve `null`: el llamador se queda con la tinta SVG (T1), que ya funciona.
 */

export type InkQuality = {
  /** Tope del devicePixelRatio del buffer (T3 = 1,5; T2 = 1). */
  readonly dprCap: number;
  /** Octavas del ruido fBm del shader (T3 = 5; T2 = 3). */
  readonly octaves: number;
};

export type Rgb = readonly [number, number, number];

/** Un fotograma, ya traducido a valores de shader (colores en 0..1). */
export type InkDrawInput = {
  readonly effect: number;
  readonly cover: number;
  readonly erase: number;
  readonly mirror: boolean;
  readonly seed: number;
  /** Paso de la trama, en px CSS. */
  readonly tonePitch: number;
  readonly ink: Rgb;
  readonly rim: Rgb;
};

export type InkRendererHooks = {
  readonly onLost: () => void;
  readonly onRestored: () => void;
  /** El contexto volvio pero el shader ya no se puede preparar: no habra mas WebGL. */
  readonly onRestoreFailed: () => void;
};

export type InkRenderer = {
  /** Tamano CSS del canvas y DPR del dispositivo: el buffer mide css × min(dpr, tope). */
  resize(cssWidth: number, cssHeight: number, devicePixelRatio: number): void;
  setQuality(quality: InkQuality): void;
  /** false si no se pudo dibujar (contexto perdido o renderer destruido). */
  draw(input: InkDrawInput): boolean;
  clear(): void;
  readonly lost: boolean;
  destroy(): void;
};

const CONTEXT_OPTIONS: WebGLContextAttributes = {
  // Un rasterizador por software iria a saltos: mejor la tinta SVG.
  failIfMajorPerformanceCaveat: true,
  alpha: true,
  premultipliedAlpha: true,
  antialias: false,
  depth: false,
  stencil: false,
  preserveDrawingBuffer: false,
  powerPreference: "low-power",
};

/** Triangulo que cubre el clip space entero: menos vertices que un quad. */
const FULLSCREEN_TRIANGLE = new Float32Array([-1, -1, 3, -1, -1, 3]);

type GpuResources = {
  readonly program: WebGLProgram;
  readonly buffer: WebGLBuffer;
  readonly locations: ReadonlyMap<UniformName, WebGLUniformLocation | null>;
};

const UNIFORMS = [
  "uResolution",
  "uEffect",
  "uCover",
  "uErase",
  "uMirror",
  "uSeed",
  "uTonePitch",
  "uOctaves",
  "uInk",
  "uRim",
] as const;

type UniformName = (typeof UNIFORMS)[number];

function compileShader(gl: WebGLRenderingContext, type: number, source: string): WebGLShader | null {
  const shader = gl.createShader(type);
  if (!shader) return null;
  gl.shaderSource(shader, source);
  gl.compileShader(shader);
  if (gl.getShaderParameter(shader, gl.COMPILE_STATUS)) return shader;
  gl.deleteShader(shader);
  return null;
}

function linkProgram(gl: WebGLRenderingContext): WebGLProgram | null {
  const vertex = compileShader(gl, gl.VERTEX_SHADER, vertexSource);
  const fragment = vertex && compileShader(gl, gl.FRAGMENT_SHADER, fragmentSource);
  const program = fragment ? gl.createProgram() : null;

  if (program && vertex && fragment) {
    gl.attachShader(program, vertex);
    gl.attachShader(program, fragment);
    gl.linkProgram(program);
  }
  // Enlazado (o no), los shaders ya no hacen falta por separado.
  if (vertex) gl.deleteShader(vertex);
  if (fragment) gl.deleteShader(fragment);
  if (!program) return null;
  if (gl.getProgramParameter(program, gl.LINK_STATUS)) return program;
  gl.deleteProgram(program);
  return null;
}

function createResources(gl: WebGLRenderingContext): GpuResources | null {
  // `fwidth()` mide los bordes de la tinta en px (iguales en todos los efectos).
  // Hay que pedirla otra vez tras restaurar el contexto: por eso va aqui.
  if (!gl.getExtension("OES_standard_derivatives")) return null;
  const program = linkProgram(gl);
  if (!program) return null;

  gl.useProgram(program);
  const buffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
  gl.bufferData(gl.ARRAY_BUFFER, FULLSCREEN_TRIANGLE, gl.STATIC_DRAW);
  const position = gl.getAttribLocation(program, "aPosition");
  gl.enableVertexAttribArray(position);
  gl.vertexAttribPointer(position, 2, gl.FLOAT, false, 0, 0);

  const locations = new Map(UNIFORMS.map((name) => [name, gl.getUniformLocation(program, name)] as const));
  return { program, buffer, locations };
}

function releaseResources(gl: WebGLRenderingContext, resources: GpuResources | null): void {
  if (!resources) return;
  gl.deleteProgram(resources.program);
  gl.deleteBuffer(resources.buffer);
}

function effectiveDpr(devicePixelRatio: number, cap: number): number {
  const dpr = Number.isFinite(devicePixelRatio) && devicePixelRatio > 0 ? devicePixelRatio : 1;
  return Math.min(dpr, cap);
}

function writeUniforms(
  gl: WebGLRenderingContext,
  at: (name: UniformName) => WebGLUniformLocation | null,
  input: InkDrawInput,
  extras: { readonly width: number; readonly height: number; readonly dpr: number; readonly octaves: number },
): void {
  gl.uniform2f(at("uResolution"), extras.width, extras.height);
  gl.uniform1f(at("uEffect"), input.effect);
  gl.uniform1f(at("uCover"), input.cover);
  gl.uniform1f(at("uErase"), input.erase);
  gl.uniform1f(at("uMirror"), input.mirror ? 1 : 0);
  gl.uniform1f(at("uSeed"), input.seed);
  gl.uniform1f(at("uTonePitch"), input.tonePitch * extras.dpr);
  gl.uniform1i(at("uOctaves"), extras.octaves);
  gl.uniform3f(at("uInk"), ...input.ink);
  gl.uniform3f(at("uRim"), ...input.rim);
}

/**
 * Escucha la perdida y la restauracion del contexto (la GPU se reinicia, el
 * sistema la reclama en segundo plano...). Devuelve la funcion que deja de escuchar.
 */
function watchContextLoss(canvas: HTMLCanvasElement, onLost: () => void, onRestored: () => void): () => void {
  const lost = (event: Event) => {
    // Sin preventDefault el navegador no intentaria restaurar el contexto.
    event.preventDefault();
    onLost();
  };
  canvas.addEventListener("webglcontextlost", lost);
  canvas.addEventListener("webglcontextrestored", onRestored);
  return () => {
    canvas.removeEventListener("webglcontextlost", lost);
    canvas.removeEventListener("webglcontextrestored", onRestored);
  };
}

/** Suelta el contexto ya, sin esperar al recolector (la GPU importa en movil). */
function releaseContext(gl: WebGLRenderingContext): void {
  gl.getExtension("WEBGL_lose_context")?.loseContext();
}

/** Estado vivo de un renderer: lo comparten los metodos y la escucha de perdida. */
type RendererState = {
  resources: GpuResources | null;
  quality: InkQuality;
  lost: boolean;
  destroyed: boolean;
  cssSize: { readonly width: number; readonly height: number; readonly devicePixelRatio: number };
};

function applySize(gl: WebGLRenderingContext, canvas: HTMLCanvasElement, state: RendererState): void {
  const dpr = effectiveDpr(state.cssSize.devicePixelRatio, state.quality.dprCap);
  canvas.width = Math.max(1, Math.round(state.cssSize.width * dpr));
  canvas.height = Math.max(1, Math.round(state.cssSize.height * dpr));
  gl.viewport(0, 0, canvas.width, canvas.height);
}

function usable(state: RendererState): GpuResources | null {
  return state.destroyed || state.lost ? null : state.resources;
}

function rendererApi(
  gl: WebGLRenderingContext,
  canvas: HTMLCanvasElement,
  state: RendererState,
  unwatch: () => void,
): InkRenderer {
  return {
    resize(width, height, devicePixelRatio) {
      state.cssSize = { width, height, devicePixelRatio };
      if (usable(state)) applySize(gl, canvas, state);
    },
    setQuality(next) {
      state.quality = next;
      if (usable(state)) applySize(gl, canvas, state);
    },
    draw(input) {
      const current = usable(state);
      if (!current) return false;
      const dpr = effectiveDpr(state.cssSize.devicePixelRatio, state.quality.dprCap);
      const at = (name: UniformName) => current.locations.get(name) ?? null;
      const extras = { width: canvas.width, height: canvas.height, dpr, octaves: state.quality.octaves };
      writeUniforms(gl, at, input, extras);
      gl.drawArrays(gl.TRIANGLES, 0, 3);
      return true;
    },
    clear() {
      if (!usable(state)) return;
      gl.clearColor(0, 0, 0, 0);
      gl.clear(gl.COLOR_BUFFER_BIT);
    },
    get lost() {
      return state.lost;
    },
    destroy() {
      if (state.destroyed) return;
      state.destroyed = true;
      unwatch();
      releaseResources(gl, state.resources);
      state.resources = null;
      releaseContext(gl);
    },
  };
}

export function createInkRenderer(
  canvas: HTMLCanvasElement,
  initialQuality: InkQuality,
  hooks: InkRendererHooks,
): InkRenderer | null {
  const gl = canvas.getContext("webgl", CONTEXT_OPTIONS);
  if (!gl) return null;

  const resources = createResources(gl);
  if (!resources) {
    releaseContext(gl);
    return null;
  }

  const state: RendererState = {
    resources,
    quality: initialQuality,
    lost: false,
    destroyed: false,
    cssSize: { width: 0, height: 0, devicePixelRatio: 1 },
  };

  const unwatch = watchContextLoss(
    canvas,
    () => {
      state.lost = true;
      state.resources = null;
      hooks.onLost();
    },
    () => {
      state.resources = createResources(gl);
      if (!state.resources) return hooks.onRestoreFailed();
      state.lost = false;
      applySize(gl, canvas, state);
      hooks.onRestored();
    },
  );

  return rendererApi(gl, canvas, state, unwatch);
}
