import { useEffect } from "react";

const SCRIPT_ID_PREFIX = "ld-json-page-";

/**
 * Injects (and on unmount removes) one or more JSON-LD scripts into <head>.
 *
 * Pass either a single schema object or an array. Each schema becomes its own
 * <script type="application/ld+json"> tag with a deterministic id, so
 * navigation cleans them up properly.
 */
export const useStructuredData = (
  schema: Record<string, unknown> | Record<string, unknown>[]
) => {
  useEffect(() => {
    const list = Array.isArray(schema) ? schema : [schema];
    const created: HTMLScriptElement[] = [];
    list.forEach((s, i) => {
      const id = `${SCRIPT_ID_PREFIX}${i}`;
      const el = document.createElement("script");
      el.id = id;
      el.type = "application/ld+json";
      el.textContent = JSON.stringify(s);
      document.head.appendChild(el);
      created.push(el);
    });
    return () => {
      created.forEach((el) => el.remove());
    };
    // We stringify here to compare structurally — passing the same shape
    // shouldn't re-run.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [JSON.stringify(schema)]);
};
