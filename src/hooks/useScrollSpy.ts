import { useEffect, useState } from "react";

/**
 * Devuelve el id de la seccion visible, para marcar el estado activo del
 * riel de navegacion.
 *
 * Un UNICO IntersectionObserver para todas las secciones, no uno por seccion:
 * con diez secciones y varios videos, un observer por elemento multiplica el
 * trabajo en cada frame de scroll sin necesidad.
 *
 * `rootMargin` recorta la ventana a su banda central: asi la seccion activa
 * es la que ocupa el centro de la pantalla, no la que asoma por abajo.
 */
export function useScrollSpy(ids: readonly string[]): string {
  const [active, setActive] = useState(ids[0] ?? "");

  useEffect(() => {
    const nodes = ids
      .map((id) => document.getElementById(id))
      .filter((node): node is HTMLElement => node !== null);

    if (nodes.length === 0) return;

    const observer = new IntersectionObserver(
      (entries) => {
        // Gana la seccion mas visible, no la ultima que disparo el evento:
        // en un scroll rapido pueden entrar varias en el mismo callback.
        const visible = entries
          .filter((entry) => entry.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];

        if (visible) setActive(visible.target.id);
      },
      { rootMargin: "-45% 0px -45% 0px", threshold: [0, 0.25, 0.5, 1] },
    );

    nodes.forEach((node) => observer.observe(node));
    return () => observer.disconnect();
  }, [ids]);

  return active;
}
