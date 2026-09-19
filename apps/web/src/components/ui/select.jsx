import { mergeProps } from "@base-ui/react/merge-props";
import { Select as SelectPrimitive } from "@base-ui/react/select";
import { useRender } from "@base-ui/react/use-render";
import { cva } from "class-variance-authority";
import {
  ChevronDownIcon,
  ChevronsUpDownIcon,
  ChevronUpIcon,
} from "lucide-react";
import * as React from "react";
import { cn } from "@/lib/utils";

export const Select = SelectPrimitive.Root;

export const selectTriggerVariants = cva(
  "relative inline-flex min-h-9 w-full min-w-36 select-none items-center justify-between gap-2 rounded-lg border border-input bg-background px-3 text-left text-sm text-foreground shadow-sm outline-none transition-colors focus-visible:border-ring focus-visible:ring-1 focus-visible:ring-ring data-disabled:pointer-events-none data-disabled:opacity-50 dark:bg-input/30",
  {
    defaultVariants: {
      size: "default",
    },
    variants: {
      size: {
        default: "",
        lg: "min-h-10 text-base",
        sm: "min-h-8 text-xs px-2.5",
      },
    },
  },
);

export function SelectTrigger({
  className,
  size = "default",
  children,
  ...props
}) {
  return (
    <SelectPrimitive.Trigger
      className={cn(selectTriggerVariants({ size }), className)}
      data-slot="select-trigger"
      {...props}
    >
      {children}
      <SelectPrimitive.Icon data-slot="select-icon">
        <ChevronsUpDownIcon className="size-4 opacity-70 shrink-0" />
      </SelectPrimitive.Icon>
    </SelectPrimitive.Trigger>
  );
}

export function SelectValue({
  className,
  placeholder,
  ...props
}) {
  return (
    <SelectPrimitive.Value
      className={cn(
        "flex-1 truncate data-placeholder:text-muted-foreground",
        className,
      )}
      placeholder={placeholder}
      data-slot="select-value"
      {...props}
    />
  );
}

export function SelectPopup({
  className,
  children,
  side = "bottom",
  sideOffset = 4,
  align = "start",
  alignOffset = 0,
  portalProps,
  ...props
}) {
  return (
    <SelectPrimitive.Portal {...portalProps}>
      <SelectPrimitive.Positioner
        align={align}
        alignOffset={alignOffset}
        className="z-50 select-none"
        data-slot="select-positioner"
        side={side}
        sideOffset={sideOffset}
      >
        <SelectPrimitive.Popup
          className={cn(
            "relative max-h-60 min-w-(--anchor-width) overflow-y-auto rounded-lg border bg-popover p-1 text-popover-foreground shadow-md outline-none dark:bg-card",
            className,
          )}
          data-slot="select-popup"
          {...props}
        >
          {children}
        </SelectPrimitive.Popup>
      </SelectPrimitive.Positioner>
    </SelectPrimitive.Portal>
  );
}

export function SelectItem({
  className,
  children,
  value,
  ...props
}) {
  return (
    <SelectPrimitive.Item
      className={cn(
        "relative flex w-full cursor-pointer select-none items-center rounded-sm py-1.5 ps-2 pe-8 text-sm outline-none data-disabled:pointer-events-none data-highlighted:bg-accent data-highlighted:text-accent-foreground data-disabled:opacity-50",
        className,
      )}
      value={value}
      data-slot="select-item"
      {...props}
    >
      <SelectPrimitive.ItemText className="truncate">
        {children}
      </SelectPrimitive.ItemText>
      <SelectPrimitive.ItemIndicator className="absolute right-2 flex size-3.5 items-center justify-center">
        <svg
          aria-hidden="true"
          fill="none"
          height="16"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth="2"
          viewBox="0 0 24 24"
          width="16"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path d="M5.252 12.7 10.2 18.63 18.748 5.37" />
        </svg>
      </SelectPrimitive.ItemIndicator>
    </SelectPrimitive.Item>
  );
}

export function SelectGroup(props) {
  return <SelectPrimitive.Group data-slot="select-group" {...props} />;
}

export function SelectLabel({
  className,
  ...props
}) {
  return (
    <SelectPrimitive.Label
      className={cn("px-2 py-1.5 text-xs font-semibold text-muted-foreground", className)}
      data-slot="select-label"
      {...props}
    />
  );
}

export { SelectPrimitive, SelectPopup as SelectContent };
