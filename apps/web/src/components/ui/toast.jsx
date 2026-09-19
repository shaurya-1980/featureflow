import { Toast } from "@base-ui/react/toast";
import {
  CircleAlertIcon,
  CircleCheckIcon,
  InfoIcon,
  LoaderCircleIcon,
  TriangleAlertIcon,
  XIcon,
} from "lucide-react";
import * as React from "react";
import { cn } from "@/lib/utils";

const TOAST_ICONS = {
  error: CircleAlertIcon,
  info: InfoIcon,
  loading: LoaderCircleIcon,
  success: CircleCheckIcon,
  warning: TriangleAlertIcon,
};

export const toastManager = Toast.createToastManager();

export const toast = {
  success: (title, description) => {
    toastManager.add({
      type: "success",
      title: typeof title === "string" ? title : title?.title,
      description: typeof title === "object" ? title?.description : description,
    });
  },
  error: (title, description) => {
    toastManager.add({
      type: "error",
      title: typeof title === "string" ? title : title?.title,
      description: typeof title === "object" ? title?.description : description,
    });
  },
  info: (title, description) => {
    toastManager.add({
      type: "info",
      title: typeof title === "string" ? title : title?.title,
      description: typeof title === "object" ? title?.description : description,
    });
  },
  warning: (title, description) => {
    toastManager.add({
      type: "warning",
      title: typeof title === "string" ? title : title?.title,
      description: typeof title === "object" ? title?.description : description,
    });
  },
};

function Toasts({
  position = "bottom-right",
  portalProps,
}) {
  const { toasts } = Toast.useToastManager();

  return (
    <Toast.Portal data-slot="toast-portal" {...portalProps}>
      <Toast.Viewport
        className={cn(
          "fixed z-50 flex max-h-screen w-full flex-col-reverse p-4 sm:bottom-0 sm:right-0 sm:top-auto sm:flex-col sm:max-w-[420px]",
        )}
        data-position={position}
        data-slot="toast-viewport"
      >
        {toasts.map((item) => {
          const Icon = item.type
            ? TOAST_ICONS[item.type]
            : null;

          return (
            <Toast.Root
              key={item.id}
              className={cn(
                "group pointer-events-auto relative flex w-full items-center justify-between space-x-4 overflow-hidden rounded-xl border bg-card p-4 pr-8 shadow-lg transition-all mb-2",
                item.type === "error" && "border-destructive/40 bg-destructive/10 text-destructive dark:bg-destructive/20",
                item.type === "success" && "border-emerald-500/40 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 dark:bg-emerald-950/40",
                item.type === "info" && "border-blue-500/40 bg-blue-500/10 text-blue-700 dark:text-blue-300 dark:bg-blue-950/40",
                item.type === "warning" && "border-amber-500/40 bg-amber-500/10 text-amber-700 dark:text-amber-300 dark:bg-amber-950/40",
              )}
              toast={item}
            >
              <div className="flex items-start gap-3">
                {Icon && (
                  <div className="mt-0.5 shrink-0">
                    <Icon className={cn(
                      "size-5",
                      item.type === "error" && "text-destructive",
                      item.type === "success" && "text-emerald-500",
                      item.type === "info" && "text-blue-500",
                      item.type === "warning" && "text-amber-500",
                    )} />
                  </div>
                )}
                <div className="grid gap-1">
                  {item.title && (
                    <Toast.Title className="text-sm font-semibold text-foreground">
                      {item.title}
                    </Toast.Title>
                  )}
                  {item.description && (
                    <Toast.Description className="text-xs text-muted-foreground">
                      {item.description}
                    </Toast.Description>
                  )}
                </div>
              </div>
              <Toast.Close className="absolute right-2 top-2 rounded-md p-1 text-muted-foreground opacity-70 hover:opacity-100 focus:outline-none">
                <XIcon className="size-4" />
              </Toast.Close>
            </Toast.Root>
          );
        })}
      </Toast.Viewport>
    </Toast.Portal>
  );
}

export function ToastProvider({
  children,
  position = "bottom-right",
  portalProps,
  ...props
}) {
  return (
    <Toast.Provider toastManager={toastManager} {...props}>
      {children}
      <Toasts portalProps={portalProps} position={position} />
    </Toast.Provider>
  );
}

const addToast = (message, type = "info") => {
  if (type === "success") toast.success(message);
  else if (type === "error") toast.error(message);
  else if (type === "warning") toast.warning(message);
  else toast.info(message);
};

const toastContextValue = {
  toast,
  addToast,
  success: (msg, desc) => toast.success(msg, desc),
  error: (msg, desc) => toast.error(msg, desc),
  info: (msg, desc) => toast.info(msg, desc),
  warning: (msg, desc) => toast.warning(msg, desc),
};

export function useToast() {
  return toastContextValue;
}

export { Toast as ToastPrimitive };
