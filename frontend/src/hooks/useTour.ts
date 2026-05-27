import { useCallback, useEffect, useState } from "react";

export type TourStep = {
  /**
   * CSS selector for the target element. If omitted, the step renders as a
   * centered modal (welcome / closing screens).
   */
  selector?: string;
  title: string;
  body: string;
  /**
   * Where to place the tooltip relative to the target. Default: auto (below
   * if there's room, otherwise above).
   */
  placement?: "top" | "bottom" | "auto";
  /**
   * Custom label for the "next" / "finish" button on this step.
   */
  ctaLabel?: string;
};

type UseTourOpts = {
  /**
   * If true (default), starts the tour automatically on mount if it has never
   * been completed or skipped in this browser.
   */
  autoStart?: boolean;
  /**
   * Milliseconds to wait after mount before auto-starting. Gives the page
   * time to paint so target selectors resolve.
   */
  startDelayMs?: number;
};

export const useTour = (
  tourId: string,
  steps: TourStep[],
  opts: UseTourOpts = {}
) => {
  const { autoStart = true, startDelayMs = 700 } = opts;
  const STORAGE_KEY = `presence:tour:${tourId}`;
  const [active, setActive] = useState(false);
  const [stepIdx, setStepIdx] = useState(0);

  useEffect(() => {
    if (!autoStart) return;
    if (typeof window === "undefined") return;
    const done = window.localStorage.getItem(STORAGE_KEY);
    if (done) return;
    const t = window.setTimeout(() => setActive(true), startDelayMs);
    return () => window.clearTimeout(t);
  }, [STORAGE_KEY, autoStart, startDelayMs]);

  const start = useCallback(() => {
    setStepIdx(0);
    setActive(true);
  }, []);

  const skip = useCallback(() => {
    try {
      window.localStorage.setItem(STORAGE_KEY, "skipped");
    } catch {
      // ignore
    }
    setActive(false);
  }, [STORAGE_KEY]);

  const finish = useCallback(() => {
    try {
      window.localStorage.setItem(STORAGE_KEY, "completed");
    } catch {
      // ignore
    }
    setActive(false);
  }, [STORAGE_KEY]);

  const next = useCallback(() => {
    setStepIdx((i) => {
      if (i >= steps.length - 1) {
        finish();
        return i;
      }
      return i + 1;
    });
  }, [steps.length, finish]);

  const prev = useCallback(() => {
    setStepIdx((i) => Math.max(0, i - 1));
  }, []);

  // Keyboard nav while active.
  useEffect(() => {
    if (!active) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") skip();
      else if (e.key === "ArrowRight" || e.key === "Enter") next();
      else if (e.key === "ArrowLeft") prev();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [active, skip, next, prev]);

  /**
   * Resets the persisted state and re-starts the tour. Use this for the
   * "Volver a ver el tour" button.
   */
  const restart = useCallback(() => {
    try {
      window.localStorage.removeItem(STORAGE_KEY);
    } catch {
      // ignore
    }
    start();
  }, [STORAGE_KEY, start]);

  return {
    active,
    stepIdx,
    totalSteps: steps.length,
    step: steps[stepIdx],
    next,
    prev,
    skip,
    finish,
    start,
    restart,
  };
};
