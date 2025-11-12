// postcss.config.js
export default {
  plugins: {
    '@tailwindcss/postcss': {}, // ✅ только так для Tailwind v4
    autoprefixer: {},
  },
};
