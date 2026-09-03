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

/**
 * Los que tienen plancha propia en 三 (Proyectos). El resto cae en 四.
 *
 * Vive aqui y no en las secciones porque estaba duplicada en las dos: editar
 * una sola dejaba un proyecto fuera de ambas listas, o repetido en las dos,
 * sin que nada fallara.
 */
export const featuredIds: readonly string[] = ["taskflow", "adflow"];

export function isFeatured(id: string): boolean {
  return featuredIds.includes(id);
}

export const projects: readonly Project[] = [
  {
    id: "taskflow",
    title: "TaskFlow",
    tagline:
      "Espacio de trabajo para equipos: tablero kanban, sprints, wiki jerárquico y editor de bloques. Una alternativa seria a Notion y Linear, no una demo.",
    role: "Desarrollador full stack",
    bullets: [
      "17 apps de Django y 23 módulos de producto: tickets, sprints, metas, relaciones entre tareas, plantillas y páginas.",
      "Editor de bloques con TipTap — tablas, fórmulas, menciones y adjuntos — reutilizado por tickets y wiki.",
      "Búsqueda global con paleta de comandos, atajos de teclado y 657 tests entre backend y frontend.",
    ],
    stack: ["Django REST", "PostgreSQL", "Celery", "Channels", "React", "TypeScript", "TipTap"],
    status: "produccion",
    liveUrl: "https://task.screeniadigital.com/",
    media: "taskflow",
    alt: "Demo de TaskFlow, espacio de trabajo para equipos, mostrando el tablero kanban con carriles por responsable y el detalle de un ticket.",
    pow: "¡BAM!",
  },
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
    id: "screenia-plataforma",
    title: "Screenia Plataforma",
    tagline:
      "El sitio de producto que une los dos negocios de una misma pantalla: CMS Pro, que opera la red de pantallas LED, y AdFlow, que vende su espacio publicitario.",
    role: "Desarrollador y responsable del despliegue",
    bullets: [
      "Cuenta dos productos en una sola narrativa, sin que compitan entre sí.",
      "Recorrido de tres pasos que conecta pantalla, operación y venta sin jerga técnica.",
      "Contacto directo por WhatsApp: cero formularios, cero intermediarios.",
    ],
    stack: ["Next.js", "Turbopack", "TypeScript", "Tailwind"],
    status: "produccion",
    liveUrl: "https://plataforma.screeniadigital.com/",
    media: "plataforma",
    alt: "Demo del sitio de Screenia Plataforma, mostrando CMS Pro para operar redes de pantallas LED y AdFlow para vender su espacio publicitario.",
    pow: "¡ZOOM!",
  },
  {
    id: "od-jose-cabana",
    title: "Od. Jose Cabaña",
    tagline:
      "Web de una consulta odontológica en Calabozo, Guárico. Tratamientos, resultados y agenda por WhatsApp, con SEO local para que la encuentre el paciente del barrio.",
    role: "Desarrollador y responsable del despliegue",
    bullets: [
      "Siete tratamientos explicados en lenguaje de paciente, no de ficha clínica.",
      "Galería de antes y después con el contenido clínico desenfocado por defecto.",
      "Sitio estático en Cloudflare Pages, con ubicación y cita por WhatsApp.",
    ],
    stack: ["Next.js", "Turbopack", "TypeScript", "Tailwind", "Cloudflare Pages"],
    status: "produccion",
    liveUrl: "https://od-jose-daconceicao.pages.dev/",
    media: "odontologo",
    alt: "Demo de la web del odontólogo Jose Cabaña, mostrando los tratamientos disponibles y la galería de resultados.",
    pow: "¡FLASH!",
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
