'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { saveSettingsAction } from '../actions'
import { T } from '@merkiai/ui'
import { useTx } from '@merkiai/ui'

type Modality = 'credit_sale' | 'special_order' | 'layaway' | 'consignment'
type Ev = 'on_document' | 'on_payment' | 'on_delivery' | 'on_settlement' | 'none'
interface Settings {
  delivery_policy: 'require_full_payment' | 'allow_balance_on_delivery'
  invoice_events: Partial<Record<Modality, Ev>>
  layaway_days: number
  reminder_days_before: number
  reminder_days_after: number
  reminders_enabled: boolean
}
const MOD_LABEL: Record<Modality, string> = { credit_sale: 'Venta a crédito', special_order: 'Encargo', layaway: 'Apartado', consignment: 'Consignación' }
const EV_LABEL: Record<Ev, string> = { on_document: 'Al crear el documento', on_payment: 'En cada abono (anticipos)', on_delivery: 'Al entregar', on_settlement: 'Al quedar pagado', none: 'No avisar (manual)' }
const input = 'rounded-xl border border-brand-primary/20 px-3 py-2 font-brand text-sm focus:border-brand-primary focus:outline-none'

export default function SettingsForm({ settings, consignmentEnabled }: { settings: Settings; consignmentEnabled: boolean }) {
  const tx = useTx()
  const router = useRouter()
  const [pending, start] = useTransition()
  const [s, setS] = useState(settings)
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null)
  const mods = (Object.keys(MOD_LABEL) as Modality[]).filter((m) => m !== 'consignment' || consignmentEnabled)

  return (
    <div className="space-y-5">
      <section className="rounded-2xl border border-gray-200 bg-white p-5 space-y-3">
        <h2 className="font-brand text-sm font-semibold text-brand-primary"><T>Encargos y apartados</T></h2>
        <label className="block font-brand text-sm text-brand-primary">Entrega de encargos (se puede cambiar en cada encargo)<br />
          <select className={`${input} mt-1`} value={s.delivery_policy} onChange={(e) => setS({ ...s, delivery_policy: e.target.value as Settings['delivery_policy'] })}>
            <option value="require_full_payment">Entregar solo con el pago completo</option>
            <option value="allow_balance_on_delivery">Se puede entregar con saldo (queda a crédito)</option>
          </select>
        </label>
        <label className="block font-brand text-sm text-brand-primary"><T>Días que dura un apartado antes de liberarse</T><br />
          <input type="number" min={1} className={`${input} mt-1 w-28`} value={s.layaway_days} onChange={(e) => setS({ ...s, layaway_days: Math.max(1, Number(e.target.value)) })} />
        </label>
      </section>

      <section className="rounded-2xl border border-gray-200 bg-white p-5 space-y-3">
        <h2 className="font-brand text-sm font-semibold text-brand-primary"><T>Facturación</T></h2>
        <p className="font-brand text-xs text-brand-primary/60">¿En qué momento se avisa a tu sistema de facturación? Valídalo con tu contador: la plataforma no asume criterio fiscal.</p>
        {mods.map((m) => (
          <label key={m} className="flex flex-wrap items-center gap-3 font-brand text-sm text-brand-primary">
            <span className="w-40">{MOD_LABEL[m]}</span>
            <select className={input} value={s.invoice_events[m] ?? 'none'} onChange={(e) => setS({ ...s, invoice_events: { ...s.invoice_events, [m]: e.target.value as Ev } })}>
              {(Object.keys(EV_LABEL) as Ev[]).map((ev) => <option key={ev} value={ev}>{EV_LABEL[ev]}</option>)}
            </select>
          </label>
        ))}
      </section>

      <section className="rounded-2xl border border-gray-200 bg-white p-5 space-y-3">
        <h2 className="font-brand text-sm font-semibold text-brand-primary">Recordatorios de pago por correo</h2>
        <label className="flex items-center gap-2 font-brand text-sm text-brand-primary">
          <input type="checkbox" checked={s.reminders_enabled} onChange={(e) => setS({ ...s, reminders_enabled: e.target.checked })} /> <T>Enviar recordatorios a clientes y aliados con correo</T>
        </label>
        <div className="flex flex-wrap gap-4 font-brand text-sm text-brand-primary">
          <label><T>Días antes del vencimiento</T> <input type="number" min={0} className={`${input} ml-2 w-20`} value={s.reminder_days_before} onChange={(e) => setS({ ...s, reminder_days_before: Math.max(0, Number(e.target.value)) })} /></label>
          <label><T>Días después del vencimiento</T> <input type="number" min={0} className={`${input} ml-2 w-20`} value={s.reminder_days_after} onChange={(e) => setS({ ...s, reminder_days_after: Math.max(0, Number(e.target.value)) })} /></label>
        </div>
        <p className="font-brand text-xs text-brand-primary/60"><T>Se envían con el proveedor de correo configurado en tu tienda.</T></p>
      </section>

      {msg && <p role="status" className={`font-brand text-sm ${msg.ok ? 'text-green-700' : 'text-red-600'}`}>{msg.text}</p>}
      <button type="button" disabled={pending} onClick={() => start(async () => {
        const r = await saveSettingsAction(s)
        setMsg(r.ok ? { ok: true, text: r.message ?? 'Guardado.' } : { ok: false, text: r.error })
        if (r.ok) router.refresh()
      })} className="rounded-full bg-brand-primary px-6 py-2.5 font-brand text-sm text-white disabled:opacity-60">{pending ? tx("Guardando…") : tx("Guardar ajustes")}</button>
    </div>
  )
}
