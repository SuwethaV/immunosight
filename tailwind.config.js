/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Theme matching the reference image: light, crisp mint-tinted surfaces & deep teal accents
        canvas: {
          50: '#f4faf8',
          100: '#eef7f4',
          200: '#e1f0eb',
          DEFAULT: '#f3f9f7',
        },
        teal: {
          50: '#f0fdf9',
          100: '#ccfbf1',
          200: '#99f6e4',
          300: '#5eead4',
          400: '#2dd4bf',
          500: '#14b8a6',
          600: '#0d9488',
          700: '#0f766e',
          800: '#115e59',
          900: '#0d473f',
          950: '#072b26',
        },
        brand: {
          teal: '#0d7a68',
          'teal-dark': '#073e35',
          'teal-light': '#2dd4bf',
          'teal-muted': '#e6f7f2',
          mint: '#d5f5eb',
          'mint-subtle': '#f0faf6',
          border: '#dbeee7',
          'border-card': '#e4f2ec',
          dark: '#0d2823',
        },
        risk: {
          high: '#e11d48',
          'high-bg': '#ffe4e6',
          medium: '#d97706',
          'medium-bg': '#fef3c7',
          low: '#0d7a68',
          'low-bg': '#ccfbf1',
        }
      },
      fontFamily: {
        sans: ['Inter', 'ui-sans-serif', 'system-ui', '-apple-system', 'BlinkMacSystemFont', 'sans-serif'],
        mono: ['JetBrains Mono', 'ui-monospace', 'SFMono-Regular', 'Menlo', 'monospace'],
      },
      boxShadow: {
        'card': '0 1px 3px 0 rgba(0, 0, 0, 0.04), 0 1px 2px -1px rgba(0, 0, 0, 0.03)',
        'card-hover': '0 10px 25px -5px rgba(13, 122, 104, 0.08), 0 8px 10px -6px rgba(0, 0, 0, 0.03)',
        'pill': '0 1px 2px rgba(13, 122, 104, 0.1)',
      }
    },
  },
  plugins: [],
}
