/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
        display: ['Outfit', 'sans-serif'],
      },
      colors: {
        brand: {
          50: '#F0F5FF',
          100: '#E5EDFF',
          200: '#CDDBFE',
          300: '#B4C6FC',
          400: '#8DA2FB',
          500: '#6875F5', // Premium Indigo/Blue
          600: '#5850EC',
          700: '#5145CD',
          800: '#42389D',
          900: '#362F78',
        },
        medical: {
          50: '#F2FBF9',
          100: '#D5F2EA',
          200: '#AFE4D5',
          300: '#7CD1BC',
          400: '#4EB6A0',
          500: '#329683', // Trustworthy Teal
          600: '#26796A',
          700: '#206156',
          800: '#1C4D45',
          900: '#17403A',
        },
        dark: '#0B1120',
        surface: '#F8FAFC',
      },
      animation: {
        'fade-in': 'fadeIn 0.5s ease-out forwards',
        'fade-in-up': 'fadeInUp 0.6s cubic-bezier(0.16, 1, 0.3, 1) forwards',
        'fade-in-right': 'fadeInRight 0.6s cubic-bezier(0.16, 1, 0.3, 1) forwards',
        'slide-up': 'slideUp 0.5s ease-out forwards',
        'pulse-slow': 'pulse 4s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'float': 'float 6s ease-in-out infinite',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        fadeInUp: {
          '0%': { opacity: '0', transform: 'translateY(24px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        fadeInRight: {
          '0%': { opacity: '0', transform: 'translateX(-24px)' },
          '100%': { opacity: '1', transform: 'translateX(0)' },
        },
        slideUp: {
          '0%': { opacity: '0', transform: 'translateY(20px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        float: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-10px)' },
        }
      },
      boxShadow: {
        'glass': '0 8px 32px 0 rgba(31, 38, 135, 0.07)',
        'glass-hover': '0 8px 32px 0 rgba(31, 38, 135, 0.15)',
        'soft': '0 20px 40px -15px rgba(0,0,0,0.05)',
      }
    },
  },
  plugins: [],
};
