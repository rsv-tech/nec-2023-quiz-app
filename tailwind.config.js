/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'selector',
  content: [
    './index.html',
    './**/*.{ts,tsx}',        // все твои компоненты, так как нет src/
  ],
  theme: { extend: {} },
  plugins: [],
};
