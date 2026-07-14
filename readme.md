# Portafolio de Anthony Gámez

Portafolio personal en forma de **cómic navegable**: cada sección es una página
del cómic y se pasa de página con un giro 3D real, como un libro impreso.

- **Stack:** React 19 · TypeScript · Vite 8 · Tailwind CSS 4 · Motion
- **Despliegue:** sitio estático en Cloudflare Pages (`npm run build` → `dist/`)
- **Estilo:** brutalista + cómic (bordes gruesos, sombras duras sin blur, halftone Ben-Day)

## Comandos

```bash
npm install
npm run dev        # http://localhost:5173
npm run build      # tsc -b && vite build  → dist/
npm run preview    # sirve dist/ en local
npm run typecheck
```

## Cómo está montado

### El motor del cómic

`src/components/comic/ComicBook.tsx` es el núcleo. Tres decisiones que conviene
entender antes de tocarlo:

1. **Las 7 páginas están SIEMPRE montadas en el DOM.** Nunca uses
   `{activa && <Pagina/>}`: Googlebot renderiza con Chrome headless pero **no
   hace click en "siguiente"**, así que una página que solo se monta tras la
   interacción no se indexa jamás. Las inactivas llevan `inert` + `aria-hidden`.

2. **Las hojas inactivas se ocultan con `visibility`, nunca con `opacity`.** Por
   spec de `transform-style`, un `opacity < 1` fuerza `flat` y **mata el 3D de
   toda la escena**. Lo mismo harían `filter`, `clip-path` u `overflow ≠ visible`
   aplicados sobre la hoja o sobre `.page-stage`. (La sombra dura
   `box-shadow: 8px 8px 0` es segura; un `filter: drop-shadow` la habría roto.)

3. **Tres modos de transición**, en `useTransitionMode`:
   - `flip3d` — desktop con puntero fino: `rotateY` sobre el lomo, 480ms.
   - `slide` — táctil/móvil: el flip 3D con perspectiva y sombras duras no cabe
     en el presupuesto de 16ms/frame de una GPU móvil.
   - `fade` — `prefers-reduced-motion`: crossfade de 120ms, sin 3D.

Navegación por **hash sobre una única URL canónica** (`#/proyectos`). Con rutas
reales, las 7 URLs servirían un HTML idéntico → contenido duplicado.

### Sistema de diseño

`src/styles/app.css` implementa los tokens en 3 capas (primitive → semantic →
component). Reglas que no se negocian:

- **Ningún `#hex` literal en `.tsx`** — solo tokens.
- **Ninguna sombra con blur** ni gradientes. La sombra es un bloque sólido de tinta.
- **Comic Shanns solo en display/títulos**, nunca en párrafos ni bajo 20px.
- **Toda superficie de color lleva borde `ink`** — eso garantiza WCAG 1.4.11 por
  construcción.
- **Combinaciones prohibidas** (fallan WCAG AA): blanco sobre `#FFD600` (1.41:1),
  blanco sobre `#FF3B3B` en texto normal (3.53:1), `#FF3B3B` como color de texto
  sobre crema (3.34:1).

El detalle completo (paleta validada, tabla de 24 pares de contraste, specs de
cada componente) está en [`docs/DESIGN_SYSTEM.md`](docs/DESIGN_SYSTEM.md).

## Media

Los originales viven en `assets/raw/` y **están fuera de git** (pesan ~55 MB).
Las versiones optimizadas para web están en `public/media/` y sí se versionan:

| | Original | Optimizado |
|---|---|---|
| 3 videos de demo | 52.7 MB | **5.1 MB** (H.264, 1280px, sin audio) |
| Imágenes | 2.2 MB | 72 KB (AVIF + WebP) |

Para re-generarlos hace falta `ffmpeg` sobre los archivos de `assets/raw/`.

## Documentación

- [`docs/DESIGN_SYSTEM.md`](docs/DESIGN_SYSTEM.md) — paleta, tokens, componentes, accesibilidad
- [`docs/PAGE_TURN_ENGINE.md`](docs/PAGE_TURN_ENGINE.md) — por qué el motor es propio y no una librería
- [`docs/SEO_Y_CONTENIDO.md`](docs/SEO_Y_CONTENIDO.md) — meta tags, schema.org, copy, Core Web Vitals
- [`PORTAFOLIO_PLAN.md`](PORTAFOLIO_PLAN.md) — plan original y contenido de referencia

## Pendiente

- [ ] Confirmar el dominio final y reemplazar el placeholder `anthonygamez.dev`
      en `index.html` (canonical, OG, JSON-LD) y en `public/robots.txt`.
- [ ] Diseñar la imagen Open Graph 1200×630 (ahora usa la foto de perfil).
- [ ] Prerenderizado en build (`vite-prerender-plugin`) para que el HTML inicial
      lleve el texto ya pintado. Los meta tags y el JSON-LD ya son estáticos, y
      Googlebot ejecuta JS, así que esto es mejora, no bloqueo.
- [ ] Añadir `sitemap.xml`.
- [ ] Dato que reforzaría el pilar de liderazgo: **tamaño del equipo en Screen IA**.
