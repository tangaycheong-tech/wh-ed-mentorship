import type { Config } from 'tailwindcss';

const config: Config = {
  content: ['./app/**/*.{js,ts,jsx,tsx,mdx}', './components/**/*.{js,ts,jsx,tsx,mdx}'],
  theme: {
    extend: {
      colors: {
        primary: { DEFAULT: '#0D9488', light: '#14B8A6', dark: '#0F766E' },
        secondary: { DEFAULT: '#6366F1', light: '#818CF8', dark: '#4F46E5' },
      },
    },
  },
  plugins: [],
};

export default config;