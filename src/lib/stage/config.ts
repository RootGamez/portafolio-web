/**
 * Constantes del modo escenarios (docs/PLAN_ESCENARIOS.md §6).
 *
 * Todo lo que afina el "tempo" del scroll vive aqui y en ningun otro sitio: el
 * motor (timeline.ts) y los componentes importan estos nombres en vez de repetir
 * numeros. Cambiar el ritmo de la pagina es tocar este archivo.
 */

/** Largo de una transicion de tinta, en alturas de visor (1 = una pantalla de scroll). */
export const TRANSITION_SCREENS = 1;

/**
 * Pausa inicial de un escenario, en alturas de visor: el contenido se compone
 * antes de empezar a subir. Un escenario que cabe en pantalla dura solo esto.
 */
export const DEFAULT_INTRO_SCREENS = 0.6;

/** Fin de la fase "cubrir" de una transicion (fraccion 0..1 de la transicion). */
export const COVER_END = 0.45;

/** Fin de la fase "tarjeta de capitulo": ahi la tinta ya lo cubre todo. */
export const CARD_END = 0.55;

/** Punto de la transicion en que cambia el escenario activo (oculto tras la tinta). */
export const SWAP_AT = 0.5;

/**
 * Ventana del crossfade provisional (fase 1, antes de que exista la tinta).
 * Simetrica alrededor de SWAP_AT para que la opacidad saliente y la entrante
 * sumen siempre 1.
 */
export const CROSSFADE_START = 0.3;
export const CROSSFADE_END = 0.7;

/**
 * Cuantos escenarios a cada lado del activo cuentan como "cercanos": ahi se
 * precargan los medios pesados (videos) para que esten listos al llegar.
 */
export const NEAR_RANGE = 1;

/**
 * Pausa antes de anunciar un escenario nuevo al lector de pantalla. En un
 * scroll rapido se cruzan varios escenarios: sin esta pausa el lector
 * recitaria cada uno; con ella solo habla donde el usuario se detiene.
 */
export const ANNOUNCE_DELAY_MS = 300;

/**
 * Frames que se reintenta dar el foco al titulo tras un salto. Un elemento con
 * `visibility: hidden` no admite foco, y la capa destino sigue oculta hasta que
 * Motion escribe su visibilidad en el siguiente frame.
 */
export const FOCUS_RETRY_FRAMES = 6;

/**
 * Aire, en px, que se deja entre el elemento enfocado por teclado y el borde del
 * visor al subir o bajar el pan para mostrarlo.
 */
export const FOCUS_MARGIN_PX = 24;

/**
 * Desplazamiento minimo, en px, que justifica re-anclar el scroll tras volver a
 * medir: por debajo es ruido de redondeo y mover la ventana solo la haria temblar.
 */
export const REANCHOR_TOLERANCE_PX = 1;

/** Clave de localStorage del opt-out ("Modo simple"). Vale MOTION_OFF_VALUE si lo desactivo. */
export const MOTION_STORAGE_KEY = "portafolio:motion";
export const MOTION_OFF_VALUE = "off";

/** Media query de colores forzados (modo alto contraste de Windows). */
export const FORCED_COLORS_QUERY = "(forced-colors: active)";
