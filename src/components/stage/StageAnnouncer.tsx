import { useEffect, useRef, useState } from "react";
import { ANNOUNCE_DELAY_MS } from "@/lib/stage/config";
import { useDeck } from "./DeckContext";

type Props = {
  /** Titulo de cada escenario, en orden. Sale de `sectionsMeta`. */
  readonly titles: readonly string[];
};

/**
 * Anuncia al lector de pantalla en que escenario esta el usuario.
 *
 * En el modo lineal el lector recorre un documento normal y no hace falta; en
 * el modo escenarios solo hay UN escenario accesible a la vez (el resto va
 * `inert`) y el cambio ocurre por scroll, sin que el foco se mueva, asi que
 * hay que decirlo. Es una region `polite`: no interrumpe lo que se este
 * leyendo.
 *
 * Dos cuidados:
 *  - no anuncia el escenario con el que arranca la app (el primero); solo
 *    CAMBIOS. Si se abre con un enlace profundo (`/#produccion`) o al volver del
 *    modo lineal, SI anuncia la seccion donde cae: es informacion util;
 *  - espera una pausa antes de hablar, para que un scroll rapido que cruza
 *    varios escenarios anuncie solo donde el usuario se detiene.
 */
export function StageAnnouncer({ titles }: Props) {
  const { mode, activeIndex } = useDeck();
  const [message, setMessage] = useState("");
  const announced = useRef(activeIndex);

  useEffect(() => {
    if (mode !== "deck" || activeIndex === announced.current) return;

    const timer = window.setTimeout(() => {
      announced.current = activeIndex;
      setMessage(`Sección ${activeIndex + 1} de ${titles.length}: ${titles[activeIndex] ?? ""}`);
    }, ANNOUNCE_DELAY_MS);

    return () => window.clearTimeout(timer);
  }, [mode, activeIndex, titles]);

  return (
    <div role="status" aria-live="polite" aria-atomic="true" className="sr-only">
      {message}
    </div>
  );
}
