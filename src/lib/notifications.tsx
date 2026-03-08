"use client";

import { createContext, useContext, useState, useCallback, type ReactNode } from "react";

interface NotificationItem {
  id: string;
  text: string;
  time: Date;
}

const NotificationsContext = createContext<{
  items: NotificationItem[];
  count: number;
  add: (text: string) => void;
  clear: () => void;
} | null>(null);

export function NotificationsProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<NotificationItem[]>([]);
  const add = useCallback((text: string) => {
    setItems((prev) => [...prev.slice(-19), { id: String(Date.now()), text, time: new Date() }]);
  }, []);
  const clear = useCallback(() => setItems([]), []);
  return (
    <NotificationsContext.Provider value={{ items, count: items.length, add, clear }}>
      {children}
    </NotificationsContext.Provider>
  );
}

export function useNotifications() {
  const ctx = useContext(NotificationsContext);
  return ctx ?? { items: [], count: 0, add: () => {}, clear: () => {} };
}
