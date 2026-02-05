import { createContext, useContext, useState, useCallback, type ReactNode } from "react";

export type NotificationTone = "default" | "info" | "success" | "warning" | "danger";

export interface NotificationAction {
  label: string;
  tone?: NotificationTone;
  onClick: () => void;
}

export interface NotificationItem {
  id: string;
  title: string;
  message?: string;
  tone?: NotificationTone;
  actions?: NotificationAction[];
  dismissible?: boolean;
}

interface ConfirmOptions {
  title: string;
  message?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  tone?: NotificationTone;
}

interface NotificationsContextValue {
  notifications: NotificationItem[];
  notify: (item: Omit<NotificationItem, "id">) => string;
  dismiss: (id: string) => void;
  confirm: (options: ConfirmOptions) => Promise<boolean>;
}

const NotificationsContext = createContext<NotificationsContextValue | null>(null);

export function NotificationsProvider({ children }: { children: ReactNode }) {
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);

  const dismiss = useCallback((id: string) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id));
  }, []);

  const notify = useCallback((item: Omit<NotificationItem, "id">) => {
    const id = Math.random().toString(36).substring(2, 9);
    const newNotification: NotificationItem = { ...item, id };
    setNotifications((prev) => [...prev, newNotification]);
    return id;
  }, []);

  const confirm = useCallback(
    ({ title, message, confirmLabel = "Confirm", cancelLabel = "Cancel", tone = "default" }: ConfirmOptions) => {
      return new Promise<boolean>((resolve) => {
        const id = Math.random().toString(36).substring(2, 9);
        
        const cleanup = (value: boolean) => {
          dismiss(id);
          resolve(value);
        };

        const newNotification: NotificationItem = {
          id,
          title,
          message,
          tone,
          dismissible: false,
          actions: [
            {
              label: cancelLabel,
              onClick: () => cleanup(false),
            },
            {
              label: confirmLabel,
              tone: tone === "default" ? "info" : tone,
              onClick: () => cleanup(true),
            },
          ],
        };

        setNotifications((prev) => [...prev, newNotification]);
      });
    },
    [dismiss]
  );

  return (
    <NotificationsContext.Provider value={{ notifications, notify, dismiss, confirm }}>
      {children}
      {/* The host component will be added here or in the layout */}
    </NotificationsContext.Provider>
  );
}

export function useNotifications() {
  const context = useContext(NotificationsContext);
  if (!context) {
    throw new Error("useNotifications must be used within a NotificationsProvider");
  }
  return context;
}
