import {
  AlarmClock,
  BadgeCheck,
  Ban,
  Bell,
  CalendarX,
  CircleX,
  Flag,
  Megaphone,
  MessageSquare,
  MessageSquareReply,
  PauseCircle,
  PencilLine,
  ShieldAlert,
  ShieldCheck,
  Star,
  Store,
  UserCheck,
  type LucideIcon,
} from "lucide-react";
import type { ReactNode } from "react";
import { formatDateTime, timeAgo } from "@/lib/datetime";
import type { AppNotification } from "@/lib/notifications-api";

type Visual = { icon: LucideIcon; className: string };

const NEUTRAL = "bg-[#eef0ff] text-[#514ddd]";
const POSITIVE = "bg-emerald-100 text-emerald-700";
const NEGATIVE = "bg-[#fde0e3] text-[#d6154a]";
const WARNING = "bg-amber-100 text-amber-700";

const VISUALS: Record<string, Visual> = {
  REVIEW_RECEIVED: { icon: MessageSquare, className: NEUTRAL },
  REVIEW_REPLIED: { icon: MessageSquareReply, className: NEUTRAL },
  REVIEW_PROMPT: { icon: Star, className: WARNING },
  CONTENT_MODERATED: { icon: ShieldAlert, className: NEGATIVE },
  CONTENT_RESTORED: { icon: ShieldCheck, className: POSITIVE },
  ACCOUNT_SUSPENDED: { icon: Ban, className: NEGATIVE },
  ACCOUNT_REACTIVATED: { icon: UserCheck, className: POSITIVE },
  ESTABLISHMENT_APPROVED: { icon: BadgeCheck, className: POSITIVE },
  ESTABLISHMENT_REJECTED: { icon: CircleX, className: NEGATIVE },
  ESTABLISHMENT_SUSPENDED: { icon: PauseCircle, className: NEGATIVE },
  ESTABLISHMENT_REACTIVATED: { icon: Store, className: POSITIVE },
  ESTABLISHMENT_EDITED_BY_ADMIN: { icon: PencilLine, className: WARNING },
  PLAN_REMINDER: { icon: AlarmClock, className: NEUTRAL },
  PLAN_AFFECTED: { icon: CalendarX, className: WARNING },
  REPORT_RESOLVED: { icon: Flag, className: NEUTRAL },
  ADMIN_REPORT_OPENED: { icon: Flag, className: WARNING },
  ADMIN_MESSAGE: { icon: Megaphone, className: NEUTRAL },
};

export function notificationVisual(type: string): Visual {
  return VISUALS[type] ?? { icon: Bell, className: NEUTRAL };
}

type NotificationItemProps = {
  notification: AppNotification;
  // Campana: texto en dos líneas como máximo.
  compact?: boolean;
  // Botones a la derecha (marcar como leída, eliminar) en la página completa.
  actions?: ReactNode;
};

// Ícono por tipo, título, cuerpo y fecha relativa. No lleva el clic: lo envuelve quien lo usa.
export default function NotificationItem({ notification, compact = false, actions }: NotificationItemProps) {
  const { icon: Icon, className } = notificationVisual(notification.type);
  const unread = !notification.is_read;

  return (
    <div className="flex w-full items-start gap-3 text-left">
      <span className={`mt-0.5 flex size-9 shrink-0 items-center justify-center rounded-full ${className}`}>
        <Icon aria-hidden="true" className="size-4" />
      </span>
      <div className="min-w-0 flex-1">
        <p className={`text-sm text-[#17243d] ${unread ? "font-bold" : "font-semibold"}`}>
          {notification.title}
          {unread && <span className="sr-only"> (sin leer)</span>}
        </p>
        <p className={`mt-0.5 text-[13px] leading-snug text-[#43506a] ${compact ? "line-clamp-2" : ""}`}>
          {notification.body}
        </p>
        <time
          dateTime={notification.created_at}
          title={formatDateTime(notification.created_at)}
          className="mt-1 block text-xs text-[#6d6e7a]"
        >
          {timeAgo(notification.created_at)}
        </time>
      </div>
      {unread && !actions && <span aria-hidden="true" className="mt-2 size-2.5 shrink-0 rounded-full bg-[#514ddd]" />}
      {actions}
    </div>
  );
}
