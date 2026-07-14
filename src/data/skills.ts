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
    items: ["Django", "Django REST Framework", "Node.js", "Hono", "APIs REST"],
  },
  {
    id: "datos",
    title: "Bases de datos",
    hook: "Donde vive la información.",
    items: ["PostgreSQL", "MySQL", "MongoDB", "Redis", "Cloudflare D1"],
  },
  {
    id: "cloud",
    title: "Cloud & DevOps",
    hook: "De mi máquina a producción.",
    items: [
      "AWS (EC2, S3, CloudFront)",
      "Cloudflare (Workers, Pages, D1, R2)",
      "Docker",
      "VPS",
      "Nginx / Caddy",
      "Linux",
    ],
  },
  {
    id: "herramientas",
    title: "Herramientas",
    hook: "Cómo trabajo en equipo.",
    items: ["GitHub / GitFlow", "Monorepos pnpm", "Dominios y DNS", "Proxies"],
  },
  {
    id: "otros",
    title: "Otros",
    hook: "Lo que sigo explorando.",
    items: [
      "Next.js",
      "Flutter",
      "FastAPI",
      "WebSockets",
      "Celery",
      "Java",
      "Kotlin",
      "PHP",
      "C#",
      "Fundamentos de IA/ML",
    ],
  },
] as const;
