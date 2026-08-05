/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './app/**/*.{js,jsx}',
    './components/**/*.{js,jsx}',
  ],
  theme: {
    extend: {
      colors: {
        bg: 'var(--bg)',
        'bg-elevated': 'var(--bg-elevated)',
        'bg-elevated-2': 'var(--bg-elevated-2)',
        line: 'var(--line)',
        gold: 'var(--gold)',
        'gold-dim': 'var(--gold-dim)',
        wine: 'var(--wine)',
        sage: 'var(--sage)',
        ink: 'var(--text)',
        muted: 'var(--text-muted)',
        faint: 'var(--text-faint)',
      },
      fontFamily: {
        display: ['var(--font-display)', 'Georgia', 'serif'],
        body: ['var(--font-body)', 'ui-sans-serif', 'sans-serif'],
        mono: ['var(--font-mono)', 'ui-monospace', 'monospace'],
      },
    },
  },
  plugins: [],
};
