"use client";

import {
  useEffect,
  useSyncExternalStore,
  useState,
  type ComponentProps,
  type ReactNode,
} from "react";
import { cn } from "@/lib/utils";

const SCROLL_THRESHOLD_PX = 16;

function subscribeReducedMotion(onStoreChange: () => void) {
  const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
  mq.addEventListener("change", onStoreChange);
  return () => mq.removeEventListener("change", onStoreChange);
}

function getReducedMotionSnapshot() {
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

function getReducedMotionServerSnapshot() {
  return false;
}

export type TopNavChromeProps = Omit<ComponentProps<"nav">, "children"> & {
  children: ReactNode;
};

/**
 * Quiet-luxury shell: softer glass at page top, slightly more opaque when scrolled.
 * Respects `prefers-reduced-motion` for surface transitions.
 */
export function TopNavChrome({
  children,
  className,
  ...navProps
}: TopNavChromeProps) {
  const [scrolled, setScrolled] = useState(false);
  const reducedMotion = useSyncExternalStore(
    subscribeReducedMotion,
    getReducedMotionSnapshot,
    getReducedMotionServerSnapshot,
  );

  useEffect(() => {
    const el = document.scrollingElement ?? document.documentElement;
    const update = () => {
      setScrolled(el.scrollTop > SCROLL_THRESHOLD_PX);
    };
    update();
    window.addEventListener("scroll", update, { passive: true });
    return () => window.removeEventListener("scroll", update);
  }, []);

  return (
    <nav
      {...navProps}
      data-scrolled={scrolled ? "true" : "false"}
      className={cn(
        "pointer-events-auto mx-auto flex max-w-5xl items-center justify-between gap-2 rounded-full border backdrop-blur-xl",
        "px-4 py-2.5 md:gap-3.5 md:px-6 md:py-2.5",
        !reducedMotion &&
          "transition-[background-color,box-shadow,border-color,backdrop-filter] duration-300 ease-out",
        scrolled
          ? [
              "border-border/55 bg-surface/95 shadow-1",
              "supports-[backdrop-filter]:bg-surface/90",
            ]
          : [
              "border-border/40 bg-surface/80 shadow-none",
              "supports-[backdrop-filter]:bg-surface/65",
            ],
        className,
      )}
    >
      {children}
    </nav>
  );
}
