import type { Config } from "tailwindcss";
import typography from '@tailwindcss/typography';

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
        // Elegancka szeryfowa (Playfair)
        serif: ["var(--font-playfair)", "Playfair Display", "serif"],
        // Odręczna (Great Vibes)
        handwriting: ["var(--font-great-vibes)", "Great Vibes", "cursive"],        'great-vibes': ["var(--font-great-vibes)", "Great Vibes", "cursive"],      },
      colors: {
        background: "var(--background)",
        foreground: "var(--foreground)",
        gold: {
          50: "#F7F4EA",
          100: "#EEE3C9",
          200: "#DBCA93",
          300: "#C9B05D",
          400: "#B79727",
          500: "#9F7A16", // Base gold from user
          600: "#8A6A13",
          700: "#755A10",
          800: "#604A0D",
          900: "#4B3A0A",
        },
      },
      keyframes: {
        'pulse-soft': {
          '0%, 100%': { boxShadow: '0 0 30px rgba(212,175,55,0.25)' },
          '50%': { boxShadow: '0 0 50px rgba(212,175,55,0.55)' },
        },
        'pulse-slow': {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0.85' },
        },
        float: {
          '0%, 100%': { transform: 'translate(0, 0) scale(1)' },
          '25%': { transform: 'translate(30px, -30px) scale(1.05)' },
          '50%': { transform: 'translate(-20px, 20px) scale(0.95)' },
          '75%': { transform: 'translate(20px, 30px) scale(1.02)' },
        },
      },
      animation: {
        'pulse-soft': 'pulse-soft 2.5s ease-in-out infinite',
        'pulse-slow': 'pulse-slow 3s ease-in-out infinite',
        float: 'float 20s ease-in-out infinite',
      },
      backgroundImage: {
        'gradient-radial': 'radial-gradient(circle, var(--tw-gradient-stops))',
      },
    },
  },
  plugins: [
    typography,
  ],
};
export default config;
