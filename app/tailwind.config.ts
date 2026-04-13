import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        ink: "#020617",
        panel: "#0b1220",
        edge: "#1e293b",
        accent: "#22d3ee",
        success: "#34d399",
        danger: "#f87171",
      },
      boxShadow: {
        panel: "0 0 0 1px rgba(30, 41, 59, 0.9)",
      },
    },
  },
  plugins: [],
};

export default config;
