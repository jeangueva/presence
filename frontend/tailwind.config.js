/** @type {import('tailwindcss').Config} */

// Every color resolves to a CSS custom property declared in
// src/styles/tokens.css. `<alpha-value>` keeps the `/NN` opacity modifiers
// working (`bg-warm-accent/10`), which hex values would break.
const token = (name) => `rgb(var(--${name}) / <alpha-value>)`;

export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        // Semantic names — use these in new code.
        ink: { DEFAULT: token("ink"), hover: token("ink-hover") },
        muted: token("muted"),
        faint: token("faint"),
        hairline: token("hairline"),
        canvas: { DEFAULT: token("canvas"), alt: token("canvas-alt") },
        surface: token("fill"),
        "on-ink": token("on-ink"),
        danger: {
          DEFAULT: token("danger"),
          fill: token("danger-fill"),
          hairline: token("danger-hairline"),
        },

        // Original palette names, now pointing at the monochrome tokens. Kept
        // so the ~90 existing `warm-*` classnames across the app keep resolving
        // instead of forcing a rename sweep through every page.
        warm: {
          accent: token("ink"),
          "accent-hover": token("ink-hover"),
          plum: token("ink"), // primary text / headings
          olive: token("muted"), // secondary text, descriptions, menu items
          silver: token("faint"), // tertiary text, placeholders
          sand: token("hairline"), // hairline borders
          light: token("fill"), // subtle fills
          fog: token("canvas-alt"), // section backgrounds
          dark: token("ink"), // footers, inverted surfaces
        },
      },
      fontFamily: {
        sans: "var(--font-body)",
        serif: "var(--font-display)",
      },
      letterSpacing: {
        display: "var(--tracking-display)",
        section: "var(--tracking-section)",
        eyebrow: "var(--tracking-eyebrow)",
      },
      lineHeight: {
        display: "var(--leading-display)",
      },
      borderRadius: {
        pill: "var(--radius-pill)",
        card: "var(--radius-card)",
        panel: "var(--radius-panel)",
        slab: "var(--radius-slab)",
      },
      transitionTimingFunction: {
        cinematic: "var(--ease-cinematic)",
      },
      transitionDuration: {
        hover: "var(--duration-hover)",
        page: "var(--duration-page)",
        reveal: "var(--duration-reveal)",
      },
      boxShadow: {
        raise: "var(--shadow-raise)",
        lift: "var(--shadow-lift)",
      },
      scale: {
        lift: "var(--lift)",
      },
    },
  },
  plugins: [],
};
