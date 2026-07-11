"use client";
import { forwardRef } from "react";
import { cn } from "@/lib/utils";

export const Input = forwardRef<HTMLInputElement, React.InputHTMLAttributes<HTMLInputElement>>(
  function Input({ className, ...props }, ref) {
    return (
      <input
        ref={ref}
        className={cn(
          "w-full rounded-xl border border-ink/10 bg-white px-3 py-2 text-sm",
          "outline-none focus:border-ink focus:ring-2 focus:ring-lime/40 transition",
          className,
        )}
        {...props}
      />
    );
  },
);

export const Textarea = forwardRef<HTMLTextAreaElement, React.TextareaHTMLAttributes<HTMLTextAreaElement>>(
  function Textarea({ className, ...props }, ref) {
    return (
      <textarea
        ref={ref}
        className={cn(
          "w-full rounded-xl border border-ink/10 bg-white px-3 py-2 text-sm resize-none",
          "outline-none focus:border-ink focus:ring-2 focus:ring-lime/40 transition",
          className,
        )}
        {...props}
      />
    );
  },
);
