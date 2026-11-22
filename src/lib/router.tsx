import React, { createContext, useCallback, useContext, useEffect, useState } from "react";

export type AppRoute = "/" | "/boletos" | "/notas" | "/servicos";

const VALID_ROUTES = new Set<AppRoute>(["/", "/boletos", "/notas", "/servicos"]);

function normalizeRoute(path: string): AppRoute {
  const clean = path.split("?")[0].split("#")[0] || "/";
  if (VALID_ROUTES.has(clean as AppRoute)) {
    return clean as AppRoute;
  }
  return "/";
}

interface RouterContextValue {
  pathname: AppRoute;
  navigate: (to: AppRoute) => void;
}

const RouterContext = createContext<RouterContextValue>({
  pathname: "/",
  navigate: () => {},
});

export function RouterProvider({ children }: { children: React.ReactNode }) {
  const [pathname, setPathname] = useState<AppRoute>(() =>
    typeof window !== "undefined" ? normalizeRoute(window.location.pathname) : "/"
  );

  useEffect(() => {
    const onPopState = () => {
      setPathname(normalizeRoute(window.location.pathname));
    };
    window.addEventListener("popstate", onPopState);
    return () => window.removeEventListener("popstate", onPopState);
  }, []);

  const navigate = useCallback((to: AppRoute) => {
    const next = normalizeRoute(to);
    if (typeof window !== "undefined" && window.location.pathname !== next) {
      window.history.pushState({}, "", next);
    }
    setPathname(next);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, []);

  return (
    <RouterContext.Provider value={{ pathname, navigate }}>
      {children}
    </RouterContext.Provider>
  );
}

export function useRouter() {
  return useContext(RouterContext);
}

interface LinkProps extends React.AnchorHTMLAttributes<HTMLAnchorElement> {
  to: AppRoute;
  children: React.ReactNode;
}

export function Link({ to, onClick, children, ...props }: LinkProps) {
  const { navigate } = useRouter();
  return (
    <a
      href={to}
      onClick={(e) => {
        if (
          e.metaKey ||
          e.ctrlKey ||
          e.shiftKey ||
          e.altKey ||
          e.button !== 0
        ) {
          return;
        }
        e.preventDefault();
        onClick?.(e);
        navigate(to);
      }}
      {...props}
    >
      {children}
    </a>
  );
}
