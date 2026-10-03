import { JUMP_CURTAIN_MS, JUMP_SWAP_AT } from "./config";
import { curtainProgress } from "./ink";

/** Lo unico que el runner necesita del progreso: poder escribirlo (un MotionValue sirve). */
type ProgressSink = { readonly set: (value: number) => void };

export type CurtainRunner = {
  /**
   * Abre la cortina y llama a `onCovered` cuando la pantalla ya esta cubierta: ahi es
   * donde se hace el salto, oculto tras la tinta.
   */
  readonly run: (onCovered: () => void) => void;
  /**
   * Cancela el salto pendiente si la cortina aun no ha cubierto (y la apaga). Una vez
   * cubierta el salto ya se hizo: se deja que acabe de destaparse en vez de cortarla.
   */
  readonly cancel: () => void;
  /** Detiene todo sin tocar la banda (desmontaje): sin salto fantasma. */
  readonly dispose: () => void;
};

/**
 * El motor de la cortina de tinta de un SALTO, sin React (docs/PLAN_ESCENARIOS.md §7).
 *
 * La tinta cubre (primera mitad), se hace el salto con todo tapado y la tinta se va
 * (segunda mitad). El progreso es lineal en el tiempo, asi que basta un bucle de
 * `requestAnimationFrame`: `animate()` de Motion anadia ~2,8 kB gz al JS inicial para
 * algo que no necesita curvas ni muelles.
 *
 * Interrumpible, y el ULTIMO salto manda:
 *  - un salto nuevo antes de cubrir solo cambia el destino (la cortina sigue donde iba);
 *  - uno nuevo despues de cubrir REBOBINA a "cubierto" (no a 0): la banda no se apaga
 *    entre medias, que dejaria ver un fotograma limpio del destino y la tinta
 *    reapareciendo desde abajo;
 *  - `cancel` anula el pendiente si aun no cubrio.
 */
export function createCurtainRunner(progress: ProgressSink): CurtainRunner {
  let frame: number | null = null;
  let pending: (() => void) | null = null;
  let isCovered = false;

  const stopFrame = () => {
    if (frame !== null) cancelAnimationFrame(frame);
    frame = null;
  };

  const cover = () => {
    isCovered = true;
    const jump = pending;
    pending = null;
    jump?.();
  };

  const finish = () => {
    progress.set(0);
    frame = null;
    isCovered = false;
  };

  function start(fromProgress: number) {
    // El inicio es la marca del PRIMER fotograma, no `performance.now()`: asi solo se
    // comparan marcas del mismo reloj (la de rAF puede ser anterior a la de now()).
    let startedAt: number | null = null;
    const tick = (now: number) => {
      startedAt ??= now - fromProgress * JUMP_CURTAIN_MS;
      const value = curtainProgress(now - startedAt, JUMP_CURTAIN_MS);
      progress.set(value);
      if (!isCovered && value >= JUMP_SWAP_AT) cover();
      if (value < 1) frame = requestAnimationFrame(tick);
      else finish();
    };
    frame = requestAnimationFrame(tick);
  }

  const run = (onCovered: () => void) => {
    pending = onCovered;
    if (frame !== null && !isCovered) return;

    const rewind = isCovered;
    stopFrame();
    isCovered = false;
    if (!rewind) progress.set(0);
    start(rewind ? JUMP_SWAP_AT : 0);
  };

  const cancel = () => {
    if (isCovered) return;
    stopFrame();
    pending = null;
    progress.set(0);
  };

  const dispose = () => {
    stopFrame();
    pending = null;
  };

  return { run, cancel, dispose };
}
