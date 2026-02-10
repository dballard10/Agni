import { createPortal } from "react-dom";
import { IconX } from "@tabler/icons-react";
import { motion, AnimatePresence } from "framer-motion";
import { useNotifications } from "../../shared/context/NotificationsContext";
import type {
  NotificationItem,
  NotificationTone,
} from "../../shared/context/NotificationsContext";

export function TopNotificationHost() {
  const { notifications, dismiss } = useNotifications();

  return createPortal(
    <div className="fixed top-4 left-0 right-0 z-[200] flex flex-col items-center gap-3 pointer-events-none px-4">
      <AnimatePresence mode="popLayout">
        {notifications.map((notification) => (
          <NotificationBanner
            key={notification.id}
            notification={notification}
            onDismiss={() => dismiss(notification.id)}
          />
        ))}
      </AnimatePresence>
    </div>,
    document.body
  );
}

export default TopNotificationHost;

function NotificationBanner({
  notification,
  onDismiss,
}: {
  notification: NotificationItem;
  onDismiss: () => void;
}) {
  const { title, message, tone = "default", actions, dismissible = true } = notification;

  const toneClasses: Record<NotificationTone, string> = {
    default: "border-border bg-bg-panel/90",
    info: "border-blue-500/20 bg-blue-500/10",
    success: "border-status-success/20 bg-status-success/10",
    warning: "border-status-warning/20 bg-status-warning/10",
    danger: "border-status-error/20 bg-status-error/10",
  };

  const actionToneClasses: Record<NotificationTone, string> = {
    default: "text-text-secondary hover:bg-bg-hover",
    info: "text-blue-400 hover:bg-blue-400/10",
    success: "text-status-success hover:bg-status-success/10",
    warning: "text-status-warning hover:bg-status-warning/10",
    danger: "text-status-error hover:bg-status-error/10",
  };

  return (
    <motion.div
      layout
      initial={{ y: -100, opacity: 0, scale: 0.95 }}
      animate={{ y: 0, opacity: 1, scale: 1 }}
      exit={{ y: -20, opacity: 0, scale: 0.95, transition: { duration: 0.2 } }}
      transition={{ type: "spring", stiffness: 400, damping: 30 }}
      className={`
        pointer-events-auto
        w-full max-w-md
        flex flex-col
        backdrop-blur-md border rounded-2xl shadow-2xl
        ${toneClasses[tone]}
      `}
    >
      <div className="flex items-start justify-between p-4 gap-4">
        <div className="flex-1 min-w-0">
          <h4 className="font-semibold text-text-primary truncate">{title}</h4>
          {message && <p className="text-sm text-text-muted mt-0.5">{message}</p>}
        </div>
        {dismissible && (
          <button
            onClick={onDismiss}
            className="p-1 -mr-1 text-text-muted hover:text-text-secondary transition-colors"
          >
            <IconX size={18} />
          </button>
        )}
      </div>

      {actions && actions.length > 0 && (
        <div className="flex border-t border-white/5">
          {actions.map((action, idx) => (
            <button
              key={idx}
              onClick={action.onClick}
              className={`
                flex-1 py-3 px-4 text-sm font-medium transition-colors
                ${idx > 0 ? "border-l border-white/5" : ""}
                ${actionToneClasses[action.tone || "default"]}
              `}
            >
              {action.label}
            </button>
          ))}
        </div>
      )}
    </motion.div>
  );
}
