import type { ReactNode } from "react";
import { useStage } from "@/components/stage/StageContext";
import { Reveal } from "./Reveal";
import { ScrubReach } from "./ScrubReach";

type Props = {
  readonly children: ReactNode;
  /** `li` cuando el padre es una lista, o el HTML se rompe. */
  readonly as?: "div" | "li";
  readonly className?: string;
  /** Entrada por tiempo del modo lineal (la de `Reveal`): distancia en px. */
  readonly y?: number;
  /** Entrada por tiempo del modo lineal: retardo en s. */
  readonly delay?: number;
  /** Entrada por tiempo del modo lineal: fraccion visible que la dispara. */
  readonly amount?: number;
  /** Entrada por tiempo del modo lineal: duracion en s. */
  readonly duration?: number;
};

/**
 * Un bloque de una escena larga (hito, tarjeta...): en el modo escenarios es un
 * `ScrubReach` (sus hijos se animan AL ALCANZARLO con el scroll, `over="reach"`);
 * en el modo lineal es el `Reveal` por tiempo de siempre, asi que el sitio
 * clasico no cambia.
 */
export function ReachItem({
  children,
  as = "div",
  className = "",
  y,
  delay,
  amount,
  duration,
}: Props) {
  const { mode } = useStage();
  if (mode === "deck") {
    return (
      <ScrubReach as={as} className={className}>
        {children}
      </ScrubReach>
    );
  }
  return (
    <Reveal as={as} className={className} y={y} delay={delay} amount={amount} duration={duration}>
      {children}
    </Reveal>
  );
}
