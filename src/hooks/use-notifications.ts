"use client";

import { useEffect } from "react";
import { Bell, BellRing } from "lucide-react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";

interface Notification {
  id: string;
  title: string;
  body: string;
  type: string;
  read: boolean;
  bookingId: string | null;
  createdAt: string;
}

interface NotificationsResponse {
  notifications: Notification[];
  unread: number;
}

/**
 * Hook that:
 *  - Polls /api/notifications every 30s for new notifications
 *  - Shows them as a system toast AND a browser Notification (if permission granted)
 *  - Provides a markAllRead action
 */
export function useNotifications() {
  const qc = useQueryClient();

  const query = useQuery({
    queryKey: ["notifications"],
    queryFn: () => api.get<NotificationsResponse>(`/api/notifications`),
    refetchInterval: 30_000,
    staleTime: 15_000,
  });

  // Request permission on first interaction
  const requestPermission = async () => {
    if (typeof window === "undefined") return;
    if (!("Notification" in window)) return;
    if (Notification.permission === "default") {
      const result = await Notification.requestPermission();
      return result === "granted";
    }
    return Notification.permission === "granted";
  };

  const showBrowserNotification = (n: Notification) => {
    if (typeof window === "undefined") return;
    if (!("Notification" in window)) return;
    if (Notification.permission !== "granted") return;
    try {
      const notif = new Notification(n.title, {
        body: n.body,
        icon: "/logo.svg",
        tag: n.id,
        badge: "/logo.svg",
      });
      notif.onclick = () => {
        window.focus();
        notif.close();
      };
    } catch (err) {
      console.warn("[notify] failed", err);
    }
  };

  const markAllRead = async () => {
    try {
      await api.patch(`/api/notifications`, {});
      qc.invalidateQueries({ queryKey: ["notifications"] });
    } catch (err) {
      console.error("[notify] markAllRead failed", err);
    }
  };

  return {
    notifications: query.data?.notifications ?? [],
    unread: query.data?.unread ?? 0,
    requestPermission,
    showBrowserNotification,
    markAllRead,
    refresh: () => qc.invalidateQueries({ queryKey: ["notifications"] }),
  };
}
