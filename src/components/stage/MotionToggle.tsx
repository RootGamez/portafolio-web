import { Zap, ZapOff } from "lucide-react";
import { useDeck } from "./DeckContext";

type Props = {
  /**
   * - rail: icono en el riel de escritorio;
   * - menu: fila con texto en el menu movil;
   * - skip: enlace de salto, invisible hasta que recibe foco (tras "Saltar al contenido").
   */
  readonly variant: "rail" | "menu" | "skip";
  /** Se llama tras cambiar el modo (p. ej. para cerrar el menu movil). */
  readonly onToggle?: () => void;
};

const LABEL = "Animaciones de scroll";

const RAIL_CLASS =
  "flex min-h-11 min-w-11 cursor-pointer items-center justify-center border-[3px] border-[var(--g-structure)] text-ink";

const MENU_CLASS =
  "flex min-h-12 w-full cursor-pointer items-center gap-3 px-4 py-3 text-left text-body text-ink";

/* Mismo patron visual que SkipLink: invisible hasta tener foco. */
const SKIP_CLASS =
  "sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[100] focus:border-[4px] focus:bg-kin focus:px-4 focus:py-2 focus:font-poster focus:uppercase focus:text-ink";

/**
 * El "Modo simple" (DESIGN_SYSTEM §7.1, salvaguarda 3): el usuario puede apagar
 * los escenarios aunque su sistema no pida reducir el movimiento. Se recuerda
 * en localStorage.
 *
 * Solo se muestra si el modo escenarios es POSIBLE. Con `prefers-reduced-motion`
 * (o sin `position: sticky`) el sitio ya es lineal y un interruptor que no
 * cambia nada solo confundiria.
 *
 * Rail y menu son un interruptor: el nombre accesible es CONSTANTE y el estado
 * lo da `aria-pressed` (pulsado = animaciones activas); cambiar el nombre con el
 * estado haria que un lector dijese "desactivar... pulsado". El icono tambien
 * cambia, y el estado no depende del color. `skip` es una accion de un solo
 * sentido (desactivar) y por eso su texto si es una orden.
 */
export function MotionToggle({ variant, onToggle }: Props) {
  const { eligible, optedOut, setOptedOut } = useDeck();
  if (!eligible) return null;

  const motionOn = !optedOut;
  const toggle = () => {
    setOptedOut(motionOn);
    // La variante skip desaparece al pulsarse y el foco caeria al <body> (WCAG
    // 2.4.3): se entrega al contenido, que es justo donde el usuario iba.
    if (variant === "skip") document.getElementById("contenido")?.focus();
    onToggle?.();
  };

  if (variant === "skip") {
    // Si ya esta desactivado no hay nada que saltar.
    if (!motionOn) return null;
    return (
      <button type="button" onClick={toggle} className={SKIP_CLASS}>
        Desactivar animaciones de scroll
      </button>
    );
  }

  const Icon = motionOn ? Zap : ZapOff;

  return (
    <button
      type="button"
      aria-pressed={motionOn}
      onClick={toggle}
      className={`${variant === "rail" ? RAIL_CLASS : MENU_CLASS} ${motionOn ? "bg-kin" : "bg-washi-deep"}`}
    >
      <Icon size={20} strokeWidth={3} aria-hidden="true" />
      {variant === "rail" ? (
        <span className="sr-only">{LABEL}</span>
      ) : (
        <>
          <span>{LABEL}</span>
          {/* El estado ya lo da aria-pressed: esto es solo refuerzo visual. */}
          <span aria-hidden="true" className="ml-auto font-mono text-caption">
            {motionOn ? "ON" : "OFF"}
          </span>
        </>
      )}
    </button>
  );
}
