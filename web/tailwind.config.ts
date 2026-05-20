import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          primary: "#7A2438",
          "primary-dark": "#5E1A2B",
          "primary-light": "#943248",
          accent: "#A68B4B",
          bg: "#F3F1EE",
          "bg-tint": "#EBE8E4",
          surface: "#FFFFFF",
          cream: "#F7F5F2",
          border: "#E4E0DA",
          "border-subtle": "#EEEAE4",
          muted: "#5E5A55",
        },
      },
      fontFamily: {
        sans: [
          "var(--font-sans)",
          "Pretendard",
          "-apple-system",
          "BlinkMacSystemFont",
          "system-ui",
          "sans-serif",
        ],
      },
      boxShadow: {
        card: "0 1px 2px rgba(31, 31, 31, 0.04), 0 6px 20px rgba(31, 31, 31, 0.05)",
        "card-hover":
          "0 2px 8px rgba(31, 31, 31, 0.06), 0 12px 28px rgba(31, 31, 31, 0.07)",
      },
      letterSpacing: {
        label: "0.16em",
      },
    },
  },
  plugins: [],
};

export default config;
