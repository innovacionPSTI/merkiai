'use client'

/**
 * Campos de dirección para países distintos de Colombia (E28 · HU-468).
 * Colombia conserva su formulario histórico (departamento + municipio DIVIPOLA).
 * Las etiquetas y las reglas salen de `@merkiai/i18n` (catálogo regional).
 */
import { SearchableSelect } from '@merkiai/ui'
import { getRegion, isValidPostalCode, normalizePostalCode } from '@merkiai/i18n'
import { useT } from '@/components/i18n/I18nProvider'

export interface RegionalAddressValue {
  country: string
  department: string
  city: string
  neighborhood: string
  postal_code: string
}

const inputCls = 'w-full border border-brand-primary/20 rounded-xl px-4 py-2.5 font-brand text-sm focus:outline-none focus:border-brand-primary'
const labelCls = 'font-brand text-sm font-semibold text-brand-primary block mb-1'

export default function RegionalAddressFields({ value, onChange }: { value: RegionalAddressValue; onChange: (patch: Partial<RegionalAddressValue>) => void }) {
  const t = useT()
  const region = getRegion(value.country)
  const subdivisions = Array.isArray(region.subdivisions) ? [...region.subdivisions] : []
  const cpInvalid = !!value.postal_code && !isValidPostalCode(region.country, value.postal_code)

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <SearchableSelect
          label={t(region.regionLabelKey)}
          required
          value={value.department}
          options={subdivisions}
          placeholder={t(region.regionLabelKey)}
          onChange={(department) => onChange({ department })}
        />
        <div>
          <label className={labelCls}>{t(region.cityLabelKey)} *</label>
          <input type="text" value={value.city} onChange={(e) => onChange({ city: e.target.value })} className={inputCls} />
        </div>
      </div>

      {region.neighborhood !== 'none' && (
        <div>
          <label className={labelCls}>{t('address.neighborhood')}{region.neighborhood === 'required' ? ' *' : ''}</label>
          <input type="text" value={value.neighborhood} onChange={(e) => onChange({ neighborhood: e.target.value })} className={inputCls} />
        </div>
      )}

      <div>
        <label className={labelCls}>
          {t('address.postal_code')}{region.postalCode.required ? ' *' : <span className="font-normal text-brand-primary/40"> {t('web.checkout.optional')}</span>}
        </label>
        <input
          type="text"
          value={value.postal_code}
          onChange={(e) => onChange({ postal_code: normalizePostalCode(region.country, e.target.value).slice(0, region.postalCode.maxLength) })}
          placeholder={region.postalCode.example}
          maxLength={region.postalCode.maxLength}
          inputMode={region.country === 'US' ? 'text' : 'numeric'}
          className={`w-40 border rounded-xl px-4 py-2.5 font-brand text-sm focus:outline-none transition-colors ${cpInvalid ? 'border-amber-400 focus:border-amber-500' : 'border-brand-primary/20 focus:border-brand-primary'}`}
        />
        {cpInvalid && <p className="font-brand text-xs text-amber-600 mt-1">{t('address.error_postal_code')}</p>}
      </div>
    </div>
  )
}
