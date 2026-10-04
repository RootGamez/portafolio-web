import "@testing-library/jest-dom/vitest";
import { afterEach, beforeEach, vi } from "vitest";
import { act, cleanup } from "@testing-library/react";

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});

/**
 * Geometria de REFERENCIA de los tests: una transicion = un visor. El largo real
 * (TRANSITION_SCREENS en config.ts) es un ajuste de ritmo que el usuario afina a
 * ojo; los tests prueban la logica del motor con numeros faciles de seguir
 * ("T0 480..1280" con un visor de 800) y no tienen que reescribirse cada vez que
 * cambia el tempo. timeline.test.ts prueba el tempo explicito y que el valor
 * REAL (vi.importActual) sea mas lento que una pantalla.
 *
 * OJO: un archivo que declare su propio vi.mock de este modulo SUSTITUYE a este y
 * debe repetir `TRANSITION_SCREENS: 1` (ver StageGeometry/StageNavigation/useJumpCurtain).
 */
vi.mock("@/lib/stage/config", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@/lib/stage/config")>()),
  TRANSITION_SCREENS: 1,
}));

/**
 * jsdom no implementa matchMedia, y el sitio entero cuelga de el:
 * usePrefersReducedMotion y useInViewVideo preguntan por
 * `prefers-reduced-motion` y por `(hover: none)`.
 *
 * Por defecto responde `false` a todo, que equivale a "escritorio, con hover,
 * sin peticion de menos movimiento". Cada test que necesite otra cosa
 * sobreescribe esta implementacion.
 */
function installMatchMedia() {
  Object.defineProperty(window, "matchMedia", {
    writable: true,
    configurable: true,
    value: vi.fn().mockImplementation((query: string) => ({
      matches: false,
      media: query,
      onchange: null,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      addListener: vi.fn(),
      removeListener: vi.fn(),
      dispatchEvent: vi.fn(),
    })),
  });
}

/**
 * jsdom tampoco trae IntersectionObserver. Este doble guarda los callbacks
 * en `observerCallbacks` para que los tests puedan disparar una interseccion
 * a mano, que es la unica forma de probar el scroll-spy y el video en vista.
 */
export const observerCallbacks: IntersectionObserverCallback[] = [];

/** Todos los observers creados, para poder disparar el que observa un elemento concreto. */
const observerInstances: MockIntersectionObserver[] = [];

class MockIntersectionObserver implements IntersectionObserver {
  readonly root = null;
  readonly rootMargin = "";
  readonly scrollMargin = "";
  readonly thresholds: readonly number[] = [];

  /** Elementos que este observer tiene en observacion ahora mismo. */
  readonly targets = new Set<Element>();
  private readonly callback: IntersectionObserverCallback;

  constructor(callback: IntersectionObserverCallback) {
    this.callback = callback;
    observerCallbacks.push(callback);
    observerInstances.push(this);
  }

  observe = vi.fn((target: Element) => {
    this.targets.add(target);
  });
  unobserve = vi.fn((target: Element) => {
    this.targets.delete(target);
  });
  disconnect = vi.fn(() => {
    this.targets.clear();
  });
  takeRecords = vi.fn(() => []);

  /** Solo para triggerIntersection. */
  fire(entries: IntersectionObserverEntry[]) {
    this.callback(entries, this);
  }
}

vi.stubGlobal("IntersectionObserver", MockIntersectionObserver);

/**
 * Dispara una interseccion sobre UN elemento, sin importar que observer lo
 * tenga. Hace falta porque Motion cachea sus observers entre tests: el
 * callback de `observerCallbacks.at(-1)` puede pertenecer a otro test y no al
 * observer que de verdad observa este elemento.
 */
export function triggerIntersection(target: Element, isIntersecting: boolean): void {
  const observer = [...observerInstances].reverse().find((candidate) => candidate.targets.has(target));
  if (!observer) throw new Error("Ningun IntersectionObserver observa ese elemento");

  const rect = target.getBoundingClientRect();
  const entry = {
    target,
    isIntersecting,
    intersectionRatio: isIntersecting ? 1 : 0,
    time: 0,
    boundingClientRect: rect,
    intersectionRect: rect,
    rootBounds: null,
  } as IntersectionObserverEntry;

  act(() => observer.fire([entry]));
}

/**
 * jsdom tampoco trae ResizeObserver, y el modo escenarios mide con el. Este
 * doble no mide nada (jsdom no tiene layout): un test fija las alturas
 * simuladas y llama a `triggerResize()` para decir "el tamano cambio".
 */
const resizeObservers = new Set<MockResizeObserver>();

class MockResizeObserver implements ResizeObserver {
  private readonly callback: ResizeObserverCallback;

  constructor(callback: ResizeObserverCallback) {
    this.callback = callback;
    resizeObservers.add(this);
  }

  /** Elementos que este observer tiene en observacion ahora mismo. */
  readonly targets = new Set<Element>();

  observe = vi.fn((target: Element) => {
    this.targets.add(target);
  });
  unobserve = vi.fn((target: Element) => {
    this.targets.delete(target);
  });
  disconnect = vi.fn(() => {
    this.targets.clear();
    resizeObservers.delete(this);
  });

  /** Solo para triggerResize. */
  fire() {
    this.callback([], this);
  }
}

vi.stubGlobal("ResizeObserver", MockResizeObserver);

/** Todos los elementos que algun ResizeObserver vivo esta observando. */
export function elementsUnderResizeObservation(): Element[] {
  return [...resizeObservers].flatMap((observer) => [...observer.targets]);
}

/** Avisa a todos los ResizeObserver vivos de que algo cambio de tamano. */
export function triggerResize(): void {
  act(() => {
    resizeObservers.forEach((observer) => observer.fire());
  });
}
installMatchMedia();

/**
 * jsdom no reproduce media: HTMLMediaElement.play lanza "Not implemented".
 * Se sustituyen por espias para poder afirmar que el video arranca con hover
 * y con foco — justo lo que el rediseno tenia que arreglar.
 *
 * Van en beforeEach y no una sola vez al cargar el modulo: el
 * `restoreAllMocks` del afterEach deja el doble sin implementacion, y
 * entonces `play()` devuelve undefined en lugar de una promesa. El codigo de
 * produccion encadena `.catch()` sobre ese valor, asi que a partir del
 * segundo test todo reventaria por un fallo del arnes, no del componente.
 * Por el mismo motivo se reinstala matchMedia aqui.
 */
beforeEach(() => {
  installMatchMedia();
  vi.spyOn(HTMLMediaElement.prototype, "play").mockResolvedValue(undefined);
  vi.spyOn(HTMLMediaElement.prototype, "pause").mockImplementation(() => {});
});
