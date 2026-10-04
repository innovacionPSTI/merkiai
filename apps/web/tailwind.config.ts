import baseConfig from '../../packages/config/tailwind.config'
import type { Config } from 'tailwindcss'

/**
 * La web usa CSS custom properties para los colores brand, lo que permite
 * cambiar el tema en runtime desde la DB sin rebuildar.
 *
 * Sintaxis: 'rgb(var(--brand-xxx) / <alpha-value>)'
 *   → Tailwind reemplaza <alpha-value> por la opacidad del modifier (ej. /50)
 *   → Los defaults de :root se definen en globals.css
 *
 * Los font families también pasan por CSS vars para permitir cambio de fuente
 * sin rebuild: --font-display y --font-body se inyectan desde el tema activo.
 */
const config: Config = {
  ...baseConfig,
  content: [
    './src/**/*.{js,ts,jsx,tsx,mdx}',
    '../../packages/ui/src/**/*.{js,ts,jsx,tsx}',
  ],
  // HU-253 · clases aplicadas dinámicamente por SectionShell (fondo/espaciado),
  // definidas en @merkiai/database (fuera del content scan) → safelist explícito.
  safelist: [
    'bg-brand-cream', 'bg-brand-cream-warm', 'bg-brand-yellow-pale', 'bg-brand-primary', 'bg-brand-dark',
    'pt-8', 'pb-8', 'pt-16', 'pb-16', 'pt-28', 'pb-28',
  ],
  theme: {
    ...baseConfig.theme,
    extend: {
      ...baseConfig.theme?.extend,
      colors: {
        brand: {
          primary:      'rgb(var(--brand-primary)      / <alpha-value>)',
          dark:         'rgb(var(--brand-dark)         / <alpha-value>)',
          cream:        'rgb(var(--brand-cream)        / <alpha-value>)',
          'cream-warm': 'rgb(var(--brand-cream-warm)   / <alpha-value>)',
          yellow:       'rgb(var(--brand-yellow)       / <alpha-value>)',
          'yellow-pale':'rgb(var(--brand-yellow-pale)  / <alpha-value>)',
          text:         'rgb(var(--brand-text)         / <alpha-value>)',
          price:        'rgb(var(--brand-price)        / <alpha-value>)',
        },
      },
      fontFamily: {
        // Apuntan a CSS vars que el layout.tsx resuelve según el tema activo
        display: ['var(--font-display)', 'Georgia', 'serif'],
        brand:   ['var(--font-body)', 'system-ui', 'sans-serif'],
      },
    },
  },
}

export default config
