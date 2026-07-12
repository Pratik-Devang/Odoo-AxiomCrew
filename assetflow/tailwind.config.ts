import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./lib/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        // Surface hierarchy
        canvas:    "#F0EEE9",
        surface:   "#FFFFFF",
        sunken:    "#E8E6E0",
        // Brand / Text
        ink:       "#1C1C1A",
        ink2:      "#4A4A46",
        ink3:      "#8A8880",
        // Accent
        signal:    "#2563EB",
        signal2:   "#1D4ED8",
        // Semantic
        go:        "#16A34A",
        warn:      "#D97706",
        danger:    "#DC2626",
        violet:    "#7C3AED",
        // Status chip backgrounds
        go_bg:     "#DCFCE7",
        warn_bg:   "#FEF3C7",
        danger_bg: "#FEE2E2",
        violet_bg: "#EDE9FE",
        gray_bg:   "#F1F0EC",
        // Borders
        border:    "#D6D4CE",
        border2:   "#B8B6B0",
      },
      fontFamily: {
        sans: ["Inter", "system-ui", "sans-serif"],
        mono: ["JetBrains Mono", "Fira Code", "Consolas", "monospace"],
      },
    },
  },
  plugins: [],
};

export default config;
