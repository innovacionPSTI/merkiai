# @merkiai/i18n

Internacionalización de la plataforma (E28 · HU-460 · `docs/adr/ADR-011-internacionalizacion-y-mercados.md`).

```ts
import { createTranslator, formatMoney, formatDate, matchAcceptLanguage } from '@merkiai/i18n'

const t = createTranslator('es-ES', 'shop')
t('cart')                       // "Cesta"  (sobrescritura regional)
t('items_count', { count: 3 })  // "3 productos" (ICU plural)

formatMoney(120000)                                   // "$ 120.000" (COP, es-CO por defecto)
formatMoney(1499.5, { currency: 'MXN', locale: 'es-MX' }) // "$1,499.50"
formatDate(order.created_at, { dateStyle: 'medium' })
```

- **Catálogos** en `src/catalogs/`: `es.ts` es la **referencia** (todas las claves); `en.ts` es el otro idioma base; `es-CO`, `es-MX`, `es-ES` y `en-US` solo contienen **diferencias**. Resolución: locale → idioma base → `es` → la clave.
- **Agregar un texto:** la clave va primero en `es.ts`, luego en `en.ts` y, si cambia por región, en el regional.
- **La moneda sale del dato**, nunca del locale.
- **Guard:** `pnpm i18n:check` (CI) valida la sintaxis ICU, las claves huérfanas y las usadas en el código, y reporta la cobertura.
