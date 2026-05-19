/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: '#22c55e', // green-500
          light: '#4ade80', // green-400
          dark: '#16a34a' // green-600
        },
        secondary: {
          DEFAULT: '#f97316', // orange-500
          light: '#fb923c', // orange-400
        },
        tertiary: {
          DEFAULT: '#3b82f6', // blue-500
          light: '#60a5fa' // blue-400
        },
        'background-light': '#f7fdf9',
        'background-dark': '#0c1a12',
        'foreground-light': '#050f08',
        'foreground-dark': '#f0fdf4',
        'card-light': '#ffffff',
        'card-dark': '#111f16',
        'muted-light': '#52525b',
        'muted-dark': '#a1a1aa',
        'border-light': '#e4e4e7',
        'border-dark': '#27272a'
      },
      fontFamily: {
        display: ["Inter", 'sans-serif'],
      },
      borderRadius: {
        DEFAULT: "0.75rem",
        lg: "1rem",
        xl: "1.5rem",
        full: "9999px"
      },
      boxShadow: {
        'soft': '0 4px 6px -1px rgba(0, 0, 0, 0.05), 0 2px 4px -2px rgba(0, 0, 0, 0.05)',
        'soft-dark': '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -2px rgba(0, 0, 0, 0.1)',
      }
    },
  },
  plugins: [
    import('@tailwindcss/forms'),
  ],
}