import { NextRequest, NextResponse } from 'next/server'
import { getShippingProvider, calculateParcel } from '@/lib/shipping'
import type { ShippingAddress, ParcelItem } from '@/lib/shipping'
import { humanizeShippingError } from '@/lib/shipping/rate-errors'

// Skydropx PRO exige un valor declarado mínimo para cotizar (insurance/aduana).
const SKYDROPX_MIN_DECLARED = 10000

export async function POST(req: NextRequest) {
  try {
    const { address, items } = await req.json()

    const shippingAddress: ShippingAddress = {
      name:         address.name,
      street1:      address.street,
      postal_code:  address.postal_code ?? '',
      area_level1:  address.department,
      area_level2:  address.city,
      country_code: 'CO',
      phone:        address.phone,
      email:        address.email,
      reference:    address.reference,
    }

    const parcel = calculateParcel(items as ParcelItem[])

    // Valor declarado que exige Skydropx PRO — suma de (precio × qty), con un
    // piso igual al mínimo de Skydropx (evita el 422 "declared_amount" en pedidos
    // de muy bajo valor; el valor declarado es solo para seguro/aduana del envío).
    const rawDeclared = items.reduce(
      (sum: number, i: { price?: number; qty: number }) => sum + (i.price ?? 0) * i.qty,
      0
    )
    parcel.declaredAmount = Math.max(rawDeclared, SKYDROPX_MIN_DECLARED)

    // Factory reads provider + credentials from shipping_config in the DB
    const provider = await getShippingProvider()
    const rates = await provider.getRates(shippingAddress, parcel)

    return NextResponse.json({
      provider: provider.name,
      rates,
    })
  } catch (err) {
    console.error('[api/shipping/rates]', err)
    const { message, status } = humanizeShippingError(err)
    return NextResponse.json({ error: message }, { status })
  }
}
