import { useState, useMemo, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useAuth } from "@/lib/auth";
import { Redirect, useLocation } from "wouter";
import confetti from "canvas-confetti";
import { ReturnCard, ReturnCardSkeleton, getComputedStatus } from "@/components/return-card";
import { AddReturnDialog } from "@/components/add-return-dialog";
import { DeleteConfirmDialog } from "@/components/delete-confirm-dialog";
import { MobileNav } from "@/components/mobile-nav";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  Plus,
  DollarSign,
  AlertTriangle,
  Package,
  TrendingUp,
  Search,
  RotateCcw,
  SearchX,
  ChevronDown,
  Bell,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import type { Return } from "@shared/schema";
import { apiRequest, getQueryFn, queryClient } from "@/lib/queryClient";
import toast from "react-hot-toast";
import { startNotificationWatcher, checkAndSendNotifications } from "@/utils/notifications";

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
  urgentActive,
}: {
  icon: any;
  label: string;
  value: string;
  subtext?: string;
  colorClass: string;
  urgentActive?: boolean;
}) {
  return (
    <Card className="p-4 dark:backdrop-blur-xl dark:bg-white/5 dark:border-white/10">
      <div className="flex items-center gap-3">
        <div className={`flex items-center justify-center w-9 h-9 rounded-md ${colorClass}`}>
          <Icon className="w-4 h-4" />
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center justify-between gap-1">
            <p className="text-xs text-muted-foreground">{label}</p>
            {urgentActive && (
              <div className="animate-pulse" data-testid="icon-urgent-alert">
                <AlertTriangle className="w-4 h-4 text-red-500" />
              </div>
            )}
          </div>
          <p className={`text-lg font-display font-bold tracking-tight ${urgentActive ? "text-red-600 dark:text-red-400" : ""}`} data-testid={`text-stat-${label.toLowerCase().replace(/\s/g, "-")}`}>
            {value}
          </p>
          {subtext && (
            <p className="text-[10px] text-muted-foreground">{subtext}</p>
          )}
          {urgentActive && (
            <p className="text-[10px] text-red-600 dark:text-red-400 font-medium" data-testid="text-urgent-action">
              Requires immediate action
            </p>
          )}
        </div>
      </div>
    </Card>
  );
}

const FILTER_OPTIONS = ["All", "Pending", "Shipped", "Refunded", "Expired"] as const;
type FilterOption = (typeof FILTER_OPTIONS)[number];

const SORT_OPTIONS = [
  { value: "deadline-asc", label: "Deadline (Soonest)" },
  { value: "price-desc", label: "Price (Highest)" },
  { value: "date-desc", label: "Date (Newest)" },
] as const;

export default function DashboardPage() {
  const { user, isLoading: authLoading } = useAuth();
  const [, setLocation] = useLocation();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeFilter, setActiveFilter] = useState<FilterOption>("All");
  const [sortBy, setSortBy] = useState("deadline-asc");
  const [editReturn, setEditReturn] = useState<Return | null>(null);
  const [deleteReturn, setDeleteReturn] = useState<Return | null>(null);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [notificationsEnabled, setNotificationsEnabled] = useState(false);
  const [notificationsDismissed, setNotificationsDismissed] = useState(false);
  const [demoBannerDismissed, setDemoBannerDismissed] = useState(
    () => localStorage.getItem("demo-banner-dismissed") === "true"
  );

  const isGuest = (user as any)?.isGuest === true;

  useEffect(() => {
    const savedPref = localStorage.getItem("notifications-enabled");
    const dismissed = localStorage.getItem("notifications-dismissed");

    if (dismissed === "true") {
      setNotificationsDismissed(true);
    }

    if (savedPref === "granted") {
      setNotificationsEnabled(true);
    }
  }, []);

  const {
    data: returns,
    isLoading,
  } = useQuery<Return[]>({
    queryKey: ["/api/returns"],
    queryFn: getQueryFn({ on401: "throw" }),
    enabled: !!user,
  });

  useEffect(() => {
    if (returns && returns.length > 0 && notificationsEnabled) {
      const watcherId = startNotificationWatcher(returns);
      return () => clearInterval(watcherId);
    }
  }, [returns, notificationsEnabled]);

  useEffect(() => {
    if (returns && returns.length > 0 && notificationsEnabled) {
      const handleVisibilityChange = () => {
        if (document.visibilityState === "visible") {
          checkAndSendNotifications(returns);
        }
      };

      document.addEventListener("visibilitychange", handleVisibilityChange);
      return () => document.removeEventListener("visibilitychange", handleVisibilityChange);
    }
  }, [returns, notificationsEnabled]);

  const statusChangeMutation = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      const res = await apiRequest("PUT", `/api/returns/${id}`, { status });
      return res.json();
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ["/api/returns"] });
      if (variables.status === "refunded") {
        confetti({
          particleCount: 100,
          spread: 80,
          origin: { y: 0.6 },
          colors: ["#22c55e", "#16a34a", "#4ade80", "#86efac"],
        });
        toast.success("Money secured! Refund tracked.");
      } else {
        toast.success(`Marked as ${variables.status}`);
      }
    },
    onError: (error: Error) => {
      toast.error(error.message || "Failed to update status");
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await apiRequest("DELETE", `/api/returns/${id}`);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/returns"] });
      toast.success("Return deleted");
      setDeleteModalOpen(false);
      setDeleteReturn(null);
    },
    onError: (error: Error) => {
      toast.error(error.message || "Failed to delete return");
    },
  });

  if (!authLoading && !user) {
    return <Redirect to="/login" />;
  }

  const stats = useMemo(() => {
    if (!returns) return { totalOwed: 0, urgent: 0, active: 0, refunded: 0 };

    let totalOwed = 0;
    let urgent = 0;
    let active = 0;
    let refundedAmount = 0;

    returns.forEach((r) => {
      const computed = getComputedStatus(r);

      if (computed === "pending" || computed === "shipped") {
        totalOwed += parseFloat(r.purchasePrice);
        active++;

        if (
          r.returnDeadline &&
          getDaysRemaining(r.returnDeadline) <= 3 &&
          getDaysRemaining(r.returnDeadline) >= 0
        ) {
          urgent++;
        }
      }

      if (computed === "refunded") {
        refundedAmount += parseFloat(r.purchasePrice);
      }
    });

    return { totalOwed, urgent, active, refunded: refundedAmount };
  }, [returns]);

  const filterCounts = useMemo(() => {
    if (!returns) return { Pending: 0, Shipped: 0, Refunded: 0, Expired: 0 };

    const counts = { Pending: 0, Shipped: 0, Refunded: 0, Expired: 0 };
    returns.forEach((r) => {
      const computed = getComputedStatus(r);
      if (computed === "pending") counts.Pending++;
      else if (computed === "shipped") counts.Shipped++;
      else if (computed === "refunded") counts.Refunded++;
      else if (computed === "expired") counts.Expired++;
    });
    return counts;
  }, [returns]);

  const sortedReturns = useMemo(() => {
    if (!returns) return [];

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    let filtered = returns.filter((r) => {
      const matchesSearch =
        !searchQuery ||
        r.storeName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (r.itemName && r.itemName.toLowerCase().includes(searchQuery.toLowerCase()));

      if (!matchesSearch) return false;

      if (activeFilter === "All") return true;
      const computed = getComputedStatus(r);
      return computed === activeFilter.toLowerCase();
    });

    const withUrgency = filtered.map((r) => {
      const computed = getComputedStatus(r);
      let daysLeft = Infinity;
      if (r.returnDeadline) {
        const deadline = new Date(r.returnDeadline);
        deadline.setHours(0, 0, 0, 0);
        daysLeft = Math.ceil((deadline.getTime() - today.getTime()) / 86400000);
      }
      const isUrgent = daysLeft >= 0 && daysLeft <= 3 && computed !== "refunded" && computed !== "expired";
      return { ...r, daysLeft, isUrgent };
    });

    withUrgency.sort((a, b) => {
      if (a.isUrgent && b.isUrgent) {
        return a.daysLeft - b.daysLeft;
      }
      if (a.isUrgent) return -1;
      if (b.isUrgent) return 1;

      if (sortBy === "deadline-asc") {
        const da = a.returnDeadline ? new Date(a.returnDeadline).getTime() : Infinity;
        const db = b.returnDeadline ? new Date(b.returnDeadline).getTime() : Infinity;
        return da - db;
      }
      if (sortBy === "price-desc") {
        return parseFloat(b.purchasePrice) - parseFloat(a.purchasePrice);
      }
      if (sortBy === "date-desc") {
        return new Date(b.purchaseDate).getTime() - new Date(a.purchaseDate).getTime();
      }
      return 0;
    });

    return withUrgency;
  }, [returns, searchQuery, activeFilter, sortBy]);

  const urgentCount = useMemo(() => sortedReturns.filter((r) => r.isUrgent).length, [sortedReturns]);

  const handleEditClick = (returnItem: Return) => {
    setEditReturn(returnItem);
    setDialogOpen(true);
  };

  const handleAddNew = () => {
    setEditReturn(null);
    setDialogOpen(true);
  };

  const handleDialogClose = (open: boolean) => {
    setDialogOpen(open);
    if (!open) {
      setEditReturn(null);
    }
  };

  const handleDeleteClick = (returnItem: Return) => {
    setDeleteReturn(returnItem);
    setDeleteModalOpen(true);
  };

  const handleConfirmDelete = () => {
    if (deleteReturn) {
      deleteMutation.mutate(deleteReturn.id);
    }
  };

  const handleStatusChange = (id: string, newStatus: string) => {
    statusChangeMutation.mutate({ id, status: newStatus });
  };

  const resetFilters = () => {
    setSearchQuery("");
    setActiveFilter("All");
    setSortBy("deadline-asc");
  };

  const hasActiveFilters = searchQuery || activeFilter !== "All";

  const handleEnableNotifications = async () => {
    if (!("Notification" in window)) return;
    const permission = await Notification.requestPermission();
    localStorage.setItem("notifications-enabled", permission);
    setNotificationsEnabled(permission === "granted");
    if (permission !== "granted") {
      toast.error("Notifications blocked. You can enable them in your browser settings.");
    } else {
      toast.success("Deadline reminders enabled!");
    }
  };

  const handleDismissNotificationBanner = () => {
    setNotificationsDismissed(true);
    localStorage.setItem("notifications-dismissed", "true");
  };

  const showNotificationBanner =
    !notificationsEnabled &&
    !notificationsDismissed &&
    "Notification" in (typeof window !== "undefined" ? window : {});

  return (
    <div className="flex flex-col h-full">
      <div className="flex-1 overflow-auto pb-20 lg:pb-0">
        <div className="max-w-5xl mx-auto p-4 md:p-6 space-y-6">
          <div className="flex items-center justify-between gap-4 flex-wrap">
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-xl font-semibold tracking-tight" data-testid="text-welcome">
                  {isGuest ? "Welcome to ReturnHub!" : `Welcome back${user?.email ? `, ${user.email.split("@")[0]}` : ""}!`}
                </h1>
                {isGuest && (
                  <span
                    className="px-2 py-0.5 text-xs font-medium rounded-md bg-accent/15 text-accent border border-accent/30"
                    role="status"
                    data-testid="badge-demo-mode"
                  >
                    Demo Mode
                  </span>
                )}
              </div>
              <p className="text-sm text-muted-foreground mt-0.5">
                Track and manage your returns
              </p>
            </div>
            <Button
              onClick={handleAddNew}
              className="hidden lg:flex"
              data-testid="button-add-return"
            >
              <Plus className="w-4 h-4 mr-2" />
              Add Return
            </Button>
          </div>

          {isGuest && !demoBannerDismissed && (
            <div className="p-4 bg-accent/5 border border-accent/20 rounded-md flex items-start justify-between gap-3" data-testid="banner-demo">
              <div className="flex-1">
                <p className="text-sm font-medium">
                  You're using Demo Mode
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  All data will be deleted after 48 hours. Create a real account to keep your returns.
                </p>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <button
                  onClick={() => setLocation("/signup")}
                  className="text-sm font-medium text-accent"
                  data-testid="button-demo-signup"
                >
                  Sign Up
                </button>
                <button
                  onClick={() => {
                    localStorage.setItem("demo-banner-dismissed", "true");
                    setDemoBannerDismissed(true);
                  }}
                  className="text-sm text-muted-foreground"
                  data-testid="button-demo-dismiss"
                >
                  Dismiss
                </button>
              </div>
            </div>
          )}

          {showNotificationBanner && (
            <div className="p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-md flex items-start gap-3" data-testid="banner-notifications">
              <Bell className="text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5 w-5 h-5" />
              <div className="flex-1">
                <p className="text-sm font-medium text-blue-900 dark:text-blue-100">
                  Get deadline reminders
                </p>
                <p className="text-xs text-blue-700 dark:text-blue-300 mt-1">
                  Enable browser notifications to get daily alerts when returns are expiring soon.
                </p>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <button
                  onClick={handleEnableNotifications}
                  className="text-sm font-medium text-blue-600 dark:text-blue-400"
                  data-testid="button-enable-notifications"
                >
                  Enable
                </button>
                <button
                  onClick={handleDismissNotificationBanner}
                  className="text-sm text-blue-500/60 dark:text-blue-400/60"
                  data-testid="button-dismiss-notifications"
                  aria-label="Dismiss notification banner"
                >
                  Dismiss
                </button>
              </div>
            </div>
          )}

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
              subtext={stats.urgent > 0 ? undefined : "< 3 days left"}
              colorClass="bg-red-500/10 dark:bg-red-500/20 text-red-500"
              urgentActive={stats.urgent > 0}
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

          <div className="space-y-3">
            <div className="flex items-center gap-3 flex-wrap">
              <div className="relative flex-1 min-w-[200px]">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="Search by store or item name..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9"
                  data-testid="input-search"
                />
              </div>
              <div className="relative">
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className="appearance-none bg-background border rounded-md px-3 pr-8 h-9 text-sm cursor-pointer focus:outline-none focus:ring-2 focus:ring-ring"
                  data-testid="select-sort"
                >
                  {SORT_OPTIONS.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
                <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
              </div>
            </div>

            <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide" data-testid="filter-chips">
              {FILTER_OPTIONS.map((filter) => {
                const isActive = activeFilter === filter;
                const count = filter !== "All" ? filterCounts[filter as keyof typeof filterCounts] : null;
                return (
                  <button
                    key={filter}
                    onClick={() => setActiveFilter(filter)}
                    className={`whitespace-nowrap px-3 py-1.5 rounded-md text-sm font-medium transition-colors duration-200 ${
                      isActive
                        ? "bg-primary text-primary-foreground shadow-sm"
                        : "bg-muted text-muted-foreground"
                    }`}
                    data-testid={`chip-${filter.toLowerCase()}`}
                  >
                    {filter}
                    {count !== null && (
                      <span className={`ml-1.5 text-xs ${isActive ? "opacity-80" : "opacity-60"}`}>
                        ({count})
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {isLoading ? (
            <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
              {Array.from({ length: 3 }).map((_, i) => (
                <ReturnCardSkeleton key={i} />
              ))}
            </div>
          ) : sortedReturns.length === 0 ? (
            <Card className="p-8 text-center">
              <div className="flex flex-col items-center gap-3">
                <div className="flex items-center justify-center w-14 h-14 rounded-full bg-muted">
                  {hasActiveFilters ? (
                    <SearchX className="w-6 h-6 text-muted-foreground" />
                  ) : (
                    <RotateCcw className="w-6 h-6 text-muted-foreground" />
                  )}
                </div>
                <div>
                  <h3 className="font-semibold" data-testid="text-empty-title">
                    {hasActiveFilters
                      ? "No matches found"
                      : "No returns yet"}
                  </h3>
                  <p className="text-sm text-muted-foreground mt-1">
                    {hasActiveFilters
                      ? "Try adjusting your search or filters"
                      : "Track your first return to start protecting your money"}
                  </p>
                </div>
                {hasActiveFilters ? (
                  <Button
                    variant="outline"
                    onClick={resetFilters}
                    className="mt-2"
                    data-testid="button-reset-filters"
                  >
                    Reset Filters
                  </Button>
                ) : (
                  <Button
                    onClick={handleAddNew}
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
            <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3" data-testid="returns-grid">
              {sortedReturns.map((returnItem, index) => {
                const showDivider =
                  index > 0 &&
                  sortedReturns[index - 1].isUrgent &&
                  !returnItem.isUrgent;

                return (
                  <div key={returnItem.id} className={showDivider ? "col-span-full contents" : "contents"}>
                    {showDivider && (
                      <div className="col-span-full my-4 flex items-center gap-4" data-testid="divider-urgent">
                        <div className="flex-1 border-t-2 border-dashed border-gray-300 dark:border-gray-600" />
                        <span className="text-xs font-medium text-muted-foreground whitespace-nowrap">
                          Other Returns
                        </span>
                        <div className="flex-1 border-t-2 border-dashed border-gray-300 dark:border-gray-600" />
                      </div>
                    )}
                    <ReturnCard
                      returnItem={returnItem}
                      index={index}
                      isUrgent={returnItem.isUrgent}
                      onEdit={handleEditClick}
                      onDelete={handleDeleteClick}
                      onStatusChange={handleStatusChange}
                    />
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      <MobileNav onAddReturn={handleAddNew} />
      <AddReturnDialog
        open={dialogOpen}
        onOpenChange={handleDialogClose}
        returnToEdit={editReturn}
      />
      <DeleteConfirmDialog
        open={deleteModalOpen}
        onOpenChange={(open) => {
          setDeleteModalOpen(open);
          if (!open) setDeleteReturn(null);
        }}
        returnToDelete={deleteReturn}
        onConfirm={handleConfirmDelete}
        isPending={deleteMutation.isPending}
      />

      <button
        onClick={handleAddNew}
        className="fixed bottom-20 right-4 lg:hidden flex items-center justify-center w-14 h-14 rounded-full bg-accent text-accent-foreground shadow-lg z-40 transition-transform active:scale-95"
        data-testid="button-fab-add-return"
      >
        <Plus className="w-6 h-6" />
      </button>
    </div>
  );
}
