import { useEffect, useState } from "react";
import { useReducedMotion } from "framer-motion";

type Props = {
  text: string;
  /** Characters per second. ~22 is a comfortable reading rhythm. */
  speed?: number;
  /** If false, render the full text instantly (used for history messages). */
  animate?: boolean;
};

export const Typewriter = ({ text, speed = 22, animate = true }: Props) => {
  const reduce = useReducedMotion();
  const [visible, setVisible] = useState(animate && !reduce ? 0 : text.length);

  useEffect(() => {
    if (!animate || reduce) {
      setVisible(text.length);
      return;
    }
    setVisible(0);
  }, [text, animate, reduce]);

  useEffect(() => {
    if (!animate || reduce) return;
    if (visible >= text.length) return;
    // Speed up large messages so they don't take forever; cap effective duration at ~4s.
    const totalDuration = Math.min(text.length * (1000 / speed), 4000);
    const step = Math.max(totalDuration / text.length, 12);
    const t = setTimeout(() => setVisible((v) => v + 1), step);
    return () => clearTimeout(t);
  }, [visible, text, speed, animate, reduce]);

  return (
    <>
      {text.slice(0, visible)}
      {animate && !reduce && visible < text.length && (
        <span className="inline-block w-[2px] h-[1em] align-middle bg-current ml-0.5 animate-pulse" />
      )}
    </>
  );
};
