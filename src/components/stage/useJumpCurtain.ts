import { useEffect, useMemo } from "react";
import { useMotionValue, type MotionValue } from "motion/react";
import { createCurtainRunner, type CurtainRunner } from "@/lib/stage/jumpCurtain";

export type JumpCurtain = Pick<CurtainRunner, "run" | "cancel"> & {
  /** Progreso 0..1 de la cortina; 0 en reposo. Lo lee InkOverlay para pintar la banda. */
  readonly curtain: MotionValue<number>;
};

/**
 * La cortina de tinta de un SALTO (clic en el riel o en un ancla): el motor vive en
 * lib/stage/jumpCurtain.ts; aqui solo se ata a un MotionValue y se cancela al
 * desmontar, para que no haya un salto fantasma.
 *
 * No bloquea nada: la banda no capta el puntero y el scroll sigue libre.
 */
export function useJumpCurtain(): JumpCurtain {
  const curtain = useMotionValue(0);
  const runner = useMemo(() => createCurtainRunner(curtain), [curtain]);

  useEffect(() => runner.dispose, [runner]);

  return { curtain, run: runner.run, cancel: runner.cancel };
}
