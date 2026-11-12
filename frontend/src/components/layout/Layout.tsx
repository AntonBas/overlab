import { Suspense, useEffect, useRef } from "react";
import { Outlet, useLocation, useNavigationType } from "react-router-dom";
import { AnalyticsLoader } from "../../features/legal";
import { CookieBanner } from "../../features/legal";
import { Spinner } from "../ui/Spinner";
import { ErrorBoundary } from "../ui/ErrorBoundary";
import { Footer } from "./Footer";
import { Header } from "./Header";

export function Layout() {
  const location = useLocation();
  const navigationType = useNavigationType();
  const scrollPositions = useRef(new Map<string, number>());
  const content = useRef<HTMLElement>(null);
  const previousPathname = useRef(location.pathname);

  useEffect(() => {
    const positions = scrollPositions.current;
    const key = location.key;
    return () => {
      positions.set(key, window.scrollY);
    };
  }, [location.key]);

  useEffect(() => {
    if (previousPathname.current === location.pathname) {
      return;
    }
    previousPathname.current = location.pathname;
    const restoredPosition =
      navigationType === "POP"
        ? scrollPositions.current.get(location.key)
        : undefined;
    if (restoredPosition === undefined) {
      window.scrollTo(0, 0);
    } else {
      requestAnimationFrame(() => window.scrollTo(0, restoredPosition));
    }
    content.current?.focus({ preventScroll: true });
  }, [location.pathname, location.key, navigationType]);

  return (
    <div className="app">
      <a className="skip-link" href="#content">
        Skip to content
      </a>
      <Header />
      <main id="content" ref={content} tabIndex={-1} className="container main">
        <ErrorBoundary resetKey={location.pathname}>
          <Suspense fallback={<Spinner page />}>
            <Outlet />
          </Suspense>
        </ErrorBoundary>
      </main>
      <Footer />
      <CookieBanner />
      <AnalyticsLoader />
    </div>
  );
}
