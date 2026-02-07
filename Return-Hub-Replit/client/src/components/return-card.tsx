import { Card } from "@/components/ui/card";
import { CountdownBadge, StatusBadge } from "@/components/countdown-badge";
import { Store, ShoppingBag, DollarSign, Calendar } from "lucide-react";
import type { Return } from "@shared/schema";
import { format } from "date-fns";

interface ReturnCardProps {
  returnItem: Return;
  index: number;
}

export function ReturnCard({ returnItem, index }: ReturnCardProps) {
  const price = parseFloat(returnItem.purchasePrice);
  const isActiveReturn = returnItem.status === "pending" || returnItem.status === "shipped";

  return (
    <Card
      className={`p-4 hover-elevate transition-all duration-200`}
      style={{ animationDelay: `${index * 50}ms` }}
      data-testid={`card-return-${returnItem.id}`}
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
          <StatusBadge status={returnItem.status || "pending"} />
          {isActiveReturn && returnItem.returnDeadline && (
            <CountdownBadge deadline={returnItem.returnDeadline} />
          )}
        </div>
      </div>

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
      <div className="flex items-center gap-4 mt-3 pt-3 border-t border-border/50">
        <div className="h-3 w-16 bg-muted rounded animate-pulse" />
        <div className="h-3 w-24 bg-muted rounded animate-pulse" />
      </div>
    </Card>
  );
}
