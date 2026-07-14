"use client";
import * as DialogPrimitive from "@radix-ui/react-dialog";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";

export const Dialog = DialogPrimitive.Root;
export const DialogTrigger = DialogPrimitive.Trigger;
export const DialogClose = DialogPrimitive.Close;

export function DialogContent({
  children,
  className,
  size = "md",
}: {
  children: React.ReactNode;
  className?: string;
  size?: "sm" | "md" | "lg" | "xl" | "2xl" | "3xl";
}) {
  const sizes = {
    sm: "sm:max-w-md",
    md: "sm:max-w-xl",
    lg: "sm:max-w-3xl",
    xl: "sm:max-w-5xl",
    "2xl": "sm:max-w-6xl",
    "3xl": "sm:max-w-7xl",
  };
  return (
    <DialogPrimitive.Portal>
      <DialogPrimitive.Overlay className="fixed inset-0 z-40 data-[state=open]:animate-in data-[state=closed]:animate-out fade-in" style={{ background: "rgba(14,11,12,0.60)", backdropFilter: "blur(8px)", WebkitBackdropFilter: "blur(8px)" }} />
      <DialogPrimitive.Content
        className={cn(
          // Mobile: full-screen bottom sheet acima do bottom nav
          "fixed z-50 outline-none flex flex-col glass",
          "inset-x-0 bottom-16 rounded-t-3xl max-h-[84dvh]",
          // Desktop: centered modal
          "sm:inset-auto sm:left-1/2 sm:top-1/2 sm:-translate-x-1/2 sm:-translate-y-1/2",
          "sm:w-[92vw] sm:rounded-3xl sm:shadow-2xl sm:max-h-[90vh]",
          "overflow-hidden fade-in",
          sizes[size],
          className,
        )}
      >
        {/* Mobile drag handle */}
        <div className="sm:hidden flex justify-center pt-3 pb-1 shrink-0">
          <div className="w-10 h-1 rounded-full bg-ink/15" />
        </div>
        {children}
        <DialogPrimitive.Close className="absolute right-4 top-4 rounded-full p-2 hover:bg-black/5 transition">
          <X size={18} />
        </DialogPrimitive.Close>
      </DialogPrimitive.Content>
    </DialogPrimitive.Portal>
  );
}

export function DialogTitle({ children, className }: { children: React.ReactNode; className?: string }) {
  return <DialogPrimitive.Title className={cn("text-xl font-bold pr-10", className)}>{children}</DialogPrimitive.Title>;
}

export function DialogDescription({ children }: { children: React.ReactNode }) {
  return <DialogPrimitive.Description className="text-sm text-muted">{children}</DialogPrimitive.Description>;
}
