/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        presence: {
          50: "#fafafa",
          100: "#f2f2f2",
          500: "#404040",
          600: "#262626",
          700: "#171717",
          900: "#000000",
        },
        // Monochrome editorial palette — cinematic black/white/gray.
        // Semantic names kept so every surface restyles without renaming.
        warm: {
          // Brand accent — pure black in the monochrome system.
          accent: "#000000",
          "accent-hover": "#2b2b2b",
          plum: "#000000", // primary text / headings
          olive: "#6F6F6F", // secondary text, descriptions, menu items
          silver: "#A3A3A3", // tertiary text, placeholders
          sand: "#E8E8E8", // hairline borders
          light: "#F2F2F2", // subtle fills
          fog: "#FAFAFA", // section backgrounds
          dark: "#000000", // footers, inverted surfaces
        },
      },
      fontFamily: {
        sans: ["Inter", "system-ui", "-apple-system", "sans-serif"],
        serif: ["Instrument Serif", "Georgia", "serif"],
      },
    },
  },
  plugins: [],
};
