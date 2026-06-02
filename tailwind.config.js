/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        bg:      'rgb(var(--color-bg) / <alpha-value>)',
        bg2:     'rgb(var(--color-bg2) / <alpha-value>)',
        bg3:     'rgb(var(--color-bg3) / <alpha-value>)',
        border:  'rgb(var(--color-border) / <alpha-value>)',
        accent:  'rgb(var(--color-accent) / <alpha-value>)',
        accent2: 'rgb(var(--color-accent2) / <alpha-value>)',
        success: 'rgb(var(--color-success) / <alpha-value>)',
        danger:  'rgb(var(--color-danger) / <alpha-value>)',
        warning: 'rgb(var(--color-warning) / <alpha-value>)',
      },
      fontFamily: {
        sans: ['DM Sans', 'sans-serif'],
        mono: ['DM Mono', 'monospace'],
      }
    },
  },
  plugins: [],
}
