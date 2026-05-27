import { useEffect } from "react";

/**
 * Set document.title for the current page. Restores the previous title on unmount
 * so transient pages don't leak into others. Format: "<title> · Presence" unless
 * title is falsy (then just "Presence").
 */
export const useDocumentTitle = (title: string | null | undefined) => {
  useEffect(() => {
    const previous = document.title;
    document.title = title ? `${title} · Presence` : "Presence";
    return () => {
      document.title = previous;
    };
  }, [title]);
};
