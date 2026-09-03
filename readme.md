# Portafolio de Anthony Gámez

Portafolio personal en **una sola página**, con estética de **manga sumi-e**: tinta
sobre papel washi, screentone, composición de póster y campos planos de color.

- **Stack:** React 19 · TypeScript · Vite 8 · Tailwind CSS 4 · Motion
- **Despliegue:** sitio estático en Cloudflare Pages (`npm run build` → `dist/`)
- **Estilo:** brutalismo entintado — bordes gruesos, sombras duras sin blur, radius 0,
  pero con el canto roto por filtro para que parezca trazo de pincel

## Comandos

```bash
npm install
npm run dev        # http://localhost:5173
npm run build      # tsc -b && vite build  → dist/
npm run preview    # sirve dist/ en local
npm run typecheck
npm test           # vitest run
npm run coverage
```

## Cómo está montado

### Un documento, diez secciones

No hay router ni motor de páginas: `src/App.tsx` monta diez `<section>` en orden y el
navegador hace el resto. Cada sección declara su **suelo** con `data-ground` y de ahí
cuelga toda su paleta.

`src/sections/meta.ts` es el índice: slugs, títulos, kanji y suelo. Es la única fuente
para el orden de las secciones, el riel de navegación y el scroll-spy — si eso y el JSX
se desincronizan, la navegación apunta a anclas que no existen.

### Los cuatro suelos

La idea que sostiene el sistema de color. Un componente **nunca elige un color**: lee
variables `--g-*` y el suelo decide cuáles son.

| Suelo | Fondo | Texto | Enlace | Sombra dura |
|---|---|---|---|---|
| `washi` | papel `#EDE6D6` | tinta (15.12:1) | bermellón `#8E2A22` | tinta |
| `sumi` | tinta `#14110F` | crema (15.12:1) | oro `#E5B62C` | **oro** |
| `shu` | rojo `#B0342B` | crema (5.01:1) | crema | crema |
| `kin` | oro `#E5B62C` | tinta (9.90:1) | tinta | tinta |

Sobre `sumi` la sombra pasa a oro porque una sombra de tinta sobre tinta es invisible.
Sobre `shu` **no existe un tono atenuado que pase AA** (el siguiente da 4.27:1), así que
ahí la jerarquía se hace con tamaño y peso, nunca bajando el color.

Los **koma** (paneles) son siempre papel con borde de tinta, en los cuatro suelos. Es lo
que mantiene el sitio accesible por construcción: el único texto que toca un color
saturado es el titular y la entradilla, y ese par está medido uno por uno en
[`docs/DESIGN_SYSTEM.md`](docs/DESIGN_SYSTEM.md) §1.2.

### La capa de tinta

`src/styles/ink.css` + `src/components/ink/InkFilters.tsx`. Todo es CSS y SVG: cero
imágenes de textura.

- **Screentone** — puntos y líneas del color del suelo (`--g-tone`). Sobre papel son
  puntos de tinta; sobre tinta, puntos de papel.
- **`#ink-rough`** — `feTurbulence` + `feDisplacementMap` que rompe el borde recto para
  que el canto tiemble. **Se aplica a una capa de marco absoluta, nunca al elemento
  entero**: un `filter` sobre el elemento desplazaría también su texto.
- **`#ink-portrait`** — `feComponentTransfer` discreto que posteriza la foto a 4 niveles.
  Es lo que convierte un retrato en algo que parece una plancha entintada.
- **`.torn-top` / `.torn-bottom`** — `clip-path` de muchos vértices para el canto rasgado
  entre campos de color.

Los filtros solo se aplican ≥768px: un `feTurbulence` por koma se sale del presupuesto
de 16ms en GPU móvil. Debajo queda el fallback de alto contraste.

### Reglas que no se negocian

- **Ningún `#hex` literal en `.tsx`** — solo tokens y utilidades de suelo.
- **Ninguna sombra con blur** ni gradientes. La sombra es un bloque sólido desplazado.
- **La prensa mecánica del botón**: al pulsar viaja exactamente la distancia de su sombra
  y la sombra colapsa a 0. `active:translate` === offset de `shadow-ink-sm` === 4px.
- **Ningún reveal arranca en `opacity: 0`.** Con `prefers-reduced-motion` la animación se
  desactiva; si el estado inicial fuese invisible, el contenido no aparecería nunca. El
  patrón correcto es `initial={reduced ? false : {...}}`.
- **Nunca se secuestra el scroll.** Las animaciones se ligan al scroll; no lo controlan.
- **`#D32E4A` (el rojo caliente) no es lecho de texto** — falla AA en ambas direcciones.
  Solo relleno de forma o titular ≥24px.
- **Rojo y oro nunca se tocan como texto** (3.28:1). Son formas adyacentes.

### El vídeo de los proyectos

`ProjectCard` reproduce la demo con **hover y con focus de teclado**, y la pausa al salir.
En táctil no hay ni hover ni focus, así que ahí manda `useInViewVideo`: un
IntersectionObserver con umbral alto para que solo se reproduzca el vídeo que de verdad
ocupa la pantalla — varios a la vez se comen la batería y los datos del usuario. Con
`prefers-reduced-motion` no se reproduce nada: se queda el póster.

## Tests

Alcance deliberado: se cubre la **lógica**, no el aspecto. Los hooks de scroll y de vídeo
son donde de verdad hay bugs; un snapshot de un componente visual se rompe en cada ajuste
de diseño y no demuestra nada.

`src/test/setup.ts` monta los dobles que jsdom no trae: `matchMedia`,
`IntersectionObserver` (guardando los callbacks para poder disparar intersecciones a mano)
y `HTMLMediaElement.play/pause`.

## Media

Los originales viven en `assets/raw/` y **están fuera de git** (pesan ~55 MB).
Las versiones optimizadas para web están en `public/media/` y sí se versionan:

| | Original | Optimizado |
|---|---|---|
| 4 vídeos de demo | 52.7 MB | **5.1 MB** (H.264, 1280px, sin audio) |
| Imágenes | 2.2 MB | 72 KB (AVIF + WebP) |

Para re-generarlos hace falta `ffmpeg` sobre los archivos de `assets/raw/`.

## Documentación

- [`docs/DESIGN_SYSTEM.md`](docs/DESIGN_SYSTEM.md) — paleta con ratios medidos, suelos,
  composición, movimiento, accesibilidad
- [`docs/SEO_Y_CONTENIDO.md`](docs/SEO_Y_CONTENIDO.md) — meta tags, schema.org, copy,
  Core Web Vitals
- [`PORTAFOLIO_PLAN.md`](PORTAFOLIO_PLAN.md) — plan original y contenido de referencia

## Pendiente

- [ ] Diseñar la imagen Open Graph 1200×630 en la nueva identidad (ahora usa la foto).
- [ ] Rasterizar el retrato entintado en build, para no pagar el filtro en runtime.
- [ ] Añadir `sitemap.xml`.
- [ ] Dato que reforzaría el pilar de liderazgo: **tamaño del equipo en Screen IA**.
