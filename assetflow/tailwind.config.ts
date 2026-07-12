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
        // Flat Design Surface Hierarchy
        canvas:    "#F4F4F0",
        surface:   "#FFFFFF",
        sunken:    "#EAEAE6",
        // Bold flat text & border values
        ink:       "#1A1A1A",
        ink2:      "#4A4A4A",
        ink3:      "#8A8A8A",
        // Flat Blue Accent
        signal:    "#0066FF",
        signal2:   "#0052CC",
        // Semantic High Contrast Fills
        go:        "#16A34A",
        warn:      "#D97706",
        danger:    "#DC2626",
        violet:    "#7C3AED",
        // Flat Chip background fills
        go_bg:     "#E1F5FE", // Flat high contrast fills
        warn_bg:   "#FFF9C4",
        danger_bg: "#FFEBEE",
        violet_bg: "#F3E5F5",
        gray_bg:   "#EEEEEE",
        // Border colors
        border:    "#1A1A1A",
        border2:   "#4A4A4A",
      },
      fontFamily: {
        sans: ["-apple-system", "BlinkMacSystemFont", "Segoe UI", "Roboto", "Helvetica Neue", "Arial", "sans-serif"],
        mono: ["JetBrains Mono", "Fira Code", "Consolas", "monospace"],
      },
      borderRadius: {
        none: "0px",
        sm: "2px",
        md: "4px",
        lg: "8px",
      },
    },
  },
  plugins: [],
};

export default config;
