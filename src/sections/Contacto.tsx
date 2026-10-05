import { FileDown, Mail, MapPin } from "lucide-react";
import { GithubIcon, LinkedinIcon, WhatsappIcon } from "@/components/icons/Brand";
import { BrushStroke } from "@/components/ink/BrushStroke";
import { Fukidashi } from "@/components/ink/Fukidashi";
import { InkButton } from "@/components/ink/InkButton";
import { Sfx } from "@/components/ink/Sfx";
import { Section } from "@/components/layout/Section";
import { ReachItem } from "@/components/motion/ReachItem";
import { ScrubErase } from "@/components/motion/ScrubErase";
import { ScrubReveal } from "@/components/motion/ScrubReveal";
import { ScrubStamp } from "@/components/motion/ScrubStamp";
import { STAGGER } from "@/lib/motion";
import type { ScrubRange } from "@/lib/stage/scrub";
import { getSectionMeta } from "@/sections/meta";

/** Slug, titulo, kanji y suelo salen del indice: una sola fuente para
    la seccion y para el riel de navegacion. */
const META = getSectionMeta("contacto");

const EMAIL = "anthonygamez2858@gmail.com";
const GITHUB = "https://github.com/RootGamez";
const LINKEDIN = "https://www.linkedin.com/in/anthony-gamez-2bab19242";
const WHATSAPP = "https://wa.me/51994026241";
const CV = "/cv/CV-Anthony-Gamez.pdf";

/** Entrada de los botones de contacto: recorrido corto y rapida, porque son
 *  cinco seguidos. Lo que los encadena es el STAGGER, no la duracion. */
const BUTTON_REVEAL = { y: 14, amount: 0.6, duration: 0.3 } as const;

/*
 * Modo escenarios (Fase 4.9), sobre la intro: el globo entra, «ESCRÍBEME» SE
 * ESCRIBE a pincel de izquierda a derecha (una mascara con el borde difuminado,
 * medida sobre la palabra: `w-fit`) y se subraya, el ¡ZAS! se estampa y los
 * botones caen ESTAMPADOS en cascada. Los botones son enlaces: si el teclado
 * llega antes que el scroll, el foco los muestra. En modo lineal, lo de siempre.
 */
const BALLOON: ScrubRange = [0, 0.2];
const HEADLINE_WRITE: ScrubRange = [0.15, 0.5];
const UNDERLINE_DRAW: ScrubRange = [0.45, 0.6];
const SFX_STAMP: ScrubRange = [0.3, 0.42];
const BUTTONS_START = 0.55;
const BUTTON_STEP = 0.06;
const BUTTON_LENGTH = 0.13;

/** El tramo del boton `index`: estampados en cascada. */
function buttonStamp(index: number): ScrubRange {
  const start = BUTTONS_START + index * BUTTON_STEP;
  return [start, start + BUTTON_LENGTH];
}

/**
 * 08 · Hablemos — suelo KIN (campo oro).
 *
 * El h2 va en sr-only (hideHeading) porque el titular de esta plancha es
 * "ESCRIBEME" a tamano poster: dos titulos casi sinonimos compitiendo, uno
 * grande y otro pequeno, romperia el golpe del campo de color. La jerarquia
 * de encabezados sigue intacta para un lector de pantalla.
 *
 * Sobre el oro el texto es TINTA (9.90:1) y el enlace tambien: shu-700 se
 * queda en 4.42:1 y solo vale a partir de 24px, asi que aqui no es color de
 * enlace. El unico bermellon de la plancha es el SFX, que es display y ademas
 * lleva contorno de tinta.
 */
export function Contacto() {
  return (
    <Section
      id={META.slug}
      title={META.title}
      jp={META.jp}
      numeral={META.numeral}
      ground={META.ground}
      edge="sweep"
      edgeMirror
      hideHeading
    >
      <div className="relative">
        <ScrubStamp range={SFX_STAMP} className="absolute right-0 top-0 z-20 hidden lg:block">
          <Sfx kana="ザッ" rotate={-10}>
            ¡ZAS!
          </Sfx>
        </ScrubStamp>

        <ReachItem y={18} amount={0.4} duration={0.4}>
          <ScrubReveal range={BALLOON}>
            <Fukidashi>
              <p className="font-body font-bold">
                ¿Tienes un proyecto en mente? ¿Quieres que te ayude a llevarlo a producción? Escríbeme y lo vemos.
              </p>
            </Fukidashi>
          </ScrubReveal>
        </ReachItem>

        {/* El titular de la plancha. Es un <p> y no un encabezado: el h2 real
            ya esta arriba en sr-only y duplicarlo solo seria ruido. */}
        <ScrubErase direction="write" range={HEADLINE_WRITE} className="w-fit">
          <p className="mt-12 font-poster text-poster uppercase leading-none text-[var(--g-heading)]">
            Escríbeme
          </p>
        </ScrubErase>
        <BrushStroke
          className="mt-1 h-4 w-56 sm:w-80"
          strokeWidth={5}
          delay={0.15}
          scrub={{ range: UNDERLINE_DRAW }}
        />

        <ul className="mt-10 flex flex-wrap gap-3">
          <ReachItem as="li" {...BUTTON_REVEAL} delay={0 * STAGGER}>
            <ScrubStamp range={buttonStamp(0)}>
              <InkButton variant="primary" href={`mailto:${EMAIL}`}>
                <Mail size={18} strokeWidth={3} aria-hidden="true" />
                Email
              </InkButton>
            </ScrubStamp>
          </ReachItem>

          <ReachItem as="li" {...BUTTON_REVEAL} delay={1 * STAGGER}>
            <ScrubStamp range={buttonStamp(1)}>
              <InkButton
                variant="accent"
                href={WHATSAPP}
                ariaLabel="Escribir a Anthony Gámez por WhatsApp"
              >
                <WhatsappIcon size={18} />
                WhatsApp
              </InkButton>
            </ScrubStamp>
          </ReachItem>

          <ReachItem as="li" {...BUTTON_REVEAL} delay={2 * STAGGER}>
            <ScrubStamp range={buttonStamp(2)}>
              <InkButton variant="ghost" href={LINKEDIN}>
                <LinkedinIcon size={18} />
                LinkedIn
              </InkButton>
            </ScrubStamp>
          </ReachItem>

          <ReachItem as="li" {...BUTTON_REVEAL} delay={3 * STAGGER}>
            <ScrubStamp range={buttonStamp(3)}>
              <InkButton variant="ghost" href={GITHUB}>
                <GithubIcon size={18} />
                GitHub
              </InkButton>
            </ScrubStamp>
          </ReachItem>

          <ReachItem as="li" {...BUTTON_REVEAL} delay={4 * STAGGER}>
            <ScrubStamp range={buttonStamp(4)}>
              <InkButton
                variant="ghost"
                href={CV}
                download
                ariaLabel="Descargar el currículum de Anthony Gámez en PDF"
              >
                <FileDown size={18} strokeWidth={3} aria-hidden="true" />
                Mi CV
              </InkButton>
            </ScrubStamp>
          </ReachItem>
        </ul>

        <address className="mt-10 flex flex-col items-start gap-2 not-italic">
          <a
            href={`mailto:${EMAIL}`}
            className="inline-flex min-h-11 items-center font-mono text-body font-bold text-link underline decoration-2 underline-offset-4 hover:text-link-hover"
          >
            {EMAIL}
          </a>
          <span className="flex items-center gap-2 font-mono text-small text-on-ground-muted">
            <MapPin size={16} strokeWidth={3} aria-hidden="true" />
            Pisco, Ica, Perú
          </span>
        </address>
      </div>
    </Section>
  );
}
