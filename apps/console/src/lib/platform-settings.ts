/**
 * Ajustes de plataforma (HU-431): tabla `platform_settings` clave → valor NO
 * secreto. Los secretos se guardan en el vault y aquí solo su referencia.
 */
/* eslint-disable @typescript-eslint/no-explicit-any */
export const HOSTING_TOKEN_REF_KEY = 'hosting.cloudflare_token_ref'

export async function getSetting(db: any, key: string): Promise<string | null> {
  const { data, error } = await db.from('platform_settings').select('value').eq('key', key).maybeSingle()
  if (error) throw new Error(`[platform-settings] get ${key}: ${error.message}`)
  return data?.value ?? null
}

export async function setSetting(db: any, key: string, value: string): Promise<void> {
  const { error } = await db.from('platform_settings').upsert({ key, value, updated_at: new Date().toISOString() }, { onConflict: 'key' })
  if (error) throw new Error(`[platform-settings] set ${key}: ${error.message}`)
}
/* eslint-enable @typescript-eslint/no-explicit-any */
