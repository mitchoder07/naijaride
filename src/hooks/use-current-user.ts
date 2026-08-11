"use client";

import { useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";

export type UserRole = "DRIVER" | "PASSENGER" | "BOTH" | "ADMIN";

export interface CurrentUser {
  id: string;
  email: string;
  name: string | null;
  phone: string | null;
  role: UserRole;
  avatarUrl: string | null;
  walletBalance: number;
  isDemo: boolean;
  createdAt: string;
}

export function useCurrentUser() {
  const qc = useQueryClient();
  const query = useQuery({
    queryKey: ["session"],
    queryFn: () => api.get<{ user: CurrentUser | null }>(`/api/session`),
    staleTime: 60_000,
  });
  return {
    user: query.data?.user ?? null,
    isLoading: query.isLoading,
    isAuthenticated: !!query.data?.user,
    isAdmin: query.data?.user?.role === "ADMIN",
    isDemo: query.data?.user?.isDemo ?? false,
    refresh: () => qc.invalidateQueries({ queryKey: ["session"] }),
  };
}
