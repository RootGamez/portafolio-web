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
 * La tinta de una transicion es una banda con un borde de pincel delante y otro
 * detras. Cada borde mide un 22 % del alto del visor, entre 96 y 240 px: bastante
 * para que se lea como pincelada y no tanto como para comerse la pantalla.
 */
export const INK_EDGE_RATIO = 0.22;
export const INK_EDGE_MIN_PX = 96;
export const INK_EDGE_MAX_PX = 240;

/**
 * Tarjeta de capitulo (numeral + titulo) sobre la tinta. La ventana sale de la
 * PRUEBA DE "PARAR A MITAD" (ink.test.ts): la tarjeta mide ~356 px (semialtura
 * ~180) y solo puede verse cuando la tinta SOLIDA ya la cubre entera. En un visor
 * de 560-900 px eso ocurre hacia t~0,37 (y la cola la deja a t~0,63), asi que el
 * fundido va de 0,32 a 0,42 y de 0,58 a 0,68: simetrico alrededor de SWAP_AT y del
 * todo opaco durante la fase de tarjeta (COVER_END..CARD_END). El subrayado de
 * pincel se dibuja de CARD_STROKE_START a SWAP_AT.
 */
export const CARD_SHOW_START = 0.32;
export const CARD_SHOW_FULL = 0.42;
export const CARD_HIDE_START = 0.58;
export const CARD_HIDE_END = 0.68;
export const CARD_STROKE_START = 0.38;

/**
 * Longitud minima (fraccion del trazo) para pintar el subrayado: por debajo, una
 * raya casi nula con puntas redondas dibuja solo dos puntos en los extremos.
 */
export const CARD_STROKE_MIN_VISIBLE = 0.02;

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

/**
 * Cortina de tinta de un salto (clic en el riel, ancla, atras/adelante): dura
 * JUMP_CURTAIN_MS, cubre la pantalla y es entonces cuando se hace el salto; no
 * bloquea nada (pointer-events: none) y un salto nuevo la reutiliza. No se abre
 * para un salto de menos de CURTAIN_MIN_DISTANCE_PX: no habria nada que tapar.
 */
export const JUMP_CURTAIN_MS = 420;

/** Punto de la cortina (0..1) en que la pantalla ya esta cubierta y se hace el salto. */
export const JUMP_SWAP_AT = 0.5;
export const CURTAIN_MIN_DISTANCE_PX = 1;

/** Clave de localStorage del opt-out ("Modo simple"). Vale MOTION_OFF_VALUE si lo desactivo. */
export const MOTION_STORAGE_KEY = "portafolio:motion";
export const MOTION_OFF_VALUE = "off";

/** Media query de colores forzados (modo alto contraste de Windows). */
export const FORCED_COLORS_QUERY = "(forced-colors: active)";
