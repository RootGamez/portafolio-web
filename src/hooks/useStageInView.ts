import { useRef, useState, type RefObject } from "react";
import { useInView } from "motion/react";
import { useStage } from "@/components/stage/StageContext";

/**
 * "Ya toca revelar este elemento", una sola vez.
 *
 * Sustituye a `whileInView` de Motion dentro del sitio. Con escenarios
 * apilados, `IntersectionObserver` da por visible TODO lo que cae dentro del
 * visor aunque su capa este oculta (`visibility`, `opacity`, `inert` y
 * `clip-path` no cuentan para el), asi que `whileInView` dispararia todos los
 * reveals de golpe y fuera de pantalla: cuando el usuario llegase, ya habrian
 * pasado. Aqui se pide ademas que el escenario del elemento sea el activo.
 *
 *   revela  =  escenario activo  Y  elemento en vista   (y se queda revelado)
 *
 * En modo lineal (sin proveedor) el escenario cuenta siempre como activo, asi
 * que el comportamiento es el de `whileInView` con `once: true`.
 *
 * Quien lo use debe respetar la ley del proyecto: con reduced-motion el
 * contenido arranca VISIBLE (`animate` al estado final sin esperar a `shown`).
 */
export function useStageInView<T extends Element>(
  amount = 0.2,
): { readonly ref: RefObject<T | null>; readonly shown: boolean } {
  const ref = useRef<T | null>(null);
  const { isActive } = useStage();
  // `once`: tras la primera vez que entra en vista el observer se suelta y deja
  // de re-renderizar. Es seguro con capas inactivas porque la condicion de abajo
  // exige ademas `isActive`: un `inView` fijado mientras la capa estaba oculta
  // solo significa "estaba dentro del visor", y se revela al activarse.
  const inView = useInView(ref, { amount, once: true });
  const [shown, setShown] = useState(false);

  // Estado derivado "con memoria": se fija durante el render, sin efecto, para
  // que no haya un frame intermedio entre cumplirse la condicion y revelarse.
  if (!shown && isActive && inView) setShown(true);

  return { ref, shown };
}
