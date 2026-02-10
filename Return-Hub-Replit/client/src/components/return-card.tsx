import { Card } from "@/components/ui/card";
import { CountdownBadge, StatusBadge } from "@/components/countdown-badge";
import { Store, ShoppingBag, DollarSign, Calendar, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { Return } from "@shared/schema";
import { format } from "date-fns";

function getDaysRemaining(deadline: string): number {
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  const deadlineDate = new Date(deadline);
  deadlineDate.setHours(0, 0, 0, 0);
  return Math.ceil((deadlineDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
}

export function getComputedStatus(returnItem: Return): string {
  if (returnItem.status === "refunded") return "refunded";
  if (
    returnItem.returnDeadline &&
    getDaysRemaining(returnItem.returnDeadline) < 0 &&
    (returnItem.status === "pending" || returnItem.status === "shipped")
  ) {
    return "expired";
  }
  return returnItem.status || "pending";
}

function getProgressData(purchaseDate: string, deadline: string, status: string) {
  if (status === "refunded") {
    return { percent: 100, color: "gray" as const, daysLeft: 0 };
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const purchase = new Date(purchaseDate);
  purchase.setHours(0, 0, 0, 0);
  const deadlineDate = new Date(deadline);
  deadlineDate.setHours(0, 0, 0, 0);

  const totalDays = Math.max(1, Math.ceil((deadlineDate.getTime() - purchase.getTime()) / 86400000));
  const daysLeft = Math.ceil((deadlineDate.getTime() - today.getTime()) / 86400000);

  if (daysLeft < 0) {
    return { percent: 0, color: "red" as const, daysLeft };
  }

  const percentRemaining = Math.max(0, Math.min(100, (daysLeft / totalDays) * 100));
  const percentElapsed = 100 - percentRemaining;

  let color: "green" | "yellow" | "red";
  if (percentElapsed < 50) color = "green";
  else if (percentElapsed < 75) color = "yellow";
  else color = "red";

  return { percent: percentRemaining, color, daysLeft };
}

function getHumanTime(daysLeft: number, deadline: string, status: string): string {
  if (status === "refunded") return "Refund received";
  if (status === "shipped") return "In transit - awaiting refund";

  const deadlineDate = new Date(deadline);

  if (daysLeft < 0) {
    const abs = Math.abs(daysLeft);
    return `Expired ${abs} day${abs === 1 ? "" : "s"} ago`;
  }

  if (daysLeft === 0) {
    return "Due Today - Last Chance!";
  }

  if (daysLeft === 1) {
    return "Tomorrow at Midnight";
  }

  if (daysLeft <= 3) {
    const dayOfWeek = deadlineDate.toLocaleDateString("en-US", { weekday: "long" });
    return `Due ${dayOfWeek} (${daysLeft} days)`;
  }

  if (daysLeft <= 7) {
    const dayOfWeek = deadlineDate.toLocaleDateString("en-US", { weekday: "long" });
    return `Due ${dayOfWeek}`;
  }

  if (daysLeft <= 14) {
    const dateStr = deadlineDate.toLocaleDateString("en-US", { month: "short", day: "numeric" });
    return `Ends ${dateStr} (${daysLeft} days)`;
  }

  const dateStr = deadlineDate.toLocaleDateString("en-US", { month: "long", day: "numeric" });
  return `Ends ${dateStr}`;
}

const progressBarGradients: Record<string, string> = {
  green: "bg-gradient-to-r from-green-400 to-green-500",
  yellow: "bg-gradient-to-r from-yellow-400 to-orange-400",
  red: "bg-gradient-to-r from-red-500 to-red-600",
  gray: "bg-gray-400 dark:bg-gray-500",
};

interface ReturnCardProps {
  returnItem: Return;
  index: number;
  isUrgent?: boolean;
  onEdit?: (returnItem: Return) => void;
  onDelete?: (returnItem: Return) => void;
  onStatusChange?: (id: string, newStatus: string) => void;
}

export function ReturnCard({ returnItem, index, isUrgent = false, onEdit, onDelete, onStatusChange }: ReturnCardProps) {
  const price = parseFloat(returnItem.purchasePrice);
  const computedStatus = getComputedStatus(returnItem);
  const isActiveReturn = computedStatus === "pending" || computedStatus === "shipped";
  const isRefunded = computedStatus === "refunded";
  const isExpired = computedStatus === "expired";

  const progress = returnItem.returnDeadline
    ? getProgressData(returnItem.purchaseDate, returnItem.returnDeadline, computedStatus)
    : null;

  const humanTime = returnItem.returnDeadline
    ? getHumanTime(progress?.daysLeft ?? 0, returnItem.returnDeadline, computedStatus)
    : null;

  const statusSelectClasses: Record<string, string> = {
    pending: "border-orange-400 text-orange-600 dark:text-orange-400",
    shipped: "border-blue-400 text-blue-600 dark:text-blue-400",
    refunded: "border-emerald-400 text-emerald-600 dark:text-emerald-400",
  };

  const getAvailableStatuses = () => {
    const current = returnItem.status || "pending";
    if (current === "refunded") return ["refunded"];
    if (current === "shipped") return ["shipped", "refunded"];
    return ["pending", "shipped", "refunded"];
  };

  return (
    <Card
      className={`p-4 transition-all duration-200 dark:backdrop-blur-xl dark:bg-white/5 dark:border-white/10 ${onEdit ? "cursor-pointer" : ""} ${
        isUrgent
          ? "ring-2 ring-red-500 dark:ring-red-400 animate-pulse-border shadow-lg shadow-red-500/20"
          : "hover-elevate"
      }`}
      style={{ animationDelay: `${index * 50}ms` }}
      data-testid={`card-return-${returnItem.id}`}
      onClick={() => onEdit?.(returnItem)}
    >
      <div className="flex items-start justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-3 min-w-0 flex-1">
          <div className="flex items-center justify-center w-10 h-10 rounded-md bg-accent/10 dark:bg-accent/20 shrink-0">
            <Store className="w-5 h-5 text-accent" />
          </div>
          <div className="min-w-0">
            <h3 className="font-semibold text-sm truncate" data-testid={`text-store-${returnItem.id}`}>
              {returnItem.storeName}
            </h3>
            {returnItem.itemName && (
              <p className="text-xs text-muted-foreground truncate flex items-center gap-1 mt-0.5" data-testid={`text-item-${returnItem.id}`}>
                <ShoppingBag className="w-3 h-3 shrink-0" />
                {returnItem.itemName}
              </p>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2">
          {isExpired ? (
            <StatusBadge status="expired" />
          ) : (
            <StatusBadge status={returnItem.status || "pending"} />
          )}
          {isActiveReturn && returnItem.returnDeadline && (
            <CountdownBadge deadline={returnItem.returnDeadline} />
          )}
        </div>
      </div>

      {progress && (
        <div className="mt-3" data-testid={`progress-bar-${returnItem.id}`}>
          <div
            className="relative h-2 md:h-1.5 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden"
            role="progressbar"
            aria-valuenow={Math.round(progress.percent)}
            aria-valuemin={0}
            aria-valuemax={100}
            aria-label={`${Math.round(progress.percent)}% time remaining`}
          >
            <div
              className={`absolute inset-y-0 left-0 rounded-full transition-all duration-500 ease-out ${progressBarGradients[progress.color]}`}
              style={{ width: `${progress.percent}%` }}
            />
          </div>
          {humanTime && (
            <p
              className={`text-xs mt-1 font-medium ${
                progress.color === "red" ? "text-red-600 dark:text-red-400" :
                progress.color === "yellow" ? "text-orange-600 dark:text-orange-400" :
                progress.color === "gray" ? "text-muted-foreground" :
                "text-muted-foreground"
              }`}
              data-testid={`text-human-time-${returnItem.id}`}
            >
              {humanTime}
            </p>
          )}
        </div>
      )}

      <div className="flex items-center gap-4 mt-3 pt-3 border-t border-border/50 flex-wrap">
        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <DollarSign className="w-3 h-3" />
          <span className="font-display font-semibold text-foreground" data-testid={`text-price-${returnItem.id}`}>
            ${price.toFixed(2)}
          </span>
        </div>
        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <Calendar className="w-3 h-3" />
          <span data-testid={`text-date-${returnItem.id}`}>
            {format(new Date(returnItem.purchaseDate + "T00:00:00"), "MMM d, yyyy")}
          </span>
        </div>
      </div>

      {(onStatusChange || onDelete) && (
        <div
          className="mt-3 flex items-center justify-between gap-2"
          onClick={(e) => e.stopPropagation()}
        >
          {onStatusChange && (
            <select
              value={returnItem.status || "pending"}
              onChange={(e) => onStatusChange(returnItem.id, e.target.value)}
              disabled={isRefunded}
              className={`text-xs rounded-md border px-2 py-1 bg-transparent transition-colors duration-200 ${
                statusSelectClasses[returnItem.status || "pending"] || ""
              } ${isRefunded ? "opacity-60 cursor-not-allowed" : "cursor-pointer"}`}
              data-testid={`select-status-${returnItem.id}`}
              aria-label="Change return status"
            >
              {getAvailableStatuses().map((s) => (
                <option key={s} value={s}>
                  {s.charAt(0).toUpperCase() + s.slice(1)}
                </option>
              ))}
            </select>
          )}
          {onDelete && (
            <Button
              size="icon"
              variant="ghost"
              onClick={(e) => {
                e.stopPropagation();
                onDelete(returnItem);
              }}
              className="text-muted-foreground"
              aria-label="Delete return"
              data-testid={`button-delete-${returnItem.id}`}
            >
              <Trash2 className="w-4 h-4" />
            </Button>
          )}
        </div>
      )}
    </Card>
  );
}

export function ReturnCardSkeleton() {
  return (
    <Card className="p-4">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-md bg-muted animate-pulse" />
          <div className="space-y-2">
            <div className="h-4 w-24 bg-muted rounded animate-pulse" />
            <div className="h-3 w-32 bg-muted rounded animate-pulse" />
          </div>
        </div>
        <div className="flex gap-2">
          <div className="h-5 w-16 bg-muted rounded-full animate-pulse" />
          <div className="h-5 w-16 bg-muted rounded-full animate-pulse" />
        </div>
      </div>
      <div className="mt-3">
        <div className="h-1.5 w-full bg-muted rounded-full animate-pulse" />
        <div className="h-3 w-24 bg-muted rounded animate-pulse mt-1" />
      </div>
      <div className="flex items-center gap-4 mt-3 pt-3 border-t border-border/50">
        <div className="h-3 w-16 bg-muted rounded animate-pulse" />
        <div className="h-3 w-24 bg-muted rounded animate-pulse" />
      </div>
    </Card>
  );
}
