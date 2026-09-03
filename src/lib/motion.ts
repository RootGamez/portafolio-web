/**
 * Las dos constantes de movimiento del sistema. Vivian copiadas a mano en once
 * archivos, con dos tipados distintos (`as const` y anotacion explicita) para
 * la misma curva: cualquier ajuste habia que perseguirlo por todo src/.
 */

/**
 * La curva de entrada. Es EXACTAMENTE la misma `--ease-ink` que declara
 * src/styles/app.css: lo que se anima con Motion y lo que se anima con
 * `transition` de CSS tienen que salir con el mismo gesto, o el sitio se
 * mueve de dos maneras distintas.
 *
 * Va tipada como tupla y no como `number[]`: Motion espera exactamente cuatro
 * numeros para una bezier cubica.
 */
export const EASE_INK: readonly [number, number, number, number] = [0.22, 1, 0.36, 1];

/**
 * Retardo por elemento en una secuencia. 40ms es el valor de
 * docs/DESIGN_SYSTEM.md §7 ("Stagger de paneles") y de §10, que lo respalda
 * con `ux-guidelines` §7 `stagger-sequence` (30–50ms).
 */
export const STAGGER = 0.04;
