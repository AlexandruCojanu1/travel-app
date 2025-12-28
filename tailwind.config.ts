import type { Config } from "tailwindcss"

const config: Config = {
  darkMode: ["class"],
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        // MOVA brand colors from logo gradient
        // Gradient: Blue → Teal → Yellow-Green → Orange
        'mova-blue': '#3B82F6',      // Vibrant blue (M)
        'mova-teal': '#14B8A6',      // Teal/cyan (o)
        'mova-green': '#10B981',     // Yellow-green (v)
        'mova-orange': '#F97316',    // Warm orange (a)
        // Primary brand color (using blue as main)
        'mova-primary': '#3B82F6',
        // Secondary colors
        'mova-dark': '#1E293B',      // Dark slate for text
        'mova-gray': '#64748B',      // Medium gray
        'mova-light-gray': '#F1F5F9', // Light background
        'mova-light-blue': '#DBEAFE', // Light blue tint
        // Legacy support (mapped to MOVA colors)
        'airbnb-red': '#3B82F6',     // Mapped to mova-blue
        'airbnb-dark': '#1E293B',    // Mapped to mova-dark
        'airbnb-gray': '#64748B',    // Mapped to mova-gray
        'airbnb-light-gray': '#F1F5F9', // Mapped to mova-light-gray
        'airbnb-light-red': '#DBEAFE', // Mapped to mova-light-blue
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
        // Airbnb uses more rounded corners
        'airbnb': '12px',
        'airbnb-lg': '16px',
      },
      boxShadow: {
        // Airbnb card shadows - subtle and soft
        'airbnb': '0 1px 2px 0 rgba(0, 0, 0, 0.05), 0 1px 3px 0 rgba(0, 0, 0, 0.1)',
        'airbnb-md': '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
        'airbnb-lg': '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
        'airbnb-hover': '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
      },
      spacing: {
        // Airbnb uses generous spacing
        '18': '4.5rem',
        '22': '5.5rem',
      },
    },
  },
  plugins: [],
}

export default config

