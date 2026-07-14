export type Milestone = {
  readonly id: string;
  readonly org: string;
  readonly role: string;
  readonly period: string;
  readonly body: string;
  readonly badge?: string;
  readonly pow: string;
  readonly tone: "pow" | "bam" | "zing" | "boom";
};

export const timeline: readonly Milestone[] = [
  {
    id: "senati",
    org: "SENATI",
    role: "Ingeniería de Software",
    period: "Feb 2024 – en curso",
    body: "Arranca la carrera de Ingeniería de Software. Base sólida en lógica, algoritmos y fundamentos — la que sostiene todo lo demás.",
    badge: "5.º semestre",
    pow: "¡ZAS!",
    tone: "zing",
  },
  {
    id: "ceu",
    org: "CEU Centro de Especialización",
    role: "Desarrollador de Software Junior",
    period: "Jul 2025 – Dic 2025",
    body: "Primer salto profesional: full stack con React + Django REST Framework, PostgreSQL y despliegues reales en AWS (S3, EC2, CloudFront) con Docker y VPS.",
    pow: "¡BOOM!",
    tone: "bam",
  },
  {
    id: "screenia",
    org: "Screen IA",
    role: "Líder de Equipo de Desarrollo",
    period: "Feb 2026 – actualidad",
    body: "De programador a líder de equipo. Sprints, revisión de pull requests, GitFlow, Docker y AWS — y la responsabilidad de definir cómo escribe código todo el equipo.",
    pow: "¡POW!",
    tone: "pow",
  },
] as const;

export type PipelineStep = {
  readonly id: string;
  readonly title: string;
  readonly body: string;
};

/** El argumento visual del pilar "hago el ciclo completo". */
export const pipeline: readonly PipelineStep[] = [
  {
    id: "idea",
    title: "Idea",
    body: "Todo arranca en un problema real por resolver, y termina en un flujo definido y wireframes.",
  },
  {
    id: "diseno",
    title: "Diseño",
    body: "Paleta, tipografía, componentes: el sistema visual se define antes de tocar código de producción.",
  },
  {
    id: "codigo",
    title: "Código",
    body: "React en el frontend, Django o Node en el backend. Componentes reutilizables, tipado con TypeScript, estándares claros.",
  },
  {
    id: "docker",
    title: "Docker & CI",
    body: "La app se empaqueta en contenedores y pasa por integración continua antes de acercarse a producción.",
  },
  {
    id: "deploy",
    title: "Deploy",
    body: "Cloudflare Pages/Workers, AWS o VPS según el proyecto — con dominio, DNS y SSL configurados de punta a punta.",
  },
  {
    id: "mantenimiento",
    title: "Mantenimiento",
    body: "El trabajo no termina en el deploy: monitoreo, actualizaciones y soporte real, porque el software vivo hay que cuidarlo.",
  },
] as const;
