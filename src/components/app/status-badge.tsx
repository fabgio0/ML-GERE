import { AlertTriangle, Ban, CheckCircle2, Clock } from "lucide-react";
import type { BoletoStatus, NotaStatus, ServicoStatus } from "@/lib/finance-data";

export type AppStatus = BoletoStatus | NotaStatus | ServicoStatus;

interface StatusMeta {
  label: string;
  colorClass: string;
  Icon: typeof CheckCircle2;
}

const STATUS_MAP: Record<AppStatus, StatusMeta> = {
  pago: {
    label: "Pago",
    colorClass: "text-success",
    Icon: CheckCircle2,
  },
  autorizada: {
    label: "Autorizada",
    colorClass: "text-success",
    Icon: CheckCircle2,
  },
  autorizado: {
    label: "Autorizado",
    colorClass: "text-success",
    Icon: CheckCircle2,
  },
  aberto: {
    label: "Em aberto",
    colorClass: "text-info",
    Icon: Clock,
  },
  pendente: {
    label: "Pendente",
    colorClass: "text-warning",
    Icon: Clock,
  },
  aguardando: {
    label: "Aguardando",
    colorClass: "text-warning",
    Icon: Clock,
  },
  vencido: {
    label: "Vencido",
    colorClass: "text-destructive",
    Icon: AlertTriangle,
  },
  cancelada: {
    label: "Cancelada",
    colorClass: "text-muted-foreground",
    Icon: Ban,
  },
  negado: {
    label: "Negado",
    colorClass: "text-destructive",
    Icon: Ban,
  },
};

export function StatusBadge({ status }: { status: AppStatus }) {
  const meta = STATUS_MAP[status];
  const Icon = meta.Icon;
  return (
    <span
      className={`inline-flex items-center gap-1 text-xs font-medium whitespace-nowrap ${meta.colorClass}`}
    >
      <Icon className="size-3.5 shrink-0" aria-hidden="true" />
      <span>{meta.label}</span>
    </span>
  );
}
