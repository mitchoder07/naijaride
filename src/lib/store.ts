"use client";

import { create } from "zustand";

export type ViewName =
  | "landing"
  | "signin"
  | "signup"
  | "dashboard"
  | "trips-search"
  | "trip-detail"
  | "create-trip"
  | "my-trips"
  | "bookings"
  | "chat"
  | "wallet"
  | "profile"
  | "profile-public"
  | "admin"
  | "safety"
  | "track";

export interface RouteState {
  view: ViewName;
  params: Record<string, string>;
}

interface NavigationStore {
  route: RouteState;
  navigate: (view: ViewName, params?: Record<string, string>) => void;
  setParams: (params: Record<string, string>) => void;
  back: () => void;
  history: RouteState[];
}

function readInitialRoute(): RouteState {
  if (typeof window === "undefined") {
    return { view: "landing", params: {} };
  }
  const sp = new URLSearchParams(window.location.search);
  const view = (sp.get("view") as ViewName) || "landing";
  const params = Object.fromEntries(sp.entries());
  delete params.view;
  return { view, params };
}

export const useNavigation = create<NavigationStore>((set, get) => ({
  route: readInitialRoute(),
  history: [],
  navigate: (view, params = {}) => {
    const next = { view, params };
    set((state) => ({
      route: next,
      history: [...state.history, state.route].slice(-20),
    }));
    if (typeof window !== "undefined") {
      const url = new URL(window.location.href);
      url.search = new URLSearchParams({ view, ...params }).toString();
      window.history.pushState({}, "", url.toString());
      window.scrollTo({ top: 0 });
    }
  },
  setParams: (params) => {
    set((state) => ({
      route: { ...state.route, params: { ...state.route.params, ...params } },
    }));
  },
  back: () => {
    const history = get().history;
    if (history.length === 0) {
      get().navigate("landing");
      return;
    }
    const prev = history[history.length - 1];
    set((state) => ({
      route: prev,
      history: state.history.slice(0, -1),
    }));
    if (typeof window !== "undefined") {
      const url = new URL(window.location.href);
      url.search = new URLSearchParams({ view: prev.view, ...prev.params }).toString();
      window.history.pushState({}, "", url.toString());
    }
  },
}));

if (typeof window !== "undefined") {
  window.addEventListener("popstate", () => {
    const url = new URL(window.location.href);
    const view = (url.searchParams.get("view") as ViewName) || "landing";
    const params = Object.fromEntries(url.searchParams.entries());
    delete params.view;
    useNavigation.setState((state) => ({
      route: { view, params },
      history: state.history,
    }));
  });
}
