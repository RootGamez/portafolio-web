import { useMotionValue, type MotionValue } from "motion/react";

export type FocusHold = {
  /** true mientras el foco este DENTRO del elemento (o en el). */
  readonly focused: MotionValue<boolean>;
  readonly onFocus: () => void;
  readonly onBlur: () => void;
};

/**
 * Para las primitivas ligadas al scroll (Scrub*): si el teclado entra en algo de
 * dentro antes de que el scroll lo haya mostrado (o despues de borrarlo), la
 * primitiva se pinta en su estado final mientras tenga el foco. Un enlace
 * enfocado e invisible incumple el foco visible (WCAG 2.4.7).
 *
 * Es un MotionValue y no estado de React: el cambio de foco no re-renderiza, lo
 * recoge el `useTransform` de la primitiva. `onFocus`/`onBlur` de React burbujean
 * (focusin/focusout), asi que valen para cualquier descendiente.
 */
export function useFocusHold(): FocusHold {
  const focused = useMotionValue(false);
  return {
    focused,
    onFocus: () => focused.set(true),
    onBlur: () => focused.set(false),
  };
}
