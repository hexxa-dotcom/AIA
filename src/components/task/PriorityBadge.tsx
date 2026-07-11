import type { Priority } from "@/lib/types";
import { Badge } from "@/components/ui/Badge";
import { priorityColor } from "@/lib/utils";

const LABELS: Record<Priority, string> = {
  low: "baixa",
  medium: "média",
  high: "alta",
  urgent: "urgente",
};

export function PriorityBadge({ priority }: { priority: Priority }) {
  return <Badge color={priorityColor(priority)}>{LABELS[priority]}</Badge>;
}
