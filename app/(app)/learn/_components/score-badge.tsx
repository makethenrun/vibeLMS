import { Badge } from "@/components/ui/badge";

export function ScoreBadge({ score }: { score: number | null | undefined }) {
  if (score === undefined) return null;
  if (score === null) return <Badge variant="secondary">На проверке</Badge>;
  const variant = score >= 80 ? "success" : score >= 50 ? "secondary" : "destructive";
  return <Badge variant={variant}>Результат: {score}%</Badge>;
}
