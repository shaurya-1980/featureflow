import { cva } from "class-variance-authority";
import * as React from "react";
import { cn } from "@/lib/utils";

const alertVariants = cva(
  "relative grid w-full items-start gap-x-2.5 gap-y-1 rounded-xl border p-4 text-card-foreground text-sm",
  {
    defaultVariants: {
      variant: "default",
    },
    variants: {
      variant: {
        default: "bg-muted/50 border-border text-foreground [&>svg]:text-muted-foreground",
        error: "border-destructive/30 bg-destructive/10 text-destructive dark:bg-destructive/15 dark:border-destructive/30 [&>svg]:text-destructive",
        info: "border-blue-500/30 bg-blue-500/10 text-blue-600 dark:text-blue-400 dark:bg-blue-500/15 [&>svg]:text-blue-500",
        success: "border-emerald-500/30 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 dark:bg-emerald-500/15 [&>svg]:text-emerald-500",
        warning: "border-amber-500/30 bg-amber-500/10 text-amber-600 dark:text-amber-400 dark:bg-amber-500/15 [&>svg]:text-amber-500",
      },
    },
  },
);

export function Alert({
  className,
  variant,
  ...props
}) {
  return (
    <div
      className={cn(alertVariants({ variant }), className)}
      data-slot="alert"
      role="alert"
      {...props}
    />
  );
}

export function AlertTitle({
  className,
  ...props
}) {
  return (
    <div
      className={cn("font-medium leading-none tracking-tight", className)}
      data-slot="alert-title"
      {...props}
    />
  );
}

export function AlertDescription({
  className,
  ...props
}) {
  return (
    <div
      className={cn("text-sm opacity-90", className)}
      data-slot="alert-description"
      {...props}
    />
  );
}

export function AlertAction({
  className,
  ...props
}) {
  return (
    <div
      className={cn("flex gap-1", className)}
      data-slot="alert-action"
      {...props}
    />
  );
}
