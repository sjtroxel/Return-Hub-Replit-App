import { useLocation, Link } from "wouter";
import { LayoutDashboard, Plus, User, LogOut } from "lucide-react";
import { useAuth } from "@/lib/auth";
import toast from "react-hot-toast";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ThemeToggle } from "@/components/theme-toggle";

export function MobileNav({ onAddReturn }: { onAddReturn?: () => void }) {
  const [location] = useLocation();
  const { user, logout } = useAuth();

  const handleLogout = async () => {
    try {
      await logout();
      toast.success("Logged out successfully");
      window.location.href = "/";
    } catch {
      toast.error("Failed to log out");
    }
  };

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 lg:hidden bg-card border-t border-border">
      <div className="flex items-center justify-around h-16 px-2">
        <Link
          href="/dashboard"
          className={`flex flex-col items-center justify-center gap-1 min-w-[56px] min-h-[44px] rounded-md transition-colors ${
            location === "/dashboard"
              ? "text-accent"
              : "text-muted-foreground"
          }`}
          data-testid="link-mobile-dashboard"
        >
          <LayoutDashboard className="w-5 h-5" />
          <span className="text-[10px] font-medium">Dashboard</span>
        </Link>

        {onAddReturn && (
          <button
            onClick={onAddReturn}
            className="flex items-center justify-center w-12 h-12 rounded-full bg-accent text-accent-foreground shadow-lg -mt-4 transition-transform active:scale-95"
            data-testid="button-mobile-add-return"
          >
            <Plus className="w-6 h-6" />
          </button>
        )}

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button
              className="flex flex-col items-center justify-center gap-1 min-w-[56px] min-h-[44px] rounded-md text-muted-foreground"
              data-testid="button-mobile-menu"
            >
              <User className="w-5 h-5" />
              <span className="text-[10px] font-medium">Account</span>
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48 mb-2">
            {user && (
              <>
                <div className="px-2 py-1.5">
                  <p className="text-xs text-muted-foreground truncate">{user.email}</p>
                </div>
                <DropdownMenuSeparator />
              </>
            )}
            <DropdownMenuItem className="flex items-center gap-2">
              <ThemeToggle variant="ghost" />
              <span>Theme</span>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={handleLogout} data-testid="button-mobile-logout">
              <LogOut className="w-4 h-4 mr-2" />
              Log out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </nav>
  );
}
