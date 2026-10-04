import type { ReactNode } from "react";
import { CARD_VIDEO_READY_REACH } from "@/lib/stage/config";
import type { ScrubRange } from "@/lib/stage/scrub";
import { ReachItem } from "./ReachItem";
import { ScrubReveal } from "./ScrubReveal";

/** La tarjeta entra entera justo cuando su video ya puede reproducirse (ver ProjectCard). */
const CARD_ENTRANCE: ScrubRange = [0, CARD_VIDEO_READY_REACH];

type Props = {
  readonly children: ReactNode;
  readonly className?: string;
  /** Px que sube al entrar (en los dos modos). */
  readonly rise: number;
  /** Retardo de la entrada por tiempo del modo lineal, en s. */
  readonly delay?: number;
};

/**
 * Una tarjeta de proyecto en una escena larga (Proyectos, Mas proyectos): en el
 * modo escenarios entra al ALCANZARLA la linea de lectura, de una en una; en el
 * modo lineal, con el `Reveal` por tiempo de siempre.
 */
export function CardReach({ children, className = "", rise, delay }: Props) {
  return (
    <ReachItem className={className} y={rise} delay={delay}>
      <ScrubReveal range={CARD_ENTRANCE} over="reach" distance={rise}>
        {children}
      </ScrubReveal>
    </ReachItem>
  );
}
