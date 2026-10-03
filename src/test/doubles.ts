/**
 * Dobles de navegador reutilizables en los tests del modo escenarios.
 *
 * El `matchMedia` de src/test/setup.ts responde siempre `false` y no deja
 * disparar cambios; el modo escenarios depende justo de eso (reduced-motion,
 * forced-colors, cambios en caliente), asi que aqui hay uno CONTROLABLE.
 */

type Listener = (event: MediaQueryListEvent) => void;

export type MatchMediaControl = {
  /** Cambia una consulta y avisa a quienes la escuchan. */
  readonly change: (query: string, matches: boolean) => void;
  readonly listenerCount: (query: string) => number;
};

/** Instala un `window.matchMedia` controlable. `initial` fija el valor de cada consulta. */
export function installMatchMedia(initial: Record<string, boolean> = {}): MatchMediaControl {
  const state: Record<string, boolean> = { ...initial };
  const listeners = new Map<string, Set<Listener>>();

  Object.defineProperty(window, "matchMedia", {
    writable: true,
    configurable: true,
    value: (query: string) => ({
      get matches() {
        return state[query] ?? false;
      },
      media: query,
      onchange: null,
      addEventListener: (_type: string, listener: Listener) => {
        const set = listeners.get(query) ?? new Set<Listener>();
        set.add(listener);
        listeners.set(query, set);
      },
      removeEventListener: (_type: string, listener: Listener) => {
        listeners.get(query)?.delete(listener);
      },
      addListener: () => {},
      removeListener: () => {},
      dispatchEvent: () => false,
    }),
  });

  return {
    change(query, matches) {
      state[query] = matches;
      listeners.get(query)?.forEach((listener) => listener({ matches } as MediaQueryListEvent));
    },
    listenerCount: (query) => listeners.get(query)?.size ?? 0,
  };
}

const originalCss = Object.getOwnPropertyDescriptor(globalThis, "CSS");

/** `CSS.supports(...)` responde siempre `supported`. Se deshace con restoreCss(). */
export function stubCssSupports(supported: boolean): void {
  Object.defineProperty(globalThis, "CSS", {
    configurable: true,
    writable: true,
    value: { supports: () => supported },
  });
}

export function restoreCss(): void {
  if (originalCss) Object.defineProperty(globalThis, "CSS", originalCss);
  else Reflect.deleteProperty(globalThis, "CSS");
}
