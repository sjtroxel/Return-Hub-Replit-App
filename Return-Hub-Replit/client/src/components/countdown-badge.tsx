import { Badge } from "@/components/ui/badge";
import { Clock, AlertTriangle, XCircle } from "lucide-react";

function getDaysRemaining(deadline: string): number {
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  const deadlineDate = new Date(deadline);
  deadlineDate.setHours(0, 0, 0, 0);
  const diff = deadlineDate.getTime() - now.getTime();
  return Math.ceil(diff / (1000 * 60 * 60 * 24));
}

function getUrgencyConfig(days: number) {
  if (days < 0) {
    return {
      bg: "bg-destructive/10 dark:bg-destructive/20",
      text: "text-destructive",
      icon: XCircle,
      label: "Expired",
    };
  }
  if (days === 0) {
    return {
      bg: "bg-red-500/10 dark:bg-red-500/20",
      text: "text-red-600 dark:text-red-400",
      icon: AlertTriangle,
      label: "Due today",
    };
  }
  if (days <= 3) {
    return {
      bg: "bg-red-500/10 dark:bg-red-500/20",
      text: "text-red-600 dark:text-red-400",
      icon: AlertTriangle,
      label: `${days}d left`,
    };
  }
  if (days <= 7) {
    return {
      bg: "bg-orange-500/10 dark:bg-orange-500/20",
      text: "text-orange-600 dark:text-orange-400",
      icon: Clock,
      label: `${days}d left`,
    };
  }
  if (days <= 14) {
    return {
      bg: "bg-yellow-500/10 dark:bg-yellow-500/20",
      text: "text-yellow-600 dark:text-yellow-400",
      icon: Clock,
      label: `${days}d left`,
    };
  }
  return {
    bg: "bg-emerald-500/10 dark:bg-emerald-500/20",
    text: "text-emerald-600 dark:text-emerald-400",
    icon: Clock,
    label: `${days}d left`,
  };
}

export function CountdownBadge({ deadline }: { deadline: string }) {
  const days = getDaysRemaining(deadline);
  const config = getUrgencyConfig(days);
  const Icon = config.icon;

  return (
    <Badge
      variant="outline"
      className={`${config.bg} ${config.text} border-0 font-display font-semibold gap-1 no-default-hover-elevate no-default-active-elevate`}
      data-testid={`badge-countdown-${days}`}
    >
      <Icon className="w-3 h-3" />
      {config.label}
    </Badge>
  );
}

export function StatusBadge({ status }: { status: string }) {
  const configs: Record<string, { bg: string; text: string }> = {
    pending: {
      bg: "bg-blue-500/10 dark:bg-blue-500/20",
      text: "text-blue-600 dark:text-blue-400",
    },
    shipped: {
      bg: "bg-purple-500/10 dark:bg-purple-500/20",
      text: "text-purple-600 dark:text-purple-400",
    },
    refunded: {
      bg: "bg-emerald-500/10 dark:bg-emerald-500/20",
      text: "text-emerald-600 dark:text-emerald-400",
    },
    expired: {
      bg: "bg-destructive/10 dark:bg-destructive/20",
      text: "text-destructive",
    },
  };

  const config = configs[status] || configs.pending;

  return (
    <Badge
      variant="outline"
      className={`${config.bg} ${config.text} border-0 capitalize no-default-hover-elevate no-default-active-elevate`}
      data-testid={`badge-status-${status}`}
    >
      {status}
    </Badge>
  );
}
