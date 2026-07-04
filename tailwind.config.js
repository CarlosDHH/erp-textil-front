// /** @type {import('tailwindcss').Config} */
// module.exports = {
//   content: [],
//   theme: {
//     extend: {},
//   },
//   plugins: [],
// }
module.exports = {
  corePlugins: {
    preflight: false,
  },
  content: ['./src/**/*.{html,ts}'],
  theme: {
    extend: {
      colors: {
        'erp-dark': '#111827',
        'erp-bg': '#f3f4f6',
        'erp-primary': '#3b82f6'
      }
    },
  },
  plugins: [],
}
