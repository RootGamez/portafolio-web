import { FileDown, Mail, MapPin } from "lucide-react";
import { GithubIcon, LinkedinIcon, WhatsappIcon } from "@/components/icons/Brand";
import { BrushStroke } from "@/components/ink/BrushStroke";
import { Fukidashi } from "@/components/ink/Fukidashi";
import { InkButton } from "@/components/ink/InkButton";
import { Sfx } from "@/components/ink/Sfx";
import { Section } from "@/components/layout/Section";
import { Reveal } from "@/components/motion/Reveal";
import { STAGGER } from "@/lib/motion";
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
        <Sfx kana="ザッ" rotate={-10} className="absolute right-0 top-0 z-20 hidden lg:block">
          ¡ZAS!
        </Sfx>

        <Reveal y={18} amount={0.4} duration={0.4}>
          <Fukidashi>
            <p className="font-body font-bold">
              ¿Tienes un proyecto en mente? ¿Quieres que te ayude a llevarlo a producción? Escríbeme y lo vemos.
            </p>
          </Fukidashi>
        </Reveal>

        {/* El titular de la plancha. Es un <p> y no un encabezado: el h2 real
            ya esta arriba en sr-only y duplicarlo solo seria ruido. */}
        <p className="mt-12 font-poster text-poster uppercase leading-none text-[var(--g-heading)]">
          Escríbeme
        </p>
        <BrushStroke className="mt-1 h-4 w-56 sm:w-80" strokeWidth={5} delay={0.15} />

        <ul className="mt-10 flex flex-wrap gap-3">
          <Reveal as="li" {...BUTTON_REVEAL} delay={0 * STAGGER}>
            <InkButton variant="primary" href={`mailto:${EMAIL}`}>
              <Mail size={18} strokeWidth={3} aria-hidden="true" />
              Email
            </InkButton>
          </Reveal>

          <Reveal as="li" {...BUTTON_REVEAL} delay={1 * STAGGER}>
            <InkButton
              variant="accent"
              href={WHATSAPP}
              ariaLabel="Escribir a Anthony Gámez por WhatsApp"
            >
              <WhatsappIcon size={18} />
              WhatsApp
            </InkButton>
          </Reveal>

          <Reveal as="li" {...BUTTON_REVEAL} delay={2 * STAGGER}>
            <InkButton variant="ghost" href={LINKEDIN}>
              <LinkedinIcon size={18} />
              LinkedIn
            </InkButton>
          </Reveal>

          <Reveal as="li" {...BUTTON_REVEAL} delay={3 * STAGGER}>
            <InkButton variant="ghost" href={GITHUB}>
              <GithubIcon size={18} />
              GitHub
            </InkButton>
          </Reveal>

          <Reveal as="li" {...BUTTON_REVEAL} delay={4 * STAGGER}>
            <InkButton
              variant="ghost"
              href={CV}
              download
              ariaLabel="Descargar el currículum de Anthony Gámez en PDF"
            >
              <FileDown size={18} strokeWidth={3} aria-hidden="true" />
              Mi CV
            </InkButton>
          </Reveal>
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
