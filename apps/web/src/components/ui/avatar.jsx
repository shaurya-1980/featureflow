import { Avatar as AvatarPrimitive } from "@base-ui/react/avatar";
import * as React from "react";
import { cn } from "@/lib/utils";

export function Avatar({
  className,
  ...props
}) {
  return (
    <AvatarPrimitive.Root
      className={cn(
        "relative isolate inline-flex size-8 shrink-0 select-none items-center justify-center overflow-hidden rounded-full bg-muted align-middle font-medium text-xs",
        className,
      )}
      data-slot="avatar"
      {...props}
    />
  );
}

export function AvatarImage({
  className,
  ...props
}) {
  return (
    <AvatarPrimitive.Image
      className={cn(
        "absolute inset-0 z-10 size-full object-cover data-error:invisible data-loading:invisible",
        className,
      )}
      data-slot="avatar-image"
      {...props}
    />
  );
}

export function AvatarFallback({
  className,
  ...props
}) {
  return (
    <AvatarPrimitive.Fallback
      className={cn(
        "absolute inset-0 flex size-full items-center justify-center rounded-full bg-brand-light text-brand-primary font-semibold uppercase dark:bg-brand-primary/20 dark:text-brand-light",
        className,
      )}
      data-slot="avatar-fallback"
      {...props}
    />
  );
}

export { AvatarPrimitive };
