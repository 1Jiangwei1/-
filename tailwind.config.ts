import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: ["class"],
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./lib/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        bg: "#0b0a08",
        card: "#11100d",
        accent: "#b18b43",
        muted: "#9f967d",
        border: "#2b2416",
      },
    },
  },
  plugins: [],
};

export default config;
