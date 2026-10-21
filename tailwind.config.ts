import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        background: "#0a0c10",
        foreground: "#f0f6fc",
        card: "#12161f",
        border: "#21262d",
        brand: {
          blue: "#388bfd",
          green: "#2ea043",
          yellow: "#d29922",
          red: "#f85149",
          purple: "#a371f7",
        },
      },
    },
  },
  plugins: [],
};
export default config;
