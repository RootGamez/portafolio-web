import { CircleCheck, Hourglass, Lock } from "lucide-react";
import type { ProjectStatus } from "@/data/projects";
import { STATUS_LABEL } from "@/data/projects";

type Props = {
  readonly status: ProjectStatus;
};

/**
 * El icono NO es decorativo: sin el, alguien con daltonismo no distingue el
 * verde del ambar. El estado nunca se comunica solo por color.
 */
const STYLE: Record<ProjectStatus, string> = {
  produccion: "bg-success text-ink", // 8.69:1
  privado: "bg-neutral text-paper", // 10.40:1
  desarrollo: "bg-warning text-ink", // 11.42:1
};

const ICON: Record<ProjectStatus, typeof CircleCheck> = {
  produccion: CircleCheck,
  privado: Lock,
  desarrollo: Hourglass,
};

export function StatusBadge({ status }: Props) {
  const Icon = ICON[status];

  return (
    <span
      className={`inline-flex min-h-7 items-center gap-1.5 rounded-full border-comic border-ink px-3 py-1 font-display text-caption uppercase shadow-hard-xs ${STYLE[status]}`}
    >
      <Icon size={14} strokeWidth={3} aria-hidden="true" />
      {STATUS_LABEL[status]}
    </span>
  );
}
