import { motion } from "motion/react";
import { ChevronDown, MapPin } from "lucide-react";
import { Section } from "@/components/layout/Section";
import { Enso } from "@/components/ink/Enso";
import { BrushFrame } from "@/components/ink/BrushFrame";
import { BrushStroke } from "@/components/ink/BrushStroke";
import { ScrubErase } from "@/components/motion/ScrubErase";
import { ScrubParallax } from "@/components/motion/ScrubParallax";
import { usePrefersReducedMotion } from "@/hooks/usePrefersReducedMotion";
import { getSectionMeta } from "@/sections/meta";
import { EASE_INK } from "@/lib/motion";
import type { ScrubRange } from "@/lib/stage/scrub";

/**
 * Plancha 00 — la portada.
 *
 * Es lo primero que se ve, asi que no es una cabecera: es un POSTER, montado
 * con la misma gramatica que los carteles de referencia (docs/DESIGN_SYSTEM.md
 * §5, fila 00).
 *
 *   1. El nombre a tamano de cartel, partido por palabras, con su lectura en
 *      katakana debajo — el mismo par titulo latino + subtitulo japones que
 *      usan los carteles de referencia.
 *   2. Un BLOQUE ROJO con el rol. En los carteles el nombre del personaje va
 *      sobre un campo plano de color; aqui hace lo mismo con el puesto, y de
 *      paso mete el tercer color de la paleta por encima del pliegue.
 *   3. La frase de posicionamiento en versalitas espaciadas, como la cita del
 *      cartel. Es su copy real, el mismo de la seccion de produccion.
 *   4. El retrato dentro de una PINCELADA (BrushFrame), no de un rectangulo:
 *      la foto va sin tocar y lo que la integra en el papel es el marco de
 *      cantos irregulares mas el grano en multiply.
 *   5. El enso de oro detras haciendo de sol. Es forma, nunca texto: el oro
 *      sobre papel da 1.53:1 y esta prohibido como tipografia.
 *
 * Section va con `hideHeading` porque el titulo visible lo pinta esta seccion;
 * el h2 que queda es solo el nombre accesible de la <section>.
 */

const META = getSectionMeta("inicio");

/*
 * Coreografia del modo escenarios (Fase 4.1), sobre la INTRO del escenario
 * (STAGE_TIMING.inicio). Dos focos como maximo: el retrato con su sol, y
 * el nombre. En modo lineal nada de esto existe: el Hero es el de siempre.
 *
 *   0 ─── el anillo de tinta rodea el sol ───── 0,6
 *                               0,55 ─── el nombre se borra ─── 0,95
 *   y, durante todo el escenario, el retrato sube mas que el sol (profundidad).
 *
 * En movil el sol queda detras del retrato (como en el sitio clasico) y el
 * anillo no se ve: alli la escena es el nombre que se borra y, despues, el pan
 * que descubre el retrato.
 */
const ENSO_RING: ScrubRange = [0.05, 0.6];
const NAME_ERASE: ScrubRange = [0.55, 0.95];
const PORTRAIT_RISE_PX = 56;

export function Hero() {
  const reduced = usePrefersReducedMotion();

  /* Por encima del pliegue no se usa whileInView: si el usuario ya esta
     mirando, esperar a un evento de scroll que quiza no llegue nunca dejaria
     el hero a medio pintar. Se anima al montar. */
  const rise = (delay: number) => ({
    initial: reduced ? false : { opacity: 0, y: 20 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: 0.55, ease: EASE_INK, delay },
  });

  return (
    <Section
      id={META.slug}
      title={META.title}
      jp={META.jp}
      numeral={META.numeral}
      ground={META.ground}
      hideHeading
      bleed
      tone="fine"
      innerClassName="flex min-h-[82svh] items-center lg:min-h-[88svh]"
    >
      <div className="mx-auto w-full max-w-[1600px] px-4 sm:px-6 lg:px-10">
        <div className="grid items-center gap-12 md:grid-cols-12 md:gap-8">
          {/* ── Bloque de titulo ── */}
          <div className="md:col-span-7 md:col-start-1">
            <motion.p
              {...rise(0)}
              className="flex items-center gap-2 font-mono text-caption uppercase tracking-[0.2em] text-[var(--g-faint)]"
            >
              <MapPin size={14} strokeWidth={2.5} aria-hidden="true" />
              Pisco · Ica · Perú
            </motion.p>

            {/* `w-fit`: la mascara se mide sobre el ancho del nombre, no de la columna. */}
            <ScrubErase range={NAME_ERASE} className="w-fit">
              <motion.h1
                {...rise(0.06)}
                className="mt-4 font-poster text-poster uppercase leading-[0.82] text-[var(--g-heading)]"
              >
                <span className="block">Anthony</span>
                <span className="block">Gámez</span>
              </motion.h1>

              {/* Lectura en katakana, como el subtitulo japones de los carteles.
                Decorativo: el nombre ya esta en el h1. */}
              <motion.p
                {...rise(0.12)}
                aria-hidden="true"
                className="mt-3 font-brush text-[clamp(0.85rem,1.7vw,1.35rem)] tracking-[0.42em] text-[var(--g-accent)]"
              >
                アンソニー
              </motion.p>
            </ScrubErase>

            {/* Campo rojo con el rol. Crema sobre bermellon = 5.01:1. */}
            <motion.div
              {...rise(0.18)}
              className="mt-7 inline-block bg-shu px-5 py-3 shadow-ink-sm"
            >
              <p className="font-poster text-[clamp(1rem,2.1vw,1.6rem)] uppercase leading-tight tracking-wide text-washi-hi">
                Ingeniero de Software
                <span className="block">· Full Stack · Cloud &amp; Serverless ·</span>
              </p>
            </motion.div>

            {/* Cita de cartel: versalitas muy espaciadas, en mincho. */}
            <motion.p
              {...rise(0.24)}
              className="mt-8 max-w-[38ch] font-body text-[clamp(0.8rem,1.5vw,1rem)] uppercase leading-relaxed tracking-[0.16em] text-on-ground-muted"
            >
              No entrego un repositorio y me voy — hago el ciclo completo y me
              quedo a mantenerlo.
            </motion.p>

            <motion.div {...rise(0.3)}>
              <BrushStroke className="mt-4 h-3 w-48 sm:w-64" strokeWidth={5} />

              <a
                href="#sobre-mi"
                className="mt-8 inline-flex min-h-11 items-center gap-2 font-mono text-caption uppercase tracking-[0.18em] text-on-ground-muted hover:text-[var(--g-link-hover)]"
              >
                <ChevronDown size={18} strokeWidth={2.5} aria-hidden="true" />
                Sobre mí
              </a>
            </motion.div>
          </div>

          {/* ── Retrato + sol ──
              El enso va ANTES en el DOM para pintar debajo sin z-index
              negativos, que se comportan mal dentro del stacking context que
              crea la seccion. */}
          {/* Aqui NO se anima la opacidad: esta foto es el LCP y Chrome ignora para
              el LCP un elemento con opacity 0, asi que el fade retrasaba la metrica
              (medido: 1403 ms de retraso de render en movil). Solo escala. */}
          <motion.div
            initial={reduced ? false : { scale: 0.97 }}
            animate={{ scale: 1 }}
            transition={{ duration: 0.7, ease: EASE_INK, delay: 0.1 }}
            className="relative md:col-span-5 md:col-start-8"
          >
            <Enso
              ring={ENSO_RING}
              className="pointer-events-none absolute left-0 top-[-8%] h-[62%] w-[62%] md:left-[-14%] md:h-[72%] md:w-[72%]"
            />

            {/* Paralaje (modo escenarios): retrato y sello suben mas que el sol.
                `relative`: el sello se coloca igual con y sin transformacion. */}
            <ScrubParallax distance={PORTRAIT_RISE_PX} className="relative">
              {/* La altura se acota en svh y no se deja crecer libre: con el
                  aspecto 3/4 a ancho completo el retrato se salia del viewport y
                  se comia el sello. El recorte lo absorbe el object-cover. */}
              <BrushFrame className="relative mx-auto aspect-[4/5] max-h-[52svh] w-full sm:aspect-[3/4] md:max-h-[58svh] lg:max-h-[62svh]">
                <picture>
                  <source srcSet="/media/img/anthony.avif" type="image/avif" />
                  <img
                    src="/media/img/anthony.webp"
                    alt="Anthony Gámez, ingeniero de software, retrato de perfil"
                    width={900}
                    height={1200}
                    loading="eager"
                    decoding="sync"
                    fetchPriority="high"
                    /* El origen tiene aire de sobra sobre la cabeza. Con
                       object-top el recorte conservaba ese hueco y se comia el
                       pecho, dejando la cara alta y descolgada del cuerpo.
                       Bajar el encuadre al 30% centra la cara con el torso. */
                    className="block h-full w-full object-cover object-[50%_30%]"
                  />
                </picture>
              </BrushFrame>

              {/* Sello (hanko) en el canto inferior del retrato, como firma. */}
              <span
                aria-hidden="true"
                className="absolute -bottom-4 -left-2 flex size-14 rotate-[-4deg] items-center justify-center bg-shu font-brush text-[1.9rem] leading-none text-washi-hi shadow-ink-sm sm:size-16 sm:text-[2.2rem]"
              >
                放
              </span>
            </ScrubParallax>
          </motion.div>
        </div>
      </div>
    </Section>
  );
}
