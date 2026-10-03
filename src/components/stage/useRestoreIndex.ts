import { useState } from "react";
import type { DeckMode } from "@/lib/stage/mode";

/**
 * Escenario donde colocar al usuario tras CAMBIAR de modo con la pagina ya
 * abierta ("Modo simple"). En la carga inicial es `null`: ahi manda el hash de
 * la URL o la restauracion de scroll del navegador.
 *
 * Se FIJA una vez, en el render exacto donde cambia el modo, y no se recalcula
 * despues. Es la leccion de un fallo visto en vivo: el arbol que se monta
 * escribe su propio escenario inicial (0) en el estado compartido nada mas
 * montarse, y React vacia ese efecto antes del re-render que coloca la pista;
 * si el destino se derivara del `activeIndex` vivo, se pisaria por 0 y el
 * usuario volveria al principio.
 *
 * Es "estado derivado con memoria": se ajusta durante el render, sin efecto.
 */
export function useRestoreIndex(mode: DeckMode, activeIndex: number): number | null {
  const [seenMode, setSeenMode] = useState(mode);
  const [restoreIndex, setRestoreIndex] = useState<number | null>(null);

  if (mode !== seenMode) {
    setSeenMode(mode);
    setRestoreIndex(activeIndex);
  }

  return restoreIndex;
}
