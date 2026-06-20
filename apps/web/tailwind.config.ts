import type { Config } from 'tailwindcss';

// design tokens 源：docs/specs/features/1.redeem-frontend/design/tokens.css
// 禁止散落 magic values（react.md 规则）。所有颜色/圆角/阴影只在此声明。
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        base: '#0B0B14',
        card: '#1A1B2E',
        input: '#12131F',
        primary: { DEFAULT: '#7C3AED', hover: '#6D28D9' },
        safe: '#2DD4BF',
        danger: '#F87171',
        warning: '#FBBF24',
        ink: { DEFAULT: '#F4F4FB', muted: '#9A9AB8' },
        line: { DEFAULT: '#2A2B45', focus: '#2DD4BF' },
      },
      fontFamily: {
        sans: ['"Noto Sans SC"', 'system-ui', '-apple-system', 'sans-serif'],
      },
      borderRadius: { card: '16px', input: '12px' },
      boxShadow: { card: '0 8px 40px rgba(124,58,237,.18)' },
    },
  },
  plugins: [],
} satisfies Config;
