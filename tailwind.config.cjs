/** @type {import('tailwindcss').Config} */
const c = (v) => `hsl(var(--${v}) / <alpha-value>)`;
module.exports = {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  darkMode: 'class',
  theme: {
    container: { center: true, padding: '2rem' },
    extend: {
      colors: {
        // shadcn/ui tokens
        border: c('border'),
        input: c('input'),
        ring: c('ring'),
        background: c('background'),
        foreground: c('foreground'),
        primary: { DEFAULT: c('primary'), foreground: c('primary-foreground') },
        secondary: { DEFAULT: c('secondary'), foreground: c('secondary-foreground') },
        destructive: { DEFAULT: c('destructive'), foreground: c('destructive-foreground') },
        muted: { DEFAULT: c('muted'), foreground: c('muted-foreground') },
        accent: { DEFAULT: c('accent'), foreground: c('accent-foreground') },
        popover: { DEFAULT: c('popover'), foreground: c('popover-foreground') },
        card: { DEFAULT: c('card'), foreground: c('card-foreground') },
        // EasyJSON extras
        canvas: c('canvas'),
        faint: c('faint'),
        'border-strong': c('border-strong'),
        success: c('success'),
        warning: c('warning'),
        'j-key': c('j-key'),
        'j-string': c('j-string'),
        'j-number': c('j-number'),
        'j-bool': c('j-bool'),
        'j-null': c('j-null'),
      },
      borderRadius: {
        lg: 'var(--radius)',
        md: 'calc(var(--radius) - 2px)',
        sm: 'calc(var(--radius) - 4px)',
      },
      fontFamily: {
        sans: ['-apple-system', 'BlinkMacSystemFont', '"Segoe UI"', '"Noto Sans"', 'Helvetica', 'Arial', 'sans-serif'],
        mono: ['ui-monospace', 'SFMono-Regular', '"SF Mono"', 'Menlo', 'Consolas', '"Liberation Mono"', 'monospace'],
      },
      boxShadow: {
        node: '0 1px 0 hsl(var(--shadow) / 0.04)',
        pop: '0 8px 24px hsl(var(--shadow) / 0.12), 0 1px 3px hsl(var(--shadow) / 0.08)',
      },
      keyframes: {
        in: { from: { opacity: 0, transform: 'translateY(4px)' }, to: { opacity: 1, transform: 'none' } },
        drawer: { from: { transform: 'translateX(12px)', opacity: 0 }, to: { transform: 'none', opacity: 1 } },
      },
      animation: { in: 'in .16s ease-out', drawer: 'drawer .18s ease-out' },
    },
  },
  plugins: [require('tailwindcss-animate')],
};
