import { useEffect, type RefObject } from "react";
import { usePrefersReducedMotion } from "./usePrefersReducedMotion";

/**
 * Reproduce el video cuando entra en pantalla y lo pausa al salir.
 *
 * Existe por los dispositivos tactiles: ahi no hay hover ni focus, asi que
 * sin esto las demos de proyecto no se verian nunca en movil.
 *
 * Dos cuidados que no son opcionales:
 *  - `amount` alto (0.6) para que solo se dispare el video que de verdad
 *    ocupa la pantalla. Con varios reproduciendo a la vez se va la bateria
 *    y los datos del usuario.
 *  - con prefers-reduced-motion no se reproduce nada: se queda el poster.
 *    Un video en bucle es movimiento, y el usuario ha pedido que no lo haya.
 */
export function useInViewVideo(
  ref: RefObject<HTMLVideoElement | null>,
  enabled = true,
): void {
  const reduced = usePrefersReducedMotion();

  useEffect(() => {
    const video = ref.current;
    if (!video || !enabled || reduced) return;

    // Solo en tactil. En desktop mandan hover y focus, que son intencionados:
    // reproducir ademas por scroll haria que el video arrancase solo.
    const isTouch = window.matchMedia("(hover: none)").matches;
    if (!isTouch) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          void video.play().catch(() => {
            // Autoplay bloqueado: se queda el poster. No rompe nada.
          });
        } else {
          video.pause();
        }
      },
      { threshold: 0.6 },
    );

    observer.observe(video);
    return () => observer.disconnect();
  }, [ref, enabled, reduced]);
}
