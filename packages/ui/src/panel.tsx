import type { CSSProperties, ReactNode } from 'react'
import { Icon } from './icon'

/**
 * Design system de paneles internos (HU-210). Presentacional, sin dependencias
 * de framework: estilos inline + variables CSS (temable). Se usa en la consola
 * (control plane) y el admin. Abstrae patrones de paneles SaaS (sidebar agrupado,
 * topbar con menú de usuario, PageHeader, cards, StatCards, badges, empty states).
 */

// ── Tokens + CSS base (inyectar una vez con <PanelStyles/>) ──────────────────
export const PANEL_CSS = `
  .mk-shell {
    /* Tokens semánticos theme-driven (HU-240). Cambiar estos reskinea el panel. */
    --ui-bg:#f6f7f9; --ui-surface:#fff; --ui-surface-2:#f1f2f5; --ui-border:#e6e8eb;
    --ui-text:#1f2430; --ui-muted:#6b7280;
    --ui-primary:#4f46e5; --ui-primary-weak:#eef0fe; --ui-primary-contrast:#fff; --ui-accent:#7c3aed;
    --ui-success:#16a34a; --ui-warning:#d97706; --ui-danger:#dc2626;
    --ui-radius:10px; --ui-radius-lg:16px;
    --ui-shadow:0 1px 2px rgba(16,24,40,.06),0 1px 3px rgba(16,24,40,.08);
    --ui-shadow-lg:0 8px 24px rgba(16,24,40,.12);
    /* Alias retrocompat --mk-* → --ui-* (consumidores antiguos siguen funcionando). */
    --mk-bg:var(--ui-bg); --mk-surface:var(--ui-surface); --mk-border:var(--ui-border);
    --mk-text:var(--ui-text); --mk-muted:var(--ui-muted); --mk-primary:var(--ui-primary);
    --mk-primary-contrast:var(--ui-primary-contrast); --mk-radius:var(--ui-radius); --mk-shadow:var(--ui-shadow);
    display:grid; grid-template-columns:240px minmax(0,1fr); min-height:100vh; background:var(--ui-bg); color:var(--ui-text);
    font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",system-ui,sans-serif; }
  .mk-side { background:var(--ui-surface); border-right:1px solid var(--ui-border); padding:14px 12px; display:flex; flex-direction:column; }
  .mk-brand { display:flex; align-items:center; gap:9px; font-weight:700; color:var(--ui-primary); font-size:16px; padding:6px 10px 12px; }
  .mk-group { margin-top:10px; }
  .mk-group > .mk-lbl { font-size:10.5px; letter-spacing:.07em; text-transform:uppercase; color:var(--ui-muted); padding:10px 10px 4px; }
  .mk-nav a, .mk-nav span { display:flex; align-items:center; gap:11px; padding:8px 10px; border-radius:var(--ui-radius); font-size:14px; text-decoration:none; color:var(--ui-text); }
  .mk-nav a svg, .mk-nav span svg { stroke:var(--ui-muted); flex:0 0 auto; }
  .mk-nav a:hover { background:var(--ui-surface-2); }
  .mk-nav a.active { background:var(--ui-primary); color:var(--ui-primary-contrast); }
  .mk-nav a.active svg { stroke:var(--ui-primary-contrast); }
  .mk-nav span.disabled { color:#b4b8c0; }
  .mk-ico { width:18px; height:18px; display:inline-flex; flex:0 0 18px; }
  .mk-main { min-width:0; display:flex; flex-direction:column; }
  .mk-topbar { position:sticky; top:0; z-index:10; background:var(--ui-surface); border-bottom:1px solid var(--ui-border); padding:12px 24px; display:flex; align-items:center; justify-content:space-between; }
  .mk-content { padding:24px; max-width:1180px; width:100%; box-sizing:border-box; }
  /* Tabla temable (HU-241) */
  .mk-tablewrap { overflow-x:auto; }
  .mk-table { width:100%; border-collapse:collapse; }
  .mk-table thead th { text-align:left; font-size:10.5px; letter-spacing:.06em; text-transform:uppercase; color:var(--ui-muted); font-weight:600; padding:11px 16px; border-bottom:1px solid var(--ui-border); white-space:nowrap; }
  .mk-table tbody td { padding:13px 16px; border-bottom:1px solid var(--ui-border); vertical-align:middle; font-size:14px; }
  .mk-table tbody tr:last-child td { border-bottom:0; }
  .mk-table tbody tr:hover { background:var(--ui-surface-2); }
  /* Controles temables */
  .mk-input { padding:7px 10px; border:1px solid var(--ui-border); border-radius:var(--ui-radius); font-size:13.5px; background:var(--ui-surface); color:var(--ui-text); }
  .mk-input:focus { outline:2px solid var(--ui-primary-weak); border-color:var(--ui-primary); }
  .mk-btn { display:inline-flex; align-items:center; gap:7px; padding:8px 14px; border-radius:var(--ui-radius); border:0; background:var(--ui-primary); color:var(--ui-primary-contrast); font-weight:600; font-size:13.5px; cursor:pointer; box-shadow:var(--ui-shadow); }
  .mk-btn svg { stroke:var(--ui-primary-contrast); }
  .mk-btn-ghost { display:inline-flex; align-items:center; gap:7px; padding:7px 12px; border-radius:var(--ui-radius); border:1px solid var(--ui-border); background:var(--ui-surface); color:var(--ui-text); font-size:13px; cursor:pointer; }
  .mk-btn-sm { padding:5px 10px; font-size:12.5px; box-shadow:none; }
  @media (max-width:820px){ .mk-shell{grid-template-columns:1fr} .mk-side{display:none} }
`

export function PanelStyles() {
  return <style dangerouslySetInnerHTML={{ __html: PANEL_CSS }} />
}

// ── Layout shell ─────────────────────────────────────────────────────────────
export function PanelShell({ sidebar, topbar, children }: { sidebar: ReactNode; topbar: ReactNode; children: ReactNode }) {
  return (
    <div className="mk-shell">
      <PanelStyles />
      <aside className="mk-side">{sidebar}</aside>
      <div className="mk-main">
        <div className="mk-topbar">{topbar}</div>
        <div className="mk-content">{children}</div>
      </div>
    </div>
  )
}

// ── Sidebar (presentacional; el consumidor calcula `active`) ─────────────────
export interface NavItem { href?: string; label: string; icon?: ReactNode; active?: boolean; disabled?: boolean }
export interface NavGroup { label?: string; items: NavItem[] }

export function PanelSidebar({ brand, groups, footer }: { brand?: ReactNode; groups: NavGroup[]; footer?: ReactNode }) {
  return (
    <>
      {brand ? <div className="mk-brand">{brand}</div> : null}
      <nav className="mk-nav" style={{ flex: 1 }}>
        {groups.map((g, gi) => (
          <div className="mk-group" key={gi}>
            {g.label ? <div className="mk-lbl">{g.label}</div> : null}
            {g.items.map((it, i) =>
              it.disabled || !it.href ? (
                <span className="disabled" key={i} title="Próximamente">
                  {it.icon ? <span className="mk-ico">{it.icon}</span> : null}{it.label}
                </span>
              ) : (
                <a className={it.active ? 'active' : ''} href={it.href} key={i}>
                  {it.icon ? <span className="mk-ico">{it.icon}</span> : null}{it.label}
                </a>
              ),
            )}
          </div>
        ))}
      </nav>
      {footer ? <div style={{ borderTop: '1px solid var(--mk-border)', paddingTop: 12, marginTop: 12 }}>{footer}</div> : null}
    </>
  )
}

// ── PageHeader ───────────────────────────────────────────────────────────────
export function PageHeader({ title, description, action }: { title: ReactNode; description?: ReactNode; action?: ReactNode }) {
  return (
    <div style={{
      display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 16, marginBottom: 18,
      background: 'var(--ui-surface)', border: '1px solid var(--ui-border)', borderLeft: '5px solid var(--ui-primary)',
      borderRadius: 'var(--ui-radius-lg)', boxShadow: 'var(--ui-shadow)', padding: '20px 24px',
    }}>
      <div>
        <h1 style={{ margin: 0, fontSize: 25, letterSpacing: '-.01em', color: 'var(--ui-text)' }}>{title}</h1>
        {description ? <p style={{ margin: '6px 0 0', color: 'var(--ui-muted)', fontSize: 14, lineHeight: 1.5, maxWidth: 620 }}>{description}</p> : null}
      </div>
      {action ? <div style={{ flex: '0 0 auto' }}>{action}</div> : null}
    </div>
  )
}

// ── Card / Panel ─────────────────────────────────────────────────────────────
export function PanelCard({ title, action, children, style }: { title?: ReactNode; action?: ReactNode; children: ReactNode; style?: CSSProperties }) {
  return (
    <section style={{ background: 'var(--mk-surface)', border: '1px solid var(--mk-border)', borderRadius: 'var(--mk-radius)', boxShadow: 'var(--mk-shadow)', padding: 16, marginBottom: 16, ...style }}>
      {(title || action) && (
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
          {title ? <h2 style={{ margin: 0, fontSize: 15 }}>{title}</h2> : <span />}
          {action}
        </div>
      )}
      {children}
    </section>
  )
}

// ── StatCard (KPI) ───────────────────────────────────────────────────────────
export function StatCard({ label, value, hint, icon, tone = 'primary' }: {
  label: ReactNode; value: ReactNode; hint?: ReactNode; icon?: ReactNode;
  tone?: 'primary' | 'success' | 'warning' | 'danger'
}) {
  const tile: Record<string, { bg: string; fg: string }> = {
    primary: { bg: 'var(--ui-primary-weak)', fg: 'var(--ui-primary)' },
    success: { bg: 'rgba(22,163,74,.12)', fg: 'var(--ui-success)' },
    warning: { bg: 'rgba(217,119,6,.12)', fg: 'var(--ui-warning)' },
    danger: { bg: 'rgba(220,38,38,.12)', fg: 'var(--ui-danger)' },
  }
  const t = tile[tone]
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 14, background: 'var(--ui-surface)', border: '1px solid var(--ui-border)', borderRadius: 'var(--ui-radius-lg)', boxShadow: 'var(--ui-shadow)', padding: '16px 18px', flex: '1 1 180px', minWidth: 160 }}>
      {icon ? (
        <span style={{ width: 40, height: 40, borderRadius: 11, background: t.bg, color: t.fg, display: 'grid', placeItems: 'center', flex: '0 0 auto' }}>{icon}</span>
      ) : null}
      <div>
        <div style={{ fontSize: 10.5, color: 'var(--ui-muted)', textTransform: 'uppercase', letterSpacing: '.06em' }}>{label}</div>
        <div style={{ fontSize: 24, fontWeight: 700, marginTop: 2, lineHeight: 1.1 }}>{value}</div>
        {hint ? <div style={{ fontSize: 12, color: 'var(--ui-muted)', marginTop: 2 }}>{hint}</div> : null}
      </div>
    </div>
  )
}

export function StatGrid({ children }: { children: ReactNode }) {
  return <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12, marginBottom: 16 }}>{children}</div>
}

// ── StatusBadge (pill) ───────────────────────────────────────────────────────
export type BadgeTone = 'success' | 'danger' | 'warn' | 'info' | 'neutral'
const TONE: Record<BadgeTone, { bg: string; fg: string }> = {
  success: { bg: '#e7f4ec', fg: '#1e7a45' },
  danger: { bg: '#fdeaea', fg: '#b42318' },
  warn: { bg: '#fef6e7', fg: '#b25e09' },
  info: { bg: '#e8f0fe', fg: '#1a56db' },
  neutral: { bg: '#eef1f4', fg: '#4b5563' },
}
export function StatusBadge({ children, tone = 'neutral' }: { children: ReactNode; tone?: BadgeTone }) {
  const c = TONE[tone]
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: c.bg, color: c.fg, fontSize: 12, fontWeight: 600, padding: '2px 10px', borderRadius: 999 }}>
      <span style={{ width: 6, height: 6, borderRadius: 999, background: c.fg }} />
      {children}
    </span>
  )
}

// ── Chip (atributo / neutral) ────────────────────────────────────────────────
export function Chip({ children, variant = 'attr' }: { children: ReactNode; variant?: 'attr' | 'neutral' }) {
  const v = variant === 'attr'
    ? { bg: 'var(--ui-primary-weak)', fg: 'var(--ui-primary)' }
    : { bg: 'var(--ui-surface-2)', fg: 'var(--ui-muted)' }
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: v.bg, color: v.fg, fontSize: 12, fontWeight: 600, padding: '3px 10px', borderRadius: 999 }}>
      {children}
    </span>
  )
}

// ── IconTile (recuadro de icono) ─────────────────────────────────────────────
export function IconTile({ children, tone = 'primary', size = 34 }: {
  children: ReactNode; tone?: 'primary' | 'success' | 'warning' | 'danger'; size?: number
}) {
  const tones: Record<string, { bg: string; fg: string }> = {
    primary: { bg: 'var(--ui-primary-weak)', fg: 'var(--ui-primary)' },
    success: { bg: 'rgba(22,163,74,.12)', fg: 'var(--ui-success)' },
    warning: { bg: 'rgba(217,119,6,.12)', fg: 'var(--ui-warning)' },
    danger: { bg: 'rgba(220,38,38,.12)', fg: 'var(--ui-danger)' },
  }
  const t = tones[tone]
  return (
    <span style={{ width: size, height: size, borderRadius: Math.round(size * 0.3), background: t.bg, color: t.fg, display: 'grid', placeItems: 'center', flex: '0 0 auto' }}>
      {children}
    </span>
  )
}

// ── Field (label + control + helper/error) ───────────────────────────────────
export function Field({ label, required, helper, error, children }: {
  label?: ReactNode; required?: boolean; helper?: ReactNode; error?: ReactNode; children: ReactNode
}) {
  return (
    <label style={{ display: 'grid', gap: 5 }}>
      {label ? (
        <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--ui-text)' }}>
          {label}{required ? <span style={{ color: 'var(--ui-danger)' }}> *</span> : null}
        </span>
      ) : null}
      {children}
      {error ? <span style={{ fontSize: 12, color: 'var(--ui-danger)' }}>{error}</span>
        : helper ? <span style={{ fontSize: 12, color: 'var(--ui-muted)' }}>{helper}</span> : null}
    </label>
  )
}

// ── ResourceCard (tarjeta de recurso: plan, preset, producto…) ────────────────
export interface CardMetric { label: ReactNode; value: ReactNode }
export function ResourceCard({ title, badge, chips, price, priceSuffix, metrics, actions }: {
  title: ReactNode; badge?: ReactNode; chips?: ReactNode; price?: ReactNode; priceSuffix?: ReactNode;
  metrics?: CardMetric[]; actions?: ReactNode
}) {
  return (
    <section style={{ display: 'flex', flexDirection: 'column', background: 'var(--ui-surface)', border: '1px solid var(--ui-border)', borderRadius: 'var(--ui-radius-lg)', boxShadow: 'var(--ui-shadow)', overflow: 'hidden' }}>
      <div style={{ padding: 18, display: 'flex', flexDirection: 'column', gap: 12, flex: 1 }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 10 }}>
          <h3 style={{ margin: 0, fontSize: 17 }}>{title}</h3>
          {badge}
        </div>
        {chips ? <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>{chips}</div> : null}
        {price != null ? (
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 6 }}>
            <span style={{ fontSize: 26, fontWeight: 700 }}>{price}</span>
            {priceSuffix ? <span style={{ color: 'var(--ui-muted)', fontSize: 13 }}>{priceSuffix}</span> : null}
          </div>
        ) : null}
        {metrics?.length ? (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginTop: 'auto' }}>
            {metrics.map((m, i) => (
              <div key={i}>
                <div style={{ fontSize: 10.5, letterSpacing: '.06em', textTransform: 'uppercase', color: 'var(--ui-muted)' }}>{m.label}</div>
                <div style={{ fontSize: 14, marginTop: 2 }}>{m.value}</div>
              </div>
            ))}
          </div>
        ) : null}
      </div>
      {actions ? (
        <div style={{ borderTop: '1px solid var(--ui-border)', padding: '10px 18px', display: 'flex', gap: 14, alignItems: 'center' }}>{actions}</div>
      ) : null}
    </section>
  )
}

export function CardGrid({ children, min = 280 }: { children: ReactNode; min?: number }) {
  return <div style={{ display: 'grid', gridTemplateColumns: `repeat(auto-fill, minmax(${min}px, 1fr))`, gap: 14 }}>{children}</div>
}

// ── DataTable (envoltorio temable) ───────────────────────────────────────────
export function DataTable({ children, minWidth = 720 }: { children: ReactNode; minWidth?: number }) {
  return (
    <div className="mk-tablewrap">
      <table className="mk-table" style={{ minWidth }}>{children}</table>
    </div>
  )
}

// ── Pagination ───────────────────────────────────────────────────────────────
export function Pagination({ summary, prevHref, nextHref }: {
  summary?: ReactNode; prevHref?: string | null; nextHref?: string | null
}) {
  const base: CSSProperties = {
    display: 'inline-flex', alignItems: 'center', gap: 6, padding: '6px 12px',
    borderRadius: 999, border: '1px solid var(--ui-border)', fontSize: 13, textDecoration: 'none',
  }
  const on: CSSProperties = { ...base, color: 'var(--ui-text)', cursor: 'pointer' }
  const off: CSSProperties = { ...base, color: 'var(--ui-muted)', opacity: 0.45, pointerEvents: 'none' }
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 16 }}>
      <span style={{ fontSize: 12.5, color: 'var(--ui-muted)' }}>{summary}</span>
      <div style={{ display: 'flex', gap: 8 }}>
        <a href={prevHref ?? undefined} style={prevHref ? on : off}><Icon name="chevron-left" size={15} /> Anterior</a>
        <a href={nextHref ?? undefined} style={nextHref ? on : off}>Siguiente <Icon name="chevron-right" size={15} /></a>
      </div>
    </div>
  )
}

// ── EmptyState ───────────────────────────────────────────────────────────────
export function EmptyState({ icon, title, description, action }: { icon?: ReactNode; title: ReactNode; description?: ReactNode; action?: ReactNode }) {
  return (
    <div style={{ textAlign: 'center', padding: '40px 16px', color: 'var(--mk-muted)' }}>
      {icon ? <div style={{ fontSize: 28, marginBottom: 8 }}>{icon}</div> : null}
      <div style={{ fontWeight: 600, color: 'var(--mk-text)' }}>{title}</div>
      {description ? <div style={{ fontSize: 14, marginTop: 4 }}>{description}</div> : null}
      {action ? <div style={{ marginTop: 12 }}>{action}</div> : null}
    </div>
  )
}
