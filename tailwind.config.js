/** @type {import('tailwindcss').Config} */
export default {
  content: ['./src/**/*.{html,js,svelte,ts}'],
  theme: {
    extend: {
      height: {
        'dyn-screen': '100dvh',
      },
    },
  },
  plugins: [],
}

