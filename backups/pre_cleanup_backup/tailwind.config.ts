import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        // Nagłówki / hero / napisy — gruby, „VIP”
        display: ["var(--font-display)", "Cormorant Garamond", "serif"],
        // Tekst bieżący / UI
        sans: ["var(--font-sans)", "Montserrat", "sans-serif"],
      },
      colors: {
        background: "var(--background)",
        foreground: "var(--foreground)",
        gold: {
          50: "#F9F5E8",
          100: "#F1E8C6",
          200: "#E6D294",
          300: "#DBBC62",
          400: "#D4AF37", // Classic Gold
          500: "#B5952F",
          600: "#967B27",
          700: "#78621F",
          800: "#5A4917",
          900: "#3C310F",
        },
      },
    },
  },
  plugins: [],
};
export default config;
