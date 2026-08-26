import type { CSSProperties, ReactNode } from 'react'

/**
 * Design system de paneles internos (HU-210). Presentacional, sin dependencias
 * de framework: estilos inline + variables CSS (temable). Se usa en la consola
 * (control plane) y el admin. Abstrae patrones de paneles SaaS (sidebar agrupado,
 * topbar con menú de usuario, PageHeader, cards, StatCards, badges, empty states).
 */

// ── Tokens + CSS base (inyectar una vez con <PanelStyles/>) ──────────────────
export const PANEL_CSS = `
  .mk-shell { --mk-bg:#f6f7f9; --mk-surface:#fff; --mk-border:#e6e8eb; --mk-text:#1f2937; --mk-muted:#6b7280; --mk-primary:#2E5A3B; --mk-primary-contrast:#fff; --mk-radius:10px; --mk-shadow:0 1px 2px rgba(16,24,40,.06),0 1px 3px rgba(16,24,40,.08);
    display:grid; grid-template-columns:236px minmax(0,1fr); min-height:100vh; background:var(--mk-bg); color:var(--mk-text); font-family:system-ui,sans-serif; }
  .mk-side { background:var(--mk-surface); border-right:1px solid var(--mk-border); padding:16px 12px; display:flex; flex-direction:column; }
  .mk-brand { font-weight:700; color:var(--mk-primary); font-size:16px; padding:6px 10px 12px; }
  .mk-group { margin-top:12px; }
  .mk-group > .mk-lbl { font-size:11px; letter-spacing:.06em; text-transform:uppercase; color:var(--mk-muted); padding:8px 10px 4px; }
  .mk-nav a, .mk-nav span { display:flex; align-items:center; gap:10px; padding:8px 10px; border-radius:8px; font-size:14px; text-decoration:none; color:var(--mk-text); }
  .mk-nav a:hover { background:#eef1f4; }
  .mk-nav a.active { background:var(--mk-primary); color:var(--mk-primary-contrast); }
  .mk-nav span.disabled { color:#b0b4bb; }
  .mk-ico { width:16px; height:16px; display:inline-flex; flex:0 0 16px; }
  .mk-main { min-width:0; display:flex; flex-direction:column; }
  .mk-topbar { position:sticky; top:0; z-index:10; background:var(--mk-surface); border-bottom:1px solid var(--mk-border); padding:12px 24px; display:flex; align-items:center; justify-content:space-between; }
  .mk-content { padding:24px; max-width:1180px; width:100%; box-sizing:border-box; }
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
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 16, marginBottom: 20 }}>
      <div>
        <h1 style={{ margin: 0, fontSize: 24, color: 'var(--mk-primary)' }}>{title}</h1>
        {description ? <p style={{ margin: '4px 0 0', color: 'var(--mk-muted)', fontSize: 14 }}>{description}</p> : null}
      </div>
      {action ? <div>{action}</div> : null}
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
export function StatCard({ label, value, hint }: { label: ReactNode; value: ReactNode; hint?: ReactNode }) {
  return (
    <div style={{ background: 'var(--mk-surface)', border: '1px solid var(--mk-border)', borderRadius: 'var(--mk-radius)', boxShadow: 'var(--mk-shadow)', padding: 16, flex: '1 1 180px', minWidth: 160 }}>
      <div style={{ fontSize: 12, color: 'var(--mk-muted)', textTransform: 'uppercase', letterSpacing: '.04em' }}>{label}</div>
      <div style={{ fontSize: 28, fontWeight: 700, marginTop: 4 }}>{value}</div>
      {hint ? <div style={{ fontSize: 12, color: 'var(--mk-muted)', marginTop: 2 }}>{hint}</div> : null}
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
