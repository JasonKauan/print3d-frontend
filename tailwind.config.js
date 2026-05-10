/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        bg:      '#0f1117',
        bg2:     '#181c27',
        bg3:     '#1e2333',
        border:  '#2a3050',
        accent:  '#4f7cff',
        accent2: '#7c5cff',
        success: '#2ecc8a',
        danger:  '#ff5c7a',
        warning: '#ffb547',
      },
      fontFamily: {
        sans: ['DM Sans', 'sans-serif'],
        mono: ['DM Mono', 'monospace'],
      }
    },
  },
  plugins: [],
}
