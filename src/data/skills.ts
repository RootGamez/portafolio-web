export type SkillGroup = {
  readonly id: string;
  readonly title: string;
  readonly hook: string;
  readonly items: readonly string[];
};

export const skillGroups: readonly SkillGroup[] = [
  {
    id: "frontend",
    title: "Frontend",
    hook: "Lo que ve el usuario.",
    items: [
      "React",
      "TypeScript",
      "Next.js",
      "JavaScript (ES6+)",
      "Tailwind CSS",
      "ShadCN",
      "HeroUI",
      "HTML",
      "CSS",
    ],
  },
  {
    id: "backend",
    title: "Backend",
    hook: "Lo que sostiene todo por debajo.",
    items: ["Django", "Django REST Framework", "Node.js", "Hono", "APIs REST", "WebSockets (Channels)"],
  },
  {
    id: "datos",
    title: "Bases de datos",
    hook: "Donde vive la información.",
    items: ["PostgreSQL", "MySQL", "MongoDB", "Redis", "Cloudflare D1"],
  },
  {
    id: "cloud",
    title: "Cloud & Serverless",
    hook: "Del edge a la nube.",
    items: [
      "Cloudflare Workers",
      "Cloudflare Pages",
      "Cloudflare R2",
      "DNS en Cloudflare y migraciones entre proveedores",
      "AWS Lambda",
      "AWS (S3, EC2, CloudFront)",
    ],
  },
  {
    id: "arquitectura",
    title: "Arquitectura & Patrones",
    hook: "Cómo se ordena un sistema.",
    items: [
      "Serverless",
      "Edge computing",
      "Microservicios",
      "APIs REST",
      "Event-driven",
      "Tareas asíncronas (Celery, Redis)",
      "Monorepos",
    ],
  },
  {
    id: "infraestructura",
    title: "Infraestructura & Despliegue",
    hook: "De mi máquina a producción.",
    items: [
      "Docker",
      "CI/CD",
      "VPS (OVH, AWS y otros)",
      "Nginx / Caddy (reverse proxy)",
      "Linux",
      "GitHub / GitFlow",
    ],
  },
  {
    id: "ia",
    title: "IA para ingeniería",
    hook: "Cómo trabajo hoy.",
    items: [
      "Claude / Claude Code (principal)",
      "Agentes y subagentes",
      "Skills y plugins",
      "MCP",
      "Prompt engineering",
      "TDD y code review con IA",
      "Cursor",
      "GitHub Copilot",
    ],
  },
] as const;

/**
 * Lo que ya he usado pero no es el foco de hoy. Va en una linea bajo el bento,
 * no en un panel: sigue a la vista (y para los filtros ATS) sin competir con
 * el stack principal.
 */
export const alsoWorkedWith: readonly string[] = [
  "Flutter",
  "FastAPI",
  "Java",
  "Kotlin",
  "PHP",
  "C#",
  "Fundamentos de IA/ML",
] as const;
