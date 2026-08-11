import { useLayoutEffect, useState } from "react";
import { createPortal } from "react-dom";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, ArrowRight, X } from "lucide-react";
import type { useTour } from "../hooks/useTour";

type Props = {
  tour: ReturnType<typeof useTour>;
};

const SPOTLIGHT_PADDING = 10;
const TOOLTIP_GAP = 14;
const TOOLTIP_WIDTH = 340;
const VIEWPORT_MARGIN = 12;

type Rect = { top: number; left: number; width: number; height: number };

const measureTarget = (selector: string): Rect | null => {
  const el = document.querySelector(selector) as HTMLElement | null;
  if (!el) return null;
  const r = el.getBoundingClientRect();
  if (r.width === 0 && r.height === 0) return null;
  return { top: r.top, left: r.left, width: r.width, height: r.height };
};

const computeTooltipPos = (
  rect: Rect | null,
  preferred: "top" | "bottom" | "auto" = "auto"
): { top: number; left: number; placement: "top" | "bottom" } => {
  if (!rect) return { top: window.innerHeight / 2 - 100, left: window.innerWidth / 2 - TOOLTIP_WIDTH / 2, placement: "bottom" };

  const spaceBelow = window.innerHeight - (rect.top + rect.height);
  const spaceAbove = rect.top;
  let placement: "top" | "bottom" = preferred === "auto"
    ? (spaceBelow > 220 || spaceBelow >= spaceAbove ? "bottom" : "top")
    : preferred;

  const top =
    placement === "bottom"
      ? rect.top + rect.height + TOOLTIP_GAP
      : rect.top - TOOLTIP_GAP - 200; // approx tooltip height, refined by clamp later

  // Center horizontally on target, then clamp inside viewport
  const idealLeft = rect.left + rect.width / 2 - TOOLTIP_WIDTH / 2;
  const left = Math.min(
    Math.max(idealLeft, VIEWPORT_MARGIN),
    window.innerWidth - TOOLTIP_WIDTH - VIEWPORT_MARGIN
  );

  return { top, left, placement };
};

export const Tour = ({ tour }: Props) => {
  const { active, step, stepIdx, totalSteps, next, prev, skip } = tour;
  const [rect, setRect] = useState<Rect | null>(null);

  useLayoutEffect(() => {
    if (!active || !step) {
      setRect(null);
      return;
    }
    if (!step.selector) {
      setRect(null);
      return;
    }
    const updateRect = () => {
      const r = measureTarget(step.selector!);
      setRect(r);
    };
    // Scroll target into view first.
    const el = document.querySelector(step.selector) as HTMLElement | null;
    if (el) {
      el.scrollIntoView({ block: "center", behavior: "smooth" });
    }
    // Initial measurement after a short delay to allow scroll to settle.
    const t = window.setTimeout(updateRect, 350);
    window.addEventListener("resize", updateRect);
    window.addEventListener("scroll", updateRect, true);
    return () => {
      window.clearTimeout(t);
      window.removeEventListener("resize", updateRect);
      window.removeEventListener("scroll", updateRect, true);
    };
  }, [active, step, stepIdx]);

  if (!active || !step) return null;

  const hasTarget = Boolean(step.selector && rect);
  const tooltipPos = computeTooltipPos(rect, step.placement);
  const isLast = stepIdx === totalSteps - 1;
  const isFirst = stepIdx === 0;
  const ctaLabel = step.ctaLabel ?? (isLast ? "Empezar" : "Siguiente");

  return createPortal(
    <AnimatePresence>
      <motion.div
        key={`tour-${stepIdx}`}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.2 }}
        className="fixed inset-0 z-[80]"
      >
        {/* Backdrop: full-screen dim. Cuando hay target, el "agujero" se hace
            con un div sobre el target con un box-shadow gigante que oscurece
            todo el resto. Cuando no, simplemente un velo + blur. */}
        {!hasTarget ? (
          <div className="fixed inset-0 bg-warm-plum/45 backdrop-blur-sm" />
        ) : (
          <div
            aria-hidden
            style={{
              position: "fixed",
              top: rect!.top - SPOTLIGHT_PADDING,
              left: rect!.left - SPOTLIGHT_PADDING,
              width: rect!.width + SPOTLIGHT_PADDING * 2,
              height: rect!.height + SPOTLIGHT_PADDING * 2,
              borderRadius: 18,
              boxShadow: "0 0 0 9999px rgba(33, 25, 34, 0.55)",
              pointerEvents: "none",
              transition: "all 0.35s cubic-bezier(0.22, 1, 0.36, 1)",
            }}
          />
        )}

        {/* Tooltip / card */}
        <motion.div
          initial={{ opacity: 0, y: 8, scale: 0.97 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 8, scale: 0.97 }}
          transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
          style={{
            position: "fixed",
            top: tooltipPos.top,
            left: tooltipPos.left,
            width: TOOLTIP_WIDTH,
            maxWidth: `calc(100vw - ${VIEWPORT_MARGIN * 2}px)`,
          }}
          className="bg-white rounded-3xl border border-warm-sand shadow-2xl p-5"
          role="dialog"
          aria-modal="true"
        >
          <div className="flex items-center justify-between mb-3">
            <p className="eyebrow text-[10px]">
              Paso {stepIdx + 1} de {totalSteps}
            </p>
            <button
              type="button"
              onClick={skip}
              className="text-warm-silver hover:text-warm-plum p-1 rounded-lg hover:bg-warm-fog transition"
              aria-label="Omitir tour"
              title="Omitir tour"
            >
              <X size={16} />
            </button>
          </div>
          <h3 className="font-serif text-2xl text-warm-plum mb-2">{step.title}</h3>
          <p className="text-warm-olive text-sm leading-relaxed mb-5">{step.body}</p>
          {/* Progress dots */}
          <div className="flex items-center gap-1.5 mb-5">
            {Array.from({ length: totalSteps }).map((_, i) => (
              <span
                key={i}
                className={`h-1.5 rounded-full transition-all ${
                  i === stepIdx
                    ? "w-6 bg-warm-accent"
                    : i < stepIdx
                    ? "w-1.5 bg-warm-accent/40"
                    : "w-1.5 bg-warm-sand"
                }`}
              />
            ))}
          </div>
          <div className="flex items-center justify-between gap-2">
            <button
              type="button"
              onClick={skip}
              className="text-xs font-bold text-warm-olive hover:text-warm-plum hover:bg-warm-fog transition px-3 py-2 rounded-xl"
            >
              Omitir tour
            </button>
            <div className="flex items-center gap-2">
              {!isFirst && (
                <button
                  type="button"
                  onClick={prev}
                  className="text-xs font-bold inline-flex items-center gap-1 px-3 py-2 rounded-xl bg-warm-fog hover:bg-warm-sand text-warm-plum transition"
                >
                  <ArrowLeft size={12} /> Atrás
                </button>
              )}
              <button
                type="button"
                onClick={next}
                className="text-xs font-bold inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-warm-accent hover:bg-warm-accent-hover text-white transition shadow-sm"
              >
                {ctaLabel}
                <ArrowRight size={12} />
              </button>
            </div>
          </div>
          {isFirst && (
            <p className="text-[11px] text-warm-silver text-center mt-3">
              Puedes omitirlo en cualquier momento.
            </p>
          )}
        </motion.div>
      </motion.div>
    </AnimatePresence>,
    document.body
  );
};
