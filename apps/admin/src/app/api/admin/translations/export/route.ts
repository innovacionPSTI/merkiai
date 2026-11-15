import { NextRequest, NextResponse } from 'next/server'
import { listEntityTranslationItems, listBlockTranslationItems, translationsToCsv, logAudit, type TranslatableEntity } from '@merkiai/database'
import { requireTranslations } from '@/lib/translations'

const ENTITIES: TranslatableEntity[] = ['product', 'category', 'blog_post', 'page']

/** AC-3 · CSV con los textos de un idioma (uno o todos los tipos) para traducir fuera. */
export async function GET(req: NextRequest) {
  const ctx = await requireTranslations()
  const locale = req.nextUrl.searchParams.get('locale') ?? ''
  const type = req.nextUrl.searchParams.get('type') ?? 'all'
  if (!ctx.locales.includes(locale)) return NextResponse.json({ error: 'Idioma no publicado' }, { status: 400 })
  const types = type === 'all' ? [...ENTITIES, 'blocks'] : [type]
  const items = []
  for (const t of types) {
    if (t === 'blocks') items.push(...await listBlockTranslationItems(ctx.db, locale))
    else if ((ENTITIES as string[]).includes(t)) items.push(...await listEntityTranslationItems(ctx.db, t as TranslatableEntity, locale))
  }
  await logAudit(ctx.db, { tenantId: ctx.tenantId, actorEmail: ctx.adminUser.email, actorRole: ctx.adminUser.role, action: 'translation.export', entity: 'translations', summary: `Exportación ${locale} (${type})`, metadata: { locale, type, rows: items.length } })
  return new NextResponse('﻿' + translationsToCsv(items), {
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': `attachment; filename="traducciones-${locale}-${type}.csv"`,
      'Cache-Control': 'no-store',
    },
  })
}
