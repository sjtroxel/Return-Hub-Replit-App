import { Button } from "@/components/ui/button";
import { Loader2, AlertTriangle } from "lucide-react";
import { useEffect, useCallback } from "react";
import type { Return } from "@shared/schema";

interface DeleteConfirmDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  returnToDelete: Return | null;
  onConfirm: () => void;
  isPending: boolean;
}

export function DeleteConfirmDialog({
  open,
  onOpenChange,
  returnToDelete,
  onConfirm,
  isPending,
}: DeleteConfirmDialogProps) {
  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === "Escape" && open) {
        onOpenChange(false);
      }
    },
    [open, onOpenChange]
  );

  useEffect(() => {
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [handleKeyDown]);

  useEffect(() => {
    if (open) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  if (!open || !returnToDelete) return null;

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onOpenChange(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 bg-black/20 backdrop-blur-sm flex items-center justify-center"
      onClick={handleBackdropClick}
      role="dialog"
      aria-modal="true"
      aria-labelledby="delete-modal-title"
      data-testid="delete-modal-backdrop"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-full bg-background shadow-xl
          fixed bottom-0 rounded-t-2xl p-6 animate-slide-up
          md:static md:max-w-sm md:rounded-lg md:animate-none md:mx-4"
        data-testid="delete-modal-content"
      >
        <div className="flex items-center gap-3 mb-4">
          <div className="flex items-center justify-center w-10 h-10 rounded-md bg-destructive/10 shrink-0">
            <AlertTriangle className="w-5 h-5 text-destructive" />
          </div>
          <h2
            id="delete-modal-title"
            className="text-lg font-semibold leading-none tracking-tight"
            data-testid="text-delete-title"
          >
            Delete Return?
          </h2>
        </div>

        <p className="text-sm text-muted-foreground mb-6">
          Delete this return from <strong className="text-foreground">{returnToDelete.storeName}</strong>
          {returnToDelete.itemName ? ` (${returnToDelete.itemName})` : ""}? This action cannot be undone.
        </p>

        <div className="flex flex-col-reverse gap-2 md:flex-row md:justify-end">
          <Button
            type="button"
            variant="ghost"
            onClick={() => onOpenChange(false)}
            disabled={isPending}
            className="text-muted-foreground"
            data-testid="button-cancel-delete"
          >
            Cancel
          </Button>
          <Button
            type="button"
            variant="destructive"
            onClick={onConfirm}
            disabled={isPending}
            data-testid="button-confirm-delete"
          >
            {isPending ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Deleting...
              </>
            ) : (
              "Delete"
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}
