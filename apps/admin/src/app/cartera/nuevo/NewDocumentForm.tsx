'use client'

/**
 * Alta de documento de cartera (E27). Un solo formulario para las cuatro
 * modalidades: cambia lo que pide según el tipo (anticipo, política de entrega,
 * ubicación del aliado…). Sin JSON ni campos técnicos.
 */
import { useMemo, useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { createDocumentAction, createPartyAction, suggestPricesAction } from '../actions'
import { formatMoney } from '@merkiai/i18n'
import { T } from '@merkiai/ui'
import { useTx } from '@merkiai/ui'

type Modality = 'credit_sale' | 'special_order' | 'layaway' | 'consignment'
interface PartyRef { id: string; name: string; role: 'customer' | 'consignee'; balance: number; credit_limit: number | null }
interface ItemRef { id: number; name: string; isService: boolean }
interface LocRef { id: number; name: string; kind: string; party_id: string | null; is_default: boolean }
interface Line { kind: 'item' | 'free'; stock_item_id: number | null; description: string; qty: number; unit_price: number }

const MODALITIES: Array<{ key: Modality; label: string; help: string }> = [
  { key: 'credit_sale', label: 'Venta a crédito', help: 'Entregas hoy y te pagan después (fiado o a plazos).' },
  { key: 'special_order', label: 'Encargo', help: 'Recibes un anticipo, elaboras y cobras el saldo al entregar.' },
  { key: 'layaway', label: 'Apartado', help: 'Separas productos con abonos; se entregan al completar el pago.' },
  { key: 'consignment', label: 'Consignación', help: 'Dejas mercancía a un aliado; te paga lo que vende y devuelve lo que no.' },
]
const money = (n: number) => formatMoney(n || 0)
const input = 'w-full rounded-xl border border-brand-primary/20 px-3 py-2 font-brand text-sm focus:border-brand-primary focus:outline-none'
const label = 'block font-brand text-xs font-semibold text-brand-primary/70 mb-1'

export default function NewDocumentForm(props: {
  parties: PartyRef[]; items: ItemRef[]; locations: LocRef[]; consignmentEnabled: boolean
  defaultDeliveryPolicy: 'require_full_payment' | 'allow_balance_on_delivery'; initialModality: Modality; initialParty: string
  priceLists?: Array<{ id: number; name: string }>
}) {
  const tx = useTx()
  const router = useRouter()
  const [pending, start] = useTransition()
  const [error, setError] = useState<string | null>(null)
  const [modality, setModality] = useState<Modality>(props.initialModality === 'consignment' && !props.consignmentEnabled ? 'special_order' : props.initialModality)
  const [parties, setParties] = useState(props.parties)
  const [partyId, setPartyId] = useState(props.initialParty)
  const [newParty, setNewParty] = useState<{ name: string; email: string; phone: string } | null>(null)
  const [lines, setLines] = useState<Line[]>([{ kind: 'free', stock_item_id: null, description: '', qty: 1, unit_price: 0 }])
  const [planType, setPlanType] = useState<'free' | 'installments'>('free')
  const [dueDate, setDueDate] = useState('')
  const [instCount, setInstCount] = useState(3)
  const [instFirst, setInstFirst] = useState(new Date(Date.now() + 30 * 86_400_000).toISOString().slice(0, 10))
  const [instEvery, setInstEvery] = useState<'months' | 'days15'>('months')
  const [advance, setAdvance] = useState(0)
  const [advanceMethod, setAdvanceMethod] = useState<'cash' | 'transfer' | 'card' | 'other'>('cash')
  const [minAdvancePct, setMinAdvancePct] = useState(0)
  const [policy, setPolicy] = useState<'' | 'require_full_payment' | 'allow_balance_on_delivery'>('')
  const ownLocations = props.locations.filter((l) => l.kind !== 'consignment')
  const [locationId, setLocationId] = useState<number | ''>(ownLocations.find((l) => l.is_default)?.id ?? ownLocations[0]?.id ?? '')
  const [notes, setNotes] = useState('')
  const [priceListId, setPriceListId] = useState<number | ''>('')

  /** Precio sugerido (variante + lista de precios del canal) al elegir un producto. */
  async function suggest(targets: Array<{ index: number; stockItemId: number }>, listId: number | '') {
    if (!targets.length) return
    const prices = await suggestPricesAction(targets.map((x) => x.stockItemId), listId === '' ? null : listId)
    setLines((ls) => ls.map((l, idx) => {
      const tgt = targets.find((x) => x.index === idx)
      return tgt && prices[tgt.stockItemId] != null ? { ...l, unit_price: prices[tgt.stockItemId] } : l
    }))
  }

  const party = parties.find((p) => p.id === partyId)
  const consigneeLocs = props.locations.filter((l) => l.kind === 'consignment' && (!partyId || l.party_id === partyId))
  const [consigneeLoc, setConsigneeLoc] = useState<number | ''>('')
  const total = useMemo(() => lines.reduce((s, l) => s + Math.max(0, l.qty) * Math.max(0, l.unit_price), 0), [lines])
  const minAdvance = Math.round((total * minAdvancePct) / 100)
  const showAdvance = modality !== 'consignment'
  const partyOptions = parties.filter((p) => modality === 'consignment' ? p.role === 'consignee' : true)

  function setLine(i: number, patch: Partial<Line>) { setLines((ls) => ls.map((l, idx) => (idx === i ? { ...l, ...patch } : l))) }
  function pickItem(i: number, id: string) {
    const it = props.items.find((x) => x.id === Number(id))
    setLine(i, it ? { kind: 'item', stock_item_id: it.id, description: it.name } : { kind: 'free', stock_item_id: null })
    if (it && !it.isService) void suggest([{ index: i, stockItemId: it.id }], priceListId)
  }

  function addParty() {
    if (!newParty?.name.trim()) { setError(tx("Escribe el nombre.")); return }
    start(async () => {
      const r = await createPartyAction({ name: newParty.name, email: newParty.email || undefined, phone: newParty.phone || undefined, party_role: modality === 'consignment' ? 'consignee' : 'customer' })
      if (!r.ok) { setError(r.error); return }
      const p: PartyRef = { id: String(r.id), name: newParty.name, role: modality === 'consignment' ? 'consignee' : 'customer', balance: 0, credit_limit: null }
      setParties((ps) => [...ps, p]); setPartyId(p.id); setNewParty(null); setError(null)
    })
  }

  function submit() {
    setError(null)
    if (!partyId) { setError(tx("Elige el cliente o aliado.")); return }
    const valid = lines.filter((l) => l.description.trim() && l.qty > 0)
    if (!valid.length) { setError(tx("Agrega al menos una línea con descripción y cantidad.")); return }
    start(async () => {
      const r = await createDocumentAction({
        party_id: partyId,
        modality,
        lines: valid.map((l) => ({ kind: l.kind, stock_item_id: l.stock_item_id, description: l.description, qty: Number(l.qty), unit_price: Number(l.unit_price) })),
        plan: planType === 'installments'
          ? { type: 'installments', count: instCount, first_due: instFirst, every: instEvery === 'months' ? { step: 1, unit: 'months' } : { step: 15, unit: 'days' } }
          : { type: 'free', due_date: dueDate || null },
        min_advance: showAdvance ? minAdvance : 0,
        advance: showAdvance && advance > 0 ? { amount: advance, method: advanceMethod } : null,
        delivery_policy: modality === 'special_order' && policy ? policy : null,
        location_id: locationId === '' ? null : Number(locationId),
        consignee_location_id: modality === 'consignment' && consigneeLoc !== '' ? Number(consigneeLoc) : null,
        notes,
      })
      if (!r.ok) { setError(r.error); return }
      router.push(`/cartera/${r.id}`)
    })
  }

  return (
    <div className="space-y-5">
      <section className="rounded-2xl border border-gray-200 bg-white p-5">
        <h2 className="font-brand text-sm font-semibold text-brand-primary mb-3"><T>1. Tipo de documento</T></h2>
        <div className="grid gap-2 md:grid-cols-4">
          {MODALITIES.filter((m) => m.key !== 'consignment' || props.consignmentEnabled).map((m) => (
            <button key={m.key} type="button" onClick={() => setModality(m.key)}
              className={`rounded-xl border p-3 text-left font-brand ${modality === m.key ? 'border-brand-primary bg-brand-cream/40' : 'border-gray-200 hover:border-brand-primary/40'}`}>
              <span className="block text-sm font-semibold text-brand-primary">{m.label}</span>
              <span className="block text-xs text-brand-primary/60 mt-1">{m.help}</span>
            </button>
          ))}
        </div>
      </section>

      <section className="rounded-2xl border border-gray-200 bg-white p-5">
        <h2 className="font-brand text-sm font-semibold text-brand-primary mb-3">2. {modality === 'consignment' ? 'Aliado' : 'Cliente'}</h2>
        {newParty ? (
          <div className="grid gap-3 md:grid-cols-4">
            <input className={input} placeholder={tx("Nombre *")} value={newParty.name} onChange={(e) => setNewParty({ ...newParty, name: e.target.value })} />
            <input className={input} placeholder={tx("Correo (opcional)")} value={newParty.email} onChange={(e) => setNewParty({ ...newParty, email: e.target.value })} />
            <input className={input} placeholder={tx("Teléfono (opcional)")} value={newParty.phone} onChange={(e) => setNewParty({ ...newParty, phone: e.target.value })} />
            <div className="flex gap-2">
              <button type="button" onClick={addParty} disabled={pending} className="rounded-full bg-brand-primary px-4 py-2 font-brand text-sm text-white"><T>Guardar</T></button>
              <button type="button" onClick={() => setNewParty(null)} className="font-brand text-sm text-brand-primary/60"><T>Cancelar</T></button>
            </div>
          </div>
        ) : (
          <div className="flex flex-wrap items-center gap-3">
            <select className={`${input} max-w-sm`} value={partyId} onChange={(e) => { setPartyId(e.target.value); setConsigneeLoc('') }}>
              <option value="">Elige…</option>
              {partyOptions.map((p) => <option key={p.id} value={p.id}>{p.name}{p.balance ? ` · debe ${money(p.balance)}` : ''}</option>)}
            </select>
            <button type="button" onClick={() => setNewParty({ name: '', email: '', phone: '' })} className="font-brand text-sm text-brand-primary underline"><T>+ Nuevo</T></button>
            {party?.credit_limit != null && <span className="font-brand text-xs text-brand-primary/60">Cupo {money(party.credit_limit)} · disponible {money(party.credit_limit - party.balance)}</span>}
          </div>
        )}
        {modality === 'consignment' && partyId && (
          <div className="mt-3 grid gap-3 md:grid-cols-2">
            <div>
              <label className={label}>Ubicación del aliado (dónde queda la mercancía)</label>
              <select className={input} value={consigneeLoc} onChange={(e) => setConsigneeLoc(e.target.value ? Number(e.target.value) : '')}>
                <option value="">Elige…</option>
                {consigneeLocs.map((l) => <option key={l.id} value={l.id}>{l.name}</option>)}
              </select>
              {consigneeLocs.length === 0 && <p className="mt-1 font-brand text-xs text-amber-700"><T>Este aliado aún no tiene ubicación. Créala en “Clientes y aliados”.</T></p>}
            </div>
          </div>
        )}
      </section>

      <section className="rounded-2xl border border-gray-200 bg-white p-5">
        <h2 className="font-brand text-sm font-semibold text-brand-primary mb-3"><T>3. Qué incluye</T></h2>
        <div className="space-y-2">
          {lines.map((l, i) => (
            <div key={i} className="grid gap-2 md:grid-cols-12 items-center">
              <select className={`${input} md:col-span-3`} value={l.stock_item_id ?? ''} onChange={(e) => pickItem(i, e.target.value)}>
                <option value="">{modality === 'consignment' ? 'Elige producto…' : 'Concepto libre'}</option>
                {props.items.filter((it) => modality !== 'consignment' || !it.isService).map((it) => <option key={it.id} value={it.id}>{it.name}{it.isService ? ' (servicio)' : ''}</option>)}
              </select>
              <input className={`${input} md:col-span-4`} placeholder={tx("Descripción")} value={l.description} onChange={(e) => setLine(i, { description: e.target.value })} />
              <input className={`${input} md:col-span-1`} type="number" min={0} step="any" value={l.qty} onChange={(e) => setLine(i, { qty: Number(e.target.value) })} aria-label={tx("Cantidad")} />
              <input className={`${input} md:col-span-2`} type="number" min={0} value={l.unit_price} onChange={(e) => setLine(i, { unit_price: Number(e.target.value) })} aria-label={tx("Precio unitario")} />
              <span className="font-brand text-sm text-brand-primary md:col-span-1 text-right">{money(l.qty * l.unit_price)}</span>
              <button type="button" className="font-brand text-xs text-red-600 md:col-span-1" onClick={() => setLines((ls) => (ls.length > 1 ? ls.filter((_, k) => k !== i) : ls))}><T>Quitar</T></button>
            </div>
          ))}
        </div>
        {(props.priceLists?.length ?? 0) > 0 && (
          <div className="mt-3 max-w-sm">
            <label className={label}>Lista de precios {modality === 'consignment' ? '(precio para el aliado)' : '(opcional)'}</label>
            <select className={input} value={priceListId} onChange={(e) => {
              const v = e.target.value ? Number(e.target.value) : ''
              setPriceListId(v)
              void suggest(lines.map((l, index) => ({ index, stockItemId: l.stock_item_id ?? 0 })).filter((x) => x.stockItemId > 0), v)
            }}>
              <option value="">Precio normal del producto</option>
              {props.priceLists!.map((l) => <option key={l.id} value={l.id}>{l.name}</option>)}
            </select>
          </div>
        )}
        <div className="mt-3 flex items-center justify-between">
          <button type="button" className="font-brand text-sm text-brand-primary underline" onClick={() => setLines((ls) => [...ls, { kind: 'free', stock_item_id: null, description: '', qty: 1, unit_price: 0 }])}><T>+ Agregar línea</T></button>
          <span className="font-display text-lg text-brand-primary">Total {money(total)}</span>
        </div>
        {(modality === 'credit_sale' || modality === 'layaway' || modality === 'consignment') && ownLocations.length > 0 && (
          <div className="mt-3 max-w-xs">
            <label className={label}>{modality === 'consignment' ? 'Sale de' : modality === 'layaway' ? 'Reservar en' : 'Se entrega desde'}</label>
            <select className={input} value={locationId} onChange={(e) => setLocationId(e.target.value ? Number(e.target.value) : '')}>
              {ownLocations.map((l) => <option key={l.id} value={l.id}>{l.name}</option>)}
            </select>
          </div>
        )}
      </section>

      <section className="rounded-2xl border border-gray-200 bg-white p-5">
        <h2 className="font-brand text-sm font-semibold text-brand-primary mb-3"><T>4. Cómo se paga</T></h2>
        <div className="flex gap-4 font-brand text-sm text-brand-primary mb-3">
          <label className="flex items-center gap-2"><input type="radio" checked={planType === 'free'} onChange={() => setPlanType('free')} /> <T>Abonos libres</T></label>
          <label className="flex items-center gap-2"><input type="radio" checked={planType === 'installments'} onChange={() => setPlanType('installments')} /> <T>Cuotas</T></label>
        </div>
        {planType === 'free' ? (
          <div className="max-w-xs">
            <label className={label}>Fecha límite de pago (opcional)</label>
            <input type="date" className={input} value={dueDate} onChange={(e) => setDueDate(e.target.value)} />
          </div>
        ) : (
          <div className="grid gap-3 md:grid-cols-3">
            <div><label className={label}><T>Número de cuotas</T></label><input type="number" min={1} className={input} value={instCount} onChange={(e) => setInstCount(Math.max(1, Number(e.target.value)))} /></div>
            <div><label className={label}><T>Primera cuota</T></label><input type="date" className={input} value={instFirst} onChange={(e) => setInstFirst(e.target.value)} /></div>
            <div><label className={label}><T>Frecuencia</T></label>
              <select className={input} value={instEvery} onChange={(e) => setInstEvery(e.target.value as 'months' | 'days15')}><option value="months">Mensual</option><option value="days15">Quincenal</option></select>
            </div>
            <p className="md:col-span-3 font-brand text-xs text-brand-primary/60">Se reparte el saldo (total − anticipo) en {instCount} cuota(s) de aproximadamente {money(Math.floor((total - advance) / Math.max(1, instCount)))}.</p>
          </div>
        )}
        {showAdvance && (
          <div className="mt-4 grid gap-3 md:grid-cols-3">
            <div><label className={label}><T>Anticipo recibido hoy</T></label><input type="number" min={0} className={input} value={advance} onChange={(e) => setAdvance(Math.max(0, Number(e.target.value)))} /></div>
            <div><label className={label}><T>Medio</T></label>
              <select className={input} value={advanceMethod} onChange={(e) => setAdvanceMethod(e.target.value as typeof advanceMethod)}>
                <option value="cash">Efectivo</option><option value="transfer">Transferencia</option><option value="card">Tarjeta</option><option value="other">Otro</option>
              </select>
            </div>
            <div><label className={label}>Anticipo mínimo exigido (%)</label><input type="number" min={0} max={100} className={input} value={minAdvancePct} onChange={(e) => setMinAdvancePct(Math.min(100, Math.max(0, Number(e.target.value))))} />
              {minAdvance > 0 && <p className="mt-1 font-brand text-xs text-brand-primary/60">Mínimo {money(minAdvance)}</p>}
            </div>
          </div>
        )}
        {modality === 'special_order' && (
          <div className="mt-4 max-w-md">
            <label className={label}><T>Entrega</T></label>
            <select className={input} value={policy} onChange={(e) => setPolicy(e.target.value as typeof policy)}>
              <option value="">Usar la regla de la tienda ({props.defaultDeliveryPolicy === 'require_full_payment' ? 'pagar todo antes de entregar' : 'se puede entregar con saldo'})</option>
              <option value="require_full_payment">Entregar solo con el pago completo</option>
              <option value="allow_balance_on_delivery">Se puede entregar con saldo (queda a crédito)</option>
            </select>
          </div>
        )}
        <div className="mt-4"><label className={label}><T>Notas</T></label><textarea className={input} rows={2} value={notes} onChange={(e) => setNotes(e.target.value)} /></div>
      </section>

      {error && <p role="alert" className="font-brand text-sm text-red-600">{error}</p>}
      <div className="flex justify-end gap-3">
        <button type="button" onClick={() => router.push('/cartera')} className="font-brand text-sm text-brand-primary/60"><T>Cancelar</T></button>
        <button type="button" onClick={submit} disabled={pending} className="rounded-full bg-brand-primary px-6 py-2.5 font-brand text-sm text-white hover:bg-brand-dark disabled:opacity-60">
          {pending ? 'Guardando…' : 'Crear documento'}
        </button>
      </div>
    </div>
  )
}
