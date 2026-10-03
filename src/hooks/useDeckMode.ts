import { useCallback, useState } from "react";
import { FORCED_COLORS_QUERY } from "@/lib/stage/config";
import {
  detectStickySupport,
  getLocalStorage,
  isDeckEligible,
  readMotionOptOut,
  resolveDeckMode,
  writeMotionOptOut,
  type DeckMode,
} from "@/lib/stage/mode";
import { useMediaQuery } from "./useMediaQuery";
import { usePrefersReducedMotion } from "./usePrefersReducedMotion";

export type DeckModeState = {
  readonly mode: DeckMode;
  /**
   * ¿Es posible el modo escenarios aqui, sin contar el opt-out? Decide si se
   * muestra el interruptor "Modo simple".
   */
  readonly eligible: boolean;
  /** El usuario desactivo los escenarios. */
  readonly optedOut: boolean;
  readonly setOptedOut: (value: boolean) => void;
};

/**
 * Modo del sitio. Se evalua en el primer render y se mantiene al dia si el
 * usuario cambia reduced-motion o el alto contraste con la pagina abierta.
 * La logica de decision vive en lib/stage/mode.ts (pura y con sus tests).
 */
export function useDeckMode(): DeckModeState {
  const prefersReducedMotion = usePrefersReducedMotion();
  const forcedColors = useMediaQuery(FORCED_COLORS_QUERY);
  // El soporte de sticky no cambia con la pagina abierta: se mide una vez.
  const [stickySupported] = useState(detectStickySupport);
  const [optedOut, setOptedOutState] = useState(() => readMotionOptOut(getLocalStorage()));

  const setOptedOut = useCallback((value: boolean) => {
    writeMotionOptOut(getLocalStorage(), value);
    setOptedOutState(value);
  }, []);

  const inputs = {
    prefersReducedMotion,
    forcedColors,
    userOptOut: optedOut,
    supportsSticky: stickySupported,
  };

  return {
    mode: resolveDeckMode(inputs),
    eligible: isDeckEligible(inputs),
    optedOut,
    setOptedOut,
  };
}
