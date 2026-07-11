"use client";
import { forwardRef } from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const button = cva(
  [
    "inline-flex items-center justify-center gap-2 font-semibold text-sm",
    "transition-all rounded-full whitespace-nowrap",
    "disabled:opacity-40 disabled:cursor-not-allowed",
    "active:scale-[0.97]",
  ].join(" "),
  {
    variants: {
      variant: {
        primary: [
          "bg-lime text-ink",
          "shadow-[0_1px_3px_rgba(0,0,0,0.12)]",
          "hover:opacity-90 hover:shadow-[0_2px_8px_rgba(0,0,0,0.15)]",
        ].join(" "),
        dark: [
          "btn-dark text-white",
          "shadow-[0_1px_3px_rgba(0,0,0,0.18),0_0_0_0.5px_rgba(255,255,255,0.06)_inset]",
          "hover:shadow-[0_2px_10px_rgba(0,0,0,0.22)]",
        ].join(" "),
        ghost: [
          "bg-transparent border-[0.5px] border-ink/20 text-ink",
          "hover:bg-ink/6",
        ].join(" "),
        light: [
          "btn-light text-ink border-[0.5px] border-ink/10",
          "shadow-[0_1px_2px_rgba(0,0,0,0.06),0_1px_1px_rgba(255,255,255,0.80)_inset]",
          "hover:shadow-[0_2px_6px_rgba(0,0,0,0.08)]",
          "backdrop-blur-sm",
        ].join(" "),
        danger: [
          "bg-danger text-white",
          "shadow-[0_1px_3px_rgba(0,0,0,0.15)]",
          "hover:opacity-90 hover:shadow-[0_2px_8px_rgba(0,0,0,0.18)]",
        ].join(" "),
        icon: "bg-transparent text-ink hover:bg-black/8 rounded-full p-0",
      },
      size: {
        sm: "px-3.5 py-1.5 text-xs",
        md: "px-5 py-2.5 text-sm",
        lg: "px-7 py-3 text-base",
        icon: "size-9",
      },
    },
    defaultVariants: { variant: "dark", size: "md" },
  },
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof button> {}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  { className, variant, size, style, ...props },
  ref,
) {
  return (
    <button
      ref={ref}
      className={cn(button({ variant, size }), className)}
      style={style}
      {...props}
    />
  );
});
