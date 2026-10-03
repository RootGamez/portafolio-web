/**
 * Punto de entrada del chunk perezoso de la tinta WebGL: lo que mount.ts carga con
 * `import()` cuando el navegador queda en reposo. Todo el GL (renderer, motor,
 * shaders y lectura de la paleta) cuelga de aqui y no del bundle inicial.
 */
export { createInkEngine } from "./engine";
export { readInkPalette } from "./palette";
