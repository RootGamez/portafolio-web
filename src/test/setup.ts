import "@testing-library/jest-dom/vitest";
import { afterEach, beforeEach, vi } from "vitest";
import { cleanup } from "@testing-library/react";

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});

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

class MockIntersectionObserver implements IntersectionObserver {
  readonly root = null;
  readonly rootMargin = "";
  readonly scrollMargin = "";
  readonly thresholds: readonly number[] = [];

  constructor(callback: IntersectionObserverCallback) {
    observerCallbacks.push(callback);
  }

  observe = vi.fn();
  unobserve = vi.fn();
  disconnect = vi.fn();
  takeRecords = vi.fn(() => []);
}

vi.stubGlobal("IntersectionObserver", MockIntersectionObserver);
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
