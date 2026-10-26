/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        // Rapido / Ride-Karo Signature Yellow Accent
        primaryYellow: {
          DEFAULT: '#F9D342',
          light: '#FDE68A',
          hover: '#F59E0B',
          dark: '#D97706',
        },
        brand: {
          50: '#fffbeb',
          100: '#fef3c7',
          200: '#fde68a',
          300: '#fcd34d',
          400: '#F9D342',
          500: '#FBC02D',
          600: '#d97706',
          700: '#b45309',
          800: '#92400e',
          900: '#78350f',
        },
        surface: {
          50: '#f8fafc',
          100: '#f1f5f9',
          200: '#e2e8f0',
          300: '#cbd5e1',
          400: '#94a3b8',
          500: '#64748b',
          600: '#475569',
          700: '#334155',
          800: '#1e293b',
          900: '#0f172a',
        }
      },
      fontFamily: {
        sans: ['"Plus Jakarta Sans"', 'Inter', 'system-ui', '-apple-system', 'sans-serif'],
      },
      boxShadow: {
        'floating': '0 8px 24px -4px rgba(0, 0, 0, 0.12), 0 4px 8px -2px rgba(0, 0, 0, 0.06)',
        'yellow-glow': '0 6px 20px -3px rgba(249, 211, 66, 0.45)',
        'card': '0 2px 8px -1px rgba(0, 0, 0, 0.08)',
      },
    },
  },
  plugins: [],
};
