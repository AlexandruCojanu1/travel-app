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
        // MOVA brand colors - REBRANDED
        'mova-blue': '#325FEC',      // Deep Blue (Primary)
        'mova-teal': '#518FFF',      // Bright Blue (Secondary)
        'mova-green': '#518FFF',     // Mapped to Bright Blue
        'mova-orange': '#518FFF',    // Mapped to Bright Blue

        // NEW REBRAND COLORS (Pastel Theme)
        'brand-primary': '#325FEC',  // Deep Blue
        'brand-cream': '#FFFFFF',    // Background (White)
        'brand-light-blue': '#518FFF', // Bright Blue
        'brand-light-green': '#518FFF', // Mapped to Bright Blue

        // MAPPING Old Dark/Red Theme to New Theme
        'brand-red': '#325FEC',      // Main Accent -> Deep Blue
        'brand-dark': '#081116',     // Dark text/bg
        'brand-cherry': '#518FFF',   // Secondary Background -> Bright Blue
        'brand-white': '#FFFFFF',    // Text on dark -> White

        // Primary brand color
        'mova-primary': '#325FEC',

        // Secondary colors
        'mova-dark': '#081116',      // Text color
        'mova-gray': '#64748B',      // Slate 500
        'mova-light-gray': '#F1F5F9', // Slate 100
        'mova-light-blue': '#518FFF',

        // Legacy support
        'airbnb-red': '#325FEC',
        'airbnb-dark': '#FFFFFF',    // Backgrounds become White
        'airbnb-gray': '#64748B',
        'airbnb-light-gray': '#F1F5F9',
        'airbnb-light-red': '#518FFF',
      },
      fontFamily: {
        sans: ["var(--font-inter)", "sans-serif"],
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

