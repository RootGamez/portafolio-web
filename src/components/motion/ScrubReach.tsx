import { useCallback, useLayoutEffect, useRef, type ReactNode } from "react";
import { useMotionValue, useTransform } from "motion/react";
import { useStage } from "@/components/stage/StageContext";
import { reachProgress } from "@/lib/stage/scrub";
import { ReachContext } from "./useScrubSource";

type ReachTag = "div" | "li";

type Props = {
  readonly children: ReactNode;
  /** `li` cuando el padre es una lista, o el HTML se rompe. */
  readonly as?: ReachTag;
  readonly className?: string;
};

/**
 * Marca un bloque para animarlo "al alcanzarlo" (Fase 4): se mide dentro del
 * contenido de su escenario y da a sus hijos (las primitivas con
 * `over="reach"`) cuanto lo ha cruzado ya la linea de lectura del escenario
 * (`readingLine`): 0 hasta su borde de arriba, 1 pasado el de abajo.
 *
 * No se anima el mismo: solo mide. La medida es una RESTA de dos rects (el
 * bloque y el contenido del escenario), asi que el pan, que mueve a los dos por
 * igual, no la altera; se repite cuando algo cambia de tamano (fuentes que
 * llegan tarde, otro ancho). Todo va por MotionValues: sin renders por scroll.
 *
 * En modo lineal es la etiqueta tal cual.
 */
export function ScrubReach({ children, as = "div", className = "" }: Props) {
  const { mode, reading } = useStage();
  const ref = useRef<HTMLElement | null>(null);
  const top = useMotionValue(Number.POSITIVE_INFINITY);
  const height = useMotionValue(0);
  const reach = useTransform(() => reachProgress(reading.get(), top.get(), height.get()));

  const measure = useCallback(() => {
    const node = ref.current;
    const content = node?.closest("[data-stage-content]");
    if (!node || !content) return;
    const box = node.getBoundingClientRect();
    top.set(box.top - content.getBoundingClientRect().top);
    height.set(box.height);
  }, [top, height]);

  useLayoutEffect(() => {
    if (mode !== "deck") return;
    measure();
    const content = ref.current?.closest("[data-stage-content]");
    const observer = new ResizeObserver(measure);
    if (content) observer.observe(content);
    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, [mode, measure]);

  const Tag = as;
  return (
    <ReachContext value={mode === "deck" ? reach : null}>
      <Tag ref={(node: HTMLElement | null) => void (ref.current = node)} className={className}>
        {children}
      </Tag>
    </ReachContext>
  );
}
