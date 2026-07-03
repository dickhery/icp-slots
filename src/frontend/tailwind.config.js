import typography from "@tailwindcss/typography";
import containerQueries from "@tailwindcss/container-queries";
import animate from "tailwindcss-animate";

/** @type {import('tailwindcss').Config} */
export default {
  darkMode: ["class"],
  content: ["index.html", "src/**/*.{js,ts,jsx,tsx,html,css}"],
  theme: {
    container: {
      center: true,
      padding: "2rem",
      screens: {
        "2xl": "1400px",
      },
    },
    extend: {
      colors: {
        border: "oklch(var(--border))",
        input: "oklch(var(--input))",
        ring: "oklch(var(--ring) / <alpha-value>)",
        background: "oklch(var(--background))",
        foreground: "oklch(var(--foreground))",
        primary: {
          DEFAULT: "oklch(var(--primary) / <alpha-value>)",
          foreground: "oklch(var(--primary-foreground))",
        },
        secondary: {
          DEFAULT: "oklch(var(--secondary) / <alpha-value>)",
          foreground: "oklch(var(--secondary-foreground))",
        },
        destructive: {
          DEFAULT: "oklch(var(--destructive) / <alpha-value>)",
          foreground: "oklch(var(--destructive-foreground))",
        },
        muted: {
          DEFAULT: "oklch(var(--muted) / <alpha-value>)",
          foreground: "oklch(var(--muted-foreground) / <alpha-value>)",
        },
        accent: {
          DEFAULT: "oklch(var(--accent) / <alpha-value>)",
          foreground: "oklch(var(--accent-foreground))",
        },
        success: {
          DEFAULT: "oklch(var(--success) / <alpha-value>)",
          foreground: "oklch(var(--success-foreground))",
        },
        warning: {
          DEFAULT: "oklch(var(--warning) / <alpha-value>)",
          foreground: "oklch(var(--warning-foreground))",
        },
        popover: {
          DEFAULT: "oklch(var(--popover))",
          foreground: "oklch(var(--popover-foreground))",
        },
        card: {
          DEFAULT: "oklch(var(--card))",
          foreground: "oklch(var(--card-foreground))",
        },
        chart: {
          1: "oklch(var(--chart-1))",
          2: "oklch(var(--chart-2))",
          3: "oklch(var(--chart-3))",
          4: "oklch(var(--chart-4))",
          5: "oklch(var(--chart-5))",
        },
        sidebar: {
          DEFAULT: "oklch(var(--sidebar))",
          foreground: "oklch(var(--sidebar-foreground))",
          primary: "oklch(var(--sidebar-primary))",
          "primary-foreground": "oklch(var(--sidebar-primary-foreground))",
          accent: "oklch(var(--sidebar-accent))",
          "accent-foreground": "oklch(var(--sidebar-accent-foreground))",
          border: "oklch(var(--sidebar-border))",
          ring: "oklch(var(--sidebar-ring))",
        },
      },
      fontFamily: {
        display: ["var(--font-display)", "serif"],
        body: ["var(--font-body)", "sans-serif"],
        mono: ["var(--font-mono)", "monospace"],
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
      boxShadow: {
        xs: "0 1px 2px 0 rgba(0,0,0,0.05)",
        gold: "0 0 24px oklch(0.82 0.16 80 / 0.35), 0 0 6px oklch(0.82 0.16 80 / 0.25)",
        "gold-lg":
          "0 0 48px oklch(0.82 0.16 80 / 0.45), 0 0 12px oklch(0.82 0.16 80 / 0.3)",
        primary: "0 0 24px oklch(0.62 0.24 25 / 0.4), 0 0 6px oklch(0.62 0.24 25 / 0.25)",
        elevated:
          "0 12px 32px -8px oklch(0.05 0.01 50 / 0.7), 0 4px 12px -4px oklch(0.05 0.01 50 / 0.5)",
        cabinet:
          "inset 0 2px 8px oklch(0.05 0.01 50 / 0.6), inset 0 -2px 8px oklch(0.05 0.01 50 / 0.4), 0 16px 40px -12px oklch(0.05 0.01 50 / 0.8)",
      },
      keyframes: {
        "accordion-down": {
          from: { height: "0" },
          to: { height: "var(--radix-accordion-content-height)" },
        },
        "accordion-up": {
          from: { height: "var(--radix-accordion-content-height)" },
          to: { height: "0" },
        },
        "reel-spin": {
          "0%": { transform: "translateY(0)" },
          "100%": { transform: "translateY(-100%)" },
        },
        "win-flash": {
          "0%, 100%": {
            boxShadow: "0 0 0 oklch(0.82 0.16 80 / 0)",
            filter: "brightness(1)",
          },
          "50%": {
            boxShadow: "0 0 48px oklch(0.82 0.16 80 / 0.7)",
            filter: "brightness(1.25)",
          },
        },
        "coin-drop": {
          "0%": { transform: "translateY(-120%) rotate(0deg)", opacity: "0" },
          "40%": { opacity: "1" },
          "70%": { transform: "translateY(8%) rotate(540deg)" },
          "85%": { transform: "translateY(-6%) rotate(720deg)" },
          "100%": { transform: "translateY(0) rotate(720deg)", opacity: "1" },
        },
        "pulse-glow": {
          "0%, 100%": { boxShadow: "0 0 12px oklch(0.62 0.24 25 / 0.3)" },
          "50%": { boxShadow: "0 0 28px oklch(0.62 0.24 25 / 0.6)" },
        },
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
        "reel-spin": "reel-spin 0.12s linear infinite",
        "win-flash": "win-flash 0.9s ease-in-out 2",
        "coin-drop": "coin-drop 0.8s cubic-bezier(0.34, 1.56, 0.64, 1) both",
        "pulse-glow": "pulse-glow 2.4s ease-in-out infinite",
      },
    },
  },
  plugins: [typography, containerQueries, animate],
};
