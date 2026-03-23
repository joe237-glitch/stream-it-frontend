export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        dark: { DEFAULT: '#0a0a0f', card: '#12121a', border: '#1e1e2e' },
        brand: { DEFAULT: '#6366f1', light: '#818cf8', dark: '#4f46e5' },
        violet: '#8b5cf6',
      },
      backdropBlur: { xs: '2px' },
    },
  },
  plugins: [],
}
