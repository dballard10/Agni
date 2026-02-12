/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{ts,tsx,js,jsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Semantic background tokens
        bg: {
          app: 'var(--bg-app)',
          panel: 'var(--bg-panel)',
          editor: 'var(--bg-editor)',
          topbar: 'var(--bg-topbar)',
          sidebar: 'var(--bg-sidebar)',
          elevated: 'var(--bg-elevated)',
          hover: 'var(--bg-hover)',
          selected: 'var(--bg-selected)',
          active: 'var(--bg-active)',
        },
        // Semantic text tokens
        text: {
          primary: 'var(--text-primary)',
          secondary: 'var(--text-secondary)',
          muted: 'var(--text-muted)',
          disabled: 'var(--text-disabled)',
        },
        // Semantic border tokens
        border: {
          DEFAULT: 'var(--border-default)',
          subtle: 'var(--border-subtle)',
        },
        divider: 'var(--divider)',
        // Accent tokens
        accent: {
          DEFAULT: 'var(--accent)',
          '2': 'var(--accent-2)',
          contrast: 'var(--accent-contrast)',
        },
        // Focus
        focus: {
          ring: 'var(--focus-ring)',
        },
        // Status tokens
        status: {
          success: 'var(--status-success)',
          warning: 'var(--status-warning)',
          error: 'var(--status-error)',
          info: 'var(--status-info)',
        },
      },
      ringColor: {
        focus: 'var(--focus-ring)',
      },
      outlineColor: {
        focus: 'var(--focus-ring)',
      },
      borderColor: {
        DEFAULT: 'var(--border-default)',
      },
    },
  },
  plugins: [],
}
