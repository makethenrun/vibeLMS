import type { PaymentStatus } from "@/lib/db/database.types";

const MAP: Record<PaymentStatus, { label: string; cls: string }> = {
  PENDING: { label: "На подтверждении", cls: "bg-amber-100 text-amber-700" },
  CONFIRMED: { label: "Подтверждено", cls: "bg-green-100 text-green-700" },
  REJECTED: { label: "Отклонено", cls: "bg-red-100 text-red-700" },
};

export function PaymentStatusBadge({ status }: { status: PaymentStatus }) {
  const s = MAP[status] ?? MAP.CONFIRMED;
  return <span className={`rounded px-2 py-0.5 text-xs font-medium ${s.cls}`}>{s.label}</span>;
}
