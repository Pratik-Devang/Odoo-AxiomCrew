import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./lib/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    borderWidth: {
      DEFAULT: "1px",
      0: "0",
      2: "1px",
      4: "3px",
      8: "8px",
    },
    extend: {
      colors: {
        depth:     "#1E2A3A",
        deepMid:   "#253447",
        canvas:    "#F8F7F4",
        surface:   "#FFFFFF",
        sunken:    "#F0EFF0",
        ink:       "#1A1F2E",
        ink2:      "#5A6170",
        ink3:      "#7C8494",
        signal:    "#6B5FE4",
        signal2:   "#5A4FD3",
        go:        "#3A9E6F",
        warn:      "#D4860A",
        danger:    "#C0392B",
        violet:    "#6B5FE4",
        go_bg:     "#E8F5EE",
        warn_bg:   "#FDF3E0",
        danger_bg: "#FBE9E7",
        violet_bg: "#EEECFB",
        gray_bg:   "#F0EFF0",
        border:    "#E4E2DC",
        borderDark:"#C8C5BC",
      },
      fontFamily: {
        sans: ["var(--font-inter)", "-apple-system", "BlinkMacSystemFont", "sans-serif"],
        display: ["var(--font-outfit)", "var(--font-inter)", "system-ui", "sans-serif"],
        mono: ["var(--font-jetbrains-mono)", "monospace"],
      },
      borderRadius: {
        none: "4px",
        sm: "4px",
        md: "8px",
        lg: "12px",
      },
    },
  },
  plugins: [],
};

export default config;
