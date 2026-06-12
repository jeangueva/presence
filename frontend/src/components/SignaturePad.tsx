import { useEffect, useRef, useState } from "react";
import { Eraser } from "lucide-react";

/**
 * Minimal canvas signature pad (no dependency). Draws with pointer events and
 * exports a trimmed-ish PNG data URL. Used to insert a handwritten signature
 * into the will document as an inline image.
 */
export const SignaturePad = ({
  onChange,
}: {
  onChange: (dataUrl: string | null) => void;
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const drawing = useRef(false);
  const [hasInk, setHasInk] = useState(false);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    // Crisp lines on HiDPI.
    const ratio = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width * ratio;
    canvas.height = rect.height * ratio;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.scale(ratio, ratio);
    ctx.lineWidth = 2.2;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    ctx.strokeStyle = "#000000";
  }, []);

  const pos = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const rect = canvasRef.current!.getBoundingClientRect();
    return { x: e.clientX - rect.left, y: e.clientY - rect.top };
  };

  const start = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const ctx = canvasRef.current?.getContext("2d");
    if (!ctx) return;
    drawing.current = true;
    const { x, y } = pos(e);
    ctx.beginPath();
    ctx.moveTo(x, y);
    canvasRef.current?.setPointerCapture(e.pointerId);
  };
  const move = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!drawing.current) return;
    const ctx = canvasRef.current?.getContext("2d");
    if (!ctx) return;
    const { x, y } = pos(e);
    ctx.lineTo(x, y);
    ctx.stroke();
    if (!hasInk) setHasInk(true);
  };
  const end = () => {
    if (!drawing.current) return;
    drawing.current = false;
    const url = canvasRef.current?.toDataURL("image/png") ?? null;
    onChange(hasInk ? url : null);
  };

  const clear = () => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    setHasInk(false);
    onChange(null);
  };

  return (
    <div>
      <div className="relative">
        <canvas
          ref={canvasRef}
          onPointerDown={start}
          onPointerMove={move}
          onPointerUp={end}
          onPointerLeave={end}
          className="w-full h-44 bg-white border border-warm-sand rounded-2xl touch-none cursor-crosshair"
        />
        {!hasInk && (
          <p className="absolute inset-0 flex items-center justify-center text-sm text-warm-silver pointer-events-none">
            Firma aquí con el dedo o el mouse
          </p>
        )}
      </div>
      <button
        type="button"
        onClick={clear}
        className="mt-2 text-xs font-semibold text-warm-olive hover:text-warm-accent inline-flex items-center gap-1.5 transition"
      >
        <Eraser size={14} /> Borrar firma
      </button>
    </div>
  );
};
