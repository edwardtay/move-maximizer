import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: ["class"],
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        primary: {
          DEFAULT: "#FFCC00",
          foreground: "#000000",
          50: "#FFFBEB",
          100: "#FFF3C4",
          200: "#FFE98A",
          300: "#FFDC4E",
          400: "#FFCC00",
          500: "#E6B800",
          600: "#B38F00",
          700: "#806600",
          800: "#4D3D00",
          900: "#1A1400",
        },
        secondary: {
          DEFAULT: "#1A1A2E",
          foreground: "#FFFFFF",
        },
        accent: {
          DEFAULT: "#16213E",
          foreground: "#FFFFFF",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
        success: "#10B981",
        warning: "#F59E0B",
        error: "#EF4444",
      },
      backgroundImage: {
        "gradient-radial": "radial-gradient(var(--tw-gradient-stops))",
        "gradient-conic":
          "conic-gradient(from 180deg at 50% 50%, var(--tw-gradient-stops))",
        "movement-gradient": "linear-gradient(135deg, #FFCC00 0%, #FF9900 100%)",
      },
      animation: {
        "pulse-slow": "pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite",
        "float": "float 3s ease-in-out infinite",
        "glow": "glow 2s ease-in-out infinite alternate",
      },
      keyframes: {
        float: {
          "0%, 100%": { transform: "translateY(0)" },
          "50%": { transform: "translateY(-10px)" },
        },
        glow: {
          "0%": { boxShadow: "0 0 5px #FFCC00, 0 0 10px #FFCC00" },
          "100%": { boxShadow: "0 0 20px #FFCC00, 0 0 30px #FFCC00" },
        },
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
};

export default config;
