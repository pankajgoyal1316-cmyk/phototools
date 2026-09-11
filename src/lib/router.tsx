import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';

type Route = string;

interface RouterContextValue {
  route: Route;
  navigate: (to: string) => void;
}

const RouterContext = createContext<RouterContextValue | undefined>(undefined);

export function RouterProvider({ children }: { children: ReactNode }) {
  const [route, setRoute] = useState<Route>(() => {
    if (typeof window !== 'undefined') {
      return window.location.pathname + window.location.search || '/';
    }
    return '/';
  });

  useEffect(() => {
    const onPopState = () => {
      setRoute(window.location.pathname + window.location.search || '/');
      window.scrollTo(0, 0);
    };
    window.addEventListener('popstate', onPopState);
    return () => window.removeEventListener('popstate', onPopState);
  }, []);

  const navigate = (to: string) => {
    if (to.includes('#')) {
      const [path, anchor] = to.split('#');
      const target = path || window.location.pathname;
      if (target !== window.location.pathname) {
        window.history.pushState({}, '', target);
        setRoute(target);
      }
      setTimeout(() => {
        document.getElementById(anchor)?.scrollIntoView({ behavior: 'smooth' });
      }, 50);
    } else {
      window.history.pushState({}, '', to);
      setRoute(to);
      window.scrollTo(0, 0);
    }
  };

  return (
    <RouterContext.Provider value={{ route, navigate }}>
      {children}
    </RouterContext.Provider>
  );
}

export function useRouter() {
  const ctx = useContext(RouterContext);
  if (!ctx) throw new Error('useRouter must be used within RouterProvider');
  return ctx;
}

export function Link({ to, children, className, onClick }: { to: string; children: ReactNode; className?: string; onClick?: () => void }) {
  const { navigate } = useRouter();
  return (
    <a
      href={to}
      className={className}
      onClick={(e) => {
        e.preventDefault();
        navigate(to);
        onClick?.();
      }}
    >
      {children}
    </a>
  );
}
