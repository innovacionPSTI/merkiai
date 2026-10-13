/**
 * Admin API — Shipping Configuration
 *
 * GET  /api/admin/shipping  → returns current shipping_config (credentials masked)
 * PATCH /api/admin/shipping → updates shipping_config
 *
 * Credentials (client_secret) are returned masked in GET responses
 * so they are never exposed in the UI after saving.
 */

import { NextRequest, NextResponse } from 'next/server'
import { getShippingConfig, updateShippingConfig } from '@merkiai/database'
import type { UpdateShippingConfigInput } from '@merkiai/database'
import { getAdminUser } from '@/lib/auth'
import { getAdminDb } from '@/lib/admin-db'

/** Mask sensitive credential fields for GET responses */
function maskConfig(config: Awaited<ReturnType<typeof getShippingConfig>>) {
  return {
    ...config,
    skydropx_client_secret: config.skydropx_client_secret
      ? '••••••••' + config.skydropx_client_secret.slice(-4)
      : null,
  }
}

export async function GET() {
  try {
    const adminUser = await getAdminUser()
    if (!adminUser) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    const config = await getShippingConfig(getAdminDb(adminUser.tenantId), adminUser.tenantId)
    return NextResponse.json(maskConfig(config))
  } catch (err) {
    console.error('[admin/shipping GET]', err)
    return NextResponse.json({ error: 'Error cargando configuración' }, { status: 500 })
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const adminUser = await getAdminUser()
    if (!adminUser) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    const supabase = getAdminDb(adminUser.tenantId)
    const body = await req.json() as UpdateShippingConfigInput

    // Validate provider value
    const validProviders = ['fixed', 'skydropx']
    if (body.provider && !validProviders.includes(body.provider)) {
      return NextResponse.json(
        { error: `Proveedor inválido. Valores permitidos: ${validProviders.join(', ')}` },
        { status: 400 }
      )
    }

    // Validate fixed_rate if provided
    if (body.fixed_rate !== undefined && (body.fixed_rate < 0 || isNaN(Number(body.fixed_rate)))) {
      return NextResponse.json(
        { error: 'fixed_rate debe ser un número mayor o igual a 0' },
        { status: 400 }
      )
    }

    // ADR-004: las credenciales del carrier viven en la instancia activa
    // (Transportadoras), no en shipping_config. Para el modo 'skydropx' solo se
    // exige la dirección de origen (necesaria para generar guías).
    if (body.provider === 'skydropx') {
      const current = await getShippingConfig(supabase, adminUser.tenantId)
      const effectiveOriginName   = (body as Record<string, unknown>).origin_name   ?? current.origin_name
      const effectiveOriginCity   = (body as Record<string, unknown>).origin_city   ?? current.origin_city
      const effectiveOriginDept   = (body as Record<string, unknown>).origin_department ?? current.origin_department
      const effectiveOriginPC     = (body as Record<string, unknown>).origin_postal_code ?? current.origin_postal_code

      const missing = [
        !effectiveOriginName && 'origin_name',
        !effectiveOriginCity && 'origin_city',
        !effectiveOriginDept && 'origin_department',
        !effectiveOriginPC   && 'origin_postal_code',
      ].filter(Boolean)

      if (missing.length) {
        return NextResponse.json(
          { error: 'Para envíos con transportadora falta la dirección de origen', missing },
          { status: 400 }
        )
      }
    }

    const updated = await updateShippingConfig(body, supabase, adminUser.tenantId)
    return NextResponse.json(maskConfig(updated))
  } catch (err) {
    console.error('[admin/shipping PATCH]', err)
    return NextResponse.json({ error: 'Error guardando configuración' }, { status: 500 })
  }
}
