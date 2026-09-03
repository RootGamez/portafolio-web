import { CircleCheck, Hourglass, Lock } from "lucide-react";
import type { ProjectStatus } from "@/data/projects";
import { STATUS_LABEL } from "@/data/projects";

type Props = {
  readonly status: ProjectStatus;
};

/**
 * El sello (hanko). El icono NO es decorativo: sin el, alguien con daltonismo
 * no distingue el bermellon del caqui. El estado nunca se comunica solo por
 * color.
 *
 * Los tres rellenos son autocontenidos — no dependen del suelo — porque un
 * sello tiene que leerse igual sobre papel que sobre tinta.
 */
const STYLE: Record<ProjectStatus, string> = {
  produccion: "bg-shu text-washi-hi", // 5.48:1
  privado: "bg-ink text-washi-hi", // 16.54:1
  desarrollo: "bg-kin text-ink", // 9.90:1
};

const ICON: Record<ProjectStatus, typeof CircleCheck> = {
  produccion: CircleCheck,
  privado: Lock,
  desarrollo: Hourglass,
};

export function SealBadge({ status }: Props) {
  const Icon = ICON[status];

  return (
    <span
      className={`inline-flex min-h-7 items-center gap-1.5 border-ink-thin border-ink px-3 py-1 font-mono text-caption uppercase tracking-wide ${STYLE[status]}`}
    >
      <Icon size={14} strokeWidth={3} aria-hidden="true" />
      {STATUS_LABEL[status]}
    </span>
  );
}
