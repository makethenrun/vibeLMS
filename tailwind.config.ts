import type { Config } from "tailwindcss";
import animate from "tailwindcss-animate";

const config: Config = {
  darkMode: ["class"],
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./lib/**/*.{ts,tsx}",
    "./hooks/**/*.{ts,tsx}",
  ],
  theme: {
    container: {
      center: true,
      padding: "2rem",
      screens: {
        "2xl": "1400px",
      },
    },
    extend: {
      // All named text sizes scaled ~15% larger. Arbitrary sizes (text-[…]),
      // used by flip-card faces, are unaffected — cards keep their size.
      fontSize: {
        xs: ["0.8625rem", { lineHeight: "1.15rem" }],
        sm: ["1.00625rem", { lineHeight: "1.4375rem" }],
        base: ["1.15rem", { lineHeight: "1.725rem" }],
        lg: ["1.29375rem", { lineHeight: "2.0125rem" }],
        xl: ["1.4375rem", { lineHeight: "2.0125rem" }],
        "2xl": ["1.725rem", { lineHeight: "2.3rem" }],
        "3xl": ["2.15625rem", { lineHeight: "2.5875rem" }],
        "4xl": ["2.5875rem", { lineHeight: "2.875rem" }],
        "5xl": ["3.45rem", { lineHeight: "1" }],
        "6xl": ["4.3125rem", { lineHeight: "1" }],
        "7xl": ["5.175rem", { lineHeight: "1" }],
        "8xl": ["6.9rem", { lineHeight: "1" }],
        "9xl": ["9.2rem", { lineHeight: "1" }],
      },
      fontFamily: {
        // Latin/Cyrillic use the system sans; CJK glyphs fall through to SimSun.
        sans: [
          "ui-sans-serif",
          "system-ui",
          "-apple-system",
          "Segoe UI",
          "Roboto",
          "Helvetica Neue",
          "Arial",
          "sans-serif",
          "SimSun",
          "宋体",
          "Apple Color Emoji",
          "Segoe UI Emoji",
        ],
      },
      colors: {
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
        sidebar: {
          DEFAULT: "hsl(var(--sidebar-background))",
          foreground: "hsl(var(--sidebar-foreground))",
          accent: "hsl(var(--sidebar-accent))",
          "accent-foreground": "hsl(var(--sidebar-accent-foreground))",
          border: "hsl(var(--sidebar-border))",
        },
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
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
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
      },
    },
  },
  plugins: [animate],
};

export default config;
