/** @type {import('tailwindcss').Config} */
export default {
  content: [
    './index.html',
    './**/*.{ts,tsx}',        // все твои компоненты, так как нет src/
  ],
  theme: { extend: {} },
  plugins: [],
};
