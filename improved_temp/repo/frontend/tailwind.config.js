/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        // Body copy & UI chrome — legible at small sizes, does the quiet work.
        sans: ['Inter', 'sans-serif'],
        // Headlines only, used with restraint — carries the brand's personality.
        display: ['Fraunces', 'serif'],
        // Queue numbers, timestamps, ticket data — tabular figures, departure-board feel.
        mono: ['"JetBrains Mono"', 'monospace'],
      },
      colors: {
        // Signature palette — a clinic ticket counter, not a generic SaaS gradient.
        ink: {
          DEFAULT: '#12211D',
          50: '#F1F4F2',
          100: '#DCE3DE',
          400: '#5B6E63',
          600: '#2C3A34',
          900: '#0C1613',
        },
        paper: '#F5F7F5',
        signal: {
          // "Now serving" green — the color of a called ticket.
          50: '#EAF5EF',
          100: '#CDE8DA',
          300: '#7FC5A4',
          500: '#1E7A54',
          600: '#186043',
          700: '#134C36',
        },
        ticket: {
          // Amber — the color of the stub itself, used for waiting/pending states.
          50: '#FCF3E5',
          100: '#F7E2BC',
          300: '#EBB868',
          500: '#D98B2B',
          600: '#B06E1E',
        },
        urgent: '#C1442D',

        // --- Compatibility layer -------------------------------------------------
        // The original palette, kept so the ~17 internal app pages (dashboards,
        // queue tools, admin forms, modals) that were already styled against it
        // keep working unchanged. Only the public landing page uses the new
        // ink/paper/signal/ticket system above — re-skinning every internal
        // screen was a bigger, separate pass than this one, see CHANGES.md.
        brand: {
          50: '#F0F5FF', 100: '#E5EDFF', 200: '#CDDBFE', 300: '#B4C6FC', 400: '#8DA2FB',
          500: '#6875F5', 600: '#5850EC', 700: '#5145CD', 800: '#42389D', 900: '#362F78',
        },
        medical: {
          50: '#F2FBF9', 100: '#D5F2EA', 200: '#AFE4D5', 300: '#7CD1BC', 400: '#4EB6A0',
          500: '#329683', 600: '#26796A', 700: '#206156', 800: '#1C4D45', 900: '#17403A',
        },
        dark: '#0B1120',
        surface: '#F8FAFC',
      },
      boxShadow: {
        stub: '0 1px 0 rgba(18,33,29,0.04), 0 12px 24px -12px rgba(18,33,29,0.18)',
        'stub-lg': '0 1px 0 rgba(18,33,29,0.04), 0 30px 60px -20px rgba(18,33,29,0.28)',
        // compatibility layer for internal pages
        glass: '0 8px 32px 0 rgba(31, 38, 135, 0.07)',
        'glass-hover': '0 8px 32px 0 rgba(31, 38, 135, 0.15)',
        soft: '0 20px 40px -15px rgba(0,0,0,0.05)',
      },
      animation: {
        'flip-in': 'flipIn 0.6s cubic-bezier(0.22, 1, 0.36, 1) both',
        'rise': 'rise 0.5s cubic-bezier(0.16, 1, 0.3, 1) both',
        'pulse-slow': 'pulse 4s cubic-bezier(0.4, 0, 0.6, 1) infinite',
      },
      keyframes: {
        flipIn: {
          '0%': { opacity: '0', transform: 'rotateX(-90deg)' },
          '60%': { opacity: '1' },
          '100%': { opacity: '1', transform: 'rotateX(0deg)' },
        },
        rise: {
          '0%': { opacity: '0', transform: 'translateY(16px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
      },
    },
  },
  plugins: [],
};
