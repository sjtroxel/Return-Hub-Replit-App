import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { createReturnSchema } from "@shared/schema";
import { z } from "zod";
import { useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import toast from "react-hot-toast";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";
import { useEffect, useRef, useCallback } from "react";

type FormValues = z.infer<typeof createReturnSchema>;

interface AddReturnDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

function formatDeadline(dateString: string): string {
  const date = new Date(dateString);
  date.setDate(date.getDate() + 30);
  return date.toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  });
}

export function AddReturnDialog({ open, onOpenChange }: AddReturnDialogProps) {
  const storeInputRef = useRef<HTMLInputElement>(null);
  const modalRef = useRef<HTMLDivElement>(null);

  const form = useForm<FormValues>({
    resolver: zodResolver(createReturnSchema),
    defaultValues: {
      storeName: "",
      itemName: "",
      purchasePrice: "",
      purchaseDate: new Date().toISOString().split("T")[0],
    },
  });

  const watchDate = form.watch("purchaseDate");

  const createMutation = useMutation({
    mutationFn: async (data: FormValues) => {
      const res = await apiRequest("POST", "/api/returns", data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/returns"] });
      toast.success("Return tracked successfully!");
      form.reset({
        storeName: "",
        itemName: "",
        purchasePrice: "",
        purchaseDate: new Date().toISOString().split("T")[0],
      });
      onOpenChange(false);
    },
    onError: (error: Error) => {
      toast.error(error.message || "Failed to save return");
    },
  });

  const onSubmit = (data: FormValues) => {
    createMutation.mutate(data);
  };

  useEffect(() => {
    if (open) {
      setTimeout(() => {
        storeInputRef.current?.focus();
      }, 100);
    }
  }, [open]);

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

  if (!open) return null;

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onOpenChange(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 bg-black/20 backdrop-blur-sm flex items-center justify-center md:items-center"
      onClick={handleBackdropClick}
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-title"
      data-testid="modal-backdrop"
    >
      <div
        ref={modalRef}
        onClick={(e) => e.stopPropagation()}
        className="w-full bg-background shadow-xl
          fixed bottom-0 rounded-t-2xl p-6 animate-slide-up
          md:static md:max-w-md md:rounded-lg md:animate-none md:mx-4"
        data-testid="modal-content"
      >
        <div className="flex flex-col space-y-1.5 mb-6">
          <h2
            id="modal-title"
            className="text-lg font-semibold leading-none tracking-tight"
            data-testid="text-modal-title"
          >
            Track a Return
          </h2>
          <p className="text-sm text-muted-foreground">
            Add a purchase you might need to return. We'll track the deadline for you.
          </p>
        </div>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="storeName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Store Name</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="e.g., Amazon, Target, Nordstrom"
                      {...field}
                      ref={(e) => {
                        field.ref(e);
                        (storeInputRef as any).current = e;
                      }}
                      aria-required="true"
                      data-testid="input-store-name"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="itemName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Item Name <span className="text-muted-foreground font-normal">(optional)</span></FormLabel>
                  <FormControl>
                    <Input
                      placeholder="e.g., Winter Jacket, Headphones"
                      {...field}
                      data-testid="input-item-name"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="purchasePrice"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Purchase Price</FormLabel>
                  <FormControl>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" data-testid="text-dollar-prefix">
                        $
                      </span>
                      <Input
                        type="number"
                        step="0.01"
                        min="0.01"
                        placeholder="0.00"
                        className="pl-7"
                        {...field}
                        aria-required="true"
                        data-testid="input-purchase-price"
                      />
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="purchaseDate"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Purchase Date</FormLabel>
                  <FormControl>
                    <Input
                      type="date"
                      max={new Date().toISOString().split("T")[0]}
                      {...field}
                      aria-required="true"
                      data-testid="input-purchase-date"
                    />
                  </FormControl>
                  <FormMessage />
                  {watchDate && (
                    <p className="text-sm mt-1 text-accent font-medium" data-testid="text-deadline-preview">
                      Return by: {formatDeadline(watchDate)}
                    </p>
                  )}
                </FormItem>
              )}
            />

            <div className="flex flex-col-reverse gap-2 pt-2 md:flex-row md:justify-between">
              <Button
                type="button"
                variant="ghost"
                onClick={() => onOpenChange(false)}
                className="text-muted-foreground"
                data-testid="button-cancel-return"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={createMutation.isPending}
                className="w-full md:w-auto"
                data-testid="button-save-return"
              >
                {createMutation.isPending ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Saving...
                  </>
                ) : (
                  "Save Return"
                )}
              </Button>
            </div>
          </form>
        </Form>
      </div>
    </div>
  );
}
