import { createContext, useContext, useMemo, useState, type ReactNode } from "react";
import { useDeckMode } from "@/hooks/useDeckMode";
import type { DeckMode } from "@/lib/stage/mode";

/**
 * Estado GLOBAL del modo escenarios: el que comparten el riel, el interruptor
 * "Modo simple", el anunciador y la pista. Va separado de StageContext (por
 * escenario) a proposito: este cambia poco (al cruzar un limite de escenario o
 * al pulsar el interruptor), el otro es el de cada capa.
 */
export type DeckContextValue = {
  readonly mode: DeckMode;
  /** ¿Es posible el modo escenarios aqui? Decide si se muestra el interruptor. */
  readonly eligible: boolean;
  /** El usuario desactivo los escenarios ("Modo simple"). */
  readonly optedOut: boolean;
  readonly setOptedOut: (value: boolean) => void;
  /**
   * Escenario activo. En modo deck lo fija el motor; en lineal, el scroll-spy.
   * Una sola fuente para el riel en ambos modos, y es lo que permite
   * reposicionar el scroll al cambiar de modo.
   */
  readonly activeIndex: number;
  readonly setActiveIndex: (index: number) => void;
};

const noop = () => {};

/**
 * Valor fuera de proveedor: lineal e inerte. Asi el riel (o cualquier consumidor)
 * se puede montar solo, p. ej. en un test, sin envolverlo en nada.
 */
const INERT_DECK: DeckContextValue = {
  mode: "linear",
  eligible: false,
  optedOut: false,
  setOptedOut: noop,
  activeIndex: 0,
  setActiveIndex: noop,
};

export const DeckContext = createContext<DeckContextValue>(INERT_DECK);

export function useDeck(): DeckContextValue {
  return useContext(DeckContext);
}

export function DeckProvider({ children }: { readonly children: ReactNode }) {
  const { mode, eligible, optedOut, setOptedOut } = useDeckMode();
  const [activeIndex, setActiveIndex] = useState(0);

  const value = useMemo<DeckContextValue>(
    () => ({ mode, eligible, optedOut, setOptedOut, activeIndex, setActiveIndex }),
    [mode, eligible, optedOut, setOptedOut, activeIndex],
  );

  return <DeckContext value={value}>{children}</DeckContext>;
}
