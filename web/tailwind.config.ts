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
          primary: "#7A1E2C",
          "primary-dark": "#5C1521",
          "primary-light": "#9B2A3A",
          accent: "#B8922E",
          bg: "#F6F2EE",
          "bg-tint": "#EFE6E4",
          surface: "#FFFDFB",
          cream: "#F9F5F0",
          border: "#E6DDD6",
          "border-subtle": "#F0E9E3",
          muted: "#6B6560",
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
        card: "0 1px 2px rgba(92, 21, 33, 0.04), 0 6px 20px rgba(31, 31, 31, 0.05)",
        "card-hover":
          "0 2px 8px rgba(92, 21, 33, 0.06), 0 12px 28px rgba(31, 31, 31, 0.07)",
      },
      letterSpacing: {
        label: "0.16em",
      },
    },
  },
  plugins: [],
};

export default config;
