/**
 * POST /api/internal/receivables/sweep — E27 · HU-453/455
 *
 * Tarea diaria de cartera (la dispara el cron del console, server-to-server):
 *   1. Libera los APARTADOS vencidos (reserva → disponible; abonos → saldo a favor).
 *   2. Recalcula estados (marca VENCIDOS los documentos con fecha/cuota pasada).
 *   3. Envía RECORDATORIOS de pago antes/después del vencimiento (si la tienda los activó).
 *
 * Descubre los tenants con documentos abiertos (única lectura cross-tenant,
 * solo `tenant_id`) y opera cada uno con su cliente RLS (`getAdminDb`).
 */
import { NextResponse } from 'next/server'
import {
  createServerClient, expireLayaways, refreshDocumentStatus, getReceivablesSettings, listDueForReminder,
  markReminderSent, resolveEmailConfig, sendRawEmail, MODALITY_LABEL, type EmailConfig,
} from '@merkiai/database'
import { withInternalAuth } from '@/lib/internal-route'
import { getAdminDb } from '@/lib/admin-db'
import { formatMoney } from '@merkiai/i18n'

export const dynamic = 'force-dynamic'

const money = (n: number) => formatMoney(n)
const esc = (s: string) => s.replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c] as string)

export const POST = withInternalAuth(async () => {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error } = await (createServerClient() as any).from('receivable_documents')
    .select('tenant_id').in('payment_status', ['open', 'partial', 'overdue']).limit(10000)
  if (error) return NextResponse.json({ error: 'list_failed', detail: error.message }, { status: 502 })
  const tenants = [...new Set(((data ?? []) as Array<{ tenant_id: string }>).map((r) => r.tenant_id))]

  const summary = { tenants: tenants.length, layawaysExpired: 0, refreshed: 0, reminders: 0, errors: 0 }
  const today = new Date().toISOString().slice(0, 10)

  for (const tenantId of tenants) {
    try {
      const db = getAdminDb(tenantId, 'cartera-cron')
      summary.layawaysExpired += await expireLayaways(db, tenantId)

      // Vencimientos: recalcula los que tienen fecha pasada y siguen abiertos.
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data: due } = await (db as any).from('receivable_documents').select('id')
        .in('payment_status', ['open', 'partial']).lt('due_date', today)
      for (const d of (due ?? []) as Array<{ id: number }>) { await refreshDocumentStatus(db, d.id); summary.refreshed++ }

      const settings = await getReceivablesSettings(db, tenantId)
      if (!settings.reminders_enabled) continue
      const ec = await resolveEmailConfig(db, tenantId).catch(() => null)
      if (!ec) continue
      const cfg: EmailConfig = { apiKey: ec.apiKey, fromEmail: ec.fromEmail, storeName: ec.storeName ?? undefined, emailProvider: ec.provider ?? 'resend' }
      for (const { doc, kind } of await listDueForReminder(db, settings)) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const { data: party } = await (db as any).from('customers').select('email, name').eq('id', doc.party_id).maybeSingle()
        if (!party?.email) continue
        const subject = kind === 'before' ? `Recordatorio: tu pago ${doc.number} vence el ${doc.due_date}` : `Tu pago ${doc.number} está vencido`
        const html = `<div style="font-family:system-ui,sans-serif;max-width:520px;margin:auto;color:#1f2937">
          <p>Hola, <strong>${esc(party.name ?? '')}</strong>.</p>
          <p>${kind === 'before' ? 'Te recordamos que pronto vence' : 'Te recordamos que está vencido'} el saldo de tu ${esc(MODALITY_LABEL[doc.modality].toLowerCase())} <strong>${esc(doc.number)}</strong>.</p>
          <p>Saldo pendiente: <strong>${money(doc.balance)}</strong>${doc.due_date ? ` · Fecha límite: ${doc.due_date}` : ''}</p>
          <p style="color:#6b7280;font-size:13px">Si ya realizaste el pago, ignora este mensaje.</p></div>`
        await sendRawEmail(cfg, { to: party.email, subject, html })
        await markReminderSent(db, doc.id, kind)
        summary.reminders++
      }
    } catch (e) {
      summary.errors++
      console.error('[cartera-cron]', tenantId, e instanceof Error ? e.message : e)
    }
  }
  return NextResponse.json(summary)
})
