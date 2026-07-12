import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        "af-background": "#0d0f10",
        "af-panel": "#16181a",
        "af-green": "#1f3d33",
      },
    },
  },
  plugins: [],
};

export default config;
