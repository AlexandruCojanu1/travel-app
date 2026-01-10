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
        // MOVA brand colors - REBRANDED (Pastel & Professional)
        'mova-blue': '#364C84',      // Dark Blue (Primary)
        'mova-teal': '#95B1EE',      // Light Blue (Secondary)
        'mova-green': '#E7F1A8',     // Light Green (Highlight)
        'mova-orange': '#95B1EE',    // Mapped to Light Blue for consistency in gradients

        // NEW REBRAND COLORS (Pastel Theme)
        'brand-primary': '#364C84',  // Dark Blue
        'brand-cream': '#FFFDF5',    // Background
        'brand-light-blue': '#95B1EE',
        'brand-light-green': '#E7F1A8',

        // MAPPING Old Dark/Red Theme to New Light/Pastel Theme
        'brand-red': '#364C84',      // Main Accent -> Dark Blue
        'brand-dark': '#364C84',     // Dark Background elements -> Dark Blue
        'brand-cherry': '#95B1EE',   // Secondary Background -> Light Blue
        'brand-white': '#FFFFFF',    // Text on dark -> White

        // Primary brand color
        'mova-primary': '#364C84',

        // Secondary colors
        'mova-dark': '#364C84',      // Text color
        'mova-gray': '#64748B',      // Slate 500
        'mova-light-gray': '#F1F5F9', // Slate 100
        'mova-light-blue': '#95B1EE',

        // Legacy support
        'airbnb-red': '#364C84',
        'airbnb-dark': '#FFFDF5',    // Backgrounds become Cream
        'airbnb-gray': '#64748B',
        'airbnb-light-gray': '#F1F5F9',
        'airbnb-light-red': '#95B1EE',
      },
      fontFamily: {
        sans: ["var(--font-dm-sans)", "sans-serif"],
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

