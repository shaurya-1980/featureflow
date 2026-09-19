import { Tabs as TabsPrimitive } from "@base-ui/react/tabs";
import * as React from "react";
import {
  segmentedControlItemLayoutClassName,
  segmentedControlItemSizeClassNames,
} from "@/lib/segmented-control";
import { cn } from "@/lib/utils";

const TabsListContext = React.createContext("default");

export function Tabs({
  className,
  ...props
}) {
  return (
    <TabsPrimitive.Root
      className={cn(
        "flex flex-col gap-2 data-[orientation=vertical]:flex-row",
        className,
      )}
      data-slot="tabs"
      {...props}
    />
  );
}

export function TabsList({
  variant = "default",
  size = "default",
  className,
  children,
  ...props
}) {
  return (
    <TabsPrimitive.List
      className={cn(
        "relative z-0 flex w-fit items-center justify-center gap-x-0.5 text-muted-foreground",
        "data-[orientation=vertical]:flex-col",
        variant === "default"
          ? "rounded-lg bg-muted p-0.5 text-muted-foreground/72"
          : "data-[orientation=vertical]:px-1 data-[orientation=horizontal]:py-1 *:data-[slot=tabs-tab]:hover:bg-accent",
        className,
      )}
      data-size={size}
      data-slot="tabs-list"
      {...props}
    >
      <TabsListContext.Provider value={size}>
        {children}
      </TabsListContext.Provider>
    </TabsPrimitive.List>
  );
}

export function TabsTab({
  className,
  size,
  ...props
}) {
  const contextSize = React.useContext(TabsListContext);
  const resolvedSize = size ?? contextSize;

  return (
    <TabsPrimitive.Tab
      className={cn(
        "relative flex shrink-0 grow cursor-pointer items-center justify-center whitespace-nowrap rounded-md border border-transparent font-medium text-base outline-none transition-[color,background-color,box-shadow] hover:text-muted-foreground focus-visible:ring-2 focus-visible:ring-ring data-disabled:pointer-events-none data-[orientation=vertical]:w-full data-[orientation=vertical]:justify-start data-active:bg-background data-active:text-foreground data-active:shadow-sm data-disabled:opacity-64 sm:text-sm dark:data-active:bg-card",
        segmentedControlItemLayoutClassName,
        segmentedControlItemSizeClassNames[resolvedSize],
        className,
      )}
      data-size={resolvedSize}
      data-slot="tabs-tab"
      {...props}
    />
  );
}

export function TabsPanel({
  className,
  ...props
}) {
  return (
    <TabsPrimitive.Panel
      className={cn("flex-1 outline-none", className)}
      data-slot="tabs-content"
      {...props}
    />
  );
}

export {
  TabsPrimitive,
  TabsTab as TabsTrigger,
  TabsPanel as TabsContent,
};
