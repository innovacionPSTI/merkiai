import type { Metadata } from 'next'
import Link from 'next/link'
import { PageHeader } from '@merkiai/ui'
import { listEntityTranslationItems, listBlockTranslationItems, coverageOf, FIELD_LABELS, LONG_FIELDS, type TranslatableEntity, type TranslationItem } from '@merkiai/database'
import { requireTranslations, TYPE_LABELS } from '@/lib/translations'
import TranslationsWorkspace from './TranslationsWorkspace'

export const metadata: Metadata = { title: 'Traducciones' }
export const dynamic = 'force-dynamic'

const ENTITIES: TranslatableEntity[] = ['product', 'category', 'blog_post', 'page']
type TabKey = TranslatableEntity | 'blocks'

/** E28 · HU-464 · traducir el contenido de la tienda idioma por idioma. */
export default async function TraduccionesPage({ searchParams }: { searchParams: Promise<Record<string, string | undefined>> }) {
  const sp = await searchParams
  const ctx = await requireTranslations()

  if (ctx.locales.length === 0) {
    return (
      <div className="space-y-6 max-w-3xl">
        <PageHeader title="Traducciones" description="Traduce productos, categorías, páginas, blog y bloques a los idiomas de tu tienda." />
        <section className="rounded-2xl border border-gray-200 bg-white p-6 font-brand text-sm text-brand-primary">
          Tu tienda publica un solo idioma. Para traducir el contenido, habilita otro idioma en{' '}
          <Link href="/configuracion/idiomas" className="underline">Configuración → Idiomas y mercados</Link>.
        </section>
      </div>
    )
  }

  const locale = ctx.locales.includes(sp.idioma ?? '') ? (sp.idioma as string) : ctx.locales[0]
  const tab: TabKey = (['product', 'category', 'blog_post', 'page', 'blocks'] as string[]).includes(sp.tipo ?? '') ? (sp.tipo as TabKey) : 'product'

  // Completitud por tipo (AC-2) y elementos del tipo activo.
  const lists = await Promise.all([
    ...ENTITIES.map((e) => listEntityTranslationItems(ctx.db, e, locale).catch(() => [] as TranslationItem[])),
    listBlockTranslationItems(ctx.db, locale).catch(() => [] as TranslationItem[]),
  ])
  const byTab: Record<TabKey, TranslationItem[]> = {
    product: lists[0], category: lists[1], blog_post: lists[2], page: lists[3], blocks: lists[4],
  }
  const coverage = (Object.keys(byTab) as TabKey[]).map((k) => ({ key: k, label: TYPE_LABELS[k], ...coverageOf(byTab[k]) }))

  return (
    <div className="space-y-6">
      <PageHeader
        title="Traducciones"
        description="Traduce tu contenido idioma por idioma. Lo que no traduzcas se muestra en el idioma original de la tienda."
      />
      <TranslationsWorkspace
        locale={locale}
        locales={ctx.localeOptions}
        tab={tab}
        coverage={coverage}
        items={byTab[tab]}
        fieldLabels={FIELD_LABELS}
        longFields={[...LONG_FIELDS]}
      />
    </div>
  )
}
