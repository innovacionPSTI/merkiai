import { PageHeader, PanelCard, EmptyState, StatusBadge, Icon, type BadgeTone } from '@merkiai/ui'
import { platformDb } from '@/lib/platform-db'
import { listTenantInfra, INFRA_STATUS_LABEL } from '@/lib/tenant-infra'
import type { InfraConfigStatus } from '@merkiai/tenancy'
import { deleteTenantInfraConfig } from '../../actions'
import InfraForm from './infra-form'
import InfraSecretsForm from './infra-secrets-form'
import { btn } from '@/lib/styles'
import HostingTokenForm from './hosting-token-form'
import { getSetting, HOSTING_TOKEN_REF_KEY } from '@/lib/platform-settings'
import { managedProviderId } from '@/lib/hosting'

export const dynamic = 'force-dynamic'

const statusTone = (s: InfraConfigStatus): BadgeTone =>
  s === 'active' ? 'success' : s === 'disabled' ? 'danger' : s === 'rotating' ? 'warn' : 'neutral'

export default async function InfraestructuraPage() {
  const [{ data: tenants }, configs, tokenRef] = await Promise.all([
    platformDb().from('tenants').select('id, name').order('name', { ascending: true }),
    listTenantInfra(),
    getSetting(platformDb(), HOSTING_TOKEN_REF_KEY).catch(() => null),
  ])
  const hosting = {
    provider: managedProviderId(),
    zone: Boolean(process.env.HOSTING_ZONE_ID),
    target: process.env.HOSTING_CNAME_TARGET ?? null,
  }
  const tenantList = (tenants ?? []) as { id: string; name: string | null }[]

  const deleteBtn: React.CSSProperties = {
    ...btn, background: 'transparent', color: '#B42318', border: '1px solid var(--ui-border)', fontWeight: 500,
  }

  return (
    <>
      <PageHeader
        title="Infraestructura por tenant"
        description="Configura la base de datos dedicada de los tenants que no usan el clúster compartido. La mayoría no necesita esto."
      />

      <PanelCard title="Dominios propios de las tiendas">
        <p style={{ margin: '0 0 12px', fontSize: 13, color: 'var(--ui-muted)' }}>
          Proveedor activo: <strong>{hosting.provider === 'cloudflare' ? 'Cloudflare for SaaS' : 'Vercel (por proyecto)'}</strong>
          {hosting.provider === 'cloudflare' && (
            <> · Zona: {hosting.zone ? 'configurada' : <strong style={{ color: '#B42318' }}>falta HOSTING_ZONE_ID</strong>}
            {' '}· Destino CNAME para los comerciantes: {hosting.target ? <code>{hosting.target}</code> : <strong style={{ color: '#B42318' }}>falta HOSTING_CNAME_TARGET</strong>}</>
          )}
        </p>
        <HostingTokenForm configured={Boolean(tokenRef)} />
        <p style={{ margin: '12px 0 0', fontSize: 12, color: '#888', display: 'flex', gap: 6 }}>
          <Icon name="alert" size={14} />
          Con Cloudflare for SaaS cada dominio queda certificado y enrutado sin depender del proyecto de cómputo. El token se guarda cifrado (AWS KMS) y nunca se vuelve a mostrar.
        </p>
      </PanelCard>

      <PanelCard title="Agregar tenant">
        <div style={{ maxWidth: 560 }}>
          <InfraForm tenants={tenantList} />
        </div>
        <p style={{ margin: '14px 0 0', fontSize: 12, color: '#888', display: 'flex', gap: 6, alignItems: 'flex-start' }}>
          <Icon name="alert" size={14} />
          Aquí solo se configuran los datos de conexión. Las llaves de acceso (secretos) se cargan
          de forma segura al activar el almacén de secretos — se habilita más adelante.
        </p>
      </PanelCard>

      <PanelCard title={`Tenants configurados (${configs.length})`}>
        {configs.length === 0 ? (
          <EmptyState
            icon={<Icon name="tenant" size={28} />}
            title="Ningún tenant con infraestructura dedicada"
            description="Agrega el primero con el formulario de arriba."
          />
        ) : (
          <div style={{ display: 'grid', gap: 16 }}>
            {configs.map((c) => (
              <div key={c.tenant_id} style={{ border: '1px solid var(--ui-border)', borderRadius: 'var(--ui-radius)', padding: 16 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12, marginBottom: 12, flexWrap: 'wrap' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <strong style={{ fontSize: 15 }}>{c.tenant_name ?? c.tenant_id}</strong>
                    <StatusBadge tone={statusTone(c.status)}>{INFRA_STATUS_LABEL[c.status]}</StatusBadge>
                  </div>
                  <form action={deleteTenantInfraConfig}>
                    <input type="hidden" name="tenant_id" value={c.tenant_id} />
                    <button type="submit" style={deleteBtn}>Eliminar</button>
                  </form>
                </div>
                <div style={{ display: 'flex', gap: 24, flexWrap: 'wrap' }}>
                  <div style={{ flex: '1 1 320px', maxWidth: 560 }}>
                    <InfraForm
                      tenants={tenantList}
                      initial={{
                        tenant_id: c.tenant_id,
                        db_ref: c.db_ref,
                        db_url: c.db_url,
                        base_url: c.base_url,
                        sentry_dsn: c.sentry_dsn,
                        region: c.region,
                        status: c.status,
                      }}
                    />
                  </div>
                  <div style={{ flex: '1 1 280px', maxWidth: 420, borderLeft: '1px solid var(--ui-border)', paddingLeft: 20 }}>
                    <h4 style={{ margin: '0 0 2px', fontSize: 13 }}>Secretos de conexión</h4>
                    <p style={{ margin: '0 0 12px', fontSize: 11, color: '#888' }}>
                      Se cifran con AWS KMS; solo se guarda la referencia. No se muestran una vez cargados.
                    </p>
                    <InfraSecretsForm
                      tenantId={c.tenant_id}
                      state={{ hasAnon: c.has_anon_key, hasService: c.has_service_key, hasJwt: c.has_jwt_secret }}
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </PanelCard>
    </>
  )
}
