/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        presence: {
          50: "#f5f7fb",
          100: "#e7ecf5",
          500: "#5b6bbf",
          600: "#4a58a8",
          700: "#3a4688",
          900: "#1e2650",
        },
        // Warm palette inspired by Pinterest design system
        // Used by the public landing page (and future marketing surfaces).
        warm: {
          // Brand accent — semantic name so the hue can shift without renaming.
          // Currently: deep magenta-purple, fits the contemplative legacy tone.
          accent: "#7e238b",
          "accent-hover": "#5e1a6a",
          plum: "#211922",
          olive: "#62625b",
          silver: "#91918c",
          sand: "#e5e5e0",
          light: "#e0e0d9",
          fog: "#f6f6f3",
          dark: "#33332e",
        },
      },
      fontFamily: {
        serif: ["Cormorant Garamond", "Georgia", "serif"],
      },
    },
  },
  plugins: [],
};
