import { Mail } from "lucide-react";
import { motion } from "motion/react";
import { GithubIcon } from "@/components/icons/Brand";
import { Fukidashi } from "@/components/ink/Fukidashi";
import { InkButton } from "@/components/ink/InkButton";
import { Section } from "@/components/layout/Section";
import { Reveal } from "@/components/motion/Reveal";
import { usePrefersReducedMotion } from "@/hooks/usePrefersReducedMotion";
import { useStageInView } from "@/hooks/useStageInView";
import { EASE_INK, STAGGER } from "@/lib/motion";
import { getSectionMeta } from "@/sections/meta";

/** Slug, titulo, kanji y suelo salen del indice: una sola fuente para
    la seccion y para el riel de navegacion. */
const META = getSectionMeta("fin");

const EMAIL = "anthonygamez2858@gmail.com";
const GITHUB = "https://github.com/RootGamez";

/** El mismo gesto de entrada que la botonera de Contacto. */
const BUTTON_REVEAL = { y: 14, amount: 0.6, duration: 0.3 } as const;

/**
 * 09 · Fin — suelo SUMI (tinta).
 *
 * El h2 va en sr-only: el cierre del documento es el sello, no un titulo de
 * seccion mas. El sello (hanko) lleva colores CRUDOS y no del suelo — shu con
 * crema, 5.48:1 — porque un sello tiene que leerse igual sobre papel que
 * sobre tinta; es la misma regla que sigue <SealBadge>. Su sombra dura si es
 * del suelo: sobre tinta el offset es oro, porque una sombra de tinta sobre
 * tinta no se ve.
 *
 * El kanji va aria-hidden: "¿FIN?" ya dice lo mismo en el idioma del sitio.
 */
export function Fin() {
  const reduced = usePrefersReducedMotion();
  const { ref: sealRef, shown: sealShown } = useStageInView<HTMLSpanElement>(0.5);

  return (
    <Section
      id={META.slug}
      title={META.title}
      jp={META.jp}
      numeral={META.numeral}
      ground={META.ground}
      edge="dry"
      edgeMirror
      hideHeading
    >
      <div className="flex flex-col items-center gap-8 text-center">
        <motion.span
          ref={sealRef}
          aria-hidden="true"
          className="flex size-28 shrink-0 select-none items-center justify-center bg-shu font-brush text-[4.5rem] leading-none text-washi-hi shadow-ink-md sm:size-36 sm:text-[6rem]"
          style={{ rotate: "-3deg" }}
          initial={reduced ? false : { opacity: 0, scale: 0.86 }}
          animate={
            reduced || sealShown ? { opacity: 1, scale: 1 } : { opacity: 0, scale: 0.86 }
          }
          transition={{ duration: 0.45, ease: EASE_INK }}
        >
          終
        </motion.span>

        {/* El titular. <p> y no encabezado: el h2 de la seccion ya existe
            en sr-only y esta plancha no abre contenido nuevo. */}
        <p className="font-poster text-poster uppercase leading-none text-[var(--g-heading)]">
          ¿Fin?
        </p>

        <Fukidashi className="mx-auto">
          <p className="font-body font-bold">
            Eso depende de ti. La siguiente página la escribimos juntos.
          </p>
        </Fukidashi>

        <ul className="flex flex-wrap justify-center gap-3">
          <Reveal as="li" {...BUTTON_REVEAL}>
            <InkButton variant="primary" href={`mailto:${EMAIL}`}>
              <Mail size={18} strokeWidth={3} aria-hidden="true" />
              Escríbeme
            </InkButton>
          </Reveal>

          <Reveal as="li" {...BUTTON_REVEAL} delay={STAGGER}>
            <InkButton variant="ghost" href={GITHUB} ariaLabel="Perfil de GitHub de Anthony Gámez">
              <GithubIcon size={18} />
              GitHub
            </InkButton>
          </Reveal>
        </ul>

        <footer className="mt-6 w-full border-t-[3px] border-[var(--g-rule)] pt-6">
          <p className="font-mono text-caption text-on-ground-faint">
            © 2026 Anthony Gámez — hecho con React, Tailwind y mucha tinta.
          </p>
        </footer>
      </div>
    </Section>
  );
}
