import type { Config } from "tailwindcss";

export default {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          50: "#f0f9f9",
          100: "#d6f2f1",
          200: "#ade5e3",
          300: "#7ed3d0",
          400: "#4cbab6",
          500: "#2f9f9c", // teal healthcare vibe
          600: "#24807e",
          700: "#1f6665",
          800: "#1d5252",
          900: "#1a4445",
        },
      },
    },
  },
  plugins: [],
} satisfies Config;
