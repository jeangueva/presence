/**
 * Shimmer skeleton block. Use instead of `animate-pulse` for a warmer feel.
 * Pass standard className (height, width, rounding); shimmer adds the gradient.
 */
export const Shimmer = ({ className = "" }: { className?: string }) => (
  <div className={`shimmer rounded-xl ${className}`} aria-hidden />
);
