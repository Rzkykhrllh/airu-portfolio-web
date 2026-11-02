import type { Config } from "tailwindcss";
import colors from "tailwindcss/colors";

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        background: "var(--background)",
        foreground: "var(--foreground)",
        hairline: "var(--hairline)",
        // Site-wide pure neutrals (no blue/warm cast): every gray-* class becomes neutral.
        gray: colors.neutral,
      },
      fontFamily: {
        sans: ["var(--font-sans)", "-apple-system", "BlinkMacSystemFont", "Segoe UI", "Helvetica Neue", "sans-serif"],
        display: ["var(--font-cormorant)", "Georgia", "serif"],
      },
    },
  },
  plugins: [],
};
export default config;
