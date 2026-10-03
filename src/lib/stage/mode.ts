import { MOTION_OFF_VALUE, MOTION_STORAGE_KEY } from "./config";

/**
 * Que modo pinta el sitio (docs/PLAN_ESCENARIOS.md §6):
 *   - "deck":   escenarios `sticky` con transiciones de tinta ligadas al scroll;
 *   - "linear": el documento clasico, todo visible. Es tambien el fallback.
 *
 * La decision es una funcion PURA de cuatro entradas, para poder probarla sin
 * navegador. El hook (useDeckMode) solo se ocupa de leer las entradas.
 */
export type DeckMode = "deck" | "linear";

export type DeckInputs = {
  /** `prefers-reduced-motion: reduce`. Manda sobre todo lo demas. */
  readonly prefersReducedMotion: boolean;
  /** `forced-colors: active` (alto contraste de Windows). */
  readonly forcedColors: boolean;
  /** El usuario pulso "Modo simple" (se recuerda en localStorage). */
  readonly userOptOut: boolean;
  /** El navegador soporta `position: sticky`. */
  readonly supportsSticky: boolean;
};

/** Lo que decide si el modo escenarios es POSIBLE, sin contar la eleccion del usuario. */
export type EligibilityInputs = Omit<DeckInputs, "userOptOut"> & {
  readonly userOptOut?: boolean;
};

/**
 * ¿Puede haber escenarios en este navegador y con estas preferencias? Es lo que
 * decide si se muestra el interruptor "Modo simple": si reduced-motion ya
 * fuerza lo lineal, un interruptor que no cambia nada solo confundiria.
 */
export function isDeckEligible(inputs: EligibilityInputs): boolean {
  return !inputs.prefersReducedMotion && !inputs.forcedColors && inputs.supportsSticky;
}

/** Basta UNA razon para caer a lineal. */
export function resolveDeckMode(inputs: DeckInputs): DeckMode {
  return isDeckEligible(inputs) && !inputs.userOptOut ? "deck" : "linear";
}

type ReadableStorage = Pick<Storage, "getItem">;
type WritableStorage = Pick<Storage, "setItem" | "removeItem">;

/**
 * `window.localStorage` puede lanzar con solo leerlo (SecurityError con los
 * datos del sitio bloqueados), asi que hasta el acceso va protegido.
 */
export function getLocalStorage(): Storage | null {
  try {
    return typeof window === "undefined" ? null : window.localStorage;
  } catch {
    return null;
  }
}

/** ¿Pidio el usuario "Modo simple"? Sin almacenamiento o si falla, se asume que no. */
export function readMotionOptOut(storage: ReadableStorage | null): boolean {
  if (!storage) return false;
  try {
    return storage.getItem(MOTION_STORAGE_KEY) === MOTION_OFF_VALUE;
  } catch {
    return false;
  }
}

/**
 * Recuerda (o borra) la eleccion. Si el almacenamiento no esta disponible no es
 * un error del usuario ni de la app: la eleccion sigue valiendo durante la
 * sesion (vive en el estado de React) y simplemente no se recuerda al volver.
 */
export function writeMotionOptOut(storage: WritableStorage | null, optOut: boolean): void {
  if (!storage) return;
  try {
    if (optOut) storage.setItem(MOTION_STORAGE_KEY, MOTION_OFF_VALUE);
    else storage.removeItem(MOTION_STORAGE_KEY);
  } catch {
    // Persistencia no disponible (modo privado, cuota): ver nota de la funcion.
  }
}

type CssApi = Pick<typeof CSS, "supports">;

/**
 * `CSS.supports('position', 'sticky')`. Si no hay API de CSS no se puede
 * asegurar nada y se prefiere el modo lineal, que funciona en todas partes.
 */
export function supportsSticky(css: CssApi | undefined): boolean {
  return css?.supports?.("position", "sticky") === true;
}

/** Version con el `CSS` global del navegador. */
export function detectStickySupport(): boolean {
  return supportsSticky(typeof CSS === "undefined" ? undefined : CSS);
}
