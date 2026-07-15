export type ProjectStatus = "produccion" | "privado" | "desarrollo";

export type Project = {
  readonly id: string;
  readonly title: string;
  readonly tagline: string;
  readonly role: string;
  readonly bullets: readonly string[];
  readonly stack: readonly string[];
  readonly status: ProjectStatus;
  readonly liveUrl?: string;
  readonly repoUrl?: string;
  /** Slug de la media en public/media (video/ + poster/), si tiene demo grabada. */
  readonly media?: string;
  /** Imagen estatica en public/media/img, si no hay video. */
  readonly image?: string;
  readonly alt: string;
  /** Onomatopeya de comic que acompana la vineta. */
  readonly pow: string;
};

export const STATUS_LABEL: Record<ProjectStatus, string> = {
  produccion: "EN PRODUCCIÓN",
  privado: "CÓDIGO PRIVADO",
  desarrollo: "EN DESARROLLO",
};

export const projects: readonly Project[] = [
  {
    id: "adflow",
    title: "AdFlow — ScreenIA",
    tagline:
      "Marketplace de pantallas publicitarias digitales (DOOH): explora, compara y reserva pantallas por ubicación, tráfico y precio.",
    role: "Líder de Equipo de Desarrollo",
    bullets: [
      "Lidero el equipo: sprints, revisión de pull requests y estándares de código.",
      "Arquitectura de microservicios y definición de las buenas prácticas del equipo.",
      "Producto en producción con dominio propio, DNS y despliegue gestionados por mí.",
    ],
    stack: ["React", "Django REST", "Flutter Web", "AWS", "Docker"],
    status: "privado",
    liveUrl: "https://adflow.screeniadigital.com/",
    media: "adflow",
    alt: "Demo de AdFlow, marketplace de pantallas publicitarias digitales, mostrando el buscador de pantallas por ubicación y precio.",
    pow: "¡BOOM!",
  },
  {
    id: "jaw-project",
    title: "JAW Project",
    tagline:
      "E-commerce completo de ropa importada: tienda pública, CMS de administración y API propia. De la idea al deploy, yo solo.",
    role: "Desarrollador full stack y responsable de infraestructura",
    bullets: [
      "Monorepo con tienda pública, panel CMS y API — las tres piezas hechas por mí.",
      "Backend serverless en Cloudflare Workers con base de datos D1 y almacenamiento R2.",
      "Autenticación JWT, hero 3D con Three.js y catálogo con pedido por WhatsApp.",
    ],
    stack: ["React", "Vite", "Hono", "Cloudflare Workers", "D1", "R2", "Three.js"],
    status: "produccion",
    liveUrl: "https://jaw-project.anthonygamez2858.workers.dev/",
    repoUrl: "https://github.com/RootGamez/virtualshop",
    media: "jaw-project",
    alt: "Demo de JAW Project, tienda de ropa importada, mostrando el catálogo y el panel de administración.",
    pow: "¡ZAP!",
  },
  {
    id: "sabor-llanero",
    title: "Pizzería Sabor Llanero",
    tagline:
      "La web del negocio familiar. Landing con SEO local real, pensada para que el vecino de Pisco encuentre la pizza antes que la competencia.",
    role: "Desarrollador y responsable del despliegue",
    bullets: [
      "Arquitectura documentada en un blueprint por fases (landing → catálogo → CMS).",
      "SEO local completo: schema.org, Open Graph y metadatos por ciudad.",
      "Sitio estático en Cloudflare Pages con dominio y DNS propios.",
    ],
    stack: ["Next.js 15", "Tailwind 4", "TypeScript", "Cloudflare Pages"],
    status: "produccion",
    liveUrl: "https://saborllanero.online/",
    repoUrl: "https://github.com/RootGamez/Landing-Sabor-Llanero",
    media: "sabor-llanero",
    alt: "Demo de la web de Pizzería Sabor Llanero, mostrando el menú de pizzas artesanales y el pedido por delivery.",
    pow: "¡ÑAM!",
  },
  {
    id: "pasodoble-run",
    title: "Pasodoble Run",
    tagline:
      "Landing y foro de contenidos para un negocio de fisioterapia y running. Cliente real, entrega real.",
    role: "Desarrollador y responsable del despliegue",
    bullets: [
      "Foro de artículos en MDX que el cliente puede ampliar sin tocar código.",
      "Formulario de contacto sin backend y export estático: cero coste de servidor.",
      "Desplegado en Cloudflare Pages con dominio propio.",
    ],
    stack: ["Next.js 15", "Tailwind 4", "MDX", "Cloudflare Pages"],
    status: "produccion",
    liveUrl: "https://pasodoblerun.online/",
    repoUrl: "https://github.com/RootGamez/PasoDobleRun",
    media: "pasodoblerun",
    alt: "Demo de la web de Pasodoble Run, mostrando los servicios de fisioterapia, fuerza y running.",
    pow: "¡PUM!",
  },
  {
    id: "tesseract",
    title: "Tesseract",
    tagline:
      "Plataforma de clases interactivas en tiempo real: pizarra colaborativa, quizzes tipo Kahoot, gamificación y copiloto de IA.",
    role: "Desarrollador full stack",
    bullets: [
      "Tiempo real con WebSockets (Django Channels) y tareas asíncronas con Celery.",
      "Pizarra colaborativa con Excalidraw y acceso de alumnos por código de 6 dígitos.",
      "Copiloto de IA que genera preguntas a partir de los PDFs de la clase.",
    ],
    stack: ["Django Channels", "Celery", "Redis", "PostgreSQL", "MinIO", "React", "Zustand"],
    status: "desarrollo",
    repoUrl: "https://github.com/RootGamez/Tesseract",
    alt: "Vista previa de Tesseract, plataforma de clases interactivas en tiempo real.",
    pow: "¡WOOSH!",
  },
] as const;
