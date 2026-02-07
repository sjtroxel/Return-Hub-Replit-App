import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/lib/auth";
import { Redirect } from "wouter";
import { ReturnCard, ReturnCardSkeleton } from "@/components/return-card";
import { AddReturnDialog } from "@/components/add-return-dialog";
import { MobileNav } from "@/components/mobile-nav";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Plus,
  DollarSign,
  AlertTriangle,
  Package,
  TrendingUp,
  Search,
  RotateCcw,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import type { Return } from "@shared/schema";
import { getQueryFn } from "@/lib/queryClient";

function getDaysRemaining(deadline: string): number {
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  const deadlineDate = new Date(deadline);
  deadlineDate.setHours(0, 0, 0, 0);
  return Math.ceil((deadlineDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
}

function StatCard({
  icon: Icon,
  label,
  value,
  subtext,
  colorClass,
}: {
  icon: any;
  label: string;
  value: string;
  subtext?: string;
  colorClass: string;
}) {
  return (
    <Card className="p-4">
      <div className="flex items-center gap-3">
        <div className={`flex items-center justify-center w-9 h-9 rounded-md ${colorClass}`}>
          <Icon className="w-4 h-4" />
        </div>
        <div className="min-w-0">
          <p className="text-xs text-muted-foreground">{label}</p>
          <p className="text-lg font-display font-bold tracking-tight" data-testid={`text-stat-${label.toLowerCase().replace(/\s/g, "-")}`}>
            {value}
          </p>
          {subtext && (
            <p className="text-[10px] text-muted-foreground">{subtext}</p>
          )}
        </div>
      </div>
    </Card>
  );
}

export default function DashboardPage() {
  const { user, isLoading: authLoading } = useAuth();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  const {
    data: returns,
    isLoading,
  } = useQuery<Return[]>({
    queryKey: ["/api/returns"],
    queryFn: getQueryFn({ on401: "throw" }),
    enabled: !!user,
  });

  if (!authLoading && !user) {
    return <Redirect to="/login" />;
  }

  const stats = useMemo(() => {
    if (!returns) return { totalOwed: 0, urgent: 0, active: 0, refunded: 0 };

    const pending = returns.filter((r) => r.status === "pending" || r.status === "shipped");
    const totalOwed = pending.reduce((sum, r) => sum + parseFloat(r.purchasePrice), 0);
    const urgent = pending.filter(
      (r) => r.returnDeadline && getDaysRemaining(r.returnDeadline) <= 3 && getDaysRemaining(r.returnDeadline) > 0
    ).length;
    const active = pending.length;
    const refunded = returns.filter((r) => r.status === "refunded").reduce(
      (sum, r) => sum + parseFloat(r.purchasePrice), 0
    );

    return { totalOwed, urgent, active, refunded };
  }, [returns]);

  const filteredReturns = useMemo(() => {
    if (!returns) return [];
    return returns.filter((r) => {
      const matchesSearch =
        !searchQuery ||
        r.storeName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (r.itemName && r.itemName.toLowerCase().includes(searchQuery.toLowerCase()));
      const matchesStatus = statusFilter === "all" || r.status === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [returns, searchQuery, statusFilter]);

  return (
    <div className="flex flex-col h-full">
      <div className="flex-1 overflow-auto pb-20 lg:pb-0">
        <div className="max-w-5xl mx-auto p-4 md:p-6 space-y-6">
          <div className="flex items-center justify-between gap-4 flex-wrap">
            <div>
              <h1 className="text-xl font-semibold tracking-tight" data-testid="text-welcome">
                Welcome back{user?.email ? `, ${user.email.split("@")[0]}` : ""}!
              </h1>
              <p className="text-sm text-muted-foreground mt-0.5">
                Track and manage your returns
              </p>
            </div>
            <Button
              onClick={() => setDialogOpen(true)}
              className="hidden lg:flex"
              data-testid="button-add-return"
            >
              <Plus className="w-4 h-4 mr-2" />
              Add Return
            </Button>
          </div>

          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            <StatCard
              icon={DollarSign}
              label="Total Owed"
              value={`$${stats.totalOwed.toFixed(2)}`}
              subtext="Active returns"
              colorClass="bg-accent/10 dark:bg-accent/20 text-accent"
            />
            <StatCard
              icon={AlertTriangle}
              label="Urgent"
              value={String(stats.urgent)}
              subtext="< 3 days left"
              colorClass="bg-red-500/10 dark:bg-red-500/20 text-red-500"
            />
            <StatCard
              icon={Package}
              label="Active"
              value={String(stats.active)}
              subtext="Pending / Shipped"
              colorClass="bg-blue-500/10 dark:bg-blue-500/20 text-blue-500"
            />
            <StatCard
              icon={TrendingUp}
              label="Refunded"
              value={`$${stats.refunded.toFixed(2)}`}
              subtext="Money recovered"
              colorClass="bg-emerald-500/10 dark:bg-emerald-500/20 text-emerald-500"
            />
          </div>

          <div className="flex items-center gap-3 flex-wrap">
            <div className="relative flex-1 min-w-[200px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Search returns..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
                data-testid="input-search"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[140px]" data-testid="select-filter-status">
                <SelectValue placeholder="All statuses" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All statuses</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="shipped">Shipped</SelectItem>
                <SelectItem value="refunded">Refunded</SelectItem>
                <SelectItem value="expired">Expired</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {isLoading ? (
            <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
              {Array.from({ length: 3 }).map((_, i) => (
                <ReturnCardSkeleton key={i} />
              ))}
            </div>
          ) : filteredReturns.length === 0 ? (
            <Card className="p-8 text-center">
              <div className="flex flex-col items-center gap-3">
                <div className="flex items-center justify-center w-14 h-14 rounded-full bg-muted">
                  <RotateCcw className="w-6 h-6 text-muted-foreground" />
                </div>
                <div>
                  <h3 className="font-semibold" data-testid="text-empty-title">
                    {searchQuery || statusFilter !== "all"
                      ? "No returns match your filters"
                      : "No returns yet"}
                  </h3>
                  <p className="text-sm text-muted-foreground mt-1">
                    {searchQuery || statusFilter !== "all"
                      ? "Try adjusting your search or filter"
                      : "Track your first return to start protecting your money"}
                  </p>
                </div>
                {!searchQuery && statusFilter === "all" && (
                  <Button
                    onClick={() => setDialogOpen(true)}
                    className="mt-2"
                    data-testid="button-empty-add-return"
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Track your first return
                  </Button>
                )}
              </div>
            </Card>
          ) : (
            <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
              {filteredReturns.map((returnItem, index) => (
                <ReturnCard key={returnItem.id} returnItem={returnItem} index={index} />
              ))}
            </div>
          )}
        </div>
      </div>

      <MobileNav onAddReturn={() => setDialogOpen(true)} />
      <AddReturnDialog open={dialogOpen} onOpenChange={setDialogOpen} />

      <button
        onClick={() => setDialogOpen(true)}
        className="fixed bottom-20 right-4 lg:hidden flex items-center justify-center w-14 h-14 rounded-full bg-accent text-accent-foreground shadow-lg z-40 transition-transform active:scale-95"
        data-testid="button-fab-add-return"
      >
        <Plus className="w-6 h-6" />
      </button>
    </div>
  );
}
