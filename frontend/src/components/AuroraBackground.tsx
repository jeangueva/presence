/**
 * Aurora — slow-drifting warm gradient field rendered behind the app.
 * GPU-friendly: only `transform` is animated. Respects prefers-reduced-motion
 * via CSS media query (the animation is paused).
 */
export const AuroraBackground = () => (
  <div
    aria-hidden
    className="aurora-bg fixed inset-0 -z-10 overflow-hidden pointer-events-none"
  >
    <div className="aurora-blob aurora-blob-1" />
    <div className="aurora-blob aurora-blob-2" />
    <div className="aurora-blob aurora-blob-3" />
  </div>
);
