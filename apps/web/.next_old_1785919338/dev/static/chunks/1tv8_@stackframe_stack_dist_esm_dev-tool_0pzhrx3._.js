(globalThis["TURBOPACK"] || (globalThis["TURBOPACK"] = [])).push([typeof document === "object" ? document.currentScript : undefined,
"[project]/node_modules/.pnpm/@stackframe+stack@2.8.108_@types+react-dom@18.3.7_@types+react@18.3.31__@types+react@18.3.31__tqjf7xvnucvjx6rf5f5n65ykji/node_modules/@stackframe/stack/dist/esm/dev-tool/dev-tool-styles.js [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "devToolCSS",
    ()=>devToolCSS
]);
//#region src/dev-tool/dev-tool-styles.ts
const devToolCSS = `
  .stack-devtool {
    --sdt-bg: #0a0a0b;
    --sdt-bg-elevated: #141416;
    --sdt-bg-hover: #1c1c1f;
    --sdt-bg-active: #232326;
    --sdt-bg-subtle: #111113;
    --sdt-border: #2a2a2e;
    --sdt-border-subtle: #1e1e22;
    --sdt-text: #ececef;
    --sdt-text-secondary: #8b8b93;
    --sdt-text-tertiary: #5c5c66;
    --sdt-accent: #6366f1;
    --sdt-accent-hover: #818cf8;
    --sdt-accent-muted: rgba(99, 102, 241, 0.15);
    --sdt-success: #22c55e;
    --sdt-success-muted: rgba(34, 197, 94, 0.15);
    --sdt-warning: #eab308;
    --sdt-warning-muted: rgba(234, 179, 8, 0.15);
    --sdt-error: #ef4444;
    --sdt-error-muted: rgba(239, 68, 68, 0.15);
    --sdt-info: #3b82f6;
    --sdt-info-muted: rgba(59, 130, 246, 0.15);
    --sdt-overlay-bg: rgba(17, 17, 19, 0.92);
    --sdt-radius: 8px;
    --sdt-radius-sm: 4px;
    --sdt-radius-lg: 12px;
    --sdt-font: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
    --sdt-font-mono: 'SF Mono', SFMono-Regular, ui-monospace, 'DejaVu Sans Mono', Menlo, Consolas, monospace;
    --sdt-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.5), 0 0 0 1px rgba(255, 255, 255, 0.05);
    --sdt-trigger-shadow: 0 4px 12px rgba(0, 0, 0, 0.4), 0 0 0 1px rgba(255, 255, 255, 0.08);

    all: initial;
    font-family: var(--sdt-font);
    color: var(--sdt-text);
    font-size: 13px;
    line-height: 1.5;
    -webkit-font-smoothing: antialiased;
    -moz-osx-font-smoothing: grayscale;
    box-sizing: border-box;
  }

  .stack-devtool *, .stack-devtool *::before, .stack-devtool *::after {
    box-sizing: border-box;
  }

  /* Trigger pill */
  .stack-devtool .sdt-trigger {
    position: fixed;
    z-index: 2147483647;
    display: flex;
    align-items: center;
    justify-content: center;
    width: 36px;
    height: 36px;
    padding: 0;
    background: var(--sdt-bg-elevated);
    border: 1px solid var(--sdt-border);
    border-radius: 10px;
    cursor: grab;
    box-shadow: var(--sdt-trigger-shadow);
    transition: background 0.2s ease, border-color 0.2s ease, box-shadow 0.2s ease;
    user-select: none;
    touch-action: none;
  }

  .stack-devtool .sdt-trigger-position-animated {
    transition: left 0.14s cubic-bezier(0.2, 0.8, 0.2, 1), top 0.14s cubic-bezier(0.2, 0.8, 0.2, 1), background 0.2s ease, border-color 0.2s ease, box-shadow 0.2s ease;
  }

  .stack-devtool .sdt-trigger:hover {
    background: var(--sdt-bg-hover);
    border-color: var(--sdt-accent);
    box-shadow: var(--sdt-trigger-shadow), 0 0 0 1px var(--sdt-accent);
  }

  .stack-devtool .sdt-trigger:active {
    cursor: grabbing;
  }

  .stack-devtool .sdt-trigger-logo {
    width: 22px;
    height: 22px;
    border-radius: 6px;
    background: var(--sdt-accent);
    display: flex;
    align-items: center;
    justify-content: center;
    color: white;
    line-height: 0;
  }

  /* Panel overlay */
  .stack-devtool .sdt-panel {
    position: fixed;
    bottom: 60px;
    right: 16px;
    z-index: 99998;
    width: 800px;
    max-width: calc(100vw - 32px);
    height: 520px;
    max-height: calc(100vh - 80px);
    background: var(--sdt-bg);
    border: 1px solid var(--sdt-border);
    border-radius: var(--sdt-radius-lg);
    box-shadow: var(--sdt-shadow);
    display: flex;
    flex-direction: column;
    overflow: visible;
  }

  .stack-devtool .sdt-panel-geometry-animated {
    transition: width 0.18s cubic-bezier(0.2, 0.8, 0.2, 1),
                height 0.18s cubic-bezier(0.2, 0.8, 0.2, 1),
                right 0.18s cubic-bezier(0.2, 0.8, 0.2, 1),
                bottom 0.18s cubic-bezier(0.2, 0.8, 0.2, 1),
                border-radius 0.18s cubic-bezier(0.2, 0.8, 0.2, 1),
                border-color 0.18s cubic-bezier(0.2, 0.8, 0.2, 1);
  }

  .stack-devtool .sdt-panel-fullscreen {
    right: 0;
    bottom: 0;
    width: 100vw;
    max-width: none;
    height: 100vh;
    max-height: none;
    border: none;
    border-radius: 0;
  }

  .stack-devtool .sdt-panel-inner {
    display: flex;
    flex-direction: column;
    width: 100%;
    height: 100%;
    overflow: hidden;
    border-radius: var(--sdt-radius-lg);
    animation: sdt-panel-enter 0.2s ease-out;
  }

  .stack-devtool .sdt-panel-fullscreen .sdt-panel-inner {
    border-radius: 0;
  }

  .stack-devtool .sdt-panel-fullscreen .sdt-resize-handle {
    display: none;
  }

  @keyframes sdt-panel-enter {
    from {
      opacity: 0;
      transform: scale(0.95) translateY(8px);
    }
    to {
      opacity: 1;
      transform: scale(1) translateY(0);
    }
  }

  .stack-devtool .sdt-panel-exiting {
    animation: sdt-panel-exit 0.15s ease-in forwards;
  }

  @keyframes sdt-panel-exit {
    from {
      opacity: 1;
      transform: scale(1) translateY(0);
    }
    to {
      opacity: 0;
      transform: scale(0.95) translateY(8px);
    }
  }

  /* Tab bar */
  .stack-devtool .sdt-tabbar {
    position: relative;
    display: flex;
    align-items: center;
    height: 44px;
    padding: 0 8px;
    background: var(--sdt-bg-subtle);
    border-bottom: 1px solid var(--sdt-border);
    flex-shrink: 0;
    gap: 2px;
    overflow-x: auto;
  }

  .stack-devtool .sdt-panel-fullscreen .sdt-tabbar {
    position: absolute;
    top: 8px;
    left: 8px;
    right: 8px;
    z-index: 2;
    background: var(--sdt-overlay-bg);
    border: 1px solid var(--sdt-border);
    border-radius: var(--sdt-radius);
    box-shadow: var(--sdt-trigger-shadow);
  }

  .stack-devtool .sdt-tab-indicator {
    position: absolute;
    top: 6px;
    left: 0;
    height: 32px;
    background: var(--sdt-bg-active);
    border-radius: var(--sdt-radius);
    transition: transform 0.2s cubic-bezier(0.25, 0.46, 0.45, 0.94),
                width 0.2s cubic-bezier(0.25, 0.46, 0.45, 0.94);
    pointer-events: none;
    z-index: 0;
  }

  .stack-devtool .sdt-tab {
    position: relative;
    z-index: 1;
    display: flex;
    align-items: center;
    gap: 6px;
    height: 32px;
    padding: 0 12px;
    background: transparent;
    border: none;
    border-radius: var(--sdt-radius);
    cursor: pointer;
    font-family: var(--sdt-font);
    font-size: 12px;
    font-weight: 500;
    color: var(--sdt-text-secondary);
    transition: color 0.15s ease;
    white-space: nowrap;
    outline: none;
  }

  .stack-devtool .sdt-tab:hover {
    color: var(--sdt-text);
  }

  .stack-devtool .sdt-tab[data-active="true"] {
    color: var(--sdt-text);
  }

  .stack-devtool .sdt-tab-icon {
    width: 14px;
    height: 14px;
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
  }

  .stack-devtool .sdt-tabbar-spacer {
    flex: 1;
  }

  .stack-devtool .sdt-tabbar-actions {
    display: flex;
    align-items: center;
    gap: 4px;
    flex-shrink: 0;
  }

  .stack-devtool .sdt-docs-link {
    display: inline-flex;
    align-items: center;
    gap: 4px;
    height: 28px;
    padding: 0 8px;
    color: var(--sdt-text-secondary);
    border-radius: var(--sdt-radius-sm);
    font-family: var(--sdt-font);
    font-size: 12px;
    font-weight: 500;
    line-height: 1;
    text-decoration: none;
    white-space: nowrap;
    transition: color 0.15s ease, background 0.15s ease;
  }

  .stack-devtool .sdt-docs-link:hover {
    color: var(--sdt-text);
    background: var(--sdt-bg-hover);
  }

  .stack-devtool .sdt-docs-link-icon {
    display: flex;
    width: 13px;
    height: 13px;
    line-height: 0;
  }

  .stack-devtool .sdt-close-btn {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 28px;
    height: 28px;
    background: transparent;
    border: none;
    border-radius: var(--sdt-radius-sm);
    cursor: pointer;
    color: var(--sdt-text-tertiary);
    transition: all 0.15s ease;
    flex-shrink: 0;
  }

  .stack-devtool .sdt-close-btn:hover {
    color: var(--sdt-text);
    background: var(--sdt-bg-hover);
  }

  /* Tab content area */
  .stack-devtool .sdt-content {
    flex: 1;
    position: relative;
    overflow: hidden;
    min-height: 0;
  }

  .stack-devtool .sdt-panel-fullscreen .sdt-content {
    position: absolute;
    inset: 0;
    width: 100%;
    height: 100%;
  }

  .stack-devtool .sdt-tab-layers {
    position: absolute;
    inset: 0;
  }

  .stack-devtool .sdt-tab-pane {
    position: absolute;
    inset: 0;
    overflow-y: auto;
    overflow-x: hidden;
    padding: 16px;
    visibility: hidden;
    pointer-events: none;
  }

  .stack-devtool .sdt-tab-pane-iframe {
    padding: 0;
    overflow: hidden;
  }

  .stack-devtool .sdt-tab-pane-active {
    visibility: visible;
    pointer-events: auto;
    animation: sdt-tab-fade-in 0.15s ease-out;
  }

  @keyframes sdt-tab-fade-in {
    from {
      opacity: 0;
      transform: translateY(6px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }

  .stack-devtool .sdt-tab-pane::-webkit-scrollbar {
    width: 6px;
  }

  .stack-devtool .sdt-tab-pane::-webkit-scrollbar-track {
    background: transparent;
  }

  .stack-devtool .sdt-tab-pane::-webkit-scrollbar-thumb {
    background: var(--sdt-border);
    border-radius: 3px;
  }

  /* ===== Overview tab — single column ===== */

  .stack-devtool .sdt-ov {
    display: flex;
    flex-direction: column;
    gap: 10px;
    max-width: 660px;
    margin: 0 auto;
  }

  /* Card base */
  .stack-devtool .sdt-ov-card {
    background: var(--sdt-bg-elevated);
    border: 1px solid var(--sdt-border-subtle);
    border-radius: 12px;
    padding: 16px;
    display: flex;
    flex-direction: column;
    gap: 0;
    transition: box-shadow 0.2s ease, border-color 0.2s ease;
    overflow: hidden;
    min-width: 0;
  }

  .stack-devtool .sdt-ov-card-hero {
    background: linear-gradient(135deg, rgba(99,102,241,0.04) 0%, transparent 50%), var(--sdt-bg-elevated);
  }

  .stack-devtool .sdt-ov-label {
    font-size: 9px;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 1.2px;
    color: var(--sdt-text-tertiary);
    margin-bottom: 10px;
  }

  .stack-devtool .sdt-ov-user-row {
    display: flex;
    align-items: center;
    gap: 14px;
    margin-bottom: 14px;
  }

  .stack-devtool .sdt-ov-avatar {
    width: 52px;
    height: 52px;
    border-radius: 50%;
    background: var(--sdt-bg-hover);
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 20px;
    font-weight: 700;
    color: var(--sdt-text-tertiary);
    flex-shrink: 0;
    border: 2px solid var(--sdt-border-subtle);
    overflow: hidden;
  }

  .stack-devtool .sdt-ov-avatar-active {
    background: var(--sdt-accent-muted);
    color: var(--sdt-accent);
    border-color: rgba(99,102,241,0.3);
  }

  .stack-devtool .sdt-ov-avatar img {
    width: 100%;
    height: 100%;
    object-fit: cover;
    border-radius: 50%;
  }

  .stack-devtool .sdt-ov-user-meta {
    min-width: 0;
    flex: 1;
  }

  .stack-devtool .sdt-ov-user-name {
    font-size: 16px;
    font-weight: 700;
    color: var(--sdt-text);
    line-height: 1.2;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .stack-devtool .sdt-ov-user-email {
    font-size: 12px;
    font-family: var(--sdt-font-mono);
    color: var(--sdt-text-secondary);
    margin-top: 2px;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .stack-devtool .sdt-ov-auth-indicator {
    display: flex;
    align-items: center;
    gap: 5px;
    margin-top: 5px;
    font-size: 11px;
    font-weight: 600;
    color: var(--sdt-success);
  }

  .stack-devtool .sdt-ov-auth-indicator::before {
    content: '';
    width: 6px;
    height: 6px;
    border-radius: 50%;
    background: var(--sdt-success);
    box-shadow: 0 0 6px rgba(34,197,94,0.5);
  }

  /* Actions */
  .stack-devtool .sdt-ov-actions {
    display: flex;
    flex-wrap: wrap;
    gap: 6px;
    margin-top: 4px;
  }

  .stack-devtool .sdt-ov-btn {
    height: 30px;
    padding: 0 12px;
    border-radius: 6px;
    border: none;
    font-size: 12px;
    font-weight: 600;
    font-family: var(--sdt-font);
    cursor: pointer;
    transition: all 0.15s ease;
    white-space: nowrap;
  }
  .stack-devtool .sdt-ov-btn:disabled { opacity: 0.4; cursor: not-allowed; }

  .stack-devtool .sdt-ov-btn-primary {
    background: var(--sdt-accent);
    color: #fff;
  }
  .stack-devtool .sdt-ov-btn-primary:hover { background: var(--sdt-accent-hover); }

  .stack-devtool .sdt-ov-btn-secondary {
    background: var(--sdt-bg-hover);
    color: var(--sdt-text);
  }
  .stack-devtool .sdt-ov-btn-secondary:hover { background: var(--sdt-bg-active); }

  .stack-devtool .sdt-ov-btn-danger {
    background: var(--sdt-error-muted);
    color: var(--sdt-error);
    border: 1px solid rgba(239, 68, 68, 0.15);
  }
  .stack-devtool .sdt-ov-btn-danger:hover { background: rgba(239, 68, 68, 0.2); }

  .stack-devtool .sdt-ov-btn-wide { flex: 1; }

  .stack-devtool .sdt-ov-email-input {
    display: flex;
    flex: 1 1 180px;
    border: 1px solid var(--sdt-border-subtle);
    border-radius: 6px;
    overflow: hidden;
    background: var(--sdt-bg);
    transition: border-color 0.15s ease;
  }
  .stack-devtool .sdt-ov-email-input:focus-within {
    border-color: var(--sdt-accent);
    box-shadow: 0 0 0 2px var(--sdt-accent-muted);
  }
  .stack-devtool .sdt-ov-email-input input {
    flex: 1;
    height: 28px;
    padding: 0 8px;
    background: transparent;
    border: none;
    color: var(--sdt-text);
    font-size: 11px;
    font-family: var(--sdt-font);
    outline: none;
    min-width: 0;
  }
  .stack-devtool .sdt-ov-email-input input::placeholder { color: var(--sdt-text-tertiary); }
  .stack-devtool .sdt-ov-email-input button {
    width: 28px;
    height: 28px;
    display: flex;
    align-items: center;
    justify-content: center;
    border: none;
    border-left: 1px solid var(--sdt-border-subtle);
    background: transparent;
    color: var(--sdt-accent);
    cursor: pointer;
    flex-shrink: 0;
    font-family: var(--sdt-font);
  }
  .stack-devtool .sdt-ov-email-input button:hover { background: var(--sdt-accent-muted); }
  .stack-devtool .sdt-ov-email-input button:disabled { opacity: 0.3; cursor: not-allowed; }

  .stack-devtool .sdt-ov-toast {
    font-size: 11px;
    padding: 5px 10px;
    border-radius: 6px;
    margin-top: 8px;
    line-height: 1.4;
  }
  .stack-devtool .sdt-ov-toast-success { background: var(--sdt-success-muted); color: var(--sdt-success); }
  .stack-devtool .sdt-ov-toast-error { background: var(--sdt-error-muted); color: var(--sdt-error); }

  /* --- Auth methods card --- */
  .stack-devtool .sdt-ov-card-auth {
    padding: 14px 16px;
  }

  .stack-devtool .sdt-ov-auth-grid {
    display: flex;
    flex-wrap: wrap;
    gap: 4px;
  }

  .stack-devtool .sdt-ov-method {
    display: flex;
    align-items: center;
    gap: 5px;
    padding: 4px 8px;
    border-radius: 6px;
    font-size: 11px;
    font-weight: 600;
    border: 1px solid var(--sdt-border-subtle);
    background: var(--sdt-bg);
    transition: all 0.15s ease;
  }

  .stack-devtool .sdt-ov-method-on {
    color: var(--sdt-text);
    background: var(--sdt-success-muted);
    border-color: rgba(34, 197, 94, 0.12);
  }

  .stack-devtool .sdt-ov-method-off {
    color: var(--sdt-text-tertiary);
    opacity: 0.5;
    border-style: dashed;
  }

  .stack-devtool .sdt-ov-method-oauth {
    text-transform: capitalize;
  }

  .stack-devtool .sdt-ov-method-warn {
    color: var(--sdt-warning);
    border-color: rgba(234, 179, 8, 0.2);
  }

  .stack-devtool .sdt-ov-skeleton-pill {
    width: 64px;
    height: 26px;
    border-radius: 6px;
    background: var(--sdt-bg-hover);
    border: 1px solid var(--sdt-border-subtle);
    animation: sdt-ov-shimmer 1.5s ease-in-out infinite;
  }

  @keyframes sdt-ov-shimmer {
    0%, 100% { opacity: 0.4; }
    50% { opacity: 0.7; }
  }

  /* --- Setup checklist card (only shown when something is incomplete) --- */
  .stack-devtool .sdt-ov-card-checks {
    padding: 14px 16px;
    border-color: rgba(234, 179, 8, 0.25);
  }

  .stack-devtool .sdt-ov-checks-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 8px;
    margin-bottom: 8px;
  }

  .stack-devtool .sdt-ov-checks-badge {
    font-size: 10px;
    font-weight: 700;
    padding: 1px 6px;
    border-radius: 4px;
  }

  .stack-devtool .sdt-ov-checks-badge-ok {
    background: var(--sdt-success-muted);
    color: var(--sdt-success);
  }

  .stack-devtool .sdt-ov-checks-badge-warn {
    background: var(--sdt-warning-muted);
    color: var(--sdt-warning);
  }

  .stack-devtool .sdt-ov-checks-bar {
    height: 3px;
    border-radius: 2px;
    background: var(--sdt-border-subtle);
    margin-bottom: 10px;
    overflow: hidden;
  }

  .stack-devtool .sdt-ov-checks-bar-fill {
    height: 100%;
    border-radius: 2px;
    background: var(--sdt-warning);
    transition: width 0.4s ease;
  }

  .stack-devtool .sdt-ov-setup-row {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 6px 0;
    font-size: 12px;
    border-bottom: 1px solid var(--sdt-border-subtle);
  }

  .stack-devtool .sdt-ov-setup-row:last-child { border-bottom: none; }

  .stack-devtool .sdt-ov-setup-dot {
    width: 7px;
    height: 7px;
    border-radius: 50%;
    flex-shrink: 0;
  }

  .stack-devtool .sdt-ov-setup-dot-ok { background: var(--sdt-success); }
  .stack-devtool .sdt-ov-setup-dot-warn { background: var(--sdt-warning); }

  .stack-devtool .sdt-ov-setup-label {
    color: var(--sdt-text);
    font-size: 12px;
  }

  .stack-devtool .sdt-ov-setup-hint {
    margin-left: auto;
    font-size: 11px;
    color: var(--sdt-text-tertiary);
  }

  /* Status badges (shared across tabs) */
  .stack-devtool .sdt-badge {
    display: inline-flex;
    align-items: center;
    gap: 4px;
    padding: 2px 8px;
    border-radius: 10px;
    font-size: 11px;
    font-weight: 500;
  }
  .stack-devtool .sdt-badge-success { background: var(--sdt-success-muted); color: var(--sdt-success); }
  .stack-devtool .sdt-badge-warning { background: var(--sdt-warning-muted); color: var(--sdt-warning); }
  .stack-devtool .sdt-badge-error { background: var(--sdt-error-muted); color: var(--sdt-error); }
  .stack-devtool .sdt-badge-info { background: var(--sdt-info-muted); color: var(--sdt-info); }

  /* ===== Components / Pages tab ===== */

  .stack-devtool .sdt-pg-layout {
    display: flex;
    height: calc(100% + 32px);
    margin: -16px;
  }

  /* --- Sidebar --- */
  .stack-devtool .sdt-pg-sidebar {
    width: 250px;
    flex-shrink: 0;
    border-right: 1px solid var(--sdt-border);
    display: flex;
    flex-direction: column;
    overflow: hidden;
  }

  .stack-devtool .sdt-pg-sidebar-head {
    display: flex;
    align-items: center;
    gap: 6px;
    padding: 12px 14px 8px;
    flex-shrink: 0;
  }

  .stack-devtool .sdt-pg-sidebar-title {
    font-size: 10px;
    font-weight: 700;
    letter-spacing: 1px;
    text-transform: uppercase;
    color: var(--sdt-text-tertiary);
  }

  .stack-devtool .sdt-pg-sidebar-count {
    font-size: 10px;
    font-weight: 700;
    color: var(--sdt-text-tertiary);
    background: var(--sdt-bg-active);
    padding: 0 5px;
    border-radius: 6px;
    line-height: 18px;
  }

  .stack-devtool .sdt-pg-sidebar-warn {
    margin-left: auto;
    font-size: 10px;
    font-weight: 700;
    color: var(--sdt-warning);
    background: var(--sdt-warning-muted);
    padding: 0 6px;
    border-radius: 6px;
    line-height: 18px;
  }

  .stack-devtool .sdt-pg-list {
    flex: 1;
    overflow-y: auto;
    padding: 0 6px 6px;
  }

  /* --- List item --- */
  .stack-devtool .sdt-pg-item {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 7px 10px;
    border-radius: 6px;
    cursor: pointer;
    transition: background 0.12s ease;
    font-size: 13px;
    color: var(--sdt-text);
    position: relative;
  }

  .stack-devtool .sdt-pg-item:hover {
    background: var(--sdt-bg-hover);
  }

  .stack-devtool .sdt-pg-item[data-selected="true"] {
    background: var(--sdt-accent-muted);
  }

  .stack-devtool .sdt-pg-item[data-selected="true"] .sdt-pg-item-label {
    color: var(--sdt-accent-hover);
    font-weight: 600;
  }

  .stack-devtool .sdt-pg-item-dot {
    width: 6px;
    height: 6px;
    border-radius: 50%;
    flex-shrink: 0;
  }
  .stack-devtool .sdt-pg-item-dot-handler { background: var(--sdt-info); }
  .stack-devtool .sdt-pg-item-dot-custom { background: var(--sdt-success); }
  .stack-devtool .sdt-pg-item-dot-warn {
    background: var(--sdt-warning);
    box-shadow: 0 0 6px rgba(234, 179, 8, 0.4);
  }

  .stack-devtool .sdt-pg-item-label {
    flex: 1;
    min-width: 0;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  /* --- Badges --- */
  .stack-devtool .sdt-pg-badge {
    display: inline-flex;
    align-items: center;
    height: 20px;
    padding: 0 7px;
    border-radius: 10px;
    font-size: 10px;
    font-weight: 600;
    letter-spacing: 0.2px;
    flex-shrink: 0;
    line-height: 1;
  }

  .stack-devtool .sdt-pg-badge-outdated { background: var(--sdt-warning-muted); color: var(--sdt-warning); }

  /* --- Empty state --- */
  .stack-devtool .sdt-pg-empty {
    flex: 1;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 8px;
    text-align: center;
  }

  .stack-devtool .sdt-pg-empty-icon {
    color: var(--sdt-text-tertiary);
    opacity: 0.35;
    margin-bottom: 4px;
  }

  .stack-devtool .sdt-pg-empty-text {
    font-size: 14px;
    font-weight: 600;
    color: var(--sdt-text-secondary);
  }

  .stack-devtool .sdt-pg-empty-sub {
    font-size: 12px;
    color: var(--sdt-text-tertiary);
  }

  /* --- Main panel --- */
  .stack-devtool .sdt-pg-main {
    flex: 1;
    overflow-y: auto;
    padding: 16px 18px;
    display: flex;
    flex-direction: column;
  }

  /* --- Detail view --- */
  .stack-devtool .sdt-pg-detail {
    display: flex;
    flex-direction: column;
    gap: 12px;
  }

  /* Header */
  .stack-devtool .sdt-pg-header {
    display: flex;
    flex-direction: column;
    gap: 4px;
  }

  .stack-devtool .sdt-pg-header-top {
    display: flex;
    align-items: center;
    gap: 8px;
    flex-wrap: wrap;
  }

  .stack-devtool .sdt-pg-title {
    font-size: 15px;
    font-weight: 700;
    margin: 0;
    color: var(--sdt-text);
  }

  .stack-devtool .sdt-pg-title-url {
    min-width: 0;
    max-width: 280px;
    color: var(--sdt-text-tertiary);
    font-family: var(--sdt-font-mono);
    font-size: 11px;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    text-decoration: none;
  }

  .stack-devtool .sdt-pg-title-url:hover {
    color: var(--sdt-accent);
  }

  .stack-devtool .sdt-pg-subtitle {
    font-size: 12px;
    color: var(--sdt-text-secondary);
    line-height: 1.4;
  }

  .stack-devtool .sdt-pg-code-inline {
    display: flex;
    align-items: center;
    gap: 8px;
    margin-top: 4px;
  }

  .stack-devtool .sdt-pg-code {
    flex: 1;
    min-width: 0;
    font-family: var(--sdt-font-mono);
    font-size: 12px;
    color: var(--sdt-accent);
    background: var(--sdt-bg-elevated);
    border-radius: 6px;
    padding: 6px 10px;
    border: 1px solid var(--sdt-border-subtle);
  }

  /* --- Copy button --- */
  .stack-devtool .sdt-pg-copy-btn {
    height: 26px;
    padding: 0 10px;
    border-radius: 6px;
    border: 1px solid var(--sdt-border);
    background: var(--sdt-bg-active);
    color: var(--sdt-text-secondary);
    cursor: pointer;
    font-size: 11px;
    font-weight: 600;
    font-family: var(--sdt-font);
    transition: all 0.12s ease;
    flex-shrink: 0;
    white-space: nowrap;
  }

  .stack-devtool .sdt-pg-open-btn {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: 5px;
    height: 32px;
    padding: 0 12px;
    font-size: 12px;
  }

  .stack-devtool .sdt-pg-open-btn svg {
    flex-shrink: 0;
  }

  .stack-devtool .sdt-pg-copy-btn:hover {
    background: var(--sdt-bg-hover);
    color: var(--sdt-text);
    border-color: var(--sdt-accent);
  }

  .stack-devtool .sdt-pg-copy-btn-ok {
    border-color: rgba(34, 197, 94, 0.3);
    color: var(--sdt-success);
    background: var(--sdt-success-muted);
  }

  /* --- Update banner --- */
  .stack-devtool .sdt-pg-update-banner {
    display: flex;
    align-items: flex-start;
    gap: 10px;
    padding: 10px 14px;
    background: rgba(234, 179, 8, 0.08);
    border: 1px solid rgba(234, 179, 8, 0.3);
    border-radius: 10px;
  }

  .stack-devtool .sdt-pg-update-banner-icon {
    width: 22px;
    height: 22px;
    border-radius: 50%;
    background: rgba(234, 179, 8, 0.2);
    color: var(--sdt-warning);
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 12px;
    font-weight: 800;
    flex-shrink: 0;
    margin-top: 1px;
  }

  .stack-devtool .sdt-pg-update-banner-body {
    flex: 1;
    min-width: 0;
  }

  .stack-devtool .sdt-pg-update-banner-title {
    font-size: 13px;
    font-weight: 700;
    color: var(--sdt-warning);
    margin-bottom: 2px;
  }

  .stack-devtool .sdt-pg-update-banner-text {
    font-size: 12px;
    color: var(--sdt-text-secondary);
    line-height: 1.5;
  }

  .stack-devtool .sdt-pg-update-banner-text strong {
    color: var(--sdt-text);
    font-weight: 600;
  }

  /* --- Sections (changelog, prompt) --- */
  .stack-devtool .sdt-pg-section {
    border: 1px solid var(--sdt-border-subtle);
    border-radius: 10px;
    padding: 12px 14px;
    background: var(--sdt-bg-elevated);
  }

  .stack-devtool .sdt-pg-section-warn {
    border-color: rgba(234, 179, 8, 0.25);
    background: rgba(234, 179, 8, 0.03);
  }

  .stack-devtool .sdt-pg-section-label {
    font-size: 12px;
    font-weight: 500;
    color: var(--sdt-text-secondary);
    margin-bottom: 8px;
  }

  .stack-devtool .sdt-pg-section-warn .sdt-pg-section-label {
    color: var(--sdt-warning);
  }

  .stack-devtool .sdt-pg-section-footer {
    display: flex;
    margin-top: 8px;
  }

  /* Changelog list */
  .stack-devtool .sdt-pg-changelog-list {
    list-style: none;
    margin: 0;
    padding: 0;
    display: flex;
    flex-direction: column;
    gap: 4px;
  }

  .stack-devtool .sdt-pg-changelog-item {
    display: flex;
    align-items: flex-start;
    gap: 8px;
    font-size: 12px;
    color: var(--sdt-text);
    line-height: 1.5;
  }

  .stack-devtool .sdt-pg-changelog-bullet {
    flex-shrink: 0;
    font-size: 12px;
    line-height: 1.5;
  }

  /* Pre block */
  .stack-devtool .sdt-pg-pre {
    font-family: var(--sdt-font-mono);
    font-size: 11px;
    line-height: 1.6;
    color: var(--sdt-text);
    background: var(--sdt-bg);
    border-radius: 6px;
    padding: 10px 12px;
    margin: 0;
    white-space: pre-wrap;
    word-break: break-word;
    max-height: 200px;
    overflow-y: auto;
    border: 1px solid var(--sdt-border-subtle);
  }

  .stack-devtool .sdt-preview-loading,
  .stack-devtool .sdt-preview-unavailable {
    font-size: 12px;
    color: var(--sdt-text-secondary);
    line-height: 1.5;
  }

  .stack-devtool .sdt-preview-error {
    font-size: 12px;
    color: var(--sdt-error);
    line-height: 1.5;
  }

  .stack-devtool .sdt-preview-code {
    font-family: var(--sdt-font-mono);
    font-size: 11px;
    color: var(--sdt-text);
  }

  .stack-devtool .sdt-props-table {
    width: 100%;
    border-collapse: collapse;
    font-size: 12px;
  }

  .stack-devtool .sdt-props-table th {
    text-align: left;
    font-weight: 600;
    color: var(--sdt-text-tertiary);
    padding: 6px 8px;
    border-bottom: 1px solid var(--sdt-border);
    font-size: 11px;
    text-transform: uppercase;
    letter-spacing: 0.5px;
  }

  .stack-devtool .sdt-props-table td {
    padding: 6px 8px;
    border-bottom: 1px solid var(--sdt-border-subtle);
    color: var(--sdt-text);
  }

  .stack-devtool .sdt-props-table td:first-child {
    font-family: var(--sdt-font-mono);
    color: var(--sdt-accent-hover);
  }

  .stack-devtool .sdt-props-table td:last-child {
    font-family: var(--sdt-font-mono);
    color: var(--sdt-text-secondary);
  }

  /* Iframe tabs */
  .stack-devtool .sdt-iframe-container {
    position: relative;
    flex: 1;
    min-height: 0;
    width: 100%;
    height: 100%;
    display: flex;
    flex-direction: column;
  }

  .stack-devtool .sdt-iframe-toolbar {
    position: absolute;
    top: 8px;
    right: 8px;
    z-index: 1;
    flex-shrink: 0;
    display: flex;
    justify-content: flex-end;
    align-items: center;
    gap: 8px;
    padding: 0;
  }

  .stack-devtool .sdt-panel-fullscreen .sdt-iframe-toolbar {
    top: 60px;
    right: 12px;
  }

  .stack-devtool .sdt-iframe-open-link {
    display: inline-flex;
    align-items: center;
    min-height: 28px;
    padding: 0 10px;
    background: var(--sdt-overlay-bg);
    border: 1px solid var(--sdt-border);
    border-radius: var(--sdt-radius-sm);
    color: var(--sdt-accent-hover);
    font-family: var(--sdt-font);
    font-size: 12px;
    font-weight: 500;
    line-height: 1;
    text-decoration: none;
  }

  .stack-devtool .sdt-iframe-open-link:hover {
    color: var(--sdt-text);
  }

  .stack-devtool .sdt-iframe-container iframe {
    flex: 1;
    min-height: 0;
    width: 100%;
    height: 100%;
    border: none;
    background: white;
    border-radius: 0;
  }

  .stack-devtool .sdt-iframe-loading {
    flex: 1;
    display: flex;
    align-items: center;
    justify-content: center;
    color: var(--sdt-text-secondary);
    font-size: 13px;
  }

  .stack-devtool .sdt-iframe-error {
    flex: 1;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 8px;
    color: var(--sdt-text-secondary);
    font-size: 13px;
  }

  .stack-devtool .sdt-iframe-error-btn {
    padding: 6px 16px;
    background: var(--sdt-accent);
    color: white;
    border: none;
    border-radius: var(--sdt-radius);
    cursor: pointer;
    font-family: var(--sdt-font);
    font-size: 12px;
    font-weight: 500;
    transition: background 0.15s ease;
  }

  .stack-devtool .sdt-iframe-error-btn:hover {
    background: var(--sdt-accent-hover);
  }

  /* Shared content fade animation */
  .stack-devtool .sdt-tab-content-fade {
    animation: sdt-tab-fade-in 0.15s ease-out;
  }

  /* Console tab */
  .stack-devtool .sdt-console-panel {
    display: flex;
    flex-direction: column;
    height: 100%;
    min-height: 0;
  }

  .stack-devtool .sdt-console-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 12px;
    margin-bottom: 12px;
    flex-shrink: 0;
  }

  .stack-devtool .sdt-console-title {
    color: var(--sdt-text);
    font-size: 13px;
    font-weight: 600;
  }

  .stack-devtool .sdt-console-actions {
    display: flex;
    align-items: center;
    gap: 6px;
    flex-wrap: wrap;
    justify-content: flex-end;
  }

  .stack-devtool .sdt-console-action-btn {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: 5px;
    height: 28px;
    padding: 0 9px;
    background: var(--sdt-bg-elevated);
    border: 1px solid var(--sdt-border);
    border-radius: var(--sdt-radius-sm);
    color: var(--sdt-text-secondary);
    cursor: pointer;
    font-family: var(--sdt-font);
    font-size: 12px;
    font-weight: 500;
    line-height: 1;
    transition: color 0.15s ease, background 0.15s ease, border-color 0.15s ease;
    white-space: nowrap;
  }

  .stack-devtool .sdt-console-action-btn:hover {
    color: var(--sdt-text);
    background: var(--sdt-bg-hover);
    border-color: var(--sdt-border);
  }

  .stack-devtool .sdt-console-action-btn svg {
    flex-shrink: 0;
  }

  .stack-devtool .sdt-console-log-scroll {
    flex: 1;
    min-height: 0;
    overflow: auto;
  }

  .stack-devtool .sdt-console-tabs {
    position: relative;
    display: flex;
    flex: 1;
    gap: 2px;
    background: var(--sdt-bg-subtle);
    border-radius: var(--sdt-radius);
    padding: 2px;
  }

  .stack-devtool .sdt-console-tab-indicator {
    position: absolute;
    top: 2px;
    left: 0;
    background: var(--sdt-bg-active);
    border-radius: var(--sdt-radius-sm);
    transition: transform 0.2s cubic-bezier(0.25, 0.46, 0.45, 0.94),
                width 0.2s cubic-bezier(0.25, 0.46, 0.45, 0.94);
    pointer-events: none;
    z-index: 0;
  }

  .stack-devtool .sdt-console-tab {
    position: relative;
    z-index: 1;
    flex: 1;
    padding: 6px 12px;
    background: transparent;
    border: none;
    border-radius: var(--sdt-radius-sm);
    cursor: pointer;
    font-family: var(--sdt-font);
    font-size: 12px;
    font-weight: 500;
    color: var(--sdt-text-secondary);
    transition: color 0.15s ease;
    text-align: center;
  }

  .stack-devtool .sdt-console-tab:hover {
    color: var(--sdt-text);
  }

  .stack-devtool .sdt-console-tab[data-active="true"] {
    color: var(--sdt-text);
  }

  .stack-devtool .sdt-log-list {
    display: flex;
    flex-direction: column;
    gap: 4px;
  }

  .stack-devtool .sdt-log-load-hint {
    padding: 8px 10px;
    color: var(--sdt-text-tertiary);
    font-family: var(--sdt-font);
    font-size: 12px;
    text-align: center;
  }

  .stack-devtool .sdt-log-item {
    display: flex;
    align-items: flex-start;
    gap: 8px;
    padding: 8px 10px;
    background: var(--sdt-bg-elevated);
    border: 1px solid var(--sdt-border-subtle);
    border-radius: var(--sdt-radius-sm);
    font-size: 12px;
    font-family: var(--sdt-font-mono);
  }

  .stack-devtool .sdt-log-time {
    color: var(--sdt-text-tertiary);
    flex-shrink: 0;
    font-size: 11px;
  }

  .stack-devtool .sdt-log-type {
    padding: 1px 6px;
    border-radius: 4px;
    font-size: 10px;
    font-weight: 600;
    text-transform: uppercase;
    flex-shrink: 0;
  }

  .stack-devtool .sdt-log-message {
    flex: 1;
    color: var(--sdt-text);
    word-break: break-all;
  }

  .stack-devtool .sdt-log-method {
    padding: 1px 6px;
    border-radius: 4px;
    font-size: 10px;
    font-weight: 600;
    flex-shrink: 0;
  }

  .stack-devtool .sdt-log-method-get {
    background: var(--sdt-info-muted);
    color: var(--sdt-info);
  }

  .stack-devtool .sdt-log-method-post {
    background: var(--sdt-success-muted);
    color: var(--sdt-success);
  }

  .stack-devtool .sdt-log-method-put, .stack-devtool .sdt-log-method-patch {
    background: var(--sdt-warning-muted);
    color: var(--sdt-warning);
  }

  .stack-devtool .sdt-log-method-delete {
    background: var(--sdt-error-muted);
    color: var(--sdt-error);
  }

  .stack-devtool .sdt-log-status {
    font-size: 11px;
    flex-shrink: 0;
  }

  .stack-devtool .sdt-log-status-ok {
    color: var(--sdt-success);
  }

  .stack-devtool .sdt-log-status-err {
    color: var(--sdt-error);
  }

  .stack-devtool .sdt-log-url {
    flex: 1;
    color: var(--sdt-text);
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .stack-devtool .sdt-empty-state {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    flex: 1;
    padding: 40px 20px;
    color: var(--sdt-text-tertiary);
    font-size: 13px;
    text-align: center;
    gap: 4px;
  }

  .stack-devtool .sdt-empty-state-icon {
    font-size: 24px;
    margin-bottom: 8px;
    opacity: 0.5;
  }

  /* Config info table */
  .stack-devtool .sdt-config-table {
    width: 100%;
    border-collapse: collapse;
  }

  .stack-devtool .sdt-config-table td {
    padding: 8px 10px;
    border-bottom: 1px solid var(--sdt-border-subtle);
    font-size: 12px;
  }

  .stack-devtool .sdt-config-table td:first-child {
    color: var(--sdt-text-secondary);
    width: 160px;
    font-weight: 500;
  }

  .stack-devtool .sdt-config-table td:last-child {
    color: var(--sdt-text);
    font-family: var(--sdt-font-mono);
    word-break: break-all;
  }

  .stack-devtool .sdt-config-table td .sdt-config-link {
    font-family: inherit;
    color: var(--sdt-accent);
    text-decoration: underline;
    text-underline-offset: 2px;
  }

  .stack-devtool .sdt-config-table td .sdt-config-link:hover {
    color: var(--sdt-text);
  }

  .stack-devtool .sdt-config-muted {
    color: var(--sdt-text-tertiary);
    font-style: italic;
  }

  /* Resize handle */
  .stack-devtool .sdt-resize-handle {
    position: absolute;
    top: 0;
    left: -4px;
    width: 8px;
    height: 100%;
    cursor: ew-resize;
    z-index: 10;
  }

  .stack-devtool .sdt-resize-handle::after {
    content: '';
    position: absolute;
    top: 50%;
    left: 3px;
    width: 2px;
    height: 32px;
    transform: translateY(-50%);
    background: transparent;
    border-radius: 1px;
    transition: background 0.15s ease;
  }

  .stack-devtool .sdt-resize-handle:hover::after,
  .stack-devtool .sdt-resize-handle:active::after {
    background: var(--sdt-accent);
  }

  .stack-devtool .sdt-resize-handle-top {
    position: absolute;
    top: -4px;
    left: 0;
    width: 100%;
    height: 8px;
    cursor: ns-resize;
    z-index: 10;
  }

  .stack-devtool .sdt-resize-handle-top::after {
    content: '';
    position: absolute;
    left: 50%;
    top: 3px;
    height: 2px;
    width: 32px;
    transform: translateX(-50%);
    background: transparent;
    border-radius: 1px;
    transition: background 0.15s ease;
  }

  .stack-devtool .sdt-resize-handle-top:hover::after,
  .stack-devtool .sdt-resize-handle-top:active::after {
    background: var(--sdt-accent);
  }

  .stack-devtool .sdt-resize-handle-corner {
    position: absolute;
    top: -6px;
    left: -6px;
    width: 14px;
    height: 14px;
    cursor: nwse-resize;
    z-index: 11;
  }

  .stack-devtool .sdt-resize-handle-corner::after {
    content: '';
    position: absolute;
    bottom: 4px;
    right: 4px;
    width: 5px;
    height: 5px;
    background: transparent;
    border-radius: 50%;
    transition: background 0.15s ease;
  }

  .stack-devtool .sdt-resize-handle-corner:hover::after,
  .stack-devtool .sdt-resize-handle-corner:active::after {
    background: var(--sdt-accent);
  }

  .stack-devtool .sdt-no-components {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    height: 100%;
    color: var(--sdt-text-tertiary);
    font-size: 13px;
    text-align: center;
    padding: 20px;
  }

  /* Support tab */
  .stack-devtool .sdt-support-tab {
    display: flex;
    flex-direction: column;
    height: calc(100% + 32px);
    margin: -16px;
  }

  .stack-devtool .sdt-support-feedback-pane {
    padding: 20px;
    height: 100%;
    overflow-y: auto;
  }

  /* Form layout */
  .stack-devtool .sdt-support-form {
    display: flex;
    flex-direction: column;
    gap: 14px;
  }

  /* Type cards */
  .stack-devtool .sdt-support-type-cards {
    display: flex;
    gap: 8px;
  }

  .stack-devtool .sdt-support-type-card {
    flex: 1;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 6px;
    padding: 8px 10px;
    background: var(--sdt-bg);
    border: 1px solid var(--sdt-border-subtle);
    border-radius: var(--sdt-radius);
    cursor: pointer;
    font-family: var(--sdt-font);
    font-size: 11px;
    font-weight: 500;
    color: var(--sdt-text-secondary);
    transition: all 0.15s ease;
  }

  .stack-devtool .sdt-support-type-card svg {
    flex-shrink: 0;
    opacity: 0.6;
    transition: opacity 0.15s ease;
  }

  .stack-devtool .sdt-support-type-card:hover {
    background: var(--sdt-bg-hover);
    border-color: var(--sdt-border);
    color: var(--sdt-text);
  }

  .stack-devtool .sdt-support-type-card:hover svg {
    opacity: 1;
  }

  .stack-devtool .sdt-support-type-card-active {
    border-color: var(--sdt-accent);
    background: var(--sdt-accent-muted);
    color: var(--sdt-text);
  }

  .stack-devtool .sdt-support-type-card-active svg {
    opacity: 1;
    color: var(--sdt-accent);
  }

  /* Field group */
  .stack-devtool .sdt-support-field {
    display: flex;
    flex-direction: column;
    gap: 5px;
  }

  .stack-devtool .sdt-support-label {
    font-size: 11px;
    font-weight: 600;
    color: var(--sdt-text-secondary);
    letter-spacing: 0.3px;
    text-transform: uppercase;
    display: flex;
    align-items: center;
    gap: 6px;
  }

  .stack-devtool .sdt-support-optional {
    font-size: 10px;
    font-weight: 400;
    color: var(--sdt-text-tertiary);
    text-transform: none;
    letter-spacing: 0;
  }

  /* Inputs */
  .stack-devtool .sdt-support-input,
  .stack-devtool .sdt-support-textarea {
    width: 100%;
    padding: 9px 12px;
    background: var(--sdt-bg);
    border: 1px solid var(--sdt-border-subtle);
    border-radius: var(--sdt-radius-sm);
    color: var(--sdt-text);
    font-family: var(--sdt-font);
    font-size: 13px;
    outline: none;
    transition: border-color 0.15s ease, box-shadow 0.15s ease;
  }

  .stack-devtool .sdt-support-input::placeholder,
  .stack-devtool .sdt-support-textarea::placeholder {
    color: var(--sdt-text-tertiary);
  }

  .stack-devtool .sdt-support-input:focus,
  .stack-devtool .sdt-support-textarea:focus {
    border-color: var(--sdt-accent);
    box-shadow: 0 0 0 3px var(--sdt-accent-muted);
  }

  .stack-devtool .sdt-support-textarea {
    resize: vertical;
    min-height: 100px;
    line-height: 1.6;
  }

  /* Submit button */
  .stack-devtool .sdt-support-submit {
    width: 100%;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: 6px;
    padding: 9px 20px;
    background: var(--sdt-accent);
    color: white;
    border: none;
    border-radius: var(--sdt-radius);
    cursor: pointer;
    font-family: var(--sdt-font);
    font-size: 12px;
    font-weight: 600;
    letter-spacing: 0.2px;
    transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
    box-shadow: 0 1px 3px rgba(99, 102, 241, 0.3);
  }

  .stack-devtool .sdt-support-submit:hover:not(:disabled) {
    background: var(--sdt-accent-hover);
    box-shadow: 0 2px 8px rgba(99, 102, 241, 0.4);
    transform: translateY(-1px);
  }

  .stack-devtool .sdt-support-submit:active:not(:disabled) {
    transform: translateY(0);
    box-shadow: 0 1px 2px rgba(99, 102, 241, 0.2);
  }

  .stack-devtool .sdt-support-submit:disabled {
    opacity: 0.4;
    cursor: not-allowed;
    box-shadow: none;
  }

  .stack-devtool .sdt-support-submit svg {
    flex-shrink: 0;
  }

  @keyframes sdt-spin {
    to { transform: rotate(360deg); }
  }

  .stack-devtool .sdt-support-spinner {
    animation: sdt-spin 1s linear infinite;
  }

  /* Status screens (success / error) */
  .stack-devtool .sdt-support-status {
    display: flex;
    flex-direction: column;
    align-items: center;
    padding: 32px 20px;
    border-radius: var(--sdt-radius-lg);
    text-align: center;
    gap: 6px;
  }

  .stack-devtool .sdt-support-status-success {
    background: linear-gradient(180deg, var(--sdt-success-muted), transparent 80%);
    border: 1px solid rgba(34, 197, 94, 0.15);
  }

  .stack-devtool .sdt-support-status-error {
    background: linear-gradient(180deg, var(--sdt-error-muted), transparent 80%);
    border: 1px solid rgba(239, 68, 68, 0.15);
  }

  .stack-devtool .sdt-support-status-icon {
    width: 40px;
    height: 40px;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    margin-bottom: 6px;
  }

  .stack-devtool .sdt-support-status-success .sdt-support-status-icon {
    background: rgba(34, 197, 94, 0.15);
    color: var(--sdt-success);
    box-shadow: 0 0 20px rgba(34, 197, 94, 0.1);
  }

  .stack-devtool .sdt-support-status-error .sdt-support-status-icon {
    background: rgba(239, 68, 68, 0.15);
    color: var(--sdt-error);
    box-shadow: 0 0 20px rgba(239, 68, 68, 0.1);
  }

  .stack-devtool .sdt-support-status-title {
    font-size: 14px;
    font-weight: 600;
    color: var(--sdt-text);
  }

  .stack-devtool .sdt-support-status-msg {
    font-size: 12px;
    color: var(--sdt-text-secondary);
    line-height: 1.5;
    max-width: 260px;
  }

  /* Support channels */
  .stack-devtool .sdt-support-channels {
    display: flex;
    gap: 8px;
  }

  .stack-devtool .sdt-support-channel {
    flex: 1;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 6px;
    padding: 8px 10px;
    background: var(--sdt-bg);
    border: 1px solid var(--sdt-border-subtle);
    border-radius: var(--sdt-radius);
    color: var(--sdt-text-secondary);
    text-decoration: none;
    font-size: 11px;
    font-weight: 500;
    transition: all 0.15s ease;
  }

  .stack-devtool .sdt-support-channel:hover {
    background: var(--sdt-bg-hover);
    border-color: var(--sdt-border);
    color: var(--sdt-text);
  }

  .stack-devtool .sdt-support-channel svg {
    flex-shrink: 0;
    opacity: 0.6;
    transition: opacity 0.15s ease;
  }

  .stack-devtool .sdt-support-channel:hover svg {
    opacity: 1;
  }

  /* --- Light theme: system preference fallback --- */
  @media (prefers-color-scheme: light) {
    .stack-devtool {
      --sdt-bg: #ffffff;
      --sdt-bg-elevated: #f8f8fa;
      --sdt-bg-hover: #f0f0f3;
      --sdt-bg-active: #e8e8ec;
      --sdt-bg-subtle: #fafafa;
      --sdt-border: #e0e0e5;
      --sdt-border-subtle: #eaeaef;
      --sdt-text: #111113;
      --sdt-text-secondary: #6b6b73;
      --sdt-text-tertiary: #9b9ba3;
      --sdt-accent: #6366f1;
      --sdt-accent-hover: #4f46e5;
      --sdt-accent-muted: rgba(99, 102, 241, 0.1);
      --sdt-success: #16a34a;
      --sdt-success-muted: rgba(22, 163, 74, 0.1);
      --sdt-warning: #ca8a04;
      --sdt-warning-muted: rgba(202, 138, 4, 0.1);
      --sdt-error: #dc2626;
      --sdt-error-muted: rgba(220, 38, 38, 0.1);
      --sdt-info: #2563eb;
      --sdt-info-muted: rgba(37, 99, 235, 0.1);
      --sdt-overlay-bg: rgba(255, 255, 255, 0.92);
      --sdt-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.12), 0 0 0 1px rgba(0, 0, 0, 0.06);
      --sdt-trigger-shadow: 0 4px 12px rgba(0, 0, 0, 0.08), 0 0 0 1px rgba(0, 0, 0, 0.06);
    }
  }

  /* Export dialog — positioned inside the dev tool panel */
  .stack-devtool .sdt-share-overlay {
    position: absolute;
    inset: 0;
    z-index: 20;
    background: rgba(0, 0, 0, 0.4);
    display: flex;
    align-items: center;
    justify-content: center;
    animation: sdt-tab-fade-in 0.15s ease-out;
    border-radius: var(--sdt-radius-lg);
  }

  .stack-devtool .sdt-share-dialog {
    width: 380px;
    max-width: calc(100% - 32px);
    background: var(--sdt-bg);
    border: 1px solid var(--sdt-border);
    border-radius: var(--sdt-radius-lg);
    box-shadow: var(--sdt-shadow);
    padding: 20px;
    display: flex;
    flex-direction: column;
    gap: 16px;
  }

  .stack-devtool .sdt-share-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
  }

  .stack-devtool .sdt-share-title {
    font-size: 14px;
    font-weight: 600;
    color: var(--sdt-text);
  }

  .stack-devtool .sdt-share-status {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 10px;
    padding: 20px;
    color: var(--sdt-text-secondary);
    font-size: 13px;
  }

  .stack-devtool .sdt-share-url-row {
    display: flex;
    gap: 6px;
    align-items: center;
  }

  .stack-devtool .sdt-share-url-row .sdt-support-input {
    flex: 1;
    font-family: var(--sdt-font-mono);
    font-size: 12px;
  }

  .stack-devtool .sdt-share-copy-btn {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 36px;
    height: 36px;
    flex-shrink: 0;
    background: var(--sdt-bg-elevated);
    border: 1px solid var(--sdt-border-subtle);
    border-radius: var(--sdt-radius-sm);
    color: var(--sdt-text-secondary);
    cursor: pointer;
    transition: all 0.15s ease;
  }

  .stack-devtool .sdt-share-copy-btn:hover {
    background: var(--sdt-bg-hover);
    color: var(--sdt-text);
  }

  .stack-devtool .sdt-share-actions {
    display: flex;
    gap: 8px;
  }

  .stack-devtool .sdt-share-action-btn {
    flex: 1;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 6px;
    padding: 10px 12px;
    background: var(--sdt-bg-elevated);
    border: 1px solid var(--sdt-border-subtle);
    border-radius: var(--sdt-radius);
    color: var(--sdt-text-secondary);
    text-decoration: none;
    font-family: var(--sdt-font);
    font-size: 12px;
    font-weight: 500;
    cursor: pointer;
    transition: all 0.15s ease;
  }

  .stack-devtool .sdt-share-action-btn:hover {
    background: var(--sdt-bg-hover);
    border-color: var(--sdt-border);
    color: var(--sdt-text);
  }

  .stack-devtool .sdt-share-action-btn svg {
    flex-shrink: 0;
    opacity: 0.7;
  }

  .stack-devtool .sdt-share-action-btn:hover svg {
    opacity: 1;
  }

  .stack-devtool .sdt-share-action-btn-accent {
    background: var(--sdt-accent);
    border-color: var(--sdt-accent);
    color: white;
  }

  .stack-devtool .sdt-share-action-btn-accent:hover {
    background: var(--sdt-accent-hover);
    border-color: var(--sdt-accent-hover);
    color: white;
  }

  .stack-devtool .sdt-share-action-btn-accent svg {
    opacity: 1;
  }

  /* --- AI Chat tab --- */

  .stack-devtool .sdt-ai-container {
    display: flex;
    flex-direction: column;
    height: 100%;
    overflow: hidden;
  }

  .stack-devtool .sdt-ai-messages {
    flex: 1;
    overflow-y: auto;
    overflow-x: hidden;
    padding: 16px;
    scroll-behavior: smooth;
  }

  .stack-devtool .sdt-ai-message-list {
    display: flex;
    flex-direction: column;
    gap: 16px;
  }

  /* --- Empty state --- */

  .stack-devtool .sdt-ai-empty {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    height: 100%;
    gap: 12px;
    padding: 24px;
    text-align: center;
  }

  .stack-devtool .sdt-ai-empty-icon {
    width: 48px;
    height: 48px;
    border-radius: 50%;
    background: var(--sdt-accent-muted);
    display: flex;
    align-items: center;
    justify-content: center;
    color: var(--sdt-accent);
    margin-bottom: 4px;
  }

  .stack-devtool .sdt-ai-empty-title {
    font-size: 16px;
    font-weight: 600;
    color: var(--sdt-text);
  }

  .stack-devtool .sdt-ai-empty-desc {
    font-size: 12px;
    color: var(--sdt-text-secondary);
    max-width: 320px;
    line-height: 1.5;
  }

  .stack-devtool .sdt-ai-suggestions {
    display: flex;
    flex-direction: column;
    gap: 6px;
    margin-top: 8px;
    width: 100%;
    max-width: 340px;
  }

  .stack-devtool .sdt-ai-suggestion {
    display: flex;
    align-items: center;
    gap: 10px;
    padding: 10px 14px;
    border-radius: var(--sdt-radius);
    background: var(--sdt-bg-elevated);
    border: 1px solid var(--sdt-border-subtle);
    color: var(--sdt-text-secondary);
    font-size: 12px;
    cursor: pointer;
    text-align: left;
    transition: all 0.15s ease;
    font-family: var(--sdt-font);
    line-height: 1.4;
  }

  .stack-devtool .sdt-ai-suggestion:hover {
    background: var(--sdt-bg-hover);
    border-color: var(--sdt-border);
    color: var(--sdt-text);
  }

  .stack-devtool .sdt-ai-suggestion-icon {
    font-size: 14px;
    flex-shrink: 0;
  }

  /* --- Messages --- */

  .stack-devtool .sdt-ai-msg {
    display: flex;
    gap: 10px;
    align-items: flex-start;
  }

  .stack-devtool .sdt-ai-msg-user {
    justify-content: flex-end;
  }

  .stack-devtool .sdt-ai-msg-assistant {
    justify-content: flex-start;
  }

  .stack-devtool .sdt-ai-avatar {
    width: 26px;
    height: 26px;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
    margin-top: 2px;
  }

  .stack-devtool .sdt-ai-avatar-user {
    background: var(--sdt-info-muted);
    color: var(--sdt-info);
    order: 2;
  }

  .stack-devtool .sdt-ai-avatar-assistant {
    background: var(--sdt-accent-muted);
    color: var(--sdt-accent);
  }

  .stack-devtool .sdt-ai-bubble {
    min-width: 0;
    max-width: 85%;
    border-radius: var(--sdt-radius-lg);
    padding: 10px 14px;
  }

  .stack-devtool .sdt-ai-bubble-user {
    background: var(--sdt-info-muted);
    border: 1px solid rgba(59, 130, 246, 0.1);
  }

  .stack-devtool .sdt-ai-bubble-user p {
    font-size: 13px;
    line-height: 1.55;
    color: var(--sdt-text);
    margin: 0;
    word-break: break-word;
  }

  .stack-devtool .sdt-ai-bubble-assistant {
    background: var(--sdt-bg-elevated);
    border: 1px solid var(--sdt-border-subtle);
  }

  /* --- Thinking dots --- */

  .stack-devtool .sdt-ai-thinking {
    display: flex;
    align-items: center;
    gap: 4px;
    padding: 4px 0;
  }

  .stack-devtool .sdt-ai-thinking-dot {
    width: 5px;
    height: 5px;
    border-radius: 50%;
    background: var(--sdt-accent);
    opacity: 0.5;
    animation: sdt-ai-pulse 1.2s ease-in-out infinite;
  }

  .stack-devtool .sdt-ai-thinking-dot:nth-child(2) { animation-delay: 0.15s; }
  .stack-devtool .sdt-ai-thinking-dot:nth-child(3) { animation-delay: 0.3s; }

  @keyframes sdt-ai-pulse {
    0%, 80%, 100% { opacity: 0.3; transform: scale(0.85); }
    40% { opacity: 1; transform: scale(1.1); }
  }

  .stack-devtool .sdt-ai-streaming-indicator {
    display: flex;
    align-items: center;
    gap: 3px;
    margin-top: 6px;
  }

  /* --- Markdown content inside assistant bubble --- */

  .stack-devtool .sdt-ai-paragraph {
    font-size: 13px;
    line-height: 1.6;
    color: var(--sdt-text);
    margin: 0 0 10px;
    word-break: break-word;
  }

  .stack-devtool .sdt-ai-paragraph:last-child { margin-bottom: 0; }

  .stack-devtool .sdt-ai-bold {
    font-weight: 600;
    color: var(--sdt-text);
  }

  .stack-devtool .sdt-ai-inline-code {
    display: inline;
    padding: 1.5px 5px;
    border-radius: 4px;
    font-family: var(--sdt-font-mono);
    font-size: 11.5px;
    background: var(--sdt-bg-hover);
    color: var(--sdt-text);
    border: 1px solid var(--sdt-border-subtle);
  }

  .stack-devtool .sdt-ai-link {
    color: var(--sdt-info);
    text-decoration: none;
    transition: color 0.1s;
  }

  .stack-devtool .sdt-ai-link:hover {
    color: var(--sdt-accent-hover);
    text-decoration: underline;
    text-underline-offset: 2px;
  }

  .stack-devtool .sdt-ai-heading {
    font-weight: 600;
    color: var(--sdt-text);
    margin: 12px 0 6px;
    line-height: 1.35;
  }

  .stack-devtool .sdt-ai-heading:first-child { margin-top: 0; }

  .stack-devtool .sdt-ai-bubble-assistant h1.sdt-ai-heading { font-size: 15px; }
  .stack-devtool .sdt-ai-bubble-assistant h2.sdt-ai-heading { font-size: 13.5px; }
  .stack-devtool .sdt-ai-bubble-assistant h3.sdt-ai-heading { font-size: 13px; }

  .stack-devtool .sdt-ai-list {
    font-size: 13px;
    line-height: 1.6;
    color: var(--sdt-text);
    margin: 0 0 10px;
    padding-left: 20px;
  }

  .stack-devtool .sdt-ai-list:last-child { margin-bottom: 0; }

  .stack-devtool .sdt-ai-list li {
    margin-bottom: 3px;
    padding-left: 2px;
  }

  .stack-devtool .sdt-ai-list li::marker {
    color: var(--sdt-text-tertiary);
  }

  .stack-devtool .sdt-ai-list-ordered {
    list-style-type: decimal;
  }

  .stack-devtool .sdt-ai-tools {
    display: flex;
    flex-direction: column;
    gap: 6px;
    margin: 6px 0;
  }

  .stack-devtool .sdt-ai-part-text {
    margin: 6px 0;
  }

  .stack-devtool .sdt-ai-tool-card {
    border: 1px solid var(--sdt-border-subtle);
    border-radius: var(--sdt-radius);
    background: var(--sdt-bg-subtle);
    overflow: hidden;
  }

  .stack-devtool .sdt-ai-tool-header {
    width: 100%;
    border: none;
    background: transparent;
    color: inherit;
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 8px 10px;
    cursor: pointer;
    text-align: left;
    font-family: var(--sdt-font);
  }

  .stack-devtool .sdt-ai-tool-header:hover {
    background: var(--sdt-bg-hover);
  }

  .stack-devtool .sdt-ai-tool-name {
    font-size: 12px;
    font-weight: 600;
    color: var(--sdt-text);
    flex: 1;
  }

  .stack-devtool .sdt-ai-tool-status {
    font-size: 10px;
    text-transform: uppercase;
    letter-spacing: 0.4px;
    font-weight: 600;
  }

  .stack-devtool .sdt-ai-tool-status-running { color: var(--sdt-warning); }
  .stack-devtool .sdt-ai-tool-status-success { color: var(--sdt-success); }
  .stack-devtool .sdt-ai-tool-status-error { color: var(--sdt-error); }

  .stack-devtool .sdt-ai-tool-chevron {
    color: var(--sdt-text-tertiary);
    font-size: 10px;
    transition: transform 0.15s ease;
  }

  .stack-devtool .sdt-ai-tool-chevron-open {
    transform: rotate(180deg);
  }

  .stack-devtool .sdt-ai-tool-body {
    border-top: 1px solid var(--sdt-border-subtle);
    padding: 8px 10px;
    display: flex;
    flex-direction: column;
    gap: 6px;
  }

  .stack-devtool .sdt-ai-tool-label {
    font-size: 10px;
    text-transform: uppercase;
    letter-spacing: 0.4px;
    color: var(--sdt-text-tertiary);
    font-weight: 600;
  }

  .stack-devtool .sdt-ai-tool-pre {
    margin: 0;
    padding: 8px;
    border: 1px solid var(--sdt-border-subtle);
    border-radius: var(--sdt-radius-sm);
    background: var(--sdt-bg);
    font-family: var(--sdt-font-mono);
    font-size: 11px;
    line-height: 1.5;
    color: var(--sdt-text-secondary);
    overflow-x: auto;
    white-space: pre-wrap;
    word-break: break-word;
  }

  .stack-devtool .sdt-ai-tool-running {
    font-size: 11px;
    color: var(--sdt-text-secondary);
  }

  .stack-devtool .sdt-ai-blockquote {
    border-left: 3px solid var(--sdt-accent);
    padding-left: 12px;
    margin: 8px 0;
    font-size: 13px;
    color: var(--sdt-text-secondary);
    font-style: italic;
  }

  .stack-devtool .sdt-ai-hr {
    border: none;
    border-top: 1px solid var(--sdt-border-subtle);
    margin: 12px 0;
  }

  /* --- Code blocks --- */

  .stack-devtool .sdt-ai-code-block {
    border-radius: var(--sdt-radius);
    overflow: hidden;
    margin: 8px 0;
    border: 1px solid var(--sdt-border-subtle);
    background: var(--sdt-bg-subtle);
  }

  .stack-devtool .sdt-ai-code-block:last-child { margin-bottom: 0; }

  .stack-devtool .sdt-ai-code-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 5px 10px;
    border-bottom: 1px solid var(--sdt-border-subtle);
    background: var(--sdt-bg);
  }

  .stack-devtool .sdt-ai-code-lang {
    font-size: 9px;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.5px;
    color: var(--sdt-text-tertiary);
    font-family: var(--sdt-font);
  }

  .stack-devtool .sdt-ai-copy-btn {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 22px;
    height: 22px;
    border-radius: var(--sdt-radius-sm);
    border: none;
    background: transparent;
    color: var(--sdt-text-tertiary);
    cursor: pointer;
    font-size: 12px;
    font-family: var(--sdt-font);
    transition: all 0.15s ease;
  }

  .stack-devtool .sdt-ai-copy-btn:hover {
    background: var(--sdt-bg-hover);
    color: var(--sdt-text);
  }

  .stack-devtool .sdt-ai-copy-btn-copied {
    color: var(--sdt-success) !important;
  }

  .stack-devtool .sdt-ai-code-pre {
    margin: 0;
    padding: 10px 12px;
    overflow-x: auto;
    font-family: var(--sdt-font-mono);
    font-size: 11.5px;
    line-height: 1.6;
    color: var(--sdt-text);
  }

  .stack-devtool .sdt-ai-code-pre code {
    font-family: inherit;
    background: none;
    border: none;
    padding: 0;
  }

  /* --- Error --- */

  .stack-devtool .sdt-ai-error {
    display: flex;
    align-items: flex-start;
    gap: 8px;
    padding: 10px 14px;
    margin: 8px 16px;
    border-radius: var(--sdt-radius);
    background: var(--sdt-error-muted);
    border: 1px solid rgba(239, 68, 68, 0.2);
    font-size: 12px;
    color: var(--sdt-error);
    line-height: 1.4;
  }

  /* --- Input area --- */

  .stack-devtool .sdt-ai-input-area {
    flex-shrink: 0;
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 10px 14px;
    border-top: 1px solid var(--sdt-border-subtle);
    background: var(--sdt-bg);
  }

  .stack-devtool .sdt-ai-new-chat {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 32px;
    height: 32px;
    border-radius: var(--sdt-radius);
    border: 1px solid var(--sdt-border-subtle);
    background: var(--sdt-bg-elevated);
    color: var(--sdt-text-secondary);
    cursor: pointer;
    flex-shrink: 0;
    transition: all 0.15s ease;
    font-family: var(--sdt-font);
  }

  .stack-devtool .sdt-ai-new-chat:hover {
    background: var(--sdt-bg-hover);
    border-color: var(--sdt-border);
    color: var(--sdt-text);
  }

  .stack-devtool .sdt-ai-input-wrapper {
    flex: 1;
    display: flex;
    align-items: center;
    gap: 6px;
    border-radius: var(--sdt-radius);
    background: var(--sdt-bg-elevated);
    border: 1px solid var(--sdt-border-subtle);
    padding: 0 4px 0 12px;
    transition: border-color 0.15s ease;
  }

  .stack-devtool .sdt-ai-input-wrapper:focus-within {
    border-color: var(--sdt-accent);
    box-shadow: 0 0 0 2px var(--sdt-accent-muted);
  }

  .stack-devtool .sdt-ai-input {
    flex: 1;
    background: transparent;
    border: none;
    outline: none;
    color: var(--sdt-text);
    font-size: 13px;
    font-family: var(--sdt-font);
    padding: 8px 0;
    min-width: 0;
  }

  .stack-devtool .sdt-ai-input::placeholder {
    color: var(--sdt-text-tertiary);
  }

  .stack-devtool .sdt-ai-input:disabled {
    opacity: 0.5;
  }

  .stack-devtool .sdt-ai-send-btn {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 30px;
    height: 30px;
    border-radius: 6px;
    border: none;
    background: transparent;
    color: var(--sdt-text-tertiary);
    cursor: not-allowed;
    flex-shrink: 0;
    transition: all 0.15s ease;
    font-family: var(--sdt-font);
  }

  .stack-devtool .sdt-ai-send-btn-active {
    background: var(--sdt-accent);
    color: white;
    cursor: pointer;
  }

  .stack-devtool .sdt-ai-send-btn-active:hover {
    background: var(--sdt-accent-hover);
  }

  .stack-devtool .sdt-ai-stop-btn,
  .stack-devtool .sdt-ai-stop-btn:hover {
    background: var(--sdt-error);
    color: white;
  }

  /* Accessible focus indicator for keyboard navigation */
  .stack-devtool .sdt-tab:focus-visible {
    outline: 2px solid var(--sdt-accent);
    outline-offset: -2px;
    border-radius: var(--sdt-radius);
  }

  /* Reduced motion: disable animations for users who prefer it */
  @media (prefers-reduced-motion: reduce) {
    .stack-devtool .sdt-panel-inner,
    .stack-devtool .sdt-panel-exiting,
    .stack-devtool .sdt-tab-content,
    .stack-devtool .sdt-ov-pulse-dot,
    .stack-devtool .sdt-ov-skeleton-pill,
    .stack-devtool .sdt-support-spinner,
    .stack-devtool .sdt-ai-thinking-dot {
      animation: none !important;
    }

    .stack-devtool .sdt-tab-indicator,
    .stack-devtool .sdt-tab {
      transition: none !important;
    }
  }

  /* --- Stack theme explicit overrides (take priority over system preference) --- */
  html:has(head > [data-stack-theme="light"]) .stack-devtool {
    --sdt-bg: #ffffff;
    --sdt-bg-elevated: #f8f8fa;
    --sdt-bg-hover: #f0f0f3;
    --sdt-bg-active: #e8e8ec;
    --sdt-bg-subtle: #fafafa;
    --sdt-border: #e0e0e5;
    --sdt-border-subtle: #eaeaef;
    --sdt-text: #111113;
    --sdt-text-secondary: #6b6b73;
    --sdt-text-tertiary: #9b9ba3;
    --sdt-accent: #6366f1;
    --sdt-accent-hover: #4f46e5;
    --sdt-accent-muted: rgba(99, 102, 241, 0.1);
    --sdt-success: #16a34a;
    --sdt-success-muted: rgba(22, 163, 74, 0.1);
    --sdt-warning: #ca8a04;
    --sdt-warning-muted: rgba(202, 138, 4, 0.1);
    --sdt-error: #dc2626;
    --sdt-error-muted: rgba(220, 38, 38, 0.1);
    --sdt-info: #2563eb;
    --sdt-info-muted: rgba(37, 99, 235, 0.1);
    --sdt-overlay-bg: rgba(255, 255, 255, 0.92);
    --sdt-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.12), 0 0 0 1px rgba(0, 0, 0, 0.06);
    --sdt-trigger-shadow: 0 4px 12px rgba(0, 0, 0, 0.08), 0 0 0 1px rgba(0, 0, 0, 0.06);
  }

  html:has(head > [data-stack-theme="dark"]) .stack-devtool {
    --sdt-bg: #0a0a0b;
    --sdt-bg-elevated: #141416;
    --sdt-bg-hover: #1c1c1f;
    --sdt-bg-active: #232326;
    --sdt-bg-subtle: #111113;
    --sdt-border: #2a2a2e;
    --sdt-border-subtle: #1e1e22;
    --sdt-text: #ececef;
    --sdt-text-secondary: #8b8b93;
    --sdt-text-tertiary: #5c5c66;
    --sdt-accent: #6366f1;
    --sdt-accent-hover: #818cf8;
    --sdt-accent-muted: rgba(99, 102, 241, 0.15);
    --sdt-success: #22c55e;
    --sdt-success-muted: rgba(34, 197, 94, 0.15);
    --sdt-warning: #eab308;
    --sdt-warning-muted: rgba(234, 179, 8, 0.15);
    --sdt-error: #ef4444;
    --sdt-error-muted: rgba(239, 68, 68, 0.15);
    --sdt-info: #3b82f6;
    --sdt-info-muted: rgba(59, 130, 246, 0.15);
    --sdt-overlay-bg: rgba(17, 17, 19, 0.92);
    --sdt-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.5), 0 0 0 1px rgba(255, 255, 255, 0.05);
    --sdt-trigger-shadow: 0 4px 12px rgba(0, 0, 0, 0.4), 0 0 0 1px rgba(255, 255, 255, 0.08);
  }
`;
;
}),
"[project]/node_modules/.pnpm/@stackframe+stack@2.8.108_@types+react-dom@18.3.7_@types+react@18.3.31__@types+react@18.3.31__tqjf7xvnucvjx6rf5f5n65ykji/node_modules/@stackframe/stack/dist/esm/dev-tool/dev-tool-trigger-position.js [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "TRIGGER_EDGE_MARGIN",
    ()=>TRIGGER_EDGE_MARGIN,
    "clampTriggerPosition",
    ()=>clampTriggerPosition,
    "getSnappedTriggerPlacement",
    ()=>getSnappedTriggerPlacement,
    "resolveTriggerPosition",
    ()=>resolveTriggerPosition
]);
//#region src/dev-tool/dev-tool-trigger-position.ts
const TRIGGER_EDGE_MARGIN = 16;
function getSnapBounds(triggerSize, viewport) {
    const maxLeft = Math.max(0, viewport.width - triggerSize.width);
    const maxTop = Math.max(0, viewport.height - triggerSize.height);
    const minLeft = Math.min(TRIGGER_EDGE_MARGIN, maxLeft);
    const minTop = Math.min(TRIGGER_EDGE_MARGIN, maxTop);
    return {
        minLeft,
        maxLeft: Math.max(minLeft, maxLeft - TRIGGER_EDGE_MARGIN),
        minTop,
        maxTop: Math.max(minTop, maxTop - TRIGGER_EDGE_MARGIN)
    };
}
/**
* Clamps a position so the trigger stays fully within the viewport.
* Used during drag to prevent the pill from leaving the screen.
*/ function clampTriggerPosition(position, triggerSize, viewport) {
    const maxLeft = Math.max(0, viewport.width - triggerSize.width);
    const maxTop = Math.max(0, viewport.height - triggerSize.height);
    return {
        left: Math.max(0, Math.min(position.left, maxLeft)),
        top: Math.max(0, Math.min(position.top, maxTop))
    };
}
/**
* Returns the exact pixel position for a corner placement.
* The trigger is always `TRIGGER_EDGE_MARGIN` px from both adjacent edges.
*/ function resolveTriggerPosition(placement, triggerSize, viewport) {
    const bounds = getSnapBounds(triggerSize, viewport);
    return clampTriggerPosition((()=>{
        switch(placement.corner){
            case "top-left":
                return {
                    left: bounds.minLeft,
                    top: bounds.minTop
                };
            case "top-right":
                return {
                    left: bounds.maxLeft,
                    top: bounds.minTop
                };
            case "bottom-left":
                return {
                    left: bounds.minLeft,
                    top: bounds.maxTop
                };
            case "bottom-right":
                return {
                    left: bounds.maxLeft,
                    top: bounds.maxTop
                };
        }
    })(), triggerSize, viewport);
}
/**
* Snaps a free position to the nearest corner by checking which viewport
* quadrant the trigger center falls in.
*/ function getSnappedTriggerPlacement(position, triggerSize, viewport) {
    const cx = position.left + triggerSize.width / 2;
    return {
        corner: position.top + triggerSize.height / 2 < viewport.height / 2 ? cx < viewport.width / 2 ? "top-left" : "top-right" : cx < viewport.width / 2 ? "bottom-left" : "bottom-right"
    };
}
;
}),
"[project]/node_modules/.pnpm/@stackframe+stack@2.8.108_@types+react-dom@18.3.7_@types+react@18.3.31__@types+react@18.3.31__tqjf7xvnucvjx6rf5f5n65ykji/node_modules/@stackframe/stack/dist/esm/dev-tool/dev-tool-core.js [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "createDevTool",
    ()=>createDevTool
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f40$stackframe$2b$stack$2d$shared$40$2$2e$8$2e$108_$40$types$2b$react$2d$dom$40$18$2e$3$2e$7_$40$types$2b$react$40$18$2e$3$2e$31_$5f40$types$2b$react$40$1_c6byygfw5qeklygubnzywcb44y$2f$node_modules$2f40$stackframe$2f$stack$2d$shared$2f$dist$2f$esm$2f$utils$2f$promises$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/.pnpm/@stackframe+stack-shared@2.8.108_@types+react-dom@18.3.7_@types+react@18.3.31__@types+react@1_c6byygfw5qeklygubnzywcb44y/node_modules/@stackframe/stack-shared/dist/esm/utils/promises.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f40$stackframe$2b$stack$40$2$2e$8$2e$108_$40$types$2b$react$2d$dom$40$18$2e$3$2e$7_$40$types$2b$react$40$18$2e$3$2e$31_$5f40$types$2b$react$40$18$2e$3$2e$31_$5f$tqjf7xvnucvjx6rf5f5n65ykji$2f$node_modules$2f40$stackframe$2f$stack$2f$dist$2f$esm$2f$lib$2f$stack$2d$app$2f$common$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/.pnpm/@stackframe+stack@2.8.108_@types+react-dom@18.3.7_@types+react@18.3.31__@types+react@18.3.31__tqjf7xvnucvjx6rf5f5n65ykji/node_modules/@stackframe/stack/dist/esm/lib/stack-app/common.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f40$stackframe$2b$stack$2d$shared$40$2$2e$8$2e$108_$40$types$2b$react$2d$dom$40$18$2e$3$2e$7_$40$types$2b$react$40$18$2e$3$2e$31_$5f40$types$2b$react$40$1_c6byygfw5qeklygubnzywcb44y$2f$node_modules$2f40$stackframe$2f$stack$2d$shared$2f$dist$2f$esm$2f$utils$2f$urls$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/.pnpm/@stackframe+stack-shared@2.8.108_@types+react-dom@18.3.7_@types+react@18.3.31__@types+react@1_c6byygfw5qeklygubnzywcb44y/node_modules/@stackframe/stack-shared/dist/esm/utils/urls.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f40$stackframe$2b$stack$40$2$2e$8$2e$108_$40$types$2b$react$2d$dom$40$18$2e$3$2e$7_$40$types$2b$react$40$18$2e$3$2e$31_$5f40$types$2b$react$40$18$2e$3$2e$31_$5f$tqjf7xvnucvjx6rf5f5n65ykji$2f$node_modules$2f40$stackframe$2f$stack$2f$dist$2f$esm$2f$lib$2f$stack$2d$app$2f$url$2d$targets$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/.pnpm/@stackframe+stack@2.8.108_@types+react-dom@18.3.7_@types+react@18.3.31__@types+react@18.3.31__tqjf7xvnucvjx6rf5f5n65ykji/node_modules/@stackframe/stack/dist/esm/lib/stack-app/url-targets.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f40$stackframe$2b$stack$40$2$2e$8$2e$108_$40$types$2b$react$2d$dom$40$18$2e$3$2e$7_$40$types$2b$react$40$18$2e$3$2e$31_$5f40$types$2b$react$40$18$2e$3$2e$31_$5f$tqjf7xvnucvjx6rf5f5n65ykji$2f$node_modules$2f40$stackframe$2f$stack$2f$dist$2f$esm$2f$lib$2f$env$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/.pnpm/@stackframe+stack@2.8.108_@types+react-dom@18.3.7_@types+react@18.3.31__@types+react@18.3.31__tqjf7xvnucvjx6rf5f5n65ykji/node_modules/@stackframe/stack/dist/esm/lib/env.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f40$stackframe$2b$stack$40$2$2e$8$2e$108_$40$types$2b$react$2d$dom$40$18$2e$3$2e$7_$40$types$2b$react$40$18$2e$3$2e$31_$5f40$types$2b$react$40$18$2e$3$2e$31_$5f$tqjf7xvnucvjx6rf5f5n65ykji$2f$node_modules$2f40$stackframe$2f$stack$2f$dist$2f$esm$2f$lib$2f$stack$2d$app$2f$apps$2f$implementations$2f$common$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/.pnpm/@stackframe+stack@2.8.108_@types+react-dom@18.3.7_@types+react@18.3.31__@types+react@18.3.31__tqjf7xvnucvjx6rf5f5n65ykji/node_modules/@stackframe/stack/dist/esm/lib/stack-app/apps/implementations/common.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f40$stackframe$2b$stack$40$2$2e$8$2e$108_$40$types$2b$react$2d$dom$40$18$2e$3$2e$7_$40$types$2b$react$40$18$2e$3$2e$31_$5f40$types$2b$react$40$18$2e$3$2e$31_$5f$tqjf7xvnucvjx6rf5f5n65ykji$2f$node_modules$2f40$stackframe$2f$stack$2f$dist$2f$esm$2f$dev$2d$tool$2f$dev$2d$tool$2d$styles$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/.pnpm/@stackframe+stack@2.8.108_@types+react-dom@18.3.7_@types+react@18.3.31__@types+react@18.3.31__tqjf7xvnucvjx6rf5f5n65ykji/node_modules/@stackframe/stack/dist/esm/dev-tool/dev-tool-styles.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f40$stackframe$2b$stack$40$2$2e$8$2e$108_$40$types$2b$react$2d$dom$40$18$2e$3$2e$7_$40$types$2b$react$40$18$2e$3$2e$31_$5f40$types$2b$react$40$18$2e$3$2e$31_$5f$tqjf7xvnucvjx6rf5f5n65ykji$2f$node_modules$2f40$stackframe$2f$stack$2f$dist$2f$esm$2f$dev$2d$tool$2f$dev$2d$tool$2d$trigger$2d$position$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/.pnpm/@stackframe+stack@2.8.108_@types+react-dom@18.3.7_@types+react@18.3.31__@types+react@18.3.31__tqjf7xvnucvjx6rf5f5n65ykji/node_modules/@stackframe/stack/dist/esm/dev-tool/dev-tool-trigger-position.js [app-client] (ecmascript)");
;
;
;
;
;
;
;
;
//#region src/dev-tool/dev-tool-core.ts
const STORAGE_KEY = "__hexclave-dev-tool-state";
const TRIGGER_POS_KEY = "hexclave-devtool-trigger-position";
const ROOT_ID = "__hexclave-dev-tool-root";
const GLOBAL_INSTANCE_KEY = "__hexclave-dev-tool-instance";
const MAX_LOG_ENTRIES = 500;
const CONSOLE_LOG_BATCH_SIZE = 100;
const DRAG_THRESHOLD = 5;
const DOCS_URL = "https://docs.stack-auth.com";
const TABS = [
    {
        id: "overview",
        label: "Overview",
        icon: "<svg width=\"14\" height=\"14\" viewBox=\"0 0 24 24\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"2\" stroke-linecap=\"round\" stroke-linejoin=\"round\"><rect x=\"3\" y=\"3\" width=\"7\" height=\"7\"/><rect x=\"14\" y=\"3\" width=\"7\" height=\"7\"/><rect x=\"14\" y=\"14\" width=\"7\" height=\"7\"/><rect x=\"3\" y=\"14\" width=\"7\" height=\"7\"/></svg>"
    },
    {
        id: "customize",
        label: "Customize",
        icon: "<svg width=\"14\" height=\"14\" viewBox=\"0 0 24 24\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"2\" stroke-linecap=\"round\" stroke-linejoin=\"round\"><path d=\"M12 20h9\"/><path d=\"M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z\"/></svg>"
    },
    {
        id: "ai",
        label: "AI",
        icon: "<svg width=\"14\" height=\"14\" viewBox=\"0 0 24 24\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"2\" stroke-linecap=\"round\" stroke-linejoin=\"round\"><polygon points=\"12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2\"/></svg>"
    },
    {
        id: "console",
        label: "Console",
        icon: "<svg width=\"14\" height=\"14\" viewBox=\"0 0 24 24\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"2\" stroke-linecap=\"round\" stroke-linejoin=\"round\"><polyline points=\"4 17 10 11 4 5\"/><line x1=\"12\" y1=\"19\" x2=\"20\" y2=\"19\"/></svg>"
    },
    {
        id: "dashboard",
        label: "Dashboard",
        icon: "<svg width=\"14\" height=\"14\" viewBox=\"0 0 24 24\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"2\" stroke-linecap=\"round\" stroke-linejoin=\"round\"><rect x=\"3\" y=\"3\" width=\"18\" height=\"18\" rx=\"2\"/><path d=\"M3 9h18\"/><path d=\"M9 21V9\"/></svg>"
    },
    {
        id: "support",
        label: "Support",
        icon: "<svg width=\"14\" height=\"14\" viewBox=\"0 0 24 24\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"2\" stroke-linecap=\"round\" stroke-linejoin=\"round\"><path d=\"M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z\"/></svg>"
    }
];
const DEFAULT_STATE = {
    isOpen: false,
    activeTab: "overview",
    panelWidth: 800,
    panelHeight: 520
};
const STACK_LOGO_SVG = "<svg width=\"14\" height=\"17\" viewBox=\"0 0 131 156\" fill=\"currentColor\"><path d=\"M124.447 28.6459L70.1382 1.75616C67.3472 0.374284 64.0715 0.372197 61.279 1.75051L0.740967 31.6281V87.6369L65.7101 119.91L117.56 93.675V112.414L65.7101 138.44L0.740967 106.584V119.655C0.740967 122.359 2.28151 124.827 4.71097 126.015L62.282 154.161C65.0966 155.538 68.3938 155.515 71.1888 154.099L130.47 124.074V79.7105C130.47 74.8003 125.34 71.5769 120.915 73.7077L79.4531 93.675V75.9771L130.47 50.1589V38.3485C130.47 34.2325 128.137 30.4724 124.447 28.6459Z\"/></svg>";
function loadState() {
    try {
        const stored = localStorage.getItem(STORAGE_KEY);
        if (stored) {
            const parsed = JSON.parse(stored);
            if (parsed.activeTab === "components") parsed.activeTab = "customize";
            if (parsed.activeTab === "docs") parsed.activeTab = "overview";
            return {
                ...DEFAULT_STATE,
                ...parsed,
                isOpen: false
            };
        }
    } catch  {}
    return {
        ...DEFAULT_STATE
    };
}
function saveState(state) {
    try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify({
            ...state,
            isOpen: false
        }));
    } catch  {}
}
function createStateStore() {
    let state = loadState();
    const listeners = /* @__PURE__ */ new Set();
    return {
        get: ()=>state,
        update (partial) {
            state = {
                ...state,
                ...partial
            };
            saveState(state);
            listeners.forEach((fn)=>fn());
        },
        subscribe (fn) {
            listeners.add(fn);
            return ()=>{
                listeners.delete(fn);
            };
        }
    };
}
function isDevToolGlobalInstance(value) {
    return typeof value === "object" && value !== null && typeof Reflect.get(value, "cleanup") === "function";
}
function getGlobalDevToolInstance() {
    if (typeof window === "undefined") return null;
    const value = Reflect.get(window, GLOBAL_INSTANCE_KEY);
    return isDevToolGlobalInstance(value) ? value : null;
}
function setGlobalDevToolInstance(instance) {
    if (typeof window === "undefined") return;
    if (instance === null) Reflect.deleteProperty(window, GLOBAL_INSTANCE_KEY);
    else Reflect.set(window, GLOBAL_INSTANCE_KEY, instance);
}
function getGlobalLogStore() {
    const g = globalThis;
    if (!g.__STACK_DEV_TOOL_LOG_STORE__) g.__STACK_DEV_TOOL_LOG_STORE__ = {
        apiLogs: [],
        eventLogs: [],
        listeners: /* @__PURE__ */ new Set(),
        addApiLog (entry) {
            this.apiLogs = [
                entry,
                ...this.apiLogs
            ].slice(0, MAX_LOG_ENTRIES);
            this.listeners.forEach((fn)=>fn());
        },
        addEventLog (entry) {
            this.eventLogs = [
                entry,
                ...this.eventLogs
            ].slice(0, MAX_LOG_ENTRIES);
            this.listeners.forEach((fn)=>fn());
        },
        clear () {
            this.apiLogs = [];
            this.eventLogs = [];
            this.listeners.forEach((fn)=>fn());
        },
        subscribe (fn) {
            this.listeners.add(fn);
            return ()=>{
                this.listeners.delete(fn);
            };
        }
    };
    return g.__STACK_DEV_TOOL_LOG_STORE__;
}
let _idCounter = 0;
function nextId() {
    return `sdt-${++_idCounter}-${Date.now()}`;
}
function resolveApiBaseUrl(app) {
    return (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f40$stackframe$2b$stack$40$2$2e$8$2e$108_$40$types$2b$react$2d$dom$40$18$2e$3$2e$7_$40$types$2b$react$40$18$2e$3$2e$31_$5f40$types$2b$react$40$18$2e$3$2e$31_$5f$tqjf7xvnucvjx6rf5f5n65ykji$2f$node_modules$2f40$stackframe$2f$stack$2f$dist$2f$esm$2f$lib$2f$stack$2d$app$2f$apps$2f$implementations$2f$common$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["getBaseUrl"])(app[__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f40$stackframe$2b$stack$40$2$2e$8$2e$108_$40$types$2b$react$2d$dom$40$18$2e$3$2e$7_$40$types$2b$react$40$18$2e$3$2e$31_$5f40$types$2b$react$40$18$2e$3$2e$31_$5f$tqjf7xvnucvjx6rf5f5n65ykji$2f$node_modules$2f40$stackframe$2f$stack$2f$dist$2f$esm$2f$lib$2f$stack$2d$app$2f$common$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["stackAppInternalsSymbol"]].getConstructorOptions().baseUrl);
}
function shouldShowDashboardTab(app) {
    return __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f40$stackframe$2b$stack$40$2$2e$8$2e$108_$40$types$2b$react$2d$dom$40$18$2e$3$2e$7_$40$types$2b$react$40$18$2e$3$2e$31_$5f40$types$2b$react$40$18$2e$3$2e$31_$5f$tqjf7xvnucvjx6rf5f5n65ykji$2f$node_modules$2f40$stackframe$2f$stack$2f$dist$2f$esm$2f$lib$2f$env$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["envVars"].NEXT_PUBLIC_STACK_IS_LOCAL_EMULATOR === "true" && (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f40$stackframe$2b$stack$2d$shared$40$2$2e$8$2e$108_$40$types$2b$react$2d$dom$40$18$2e$3$2e$7_$40$types$2b$react$40$18$2e$3$2e$31_$5f40$types$2b$react$40$1_c6byygfw5qeklygubnzywcb44y$2f$node_modules$2f40$stackframe$2f$stack$2d$shared$2f$dist$2f$esm$2f$utils$2f$urls$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["isLocalhost"])(resolveApiBaseUrl(app));
}
function getTabsForApp(app) {
    if (shouldShowDashboardTab(app)) return TABS;
    return TABS.filter((tab)=>tab.id !== "dashboard");
}
function deriveDashboardBaseUrl(apiBaseUrl) {
    try {
        const url = new URL(apiBaseUrl);
        if (url.hostname === "localhost" || url.hostname === "127.0.0.1" || url.hostname === "[::1]") {
            const port = url.port;
            if (port && port.endsWith("02")) url.port = port.slice(0, -2) + "01";
            return url.origin;
        }
        if (url.hostname.startsWith("api.")) {
            url.hostname = "app." + url.hostname.slice(4);
            return url.origin;
        }
        return url.origin;
    } catch  {
        return "https://app.stack-auth.com";
    }
}
function resolveDashboardUrl(app) {
    return `${deriveDashboardBaseUrl(resolveApiBaseUrl(app))}/projects/${encodeURIComponent(app.projectId)}`;
}
function formatTimestamp(ts) {
    return new Date(ts).toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
        fractionalSecondDigits: 3
    });
}
function escapeHtml(str) {
    return str.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}
function generateRandomEmail() {
    const chars = "abcdefghijklmnopqrstuvwxyz0123456789";
    let id = "";
    for(let i = 0; i < 8; i++)id += chars[Math.floor(Math.random() * 36)];
    return `dev-${id}@test.stack-auth.com`;
}
function h(tag, attrs, ...children) {
    const el = document.createElement(tag);
    if (attrs) for (const [k, v] of Object.entries(attrs)){
        if (v == null) continue;
        if (k === "className") el.className = v;
        else if (k === "style" && typeof v === "object") Object.assign(el.style, v);
        else if (k.startsWith("on") && typeof v === "function") el.addEventListener(k.slice(2).toLowerCase(), v);
        else el.setAttribute(k, String(v));
    }
    for (const child of children){
        if (child == null) continue;
        el.appendChild(typeof child === "string" ? document.createTextNode(child) : child);
    }
    return el;
}
function setHtml(el, html) {
    el.innerHTML = html;
}
function hasAppendChild(value) {
    return typeof value === "object" && value !== null && typeof Reflect.get(value, "appendChild") === "function";
}
function appendInlineMarkdown(container, text) {
    const tokenPattern = /(\[[^\]]+\]\([^)]+\)|`[^`\n]+`|\*\*[^*\n]+\*\*|__[^_\n]+__|\*[^*\n]+\*|_[^_\n]+_)/g;
    let lastIndex = 0;
    let match;
    while((match = tokenPattern.exec(text)) !== null){
        if (match.index > lastIndex) container.appendChild(document.createTextNode(text.slice(lastIndex, match.index)));
        const token = match[0];
        if (token.startsWith("`")) container.appendChild(h("code", {
            className: "sdt-ai-inline-code"
        }, token.slice(1, -1)));
        else if (token.startsWith("**") || token.startsWith("__")) {
            const bold = h("strong", {
                className: "sdt-ai-bold"
            });
            appendInlineMarkdown(bold, token.slice(2, -2));
            container.appendChild(bold);
        } else if (token.startsWith("*") || token.startsWith("_")) {
            const italic = h("em");
            appendInlineMarkdown(italic, token.slice(1, -1));
            container.appendChild(italic);
        } else {
            const linkMatch = token.match(/^\[([^\]]+)\]\(([^)]+)\)$/);
            if (linkMatch) {
                const [, linkText, href] = linkMatch;
                const trimmedHref = href.trim();
                if (/^(https?:\/\/|mailto:)/i.test(trimmedHref)) {
                    const link = h("a", {
                        className: "sdt-ai-link",
                        href: trimmedHref,
                        target: "_blank",
                        rel: "noopener noreferrer"
                    });
                    appendInlineMarkdown(link, linkText);
                    container.appendChild(link);
                } else container.appendChild(document.createTextNode(token));
            } else container.appendChild(document.createTextNode(token));
        }
        lastIndex = tokenPattern.lastIndex;
    }
    if (lastIndex < text.length) container.appendChild(document.createTextNode(text.slice(lastIndex)));
}
function createTrigger(onClick) {
    let triggerSize = {
        width: 36,
        height: 36
    };
    function isPosition(value) {
        if (typeof value !== "object" || value === null) return false;
        return typeof Reflect.get(value, "left") === "number" && typeof Reflect.get(value, "top") === "number";
    }
    function isPlacement(value) {
        if (typeof value !== "object" || value === null) return false;
        const corner = Reflect.get(value, "corner");
        return [
            "top-left",
            "top-right",
            "bottom-left",
            "bottom-right"
        ].includes(String(corner));
    }
    function loadPlacement() {
        try {
            const raw = localStorage.getItem(TRIGGER_POS_KEY);
            if (!raw) return null;
            const parsed = JSON.parse(raw);
            if (isPlacement(parsed)) return parsed;
            if (typeof parsed === "object" && parsed !== null && "side" in parsed && "offset" in parsed) {
                const side = String(Reflect.get(parsed, "side"));
                const offset = Number(Reflect.get(parsed, "offset"));
                const vw = window.innerWidth;
                const vh = window.innerHeight;
                let corner;
                if (side === "right") corner = offset < vh / 2 ? "top-right" : "bottom-right";
                else if (side === "left") corner = offset < vh / 2 ? "top-left" : "bottom-left";
                else if (side === "top") corner = offset < vw / 2 ? "top-left" : "top-right";
                else corner = offset < vw / 2 ? "bottom-left" : "bottom-right";
                return {
                    corner
                };
            }
            if (isPosition(parsed)) return (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f40$stackframe$2b$stack$40$2$2e$8$2e$108_$40$types$2b$react$2d$dom$40$18$2e$3$2e$7_$40$types$2b$react$40$18$2e$3$2e$31_$5f40$types$2b$react$40$18$2e$3$2e$31_$5f$tqjf7xvnucvjx6rf5f5n65ykji$2f$node_modules$2f40$stackframe$2f$stack$2f$dist$2f$esm$2f$dev$2d$tool$2f$dev$2d$tool$2d$trigger$2d$position$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["getSnappedTriggerPlacement"])(parsed, triggerSize, {
                width: window.innerWidth,
                height: window.innerHeight
            });
        } catch  {}
        return null;
    }
    function savePlacement(placement) {
        try {
            localStorage.setItem(TRIGGER_POS_KEY, JSON.stringify(placement));
        } catch  {}
    }
    let animationTimeout = null;
    function setPositionAnimation(isAnimated) {
        if (animationTimeout !== null) {
            window.clearTimeout(animationTimeout);
            animationTimeout = null;
        }
        btn.classList.toggle("sdt-trigger-position-animated", isAnimated);
        if (isAnimated) animationTimeout = window.setTimeout(()=>{
            animationTimeout = null;
            btn.classList.remove("sdt-trigger-position-animated");
        }, 180);
    }
    function applyPos(nextPos, options) {
        setPositionAnimation(options?.animate === true);
        pos = nextPos;
        btn.style.left = pos.left + "px";
        btn.style.top = pos.top + "px";
    }
    const btn = h("button", {
        className: "sdt-trigger",
        "aria-label": "Toggle Stack Auth Dev Tools",
        "data-hexclave-devtool-trigger": "true",
        title: "Stack Auth Dev Tools"
    });
    const logoSpan = h("span", {
        className: "sdt-trigger-logo"
    });
    setHtml(logoSpan, STACK_LOGO_SVG);
    btn.appendChild(logoSpan);
    let placement = loadPlacement() ?? {
        corner: "bottom-right"
    };
    let pos = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f40$stackframe$2b$stack$40$2$2e$8$2e$108_$40$types$2b$react$2d$dom$40$18$2e$3$2e$7_$40$types$2b$react$40$18$2e$3$2e$31_$5f40$types$2b$react$40$18$2e$3$2e$31_$5f$tqjf7xvnucvjx6rf5f5n65ykji$2f$node_modules$2f40$stackframe$2f$stack$2f$dist$2f$esm$2f$dev$2d$tool$2f$dev$2d$tool$2d$trigger$2d$position$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["resolveTriggerPosition"])(placement, triggerSize, {
        width: window.innerWidth,
        height: window.innerHeight
    });
    applyPos(pos);
    let dragState = null;
    requestAnimationFrame(()=>{
        const rect = btn.getBoundingClientRect();
        if (rect.width > 0 && rect.height > 0) {
            triggerSize = {
                width: rect.width,
                height: rect.height
            };
            const measured = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f40$stackframe$2b$stack$40$2$2e$8$2e$108_$40$types$2b$react$2d$dom$40$18$2e$3$2e$7_$40$types$2b$react$40$18$2e$3$2e$31_$5f40$types$2b$react$40$18$2e$3$2e$31_$5f$tqjf7xvnucvjx6rf5f5n65ykji$2f$node_modules$2f40$stackframe$2f$stack$2f$dist$2f$esm$2f$dev$2d$tool$2f$dev$2d$tool$2d$trigger$2d$position$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["resolveTriggerPosition"])(placement, triggerSize, {
                width: window.innerWidth,
                height: window.innerHeight
            });
            if (measured.left !== pos.left || measured.top !== pos.top) applyPos(measured, {
                animate: true
            });
        }
    });
    btn.addEventListener("pointerdown", (e)=>{
        e.preventDefault();
        setPositionAnimation(false);
        btn.setPointerCapture(e.pointerId);
        dragState = {
            startX: e.clientX,
            startY: e.clientY,
            startLeft: pos.left,
            startTop: pos.top,
            didDrag: false
        };
    });
    btn.addEventListener("pointermove", (e)=>{
        if (!dragState) return;
        const dx = e.clientX - dragState.startX;
        const dy = e.clientY - dragState.startY;
        if (!dragState.didDrag && Math.abs(dx) + Math.abs(dy) < DRAG_THRESHOLD) return;
        dragState.didDrag = true;
        applyPos((0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f40$stackframe$2b$stack$40$2$2e$8$2e$108_$40$types$2b$react$2d$dom$40$18$2e$3$2e$7_$40$types$2b$react$40$18$2e$3$2e$31_$5f40$types$2b$react$40$18$2e$3$2e$31_$5f$tqjf7xvnucvjx6rf5f5n65ykji$2f$node_modules$2f40$stackframe$2f$stack$2f$dist$2f$esm$2f$dev$2d$tool$2f$dev$2d$tool$2d$trigger$2d$position$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["clampTriggerPosition"])({
            left: dragState.startLeft + dx,
            top: dragState.startTop + dy
        }, triggerSize, {
            width: window.innerWidth,
            height: window.innerHeight
        }));
    });
    btn.addEventListener("pointerup", (e)=>{
        const ds = dragState;
        dragState = null;
        if (!ds) return;
        btn.releasePointerCapture(e.pointerId);
        if (ds.didDrag) {
            placement = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f40$stackframe$2b$stack$40$2$2e$8$2e$108_$40$types$2b$react$2d$dom$40$18$2e$3$2e$7_$40$types$2b$react$40$18$2e$3$2e$31_$5f40$types$2b$react$40$18$2e$3$2e$31_$5f$tqjf7xvnucvjx6rf5f5n65ykji$2f$node_modules$2f40$stackframe$2f$stack$2f$dist$2f$esm$2f$dev$2d$tool$2f$dev$2d$tool$2d$trigger$2d$position$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["getSnappedTriggerPlacement"])(pos, triggerSize, {
                width: window.innerWidth,
                height: window.innerHeight
            });
            applyPos((0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f40$stackframe$2b$stack$40$2$2e$8$2e$108_$40$types$2b$react$2d$dom$40$18$2e$3$2e$7_$40$types$2b$react$40$18$2e$3$2e$31_$5f40$types$2b$react$40$18$2e$3$2e$31_$5f$tqjf7xvnucvjx6rf5f5n65ykji$2f$node_modules$2f40$stackframe$2f$stack$2f$dist$2f$esm$2f$dev$2d$tool$2f$dev$2d$tool$2d$trigger$2d$position$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["resolveTriggerPosition"])(placement, triggerSize, {
                width: window.innerWidth,
                height: window.innerHeight
            }), {
                animate: true
            });
            savePlacement(placement);
        } else onClick();
    });
    function onResize() {
        const resizedPos = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f40$stackframe$2b$stack$40$2$2e$8$2e$108_$40$types$2b$react$2d$dom$40$18$2e$3$2e$7_$40$types$2b$react$40$18$2e$3$2e$31_$5f40$types$2b$react$40$18$2e$3$2e$31_$5f$tqjf7xvnucvjx6rf5f5n65ykji$2f$node_modules$2f40$stackframe$2f$stack$2f$dist$2f$esm$2f$dev$2d$tool$2f$dev$2d$tool$2d$trigger$2d$position$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["resolveTriggerPosition"])(placement, triggerSize, {
            width: window.innerWidth,
            height: window.innerHeight
        });
        if (resizedPos.left !== pos.left || resizedPos.top !== pos.top) applyPos(resizedPos, {
            animate: true
        });
    }
    window.addEventListener("resize", onResize);
    return {
        element: btn,
        cleanup: ()=>{
            if (animationTimeout !== null) window.clearTimeout(animationTimeout);
            window.removeEventListener("resize", onResize);
        }
    };
}
function createTabBar(tabs, activeTab, onTabChange, opts) {
    const variant = opts?.variant ?? "bar";
    const barClass = variant === "pills" ? "sdt-console-tabs" : "sdt-tabbar";
    const tabClass = variant === "pills" ? "sdt-console-tab" : "sdt-tab";
    const indicatorClass = variant === "pills" ? "sdt-console-tab-indicator" : "sdt-tab-indicator";
    const bar = h("div", {
        className: barClass
    });
    const indicator = h("div", {
        className: indicatorClass
    });
    indicator.style.opacity = "0";
    bar.appendChild(indicator);
    let current = activeTab;
    let isInitial = true;
    const buttons = tabs.map((tab)=>{
        const btn = h("button", {
            className: tabClass,
            "data-tab-id": tab.id,
            "data-active": String(tab.id === activeTab)
        });
        if (tab.icon) {
            const iconSpan = h("span", {
                className: "sdt-tab-icon"
            });
            setHtml(iconSpan, tab.icon);
            btn.appendChild(iconSpan);
        }
        btn.appendChild(document.createTextNode(tab.label));
        btn.addEventListener("click", ()=>onTabChange(tab.id));
        bar.appendChild(btn);
        return btn;
    });
    if (variant === "bar") bar.appendChild(h("div", {
        className: "sdt-tabbar-spacer"
    }));
    if (opts?.trailing) bar.appendChild(opts.trailing);
    function measure() {
        const btn = bar.querySelector(`[data-tab-id="${current}"]`);
        if (!btn) return;
        indicator.style.transform = `translateX(${btn.offsetLeft}px)`;
        indicator.style.width = btn.offsetWidth + "px";
        indicator.style.height = btn.offsetHeight + "px";
        indicator.style.opacity = "1";
        indicator.style.transition = isInitial ? "none" : "";
        isInitial = false;
    }
    new ResizeObserver(measure).observe(bar);
    requestAnimationFrame(measure);
    function setActive(id) {
        current = id;
        buttons.forEach((btn)=>{
            const tabId = btn.getAttribute("data-tab-id");
            btn.setAttribute("data-active", String(tabId === id));
        });
        measure();
    }
    return {
        el: bar,
        setActive
    };
}
function createIframeTab(src, title, loadingMsg = "Loading…", errorMsg = "Unable to load content", errorDetail, openExternallyLabel) {
    const container = h("div", {
        className: "sdt-iframe-container"
    });
    if (openExternallyLabel != null) container.appendChild(h("div", {
        className: "sdt-iframe-toolbar"
    }, h("a", {
        href: src,
        target: "_blank",
        rel: "noopener noreferrer",
        className: "sdt-iframe-open-link"
    }, openExternallyLabel)));
    const loadingEl = h("div", {
        className: "sdt-iframe-loading"
    }, loadingMsg);
    container.appendChild(loadingEl);
    const iframe = document.createElement("iframe");
    iframe.src = src;
    iframe.title = title;
    iframe.setAttribute("sandbox", "allow-scripts allow-same-origin allow-popups allow-forms");
    iframe.style.display = "none";
    iframe.addEventListener("load", ()=>{
        loadingEl.style.display = "none";
        iframe.style.display = "block";
    });
    iframe.addEventListener("error", ()=>{
        loadingEl.style.display = "none";
        container.innerHTML = "";
        const errDiv = h("div", {
            className: "sdt-iframe-error"
        });
        errDiv.appendChild(h("div", null, errorMsg));
        if (errorDetail) errDiv.appendChild(h("div", {
            style: {
                fontSize: "12px",
                color: "var(--sdt-text-tertiary)"
            }
        }, errorDetail));
        const retryBtn = h("button", {
            className: "sdt-iframe-error-btn"
        }, "Retry");
        retryBtn.addEventListener("click", ()=>{
            container.replaceWith(createIframeTab(src, title, loadingMsg, errorMsg, errorDetail, openExternallyLabel));
        });
        errDiv.appendChild(retryBtn);
        const link = h("a", {
            href: src,
            target: "_blank",
            rel: "noopener noreferrer",
            style: {
                color: "var(--sdt-accent)",
                fontSize: "12px",
                textDecoration: "none"
            }
        }, "Open in new tab");
        errDiv.appendChild(link);
        container.appendChild(errDiv);
    });
    container.appendChild(iframe);
    return container;
}
function createOverviewTab(app) {
    const container = h("div", {
        className: "sdt-ov"
    });
    const heroCard = h("div", {
        className: "sdt-ov-card sdt-ov-card-hero"
    });
    heroCard.appendChild(h("div", {
        className: "sdt-ov-label"
    }, "Identity"));
    const userRow = h("div", {
        className: "sdt-ov-user-row"
    });
    const avatar = h("div", {
        className: "sdt-ov-avatar"
    }, "?");
    const userMeta = h("div", {
        className: "sdt-ov-user-meta"
    });
    const userName = h("div", {
        className: "sdt-ov-user-name"
    }, "Loading…");
    const userEmail = h("div", {
        className: "sdt-ov-user-email"
    }, "");
    const authIndicator = h("div", {
        className: "sdt-ov-auth-indicator",
        style: {
            display: "none"
        }
    }, "Authenticated");
    userMeta.append(userName, userEmail, authIndicator);
    userRow.append(avatar, userMeta);
    heroCard.appendChild(userRow);
    const actions = h("div", {
        className: "sdt-ov-actions"
    });
    const toast = h("div", {
        className: "sdt-ov-toast",
        style: {
            display: "none"
        }
    });
    const emailRow = h("div", {
        className: "sdt-ov-email-input"
    });
    const emailInput = h("input", {
        type: "email",
        placeholder: "Sign in as email…"
    });
    const emailBtn = h("button", null);
    setHtml(emailBtn, "<svg width=\"12\" height=\"12\" viewBox=\"0 0 24 24\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"2.5\" stroke-linecap=\"round\" stroke-linejoin=\"round\"><line x1=\"5\" y1=\"12\" x2=\"19\" y2=\"12\"/><polyline points=\"12 5 19 12 12 19\"/></svg>");
    emailRow.append(emailInput, emailBtn);
    function isBestEffortOverviewError(error) {
        if (error instanceof DOMException && error.name === "AbortError") return true;
        if (error instanceof TypeError) return true;
        if (error instanceof Error) return error.message.includes("Failed to fetch") || error.message.includes("NetworkError") || error.message.includes("Load failed") || error.message.includes("network connection");
        return false;
    }
    function showToast(msg, type) {
        toast.textContent = msg;
        toast.className = `sdt-ov-toast sdt-ov-toast-${type}`;
        toast.style.display = "";
        setTimeout(()=>{
            toast.style.display = "none";
        }, 4e3);
    }
    let currentUser = null;
    let loading = false;
    function rebuildActions() {
        actions.innerHTML = "";
        if (currentUser) {
            const signOutBtn = h("button", {
                className: "sdt-ov-btn sdt-ov-btn-danger"
            }, "Sign Out");
            signOutBtn.disabled = loading;
            signOutBtn.addEventListener("click", ()=>{
                (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f40$stackframe$2b$stack$2d$shared$40$2$2e$8$2e$108_$40$types$2b$react$2d$dom$40$18$2e$3$2e$7_$40$types$2b$react$40$18$2e$3$2e$31_$5f40$types$2b$react$40$1_c6byygfw5qeklygubnzywcb44y$2f$node_modules$2f40$stackframe$2f$stack$2d$shared$2f$dist$2f$esm$2f$utils$2f$promises$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["runAsynchronously"])(async ()=>{
                    loading = true;
                    rebuildActions();
                    try {
                        await currentUser.signOut();
                        showToast("Signed out", "success");
                    } catch (e) {
                        showToast(e.message || "Sign out failed", "error");
                    }
                    loading = false;
                    await refreshUser();
                });
            });
            const randomBtn = h("button", {
                className: "sdt-ov-btn sdt-ov-btn-primary"
            }, "Random User");
            randomBtn.disabled = loading;
            randomBtn.addEventListener("click", ()=>{
                (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f40$stackframe$2b$stack$2d$shared$40$2$2e$8$2e$108_$40$types$2b$react$2d$dom$40$18$2e$3$2e$7_$40$types$2b$react$40$18$2e$3$2e$31_$5f40$types$2b$react$40$1_c6byygfw5qeklygubnzywcb44y$2f$node_modules$2f40$stackframe$2f$stack$2d$shared$2f$dist$2f$esm$2f$utils$2f$promises$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["runAsynchronously"])(doQuickSignIn());
            });
            actions.append(signOutBtn, randomBtn);
        } else {
            const quickBtn = h("button", {
                className: "sdt-ov-btn sdt-ov-btn-primary sdt-ov-btn-wide"
            }, loading ? "Working…" : "Quick Sign In");
            quickBtn.disabled = loading;
            quickBtn.addEventListener("click", ()=>{
                (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f40$stackframe$2b$stack$2d$shared$40$2$2e$8$2e$108_$40$types$2b$react$2d$dom$40$18$2e$3$2e$7_$40$types$2b$react$40$18$2e$3$2e$31_$5f40$types$2b$react$40$1_c6byygfw5qeklygubnzywcb44y$2f$node_modules$2f40$stackframe$2f$stack$2d$shared$2f$dist$2f$esm$2f$utils$2f$promises$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["runAsynchronously"])(doQuickSignIn());
            });
            actions.appendChild(quickBtn);
        }
        emailInput.placeholder = currentUser ? "Switch to email…" : "Sign in as email…";
        actions.appendChild(emailRow);
    }
    async function doQuickSignIn() {
        if (!(0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f40$stackframe$2b$stack$2d$shared$40$2$2e$8$2e$108_$40$types$2b$react$2d$dom$40$18$2e$3$2e$7_$40$types$2b$react$40$18$2e$3$2e$31_$5f40$types$2b$react$40$1_c6byygfw5qeklygubnzywcb44y$2f$node_modules$2f40$stackframe$2f$stack$2d$shared$2f$dist$2f$esm$2f$utils$2f$urls$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["isLocalhost"])(window.location.href)) {
            showToast("Quick sign-in is only available on localhost", "error");
            return;
        }
        loading = true;
        rebuildActions();
        const email = generateRandomEmail();
        try {
            const signUpResult = await app.signUpWithCredential({
                email,
                password: email,
                noRedirect: true
            });
            if (signUpResult.status === "error") {
                showToast(`Sign up failed: ${signUpResult.error.message}`, "error");
                loading = false;
                rebuildActions();
                return;
            }
            const signInResult = await app.signInWithCredential({
                email,
                password: email,
                noRedirect: true
            });
            if (signInResult.status === "error") showToast(`Sign in failed: ${signInResult.error.message}`, "error");
            else showToast(`Signed in as ${email}`, "success");
        } catch (e) {
            showToast(e.message || "Unknown error", "error");
        }
        loading = false;
        await refreshUser();
    }
    async function doSignInAs(targetEmail) {
        if (!targetEmail.trim()) return;
        if (!(0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f40$stackframe$2b$stack$2d$shared$40$2$2e$8$2e$108_$40$types$2b$react$2d$dom$40$18$2e$3$2e$7_$40$types$2b$react$40$18$2e$3$2e$31_$5f40$types$2b$react$40$1_c6byygfw5qeklygubnzywcb44y$2f$node_modules$2f40$stackframe$2f$stack$2d$shared$2f$dist$2f$esm$2f$utils$2f$urls$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["isLocalhost"])(window.location.href)) {
            showToast("Quick sign-in is only available on localhost", "error");
            return;
        }
        loading = true;
        rebuildActions();
        const trimmed = targetEmail.trim();
        try {
            if ((await app.signInWithCredential({
                email: trimmed,
                password: trimmed,
                noRedirect: true
            })).status === "ok") {
                showToast(`Signed in as ${trimmed}`, "success");
                emailInput.value = "";
                loading = false;
                await refreshUser();
                return;
            }
            const signUpResult = await app.signUpWithCredential({
                email: trimmed,
                password: trimmed,
                noRedirect: true
            });
            if (signUpResult.status === "error") {
                showToast(`Failed: ${signUpResult.error.message}`, "error");
                loading = false;
                rebuildActions();
                return;
            }
            const retryResult = await app.signInWithCredential({
                email: trimmed,
                password: trimmed,
                noRedirect: true
            });
            if (retryResult.status === "error") showToast(`Sign in failed: ${retryResult.error.message}`, "error");
            else {
                showToast(`Signed in as ${trimmed}`, "success");
                emailInput.value = "";
            }
        } catch (e) {
            showToast(e.message || "Unknown error", "error");
        }
        loading = false;
        await refreshUser();
    }
    emailBtn.addEventListener("click", ()=>{
        (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f40$stackframe$2b$stack$2d$shared$40$2$2e$8$2e$108_$40$types$2b$react$2d$dom$40$18$2e$3$2e$7_$40$types$2b$react$40$18$2e$3$2e$31_$5f40$types$2b$react$40$1_c6byygfw5qeklygubnzywcb44y$2f$node_modules$2f40$stackframe$2f$stack$2d$shared$2f$dist$2f$esm$2f$utils$2f$promises$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["runAsynchronously"])(doSignInAs(emailInput.value));
    });
    emailInput.addEventListener("keydown", (e)=>{
        if (e.key === "Enter") (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f40$stackframe$2b$stack$2d$shared$40$2$2e$8$2e$108_$40$types$2b$react$2d$dom$40$18$2e$3$2e$7_$40$types$2b$react$40$18$2e$3$2e$31_$5f40$types$2b$react$40$1_c6byygfw5qeklygubnzywcb44y$2f$node_modules$2f40$stackframe$2f$stack$2d$shared$2f$dist$2f$esm$2f$utils$2f$promises$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["runAsynchronously"])(doSignInAs(emailInput.value));
    });
    heroCard.append(actions, toast);
    const methodsCard = h("div", {
        className: "sdt-ov-card sdt-ov-card-auth"
    });
    methodsCard.appendChild(h("div", {
        className: "sdt-ov-label"
    }, "Auth Methods"));
    const authGrid = h("div", {
        className: "sdt-ov-auth-grid"
    });
    for(let i = 0; i < 3; i++)authGrid.appendChild(h("div", {
        className: "sdt-ov-method sdt-ov-skeleton-pill"
    }));
    methodsCard.appendChild(authGrid);
    let hasActiveAuthMethod = null;
    async function loadAuthMethods() {
        try {
            const project = await app.getProject();
            authGrid.innerHTML = "";
            const config = project.config;
            hasActiveAuthMethod = config.credentialEnabled || config.magicLinkEnabled || config.passkeyEnabled || config.oauthProviders.length > 0;
            const methods = [
                {
                    label: "Password",
                    enabled: config.credentialEnabled
                },
                {
                    label: "Magic Link",
                    enabled: config.magicLinkEnabled
                },
                {
                    label: "Passkey",
                    enabled: config.passkeyEnabled
                }
            ];
            for (const m of methods){
                const pill = h("div", {
                    className: `sdt-ov-method ${m.enabled ? "sdt-ov-method-on" : "sdt-ov-method-off"}`
                });
                pill.appendChild(h("span", {
                    className: "sdt-ov-method-name"
                }, m.label));
                authGrid.appendChild(pill);
            }
            for (const p of config.oauthProviders){
                const pill = h("div", {
                    className: "sdt-ov-method sdt-ov-method-on sdt-ov-method-oauth"
                });
                pill.appendChild(h("span", {
                    className: "sdt-ov-method-name"
                }, p.id));
                authGrid.appendChild(pill);
            }
            if (!config.signUpEnabled) {
                const pill = h("div", {
                    className: "sdt-ov-method sdt-ov-method-warn"
                });
                pill.appendChild(h("span", {
                    className: "sdt-ov-method-name"
                }, "Sign-up off"));
                authGrid.appendChild(pill);
            }
            buildChecklist();
        } catch (error) {
            authGrid.innerHTML = "<div style=\"font-size:11px;color:var(--sdt-text-tertiary)\">Could not load auth methods</div>";
            hasActiveAuthMethod = null;
            buildChecklist();
            if (!isBestEffortOverviewError(error)) throw error;
        }
    }
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f40$stackframe$2b$stack$2d$shared$40$2$2e$8$2e$108_$40$types$2b$react$2d$dom$40$18$2e$3$2e$7_$40$types$2b$react$40$18$2e$3$2e$31_$5f40$types$2b$react$40$1_c6byygfw5qeklygubnzywcb44y$2f$node_modules$2f40$stackframe$2f$stack$2d$shared$2f$dist$2f$esm$2f$utils$2f$promises$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["runAsynchronously"])(loadAuthMethods());
    const checksCard = h("div", {
        className: "sdt-ov-card sdt-ov-card-checks"
    });
    const projectId = app.projectId;
    let checksCardMounted = false;
    function buildChecklist() {
        checksCard.innerHTML = "";
        const checks = [
            {
                ok: !!projectId && projectId !== "default",
                label: "Project configured",
                hint: null
            },
            {
                ok: hasActiveAuthMethod === true,
                label: "Auth method active",
                hint: hasActiveAuthMethod === null ? "Still checking project config" : null
            },
            {
                ok: !!currentUser,
                label: "Sign in a test user",
                hint: "Use “Quick Sign In” above →"
            }
        ];
        const passCount = checks.filter((c)=>c.ok).length;
        if (passCount === checks.length) {
            if (checksCardMounted && checksCard.parentElement) {
                container.removeChild(checksCard);
                checksCardMounted = false;
            }
            return;
        }
        if (!checksCardMounted) {
            container.appendChild(checksCard);
            checksCardMounted = true;
        }
        const titleRow = h("div", {
            className: "sdt-ov-checks-header"
        });
        const titleLabel = h("div", {
            className: "sdt-ov-label",
            style: {
                marginBottom: "0",
                color: "var(--sdt-warning)"
            }
        }, "Setup");
        const badge = h("span", {
            className: "sdt-ov-checks-badge sdt-ov-checks-badge-warn"
        }, `${passCount}\u200a/\u200a${checks.length}`);
        titleRow.append(titleLabel, badge);
        checksCard.appendChild(titleRow);
        const bar = h("div", {
            className: "sdt-ov-checks-bar"
        });
        const fill = h("div", {
            className: "sdt-ov-checks-bar-fill"
        });
        fill.style.width = `${passCount / checks.length * 100}%`;
        bar.appendChild(fill);
        checksCard.appendChild(bar);
        for (const c of checks){
            const row = h("div", {
                className: "sdt-ov-setup-row"
            });
            row.appendChild(h("span", {
                className: `sdt-ov-setup-dot ${c.ok ? "sdt-ov-setup-dot-ok" : "sdt-ov-setup-dot-warn"}`
            }));
            row.appendChild(h("span", {
                className: "sdt-ov-setup-label"
            }, c.label));
            if (!c.ok && c.hint) row.appendChild(h("span", {
                className: "sdt-ov-setup-hint"
            }, c.hint));
            checksCard.appendChild(row);
        }
    }
    async function refreshUser() {
        try {
            currentUser = await app.getUser();
            if (currentUser) {
                const initials = (currentUser.displayName || currentUser.primaryEmail || "?").split(" ").map((s)=>s[0]).join("").slice(0, 2).toUpperCase();
                avatar.className = "sdt-ov-avatar sdt-ov-avatar-active";
                if (currentUser.profileImageUrl) avatar.innerHTML = `<img src="${escapeHtml(currentUser.profileImageUrl)}" alt="" />`;
                else avatar.textContent = initials;
                userName.textContent = currentUser.displayName || "Anonymous";
                userEmail.textContent = currentUser.primaryEmail || "No email";
                authIndicator.style.display = "";
            } else {
                avatar.className = "sdt-ov-avatar";
                avatar.textContent = "?";
                userName.textContent = "No user signed in";
                userEmail.textContent = "Sign in to test auth flows";
                authIndicator.style.display = "none";
            }
        } catch (error) {
            avatar.className = "sdt-ov-avatar";
            avatar.textContent = "?";
            userName.textContent = "Could not load user";
            userEmail.textContent = "Check your local Stack backend";
            authIndicator.style.display = "none";
            currentUser = null;
            if (!isBestEffortOverviewError(error)) throw error;
        }
        rebuildActions();
        buildChecklist();
    }
    container.append(heroCard, methodsCard);
    buildChecklist();
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f40$stackframe$2b$stack$2d$shared$40$2$2e$8$2e$108_$40$types$2b$react$2d$dom$40$18$2e$3$2e$7_$40$types$2b$react$40$18$2e$3$2e$31_$5f40$types$2b$react$40$1_c6byygfw5qeklygubnzywcb44y$2f$node_modules$2f40$stackframe$2f$stack$2d$shared$2f$dist$2f$esm$2f$utils$2f$promises$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["runAsynchronously"])(refreshUser());
    const userPoll = setInterval(()=>{
        (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f40$stackframe$2b$stack$2d$shared$40$2$2e$8$2e$108_$40$types$2b$react$2d$dom$40$18$2e$3$2e$7_$40$types$2b$react$40$18$2e$3$2e$31_$5f40$types$2b$react$40$1_c6byygfw5qeklygubnzywcb44y$2f$node_modules$2f40$stackframe$2f$stack$2d$shared$2f$dist$2f$esm$2f$utils$2f$promises$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["runAsynchronously"])(refreshUser());
    }, 3e3);
    return {
        element: container,
        cleanup: ()=>clearInterval(userPoll)
    };
}
function createConsoleTab(logStore) {
    const container = h("div", {
        className: "sdt-console-panel"
    });
    const EVENT_TYPE_STYLES = {
        "error": "sdt-badge-error",
        "info": "sdt-badge-info"
    };
    const title = h("div", {
        className: "sdt-console-title"
    }, "Logs");
    const actions = h("div", {
        className: "sdt-console-actions"
    });
    const copyBtn = h("button", {
        className: "sdt-console-action-btn",
        title: "Copy logs"
    });
    setHtml(copyBtn, "<svg width=\"12\" height=\"12\" viewBox=\"0 0 24 24\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"2.25\" stroke-linecap=\"round\" stroke-linejoin=\"round\"><rect x=\"9\" y=\"9\" width=\"13\" height=\"13\" rx=\"2\"/><path d=\"M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1\"/></svg>Copy");
    const exportBtn = h("button", {
        className: "sdt-console-action-btn",
        title: "Export logs"
    });
    setHtml(exportBtn, "<svg width=\"12\" height=\"12\" viewBox=\"0 0 24 24\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"2.25\" stroke-linecap=\"round\" stroke-linejoin=\"round\"><path d=\"M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4\"/><polyline points=\"7 10 12 15 17 10\"/><line x1=\"12\" y1=\"15\" x2=\"12\" y2=\"3\"/></svg>Export");
    const clearBtn = h("button", {
        className: "sdt-console-action-btn",
        title: "Clear logs"
    });
    setHtml(clearBtn, "<svg width=\"12\" height=\"12\" viewBox=\"0 0 24 24\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"2.25\" stroke-linecap=\"round\" stroke-linejoin=\"round\"><polyline points=\"3 6 5 6 21 6\"/><path d=\"M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2\"/><path d=\"M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6\"/></svg>Clear");
    actions.append(copyBtn, exportBtn, clearBtn);
    container.appendChild(h("div", {
        className: "sdt-console-header"
    }, title, actions));
    const contentArea = h("div", {
        className: "sdt-console-log-scroll sdt-tab-content-fade"
    });
    container.appendChild(contentArea);
    let visibleLogCount = CONSOLE_LOG_BATCH_SIZE;
    function getMergedLogs() {
        return [
            ...logStore.apiLogs.map((entry)=>({
                    kind: "api",
                    entry
                })),
            ...logStore.eventLogs.map((entry)=>({
                    kind: "event",
                    entry
                }))
        ].sort((a, b)=>b.entry.timestamp - a.entry.timestamp);
    }
    function formatLogLine(item) {
        if (item.kind === "api") {
            const log = item.entry;
            const status = log.status !== void 0 ? ` [${log.status}]` : "";
            const duration = log.duration !== void 0 ? ` ${log.duration}ms` : "";
            const error = log.error !== void 0 ? ` ${log.error}` : "";
            return `${new Date(log.timestamp).toISOString()} ${log.method} ${log.url}${status}${duration}${error}`;
        }
        const log = item.entry;
        return `${new Date(log.timestamp).toISOString()} ${log.type.toUpperCase()} ${log.message}`;
    }
    function formatLogsForExport() {
        return [
            "=== Stack Auth Dev Tool Logs ===",
            `Generated: ${/* @__PURE__ */ new Date().toISOString()}`,
            `Total logs: ${getMergedLogs().length}`,
            "",
            ...getMergedLogs().map(formatLogLine)
        ].join("\n");
    }
    function renderLogItem(item) {
        if (item.kind === "api") {
            const log = item.entry;
            const row = h("div", {
                className: "sdt-log-item"
            });
            row.appendChild(h("span", {
                className: "sdt-log-time"
            }, formatTimestamp(log.timestamp)));
            row.appendChild(h("span", {
                className: `sdt-log-method sdt-log-method-${log.method.toLowerCase()}`
            }, log.method));
            row.appendChild(h("span", {
                className: "sdt-log-url"
            }, log.url));
            if (log.status !== void 0) row.appendChild(h("span", {
                className: `sdt-log-status ${log.status < 400 ? "sdt-log-status-ok" : "sdt-log-status-err"}`
            }, String(log.status)));
            if (log.duration !== void 0) row.appendChild(h("span", {
                className: "sdt-log-time"
            }, log.duration + "ms"));
            return row;
        }
        const log = item.entry;
        const row = h("div", {
            className: "sdt-log-item"
        });
        row.appendChild(h("span", {
            className: "sdt-log-time"
        }, formatTimestamp(log.timestamp)));
        row.appendChild(h("span", {
            className: `sdt-badge ${EVENT_TYPE_STYLES[log.type] || "sdt-badge-info"}`
        }, log.type));
        row.appendChild(h("span", {
            className: "sdt-log-message"
        }, log.message));
        return row;
    }
    function renderLogs() {
        const previousScrollTop = contentArea.scrollTop;
        contentArea.innerHTML = "";
        const merged = getMergedLogs();
        visibleLogCount = Math.min(Math.max(visibleLogCount, CONSOLE_LOG_BATCH_SIZE), Math.max(merged.length, CONSOLE_LOG_BATCH_SIZE));
        if (merged.length === 0) {
            contentArea.innerHTML = "<div class=\"sdt-empty-state\"><div class=\"sdt-empty-state-icon\">📋</div><div>No logs recorded yet</div><div style=\"font-size:12px;color:var(--sdt-text-tertiary)\">API calls and auth events will appear here</div></div>";
            return;
        }
        const list = h("div", {
            className: "sdt-log-list"
        });
        for (const item of merged.slice(0, visibleLogCount))list.appendChild(renderLogItem(item));
        if (visibleLogCount < merged.length) list.appendChild(h("div", {
            className: "sdt-log-load-hint"
        }, `${merged.length - visibleLogCount} older logs available`));
        contentArea.appendChild(list);
        contentArea.scrollTop = Math.min(previousScrollTop, contentArea.scrollHeight);
    }
    function maybeLoadOlderLogs() {
        const mergedLength = getMergedLogs().length;
        if (visibleLogCount >= mergedLength) return;
        if (contentArea.scrollHeight - contentArea.scrollTop - contentArea.clientHeight <= 48) {
            visibleLogCount = Math.min(visibleLogCount + CONSOLE_LOG_BATCH_SIZE, mergedLength);
            renderLogs();
        }
    }
    contentArea.addEventListener("scroll", maybeLoadOlderLogs);
    renderLogs();
    copyBtn.addEventListener("click", ()=>{
        (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f40$stackframe$2b$stack$2d$shared$40$2$2e$8$2e$108_$40$types$2b$react$2d$dom$40$18$2e$3$2e$7_$40$types$2b$react$40$18$2e$3$2e$31_$5f40$types$2b$react$40$1_c6byygfw5qeklygubnzywcb44y$2f$node_modules$2f40$stackframe$2f$stack$2d$shared$2f$dist$2f$esm$2f$utils$2f$promises$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["runAsynchronously"])(navigator.clipboard.writeText(formatLogsForExport()).then(()=>{
            copyBtn.textContent = "✓ Copied";
            setTimeout(()=>{
                setHtml(copyBtn, "<svg width=\"12\" height=\"12\" viewBox=\"0 0 24 24\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"2.25\" stroke-linecap=\"round\" stroke-linejoin=\"round\"><rect x=\"9\" y=\"9\" width=\"13\" height=\"13\" rx=\"2\"/><path d=\"M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1\"/></svg>Copy");
            }, 1500);
        }));
    });
    exportBtn.addEventListener("click", ()=>{
        const blob = new Blob([
            formatLogsForExport()
        ], {
            type: "text/plain;charset=utf-8"
        });
        const url = URL.createObjectURL(blob);
        const link = h("a", {
            href: url,
            download: `stack-auth-dev-tool-logs-${/* @__PURE__ */ new Date().toISOString()}.txt`
        });
        document.body.appendChild(link);
        link.click();
        link.remove();
        URL.revokeObjectURL(url);
    });
    clearBtn.addEventListener("click", ()=>{
        visibleLogCount = CONSOLE_LOG_BATCH_SIZE;
        logStore.clear();
    });
    const unsub = logStore.subscribe(()=>{
        renderLogs();
    });
    return {
        element: container,
        cleanup: ()=>{
            contentArea.removeEventListener("scroll", maybeLoadOlderLogs);
            unsub();
        }
    };
}
function createAITab(app) {
    const container = h("div", {
        className: "sdt-ai-container"
    });
    const apiBaseUrl = resolveApiBaseUrl(app);
    const messages = [];
    let aiLoading = false;
    let activeAiAbortController = null;
    const messagesArea = h("div", {
        className: "sdt-ai-messages"
    });
    const inputArea = h("div", {
        className: "sdt-ai-input-area"
    });
    const SUGGESTED_QUESTIONS = [
        {
            icon: "🔒",
            text: "How do I protect a Next.js route?"
        },
        {
            icon: "👥",
            text: "How do teams and permissions work?"
        },
        {
            icon: "🔗",
            text: "How do I add OAuth providers?"
        },
        {
            icon: "✉️",
            text: "How do I customize auth emails?"
        }
    ];
    function getHeaders() {
        const opts = app[__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f40$stackframe$2b$stack$40$2$2e$8$2e$108_$40$types$2b$react$2d$dom$40$18$2e$3$2e$7_$40$types$2b$react$40$18$2e$3$2e$31_$5f40$types$2b$react$40$18$2e$3$2e$31_$5f$tqjf7xvnucvjx6rf5f5n65ykji$2f$node_modules$2f40$stackframe$2f$stack$2f$dist$2f$esm$2f$lib$2f$stack$2d$app$2f$common$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["stackAppInternalsSymbol"]].getConstructorOptions();
        const headers = {
            "X-Hexclave-Access-Type": "client",
            "X-Hexclave-Project-Id": app.projectId
        };
        if ("publishableClientKey" in opts && opts.publishableClientKey) headers["X-Hexclave-Publishable-Client-Key"] = opts.publishableClientKey;
        return headers;
    }
    function renderToolCard(toolCall) {
        const toolCard = h("div", {
            className: "sdt-ai-tool-card"
        });
        const header = h("button", {
            className: "sdt-ai-tool-header",
            type: "button"
        });
        header.appendChild(h("span", {
            className: "sdt-ai-tool-name"
        }, toolCall.toolName));
        header.appendChild(h("span", {
            className: `sdt-ai-tool-status sdt-ai-tool-status-${toolCall.state}`
        }, toolCall.state));
        header.appendChild(h("span", {
            className: `sdt-ai-tool-chevron${toolCall.isExpanded ? " sdt-ai-tool-chevron-open" : ""}`
        }, "▾"));
        header.addEventListener("click", ()=>{
            toolCall.isExpanded = !toolCall.isExpanded;
            renderMessages();
        });
        toolCard.appendChild(header);
        if (toolCall.isExpanded) {
            const body = h("div", {
                className: "sdt-ai-tool-body"
            });
            if (toolCall.argsText !== null) {
                body.appendChild(h("div", {
                    className: "sdt-ai-tool-label"
                }, "Args"));
                const argsPre = h("pre", {
                    className: "sdt-ai-tool-pre"
                });
                argsPre.appendChild(h("code", null, toolCall.argsText));
                body.appendChild(argsPre);
            }
            if (toolCall.resultText !== null) {
                body.appendChild(h("div", {
                    className: "sdt-ai-tool-label"
                }, toolCall.state === "error" ? "Error" : "Result"));
                const resultPre = h("pre", {
                    className: "sdt-ai-tool-pre"
                });
                resultPre.appendChild(h("code", null, toolCall.resultText));
                body.appendChild(resultPre);
            }
            if (toolCall.state === "running") body.appendChild(h("div", {
                className: "sdt-ai-tool-running"
            }, "Running..."));
            toolCard.appendChild(body);
        }
        return toolCard;
    }
    function renderMessages() {
        messagesArea.innerHTML = "";
        if (messages.length === 0) {
            const empty = h("div", {
                className: "sdt-ai-empty"
            });
            const icon = h("div", {
                className: "sdt-ai-empty-icon"
            });
            setHtml(icon, "<svg width=\"32\" height=\"32\" viewBox=\"0 0 24 24\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"1.5\" stroke-linecap=\"round\" stroke-linejoin=\"round\"><polygon points=\"12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2\"/></svg>");
            empty.appendChild(icon);
            empty.appendChild(h("div", {
                className: "sdt-ai-empty-title"
            }, "Ask AI"));
            empty.appendChild(h("div", {
                className: "sdt-ai-empty-desc"
            }, "Get help with Stack Auth integration, troubleshooting, and best practices."));
            const suggestions = h("div", {
                className: "sdt-ai-suggestions"
            });
            for (const q of SUGGESTED_QUESTIONS){
                const btn = h("button", {
                    className: "sdt-ai-suggestion"
                });
                btn.appendChild(h("span", {
                    className: "sdt-ai-suggestion-icon"
                }, q.icon));
                btn.appendChild(h("span", null, q.text));
                btn.addEventListener("click", ()=>{
                    (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f40$stackframe$2b$stack$2d$shared$40$2$2e$8$2e$108_$40$types$2b$react$2d$dom$40$18$2e$3$2e$7_$40$types$2b$react$40$18$2e$3$2e$31_$5f40$types$2b$react$40$1_c6byygfw5qeklygubnzywcb44y$2f$node_modules$2f40$stackframe$2f$stack$2d$shared$2f$dist$2f$esm$2f$utils$2f$promises$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["runAsynchronously"])(sendMessage(q.text));
                });
                suggestions.appendChild(btn);
            }
            empty.appendChild(suggestions);
            messagesArea.appendChild(empty);
            return;
        }
        const list = h("div", {
            className: "sdt-ai-message-list"
        });
        for (const msg of messages)if (msg.role === "user") {
            const msgDiv = h("div", {
                className: "sdt-ai-msg sdt-ai-msg-user"
            });
            const bubble = h("div", {
                className: "sdt-ai-bubble sdt-ai-bubble-user"
            });
            bubble.appendChild(h("p", null, msg.content));
            msgDiv.appendChild(bubble);
            const avatarDiv = h("div", {
                className: "sdt-ai-avatar sdt-ai-avatar-user"
            });
            setHtml(avatarDiv, "<svg width=\"14\" height=\"14\" viewBox=\"0 0 24 24\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"2\" stroke-linecap=\"round\" stroke-linejoin=\"round\"><path d=\"M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2\"/><circle cx=\"12\" cy=\"7\" r=\"4\"/></svg>");
            msgDiv.appendChild(avatarDiv);
            list.appendChild(msgDiv);
        } else {
            const msgDiv = h("div", {
                className: "sdt-ai-msg sdt-ai-msg-assistant"
            });
            const avatarDiv = h("div", {
                className: "sdt-ai-avatar sdt-ai-avatar-assistant"
            });
            setHtml(avatarDiv, "<svg width=\"14\" height=\"14\" viewBox=\"0 0 24 24\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"2\" stroke-linecap=\"round\" stroke-linejoin=\"round\"><polygon points=\"12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2\"/></svg>");
            msgDiv.appendChild(avatarDiv);
            const bubble = h("div", {
                className: "sdt-ai-bubble sdt-ai-bubble-assistant"
            });
            if (msg.parts.length === 0) bubble.innerHTML = "<div class=\"sdt-ai-thinking\"><span class=\"sdt-ai-thinking-dot\"></span><span class=\"sdt-ai-thinking-dot\"></span><span class=\"sdt-ai-thinking-dot\"></span></div>";
            else for (const part of msg.parts){
                if (part.type === "text") {
                    const textContainer = h("div", {
                        className: "sdt-ai-part-text"
                    });
                    renderMarkdownInto(textContainer, part.content);
                    bubble.appendChild(textContainer);
                    continue;
                }
                const toolCall = msg.toolCallsById.get(part.toolCallId);
                if (toolCall == null) {
                    const missingTool = h("div", {
                        className: "sdt-ai-tool-card"
                    });
                    const missingBody = h("div", {
                        className: "sdt-ai-tool-body"
                    });
                    missingBody.appendChild(h("div", {
                        className: "sdt-ai-tool-label"
                    }, "Error"));
                    const missingPre = h("pre", {
                        className: "sdt-ai-tool-pre"
                    });
                    missingPre.appendChild(h("code", null, `Missing tool call state for ${part.toolCallId}`));
                    missingBody.appendChild(missingPre);
                    missingTool.appendChild(missingBody);
                    bubble.appendChild(missingTool);
                    continue;
                }
                const toolsContainer = h("div", {
                    className: "sdt-ai-tools"
                });
                toolsContainer.appendChild(renderToolCard(toolCall));
                bubble.appendChild(toolsContainer);
            }
            msgDiv.appendChild(bubble);
            list.appendChild(msgDiv);
        }
        messagesArea.appendChild(list);
        messagesArea.scrollTop = messagesArea.scrollHeight;
    }
    function renderMarkdownInto(el, content) {
        function appendBlockWithInlineMarkdown(tag, className, text) {
            const block = h(tag, {
                className
            });
            appendInlineMarkdown(block, text);
            el.appendChild(block);
        }
        const lines = content.split("\n");
        let i = 0;
        while(i < lines.length){
            const line = lines[i];
            if (line.startsWith("```")) {
                const lang = line.slice(3).trim();
                const codeLines = [];
                i++;
                while(i < lines.length && !lines[i].startsWith("```")){
                    codeLines.push(lines[i]);
                    i++;
                }
                i++;
                const block = h("div", {
                    className: "sdt-ai-code-block"
                });
                const header = h("div", {
                    className: "sdt-ai-code-header"
                });
                header.appendChild(h("span", {
                    className: "sdt-ai-code-lang"
                }, lang || "CODE"));
                const copyBtn = h("button", {
                    className: "sdt-ai-copy-btn"
                }, "⎘");
                const code = codeLines.join("\n");
                copyBtn.addEventListener("click", ()=>{
                    (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f40$stackframe$2b$stack$2d$shared$40$2$2e$8$2e$108_$40$types$2b$react$2d$dom$40$18$2e$3$2e$7_$40$types$2b$react$40$18$2e$3$2e$31_$5f40$types$2b$react$40$1_c6byygfw5qeklygubnzywcb44y$2f$node_modules$2f40$stackframe$2f$stack$2d$shared$2f$dist$2f$esm$2f$utils$2f$promises$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["runAsynchronously"])(navigator.clipboard.writeText(code).then(()=>{
                        copyBtn.textContent = "✓";
                        setTimeout(()=>{
                            copyBtn.textContent = "⎘";
                        }, 1500);
                    }));
                });
                header.appendChild(copyBtn);
                block.appendChild(header);
                const pre = h("pre", {
                    className: "sdt-ai-code-pre"
                });
                pre.appendChild(h("code", null, code));
                block.appendChild(pre);
                el.appendChild(block);
                continue;
            }
            const headingMatch = line.match(/^(#{1,3}) (.+)/);
            if (headingMatch) {
                appendBlockWithInlineMarkdown(`h${headingMatch[1].length}`, "sdt-ai-heading", headingMatch[2]);
                i++;
                continue;
            }
            if (/^[-*] /.test(line)) {
                const ul = h("ul", {
                    className: "sdt-ai-list"
                });
                while(i < lines.length && /^[-*] /.test(lines[i])){
                    const li = h("li");
                    appendInlineMarkdown(li, lines[i].replace(/^[-*] /, ""));
                    ul.appendChild(li);
                    i++;
                }
                el.appendChild(ul);
                continue;
            }
            if (/^\d+\. /.test(line)) {
                const ol = h("ol", {
                    className: "sdt-ai-list sdt-ai-list-ordered"
                });
                while(i < lines.length && /^\d+\. /.test(lines[i])){
                    const li = h("li");
                    appendInlineMarkdown(li, lines[i].replace(/^\d+\. /, ""));
                    ol.appendChild(li);
                    i++;
                }
                el.appendChild(ol);
                continue;
            }
            if (line.trim() === "") {
                i++;
                continue;
            }
            appendBlockWithInlineMarkdown("p", "sdt-ai-paragraph", line);
            i++;
        }
    }
    function stringifyForDebug(value) {
        if (value === void 0 || typeof value === "function" || typeof value === "symbol") return String(value);
        return JSON.stringify(value, null, 2);
    }
    function getLastItem(items) {
        return items.length > 0 ? items[items.length - 1] : void 0;
    }
    function isRecord(value) {
        return typeof value === "object" && value !== null && !Array.isArray(value);
    }
    function expectObject(value, payload) {
        if (!isRecord(value)) throw new Error(`SSE payload must be an object: ${payload}`);
        return value;
    }
    function getRequiredStringField(event, field, payload) {
        const value = event[field];
        if (typeof value !== "string") throw new Error(`SSE event '${String(event.type)}' missing string '${field}': ${payload}`);
        return value;
    }
    function getCurrentAssistantMessage() {
        const lastMessage = getLastItem(messages);
        if (lastMessage?.role !== "assistant") throw new Error("Expected current message to be an assistant message");
        return lastMessage;
    }
    function appendTextDelta(delta) {
        const assistantMessage = getCurrentAssistantMessage();
        const lastPart = getLastItem(assistantMessage.parts);
        if (lastPart?.type === "text") {
            lastPart.content += delta;
            return;
        }
        assistantMessage.parts.push({
            type: "text",
            content: delta
        });
    }
    function ensureToolPart(assistantMessage, toolCallId) {
        if (!assistantMessage.parts.some((part)=>part.type === "tool" && part.toolCallId === toolCallId)) assistantMessage.parts.push({
            type: "tool",
            toolCallId
        });
    }
    function findOrCreateToolCall(toolCallId, fallbackToolName) {
        const assistantMessage = getCurrentAssistantMessage();
        const existing = assistantMessage.toolCallsById.get(toolCallId);
        if (existing != null) {
            if (existing.toolName === "tool" && fallbackToolName !== "tool") existing.toolName = fallbackToolName;
            ensureToolPart(assistantMessage, toolCallId);
            return existing;
        }
        const created = {
            id: toolCallId,
            toolName: fallbackToolName,
            argsText: null,
            resultText: null,
            state: "running",
            errorText: null,
            isExpanded: false
        };
        assistantMessage.toolCallsById.set(toolCallId, created);
        ensureToolPart(assistantMessage, toolCallId);
        return created;
    }
    async function sendMessage(text) {
        if (!text.trim() || aiLoading) return;
        messages.push({
            role: "user",
            content: text.trim()
        });
        messages.push({
            role: "assistant",
            parts: [],
            toolCallsById: /* @__PURE__ */ new Map()
        });
        aiLoading = true;
        renderMessages();
        renderInput();
        try {
            const abortController = new AbortController();
            activeAiAbortController = abortController;
            const res = await fetch(`${apiBaseUrl}/api/latest/ai/query/stream`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    ...getHeaders()
                },
                signal: abortController.signal,
                body: JSON.stringify({
                    systemPrompt: "command-center-ask-ai",
                    tools: [
                        "docs"
                    ],
                    quality: "smart",
                    speed: "slow",
                    messages: messages.slice(0, -1).map((m)=>({
                            role: m.role,
                            content: [
                                {
                                    type: "text",
                                    text: m.role === "user" ? m.content : m.parts.filter((part)=>part.type === "text").map((part)=>part.content).join("")
                                }
                            ]
                        }))
                })
            });
            if (!res.ok) throw new Error(`AI request failed with status ${res.status}`);
            if (!res.body) throw new Error("AI request returned no response body");
            const reader = res.body.getReader();
            const decoder = new TextDecoder();
            let buffer = "";
            while(true){
                const { done, value } = await reader.read();
                if (done) break;
                buffer += decoder.decode(value, {
                    stream: true
                });
                const streamLines = buffer.split("\n");
                buffer = streamLines.pop() || "";
                for (const streamLine of streamLines){
                    const line = streamLine.trim();
                    if (line === "" || line.startsWith(":")) continue;
                    if (!line.startsWith("data: ")) throw new Error(`Unexpected SSE line: ${line}`);
                    const payload = line.slice(6);
                    if (payload === "[DONE]") continue;
                    const event = expectObject(JSON.parse(payload), payload);
                    const eventType = getRequiredStringField(event, "type", payload);
                    switch(eventType){
                        case "start":
                        case "start-step":
                        case "finish-step":
                        case "finish":
                        case "message-metadata":
                        case "text-start":
                        case "text-end":
                        case "reasoning-start":
                        case "reasoning-delta":
                        case "reasoning-end":
                        case "source-url":
                        case "source-document":
                        case "file":
                            break;
                        case "text-delta":
                            appendTextDelta(getRequiredStringField(event, "delta", payload));
                            break;
                        case "tool-input-start":
                            {
                                const toolCall = findOrCreateToolCall(getRequiredStringField(event, "toolCallId", payload), getRequiredStringField(event, "toolName", payload));
                                toolCall.state = "running";
                                toolCall.resultText = null;
                                toolCall.errorText = null;
                                toolCall.argsText = "";
                                break;
                            }
                        case "tool-input-delta":
                            {
                                const toolCallId = getRequiredStringField(event, "toolCallId", payload);
                                const inputTextDelta = getRequiredStringField(event, "inputTextDelta", payload);
                                const toolCall = findOrCreateToolCall(toolCallId, "tool");
                                toolCall.argsText = (toolCall.argsText ?? "") + inputTextDelta;
                                break;
                            }
                        case "tool-input-available":
                            {
                                const toolCall = findOrCreateToolCall(getRequiredStringField(event, "toolCallId", payload), getRequiredStringField(event, "toolName", payload));
                                toolCall.argsText = stringifyForDebug(event.input);
                                break;
                            }
                        case "tool-input-error":
                            {
                                const toolCallId = getRequiredStringField(event, "toolCallId", payload);
                                const toolName = getRequiredStringField(event, "toolName", payload);
                                const errorText = getRequiredStringField(event, "errorText", payload);
                                const toolCall = findOrCreateToolCall(toolCallId, toolName);
                                toolCall.state = "error";
                                toolCall.errorText = errorText;
                                toolCall.resultText = errorText;
                                break;
                            }
                        case "tool-output-available":
                            {
                                const toolCall = findOrCreateToolCall(getRequiredStringField(event, "toolCallId", payload), "tool");
                                const preliminary = event.preliminary === true;
                                toolCall.resultText = stringifyForDebug(event.output);
                                if (!preliminary) toolCall.state = "success";
                                break;
                            }
                        case "tool-output-error":
                            {
                                const toolCallId = getRequiredStringField(event, "toolCallId", payload);
                                const errorText = getRequiredStringField(event, "errorText", payload);
                                const toolCall = findOrCreateToolCall(toolCallId, "tool");
                                toolCall.state = "error";
                                toolCall.errorText = errorText;
                                toolCall.resultText = errorText;
                                break;
                            }
                        case "tool-output-denied":
                            {
                                const toolCall = findOrCreateToolCall(getRequiredStringField(event, "toolCallId", payload), "tool");
                                toolCall.state = "error";
                                toolCall.errorText = "Tool output denied";
                                toolCall.resultText = "Tool output denied";
                                break;
                            }
                        case "tool-approval-request":
                            {
                                const toolCallId = getRequiredStringField(event, "toolCallId", payload);
                                const approvalId = getRequiredStringField(event, "approvalId", payload);
                                const toolCall = findOrCreateToolCall(toolCallId, "tool");
                                toolCall.state = "running";
                                toolCall.resultText = `Approval requested (${approvalId})`;
                                break;
                            }
                        case "abort":
                            {
                                const reason = typeof event.reason === "string" ? event.reason : "unknown reason";
                                throw new Error(`AI stream aborted: ${reason}`);
                            }
                        case "error":
                            throw new Error(typeof event.errorText === "string" ? `AI stream error: ${event.errorText}` : `AI stream error event: ${payload}`);
                        default:
                            if (eventType.startsWith("data-")) break;
                            throw new Error(`Unexpected AI stream event type: ${eventType}`);
                    }
                }
                renderMessages();
            }
        } catch (error) {
            if (error instanceof DOMException && error.name === "AbortError") {
                const assistantMessage = getCurrentAssistantMessage();
                if (assistantMessage.parts.length === 0) assistantMessage.parts.push({
                    type: "text",
                    content: "Stopped."
                });
                renderMessages();
                return;
            }
            const message = error instanceof Error ? error.message : "Unknown AI stream error";
            const lastMessage = getLastItem(messages);
            if (lastMessage?.role === "assistant") {
                lastMessage.parts = [
                    {
                        type: "text",
                        content: message
                    }
                ];
                lastMessage.toolCallsById.clear();
            }
            renderMessages();
            alert(`AI stream failed: ${message}`);
        } finally{
            aiLoading = false;
            activeAiAbortController = null;
            renderMessages();
            renderInput();
        }
    }
    const inputWrapper = h("div", {
        className: "sdt-ai-input-wrapper"
    });
    const input = h("input", {
        type: "text",
        className: "sdt-ai-input",
        placeholder: "Ask anything about Stack Auth...",
        autocomplete: "off",
        autocorrect: "off",
        spellcheck: "false"
    });
    const sendBtn = h("button", {
        className: "sdt-ai-send-btn",
        title: "Send"
    });
    setHtml(sendBtn, "<svg width=\"14\" height=\"14\" viewBox=\"0 0 24 24\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"2\" stroke-linecap=\"round\" stroke-linejoin=\"round\"><line x1=\"22\" y1=\"2\" x2=\"11\" y2=\"13\"/><polygon points=\"22 2 15 22 11 13 2 9 22 2\"/></svg>");
    function renderInput() {
        input.disabled = false;
        input.placeholder = messages.length === 0 ? "Ask anything about Stack Auth..." : "Ask a follow-up...";
        if (aiLoading) {
            sendBtn.classList.add("sdt-ai-send-btn-active");
            sendBtn.classList.add("sdt-ai-stop-btn");
            sendBtn.setAttribute("title", "Stop");
            setHtml(sendBtn, "<svg width=\"12\" height=\"12\" viewBox=\"0 0 24 24\" fill=\"currentColor\"><rect x=\"6\" y=\"6\" width=\"12\" height=\"12\" rx=\"2\"/></svg>");
        } else if (input.value.trim()) {
            sendBtn.classList.add("sdt-ai-send-btn-active");
            sendBtn.classList.remove("sdt-ai-stop-btn");
            sendBtn.setAttribute("title", "Send");
            setHtml(sendBtn, "<svg width=\"14\" height=\"14\" viewBox=\"0 0 24 24\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"2\" stroke-linecap=\"round\" stroke-linejoin=\"round\"><line x1=\"22\" y1=\"2\" x2=\"11\" y2=\"13\"/><polygon points=\"22 2 15 22 11 13 2 9 22 2\"/></svg>");
        } else {
            sendBtn.classList.remove("sdt-ai-send-btn-active");
            sendBtn.classList.remove("sdt-ai-stop-btn");
            sendBtn.setAttribute("title", "Send");
            setHtml(sendBtn, "<svg width=\"14\" height=\"14\" viewBox=\"0 0 24 24\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"2\" stroke-linecap=\"round\" stroke-linejoin=\"round\"><line x1=\"22\" y1=\"2\" x2=\"11\" y2=\"13\"/><polygon points=\"22 2 15 22 11 13 2 9 22 2\"/></svg>");
        }
    }
    input.addEventListener("input", renderInput);
    input.addEventListener("keydown", (e)=>{
        if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault();
            if (aiLoading) activeAiAbortController?.abort();
            else {
                (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f40$stackframe$2b$stack$2d$shared$40$2$2e$8$2e$108_$40$types$2b$react$2d$dom$40$18$2e$3$2e$7_$40$types$2b$react$40$18$2e$3$2e$31_$5f40$types$2b$react$40$1_c6byygfw5qeklygubnzywcb44y$2f$node_modules$2f40$stackframe$2f$stack$2d$shared$2f$dist$2f$esm$2f$utils$2f$promises$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["runAsynchronously"])(sendMessage(input.value));
                input.value = "";
            }
            renderInput();
        }
    });
    sendBtn.addEventListener("click", ()=>{
        if (aiLoading) activeAiAbortController?.abort();
        else {
            (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f40$stackframe$2b$stack$2d$shared$40$2$2e$8$2e$108_$40$types$2b$react$2d$dom$40$18$2e$3$2e$7_$40$types$2b$react$40$18$2e$3$2e$31_$5f40$types$2b$react$40$1_c6byygfw5qeklygubnzywcb44y$2f$node_modules$2f40$stackframe$2f$stack$2d$shared$2f$dist$2f$esm$2f$utils$2f$promises$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["runAsynchronously"])(sendMessage(input.value));
            input.value = "";
        }
        renderInput();
    });
    const newChatBtn = h("button", {
        className: "sdt-ai-new-chat",
        title: "New conversation",
        style: {
            display: "none"
        }
    });
    setHtml(newChatBtn, "<svg width=\"14\" height=\"14\" viewBox=\"0 0 24 24\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"2\" stroke-linecap=\"round\" stroke-linejoin=\"round\"><line x1=\"12\" y1=\"5\" x2=\"12\" y2=\"19\"/><line x1=\"5\" y1=\"12\" x2=\"19\" y2=\"12\"/></svg>");
    newChatBtn.addEventListener("click", ()=>{
        if (aiLoading) activeAiAbortController?.abort();
        messages.length = 0;
        input.value = "";
        renderMessages();
        renderInput();
        newChatBtn.style.display = "none";
    });
    inputWrapper.append(input, sendBtn);
    inputArea.append(newChatBtn, inputWrapper);
    container.append(messagesArea, inputArea);
    renderMessages();
    renderInput();
    return container;
}
function createDashboardTab(app) {
    return createIframeTab(resolveDashboardUrl(app), "Stack Auth Dashboard", "Loading dashboard…", "Unable to load dashboard", "The dashboard may require authentication or block framing", "Open in New Tab");
}
function createSupportTab(app) {
    const container = h("div", {
        className: "sdt-support-tab"
    });
    const apiBaseUrl = resolveApiBaseUrl(app);
    function createFeedbackForm() {
        const pane = h("div", {
            className: "sdt-support-feedback-pane"
        });
        const form = h("form", {
            className: "sdt-support-form"
        });
        let feedbackType = "feedback";
        let status = "idle";
        let errorMessage = "";
        const nameInput = h("input", {
            className: "sdt-support-input",
            type: "text",
            placeholder: "Your name"
        });
        const emailInput = h("input", {
            className: "sdt-support-input",
            type: "email",
            placeholder: "you@example.com",
            required: "true"
        });
        const messageInput = h("textarea", {
            className: "sdt-support-textarea",
            placeholder: "What's on your mind?",
            required: "true",
            rows: "5"
        });
        function render() {
            form.innerHTML = "";
            if (status === "success") {
                const successDiv = h("div", {
                    className: "sdt-support-status sdt-support-status-success"
                });
                const icon = h("div", {
                    className: "sdt-support-status-icon"
                });
                setHtml(icon, "<svg width=\"20\" height=\"20\" viewBox=\"0 0 20 20\" fill=\"none\"><path d=\"M6 10l3 3 5-6\" stroke=\"currentColor\" stroke-width=\"2\" stroke-linecap=\"round\" stroke-linejoin=\"round\"/></svg>");
                successDiv.append(icon, h("div", {
                    className: "sdt-support-status-title"
                }, "Feedback sent"), h("div", {
                    className: "sdt-support-status-msg"
                }, "Thank you! We'll get back to you soon."));
                const resetBtn = h("button", {
                    className: "sdt-support-submit",
                    style: {
                        marginTop: "12px",
                        width: "auto"
                    }
                }, "Send another");
                resetBtn.addEventListener("click", ()=>{
                    status = "idle";
                    render();
                });
                successDiv.appendChild(resetBtn);
                form.appendChild(successDiv);
                return;
            }
            if (status === "error") {
                const errDiv = h("div", {
                    className: "sdt-support-status sdt-support-status-error"
                });
                const icon = h("div", {
                    className: "sdt-support-status-icon"
                });
                setHtml(icon, "<svg width=\"20\" height=\"20\" viewBox=\"0 0 20 20\" fill=\"none\"><path d=\"M10 6v5m0 3h.01\" stroke=\"currentColor\" stroke-width=\"2\" stroke-linecap=\"round\"/></svg>");
                errDiv.append(icon, h("div", {
                    className: "sdt-support-status-title"
                }, "Failed to send"), h("div", {
                    className: "sdt-support-status-msg"
                }, errorMessage || "Please try again."));
                const retryBtn = h("button", {
                    className: "sdt-support-submit",
                    style: {
                        marginTop: "12px",
                        width: "auto"
                    }
                }, "Try again");
                retryBtn.addEventListener("click", ()=>{
                    status = "idle";
                    errorMessage = "";
                    render();
                });
                errDiv.appendChild(retryBtn);
                form.appendChild(errDiv);
                return;
            }
            const nameField = h("div", {
                className: "sdt-support-field"
            });
            const nameLabel = h("label", {
                className: "sdt-support-label"
            }, "Name ");
            nameLabel.appendChild(h("span", {
                className: "sdt-support-optional"
            }, "optional"));
            nameField.append(nameLabel, nameInput);
            form.appendChild(nameField);
            const emailField = h("div", {
                className: "sdt-support-field"
            });
            emailField.append(h("label", {
                className: "sdt-support-label"
            }, "Email"), emailInput);
            form.appendChild(emailField);
            const msgField = h("div", {
                className: "sdt-support-field"
            });
            msgField.append(h("label", {
                className: "sdt-support-label"
            }, feedbackType === "bug" ? "Description" : "Message"), messageInput);
            messageInput.placeholder = feedbackType === "bug" ? "Steps to reproduce, expected vs. actual behavior…" : "What's on your mind?";
            form.appendChild(msgField);
            const typeCards = h("div", {
                className: "sdt-support-type-cards"
            });
            const feedbackBtn = h("button", {
                type: "button",
                className: `sdt-support-type-card ${feedbackType === "feedback" ? "sdt-support-type-card-active" : ""}`
            });
            setHtml(feedbackBtn, "<svg width=\"16\" height=\"16\" viewBox=\"0 0 24 24\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"2\" stroke-linecap=\"round\" stroke-linejoin=\"round\"><path d=\"M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z\"/></svg><span>Feedback</span>");
            feedbackBtn.addEventListener("click", ()=>{
                feedbackType = "feedback";
                render();
            });
            const bugBtn = h("button", {
                type: "button",
                className: `sdt-support-type-card ${feedbackType === "bug" ? "sdt-support-type-card-active" : ""}`
            });
            setHtml(bugBtn, "<svg width=\"16\" height=\"16\" viewBox=\"0 0 24 24\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"2\" stroke-linecap=\"round\" stroke-linejoin=\"round\"><path d=\"M8 2l1.88 1.88M14.12 3.88L16 2M9 7.13v-1a3.003 3.003 0 1 1 6 0v1\"/><path d=\"M12 20c-3.3 0-6-2.7-6-6v-3a4 4 0 0 1 4-4h4a4 4 0 0 1 4 4v3c0 3.3-2.7 6-6 6\"/><path d=\"M12 20v-9M6.53 9C4.6 8.8 3 7.1 3 5M6 13H2M6 17H3M21 5c0 2.1-1.6 3.8-3.53 4M18 13h4M21 17h-3\"/></svg><span>Bug Report</span>");
            bugBtn.addEventListener("click", ()=>{
                feedbackType = "bug";
                render();
            });
            typeCards.append(feedbackBtn, bugBtn);
            form.appendChild(typeCards);
            const submitBtn = h("button", {
                type: "submit",
                className: "sdt-support-submit"
            });
            setHtml(submitBtn, "Submit <svg width=\"14\" height=\"14\" viewBox=\"0 0 24 24\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"2.5\" stroke-linecap=\"round\" stroke-linejoin=\"round\"><line x1=\"5\" y1=\"12\" x2=\"19\" y2=\"12\"/><polyline points=\"12 5 19 12 12 19\"/></svg>");
            submitBtn.disabled = status === "submitting";
            form.appendChild(submitBtn);
            const channels = h("div", {
                className: "sdt-support-channels"
            });
            channels.innerHTML = `
        <a href="https://discord.stack-auth.com" target="_blank" rel="noopener noreferrer" class="sdt-support-channel">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028c.462-.63.874-1.295 1.226-1.994a.076.076 0 0 0-.041-.106 13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.892.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.095 2.157 2.42 0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.095 2.157 2.42 0 1.333-.946 2.418-2.157 2.418z"/></svg>
          <span>Discord</span>
        </a>
        <a href="mailto:team@stack-auth.com" class="sdt-support-channel">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="4" width="20" height="16" rx="2"/><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/></svg>
          <span>Email</span>
        </a>
        <a href="https://github.com/hexclave/stack-auth" target="_blank" rel="noopener noreferrer" class="sdt-support-channel">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M12 0C5.374 0 0 5.373 0 12c0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23A11.509 11.509 0 0 1 12 5.803c1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576C20.566 21.797 24 17.3 24 12c0-6.627-5.373-12-12-12z"/></svg>
          <span>GitHub</span>
        </a>`;
            form.appendChild(channels);
            form.insertBefore(channels, form.firstChild);
        }
        form.addEventListener("submit", (e)=>{
            e.preventDefault();
            if (!emailInput.value.trim() || !messageInput.value.trim()) return;
            (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f40$stackframe$2b$stack$2d$shared$40$2$2e$8$2e$108_$40$types$2b$react$2d$dom$40$18$2e$3$2e$7_$40$types$2b$react$40$18$2e$3$2e$31_$5f40$types$2b$react$40$1_c6byygfw5qeklygubnzywcb44y$2f$node_modules$2f40$stackframe$2f$stack$2d$shared$2f$dist$2f$esm$2f$utils$2f$promises$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["runAsynchronously"])(async ()=>{
                status = "submitting";
                render();
                try {
                    const response = await fetch(`${apiBaseUrl}/api/latest/internal/feedback`, {
                        method: "POST",
                        headers: {
                            "Content-Type": "application/json",
                            "Accept": "application/json"
                        },
                        body: JSON.stringify({
                            name: nameInput.value.trim() || void 0,
                            email: emailInput.value.trim(),
                            message: messageInput.value.trim(),
                            feedback_type: feedbackType
                        })
                    });
                    if (!response.ok) throw new Error(`Failed to send: ${response.status} ${response.statusText}`);
                    const result = await response.json();
                    if (!result.success) throw new Error(result.message || "Failed to send feedback");
                    status = "success";
                    messageInput.value = "";
                } catch (err) {
                    status = "error";
                    errorMessage = err.message || "An unexpected error occurred";
                }
                render();
            });
        });
        render();
        pane.appendChild(form);
        return pane;
    }
    container.appendChild(createFeedbackForm());
    return container;
}
function createComponentsTab(app) {
    const container = h("div", {
        className: "sdt-pg-layout"
    });
    const apiBaseUrl = resolveApiBaseUrl(app);
    const urls = app.urls;
    const urlOptions = app[__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f40$stackframe$2b$stack$40$2$2e$8$2e$108_$40$types$2b$react$2d$dom$40$18$2e$3$2e$7_$40$types$2b$react$40$18$2e$3$2e$31_$5f40$types$2b$react$40$18$2e$3$2e$31_$5f$tqjf7xvnucvjx6rf5f5n65ykji$2f$node_modules$2f40$stackframe$2f$stack$2f$dist$2f$esm$2f$lib$2f$stack$2d$app$2f$common$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["stackAppInternalsSymbol"]].getConstructorOptions().urls ?? {};
    const PAGE_ENTRIES = [
        {
            key: "signIn",
            label: "Sign-in"
        },
        {
            key: "signUp",
            label: "Sign-up"
        },
        {
            key: "forgotPassword",
            label: "Forgot password"
        },
        {
            key: "passwordReset",
            label: "Password reset"
        },
        {
            key: "emailVerification",
            label: "Email verification"
        },
        {
            key: "accountSettings",
            label: "Account settings"
        },
        {
            key: "teamInvitation",
            label: "Team invitation"
        },
        {
            key: "cliAuthConfirm",
            label: "CLI auth confirmation"
        },
        {
            key: "mfa",
            label: "MFA"
        },
        {
            key: "onboarding",
            label: "Onboarding"
        },
        {
            key: "error",
            label: "Error"
        }
    ];
    function classifyPage(key) {
        const target = urlOptions[key] ?? urlOptions.default ?? {
            type: "handler-component"
        };
        if (typeof target === "string") return {
            classification: "custom",
            version: null
        };
        if ("type" in target) {
            if (target.type === "custom") return {
                classification: "custom",
                version: target.version ?? null
            };
            return {
                classification: target.type,
                version: null
            };
        }
        return {
            classification: "handler-component",
            version: null
        };
    }
    let latestVersions = null;
    let selectedKey = null;
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f40$stackframe$2b$stack$2d$shared$40$2$2e$8$2e$108_$40$types$2b$react$2d$dom$40$18$2e$3$2e$7_$40$types$2b$react$40$18$2e$3$2e$31_$5f40$types$2b$react$40$1_c6byygfw5qeklygubnzywcb44y$2f$node_modules$2f40$stackframe$2f$stack$2d$shared$2f$dist$2f$esm$2f$utils$2f$promises$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["runAsynchronously"])(fetch(`${apiBaseUrl}/api/latest/internal/component-versions`).then((r)=>r.json()).then((data)=>{
        latestVersions = new Map(Object.entries(data.versions ?? {}));
        renderSidebar();
    }).catch(()=>{}));
    function buildPages() {
        return PAGE_ENTRIES.map((entry)=>{
            const { classification, version } = classifyPage(entry.key);
            let versionStatus = "current";
            let versionChangelogs = [];
            if (classification === "custom" && version != null && latestVersions) {
                const info = latestVersions.get(entry.key);
                if (info && version < info.version) {
                    versionStatus = "outdated";
                    versionChangelogs = Object.entries(info.changelogs).map(([v, cl])=>({
                            version: Number(v),
                            changelog: cl
                        })).filter((e)=>e.version > version).sort((a, b)=>a.version - b.version);
                }
            }
            return {
                key: entry.key,
                label: entry.label,
                url: urls[entry.key] || "",
                classification,
                version,
                versionStatus,
                versionChangelogs
            };
        });
    }
    function getCompactUrl(url) {
        const resolved = new URL(url, window.location.origin);
        return `${resolved.pathname}${resolved.search}${resolved.hash}`;
    }
    const sidebar = h("div", {
        className: "sdt-pg-sidebar"
    });
    const mainArea = h("div", {
        className: "sdt-pg-main"
    });
    function renderSidebar() {
        sidebar.innerHTML = "";
        const pages = buildPages();
        const outdatedCount = pages.filter((p)=>p.versionStatus === "outdated").length;
        const head = h("div", {
            className: "sdt-pg-sidebar-head"
        });
        head.appendChild(h("span", {
            className: "sdt-pg-sidebar-title"
        }, "Pages"));
        head.appendChild(h("span", {
            className: "sdt-pg-sidebar-count"
        }, String(pages.length)));
        if (outdatedCount > 0) head.appendChild(h("span", {
            className: "sdt-pg-sidebar-warn"
        }, `${outdatedCount} outdated`));
        sidebar.appendChild(head);
        const list = h("div", {
            className: "sdt-pg-list"
        });
        for (const page of pages){
            const isOutdated = page.versionStatus === "outdated";
            const item = h("div", {
                className: `sdt-pg-item ${isOutdated ? "sdt-pg-item-warn" : ""}`,
                "data-selected": String(selectedKey === page.key)
            });
            const dotClass = isOutdated ? "sdt-pg-item-dot-warn" : page.classification === "custom" ? "sdt-pg-item-dot-custom" : "sdt-pg-item-dot-handler";
            item.appendChild(h("span", {
                className: `sdt-pg-item-dot ${dotClass}`
            }));
            item.appendChild(h("span", {
                className: "sdt-pg-item-label"
            }, page.label));
            if (isOutdated) item.appendChild(h("span", {
                className: "sdt-pg-badge sdt-pg-badge-outdated"
            }, "Outdated"));
            item.addEventListener("click", ()=>{
                selectedKey = page.key;
                renderSidebar();
                renderDetail(page);
            });
            list.appendChild(item);
        }
        sidebar.appendChild(list);
    }
    function renderDetail(page) {
        mainArea.innerHTML = "";
        const detail = h("div", {
            className: "sdt-pg-detail"
        });
        const header = h("div", {
            className: "sdt-pg-header"
        });
        const headerTop = h("div", {
            className: "sdt-pg-header-top"
        });
        headerTop.appendChild(h("h3", {
            className: "sdt-pg-title"
        }, `${page.label} Page`));
        headerTop.appendChild(h("a", {
            href: page.url,
            target: "_blank",
            rel: "noopener noreferrer",
            className: "sdt-pg-title-url"
        }, getCompactUrl(page.url)));
        if (page.versionStatus === "outdated") headerTop.appendChild(h("span", {
            className: "sdt-pg-badge sdt-pg-badge-outdated"
        }, "Outdated"));
        header.appendChild(headerTop);
        const redirectMethod = `stackApp.redirectTo${page.key.charAt(0).toUpperCase()}${page.key.slice(1)}()`;
        const codeRow = h("div", {
            className: "sdt-pg-code-inline"
        });
        codeRow.appendChild(h("code", {
            className: "sdt-pg-code"
        }, redirectMethod));
        const openBtn = h("button", {
            className: "sdt-pg-copy-btn sdt-pg-open-btn"
        });
        setHtml(openBtn, "Open <svg width=\"12\" height=\"12\" viewBox=\"0 0 24 24\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"2.25\" stroke-linecap=\"round\" stroke-linejoin=\"round\" aria-hidden=\"true\"><path d=\"M7 17L17 7\"/><path d=\"M7 7h10v10\"/></svg>");
        openBtn.addEventListener("click", ()=>{
            const resolved = new URL(page.url, window.location.origin);
            window.open(resolved.toString(), "_blank", "noopener,noreferrer");
        });
        codeRow.appendChild(openBtn);
        header.appendChild(codeRow);
        detail.appendChild(header);
        const prompt = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f40$stackframe$2b$stack$40$2$2e$8$2e$108_$40$types$2b$react$2d$dom$40$18$2e$3$2e$7_$40$types$2b$react$40$18$2e$3$2e$31_$5f40$types$2b$react$40$18$2e$3$2e$31_$5f$tqjf7xvnucvjx6rf5f5n65ykji$2f$node_modules$2f40$stackframe$2f$stack$2f$dist$2f$esm$2f$lib$2f$stack$2d$app$2f$url$2d$targets$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["getPagePrompt"])(page.key, page.version ?? void 0);
        if (prompt) {
            const isOutdated = page.versionStatus === "outdated";
            if (page.classification === "handler-component" || page.classification === "hosted" || isOutdated) {
                let promptText;
                if (isOutdated && prompt.upgradePrompt) promptText = prompt.upgradePrompt;
                else if (prompt.fullPrompt) promptText = prompt.fullPrompt;
                else promptText = "";
                if (promptText) {
                    const section = h("div", {
                        className: "sdt-pg-section"
                    });
                    section.appendChild(h("div", {
                        className: "sdt-pg-section-label"
                    }, isOutdated ? "Use this prompt to upgrade your component:" : "Want to customize this page? Paste this prompt into your coding agent."));
                    section.appendChild(h("pre", {
                        className: "sdt-pg-pre"
                    }, promptText));
                    const footer = h("div", {
                        className: "sdt-pg-section-footer"
                    });
                    const copyBtn = h("button", {
                        className: "sdt-pg-copy-btn"
                    }, "Copy prompt");
                    copyBtn.addEventListener("click", ()=>{
                        (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f40$stackframe$2b$stack$2d$shared$40$2$2e$8$2e$108_$40$types$2b$react$2d$dom$40$18$2e$3$2e$7_$40$types$2b$react$40$18$2e$3$2e$31_$5f40$types$2b$react$40$1_c6byygfw5qeklygubnzywcb44y$2f$node_modules$2f40$stackframe$2f$stack$2d$shared$2f$dist$2f$esm$2f$utils$2f$promises$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["runAsynchronously"])(navigator.clipboard.writeText(promptText).then(()=>{
                            copyBtn.textContent = "✓ Copied";
                            setTimeout(()=>{
                                copyBtn.textContent = "Copy prompt";
                            }, 1500);
                        }));
                    });
                    footer.appendChild(copyBtn);
                    section.appendChild(footer);
                    detail.appendChild(section);
                }
            }
        }
        mainArea.appendChild(detail);
    }
    function renderEmptyMain() {
        mainArea.innerHTML = "";
        const empty = h("div", {
            className: "sdt-pg-empty"
        });
        const icon = h("div", {
            className: "sdt-pg-empty-icon"
        });
        setHtml(icon, "<svg width=\"32\" height=\"32\" viewBox=\"0 0 24 24\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"1.5\" stroke-linecap=\"round\" stroke-linejoin=\"round\"><rect x=\"3\" y=\"3\" width=\"7\" height=\"7\" rx=\"1\"/><rect x=\"14\" y=\"3\" width=\"7\" height=\"7\" rx=\"1\"/><rect x=\"3\" y=\"14\" width=\"7\" height=\"7\" rx=\"1\"/><rect x=\"14\" y=\"14\" width=\"7\" height=\"7\" rx=\"1\"/></svg>");
        empty.appendChild(icon);
        empty.appendChild(h("div", {
            className: "sdt-pg-empty-text"
        }, "Select a page to inspect"));
        empty.appendChild(h("div", {
            className: "sdt-pg-empty-sub"
        }, "View configuration, preview, and upgrade prompts"));
        mainArea.appendChild(empty);
    }
    renderSidebar();
    renderEmptyMain();
    container.append(sidebar, mainArea);
    return container;
}
function createPanel(app, state, logStore, onClose) {
    const panel = h("div", {
        className: "sdt-panel"
    });
    let panelAnimationTimeout = null;
    function animateNextPanelGeometryChange() {
        panel.classList.add("sdt-panel-geometry-animated");
        if (panelAnimationTimeout !== null) clearTimeout(panelAnimationTimeout);
        panelAnimationTimeout = setTimeout(()=>{
            panel.classList.remove("sdt-panel-geometry-animated");
            panelAnimationTimeout = null;
        }, 220);
    }
    function applyPanelMode(tabId, opts) {
        if (opts?.animate === true) animateNextPanelGeometryChange();
        if (tabId === "dashboard") {
            panel.classList.add("sdt-panel-fullscreen");
            panel.style.width = "";
            panel.style.height = "";
            return;
        }
        panel.classList.remove("sdt-panel-fullscreen");
        panel.style.width = state.get().panelWidth + "px";
        panel.style.height = state.get().panelHeight + "px";
    }
    const tabs = getTabsForApp(app);
    const storedActiveTab = state.get().activeTab;
    const activeTab = tabs.some((tab)=>tab.id === storedActiveTab) ? storedActiveTab : DEFAULT_STATE.activeTab;
    applyPanelMode(activeTab);
    const inner = h("div", {
        className: "sdt-panel-inner"
    });
    const closeBtn = h("button", {
        className: "sdt-close-btn",
        "aria-label": "Close"
    });
    setHtml(closeBtn, "<svg width=\"14\" height=\"14\" viewBox=\"0 0 14 14\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"2\" stroke-linecap=\"round\"><line x1=\"3\" y1=\"3\" x2=\"11\" y2=\"11\"/><line x1=\"11\" y1=\"3\" x2=\"3\" y2=\"11\"/></svg>");
    closeBtn.addEventListener("click", onClose);
    const docsLink = h("a", {
        href: DOCS_URL,
        target: "_blank",
        rel: "noopener noreferrer",
        className: "sdt-docs-link"
    });
    docsLink.appendChild(document.createTextNode("Docs"));
    const docsIcon = h("span", {
        className: "sdt-docs-link-icon",
        "aria-hidden": "true"
    });
    setHtml(docsIcon, "<svg width=\"13\" height=\"13\" viewBox=\"0 0 24 24\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"2.25\" stroke-linecap=\"round\" stroke-linejoin=\"round\"><path d=\"M7 17L17 7\"/><path d=\"M7 7h10v10\"/></svg>");
    docsLink.appendChild(docsIcon);
    const tabBar = createTabBar(tabs, activeTab, (id)=>{
        state.update({
            activeTab: id
        });
        applyPanelMode(id, {
            animate: true
        });
        showTab(id);
    }, {
        trailing: h("div", {
            className: "sdt-tabbar-actions"
        }, docsLink, closeBtn)
    });
    inner.appendChild(tabBar.el);
    const content = h("div", {
        className: "sdt-content"
    });
    const layers = h("div", {
        className: "sdt-tab-layers"
    });
    content.appendChild(layers);
    inner.appendChild(content);
    const mountedPanes = /* @__PURE__ */ new Map();
    const cleanups = [];
    function mountTab(pane, result) {
        if ("element" in result) {
            pane.appendChild(result.element);
            if (result.cleanup) cleanups.push(result.cleanup);
        } else pane.appendChild(result);
    }
    function getOrCreatePane(tabId) {
        if (mountedPanes.has(tabId)) return mountedPanes.get(tabId);
        const pane = h("div", {
            className: "sdt-tab-pane"
        });
        if (tabId === "dashboard") pane.classList.add("sdt-tab-pane-iframe");
        switch(tabId){
            case "overview":
                mountTab(pane, createOverviewTab(app));
                break;
            case "customize":
                mountTab(pane, createComponentsTab(app));
                break;
            case "ai":
                mountTab(pane, createAITab(app));
                break;
            case "console":
                mountTab(pane, createConsoleTab(logStore));
                break;
            case "dashboard":
                mountTab(pane, createDashboardTab(app));
                break;
            case "support":
                mountTab(pane, createSupportTab(app));
                break;
        }
        mountedPanes.set(tabId, pane);
        layers.appendChild(pane);
        return pane;
    }
    function showTab(tabId) {
        const pane = getOrCreatePane(tabId);
        tabBar.setActive(tabId);
        for (const [, p] of mountedPanes)p.classList.remove("sdt-tab-pane-active");
        pane.classList.add("sdt-tab-pane-active");
    }
    showTab(activeTab);
    function addResizeHandle(edge) {
        const handle = h("div", {
            className: `sdt-resize-handle sdt-resize-${edge}`
        });
        let startX = 0;
        let startY = 0;
        let startW = 0;
        let startH = 0;
        handle.addEventListener("pointerdown", (e)=>{
            e.preventDefault();
            if (panelAnimationTimeout !== null) {
                clearTimeout(panelAnimationTimeout);
                panelAnimationTimeout = null;
            }
            panel.classList.remove("sdt-panel-geometry-animated");
            handle.setPointerCapture(e.pointerId);
            startX = e.clientX;
            startY = e.clientY;
            startW = panel.offsetWidth;
            startH = panel.offsetHeight;
        });
        handle.addEventListener("pointermove", (e)=>{
            if (!handle.hasPointerCapture(e.pointerId)) return;
            const dx = startX - e.clientX;
            const dy = startY - e.clientY;
            if (edge === "left" || edge === "top-left") {
                const newW = Math.max(400, Math.min(startW + dx, window.innerWidth - 32));
                panel.style.width = newW + "px";
            }
            if (edge === "top" || edge === "top-left") {
                const newH = Math.max(300, Math.min(startH + dy, window.innerHeight - 80));
                panel.style.height = newH + "px";
            }
        });
        handle.addEventListener("pointerup", (e)=>{
            handle.releasePointerCapture(e.pointerId);
            state.update({
                panelWidth: panel.offsetWidth,
                panelHeight: panel.offsetHeight
            });
        });
        panel.appendChild(handle);
    }
    addResizeHandle("top");
    addResizeHandle("left");
    addResizeHandle("top-left");
    panel.appendChild(inner);
    return {
        element: panel,
        cleanup: ()=>{
            if (panelAnimationTimeout !== null) clearTimeout(panelAnimationTimeout);
            for (const fn of cleanups)fn();
        }
    };
}
function createDevTool(app) {
    if (typeof document === "undefined" || typeof document.createElement !== "function") return ()=>{};
    const body = Reflect.get(document, "body");
    if (!hasAppendChild(body)) return ()=>{};
    getGlobalDevToolInstance()?.cleanup();
    let existingRoot = document.getElementById(ROOT_ID);
    while(existingRoot !== null){
        existingRoot.remove();
        existingRoot = document.getElementById(ROOT_ID);
    }
    const root = document.createElement("div");
    root.id = ROOT_ID;
    body.appendChild(root);
    const wrapper = h("div", {
        className: "stack-devtool"
    });
    root.appendChild(wrapper);
    const style = document.createElement("style");
    style.textContent = __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f40$stackframe$2b$stack$40$2$2e$8$2e$108_$40$types$2b$react$2d$dom$40$18$2e$3$2e$7_$40$types$2b$react$40$18$2e$3$2e$31_$5f40$types$2b$react$40$18$2e$3$2e$31_$5f$tqjf7xvnucvjx6rf5f5n65ykji$2f$node_modules$2f40$stackframe$2f$stack$2f$dist$2f$esm$2f$dev$2d$tool$2f$dev$2d$tool$2d$styles$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["devToolCSS"];
    wrapper.appendChild(style);
    const state = createStateStore();
    const logStore = getGlobalLogStore();
    let panel = null;
    function closePanelAndPersistClosed() {
        closePanel();
    }
    function openPanel() {
        if (panel) return;
        panel = createPanel(app, state, logStore, closePanelAndPersistClosed);
        wrapper.appendChild(panel.element);
    }
    function closePanel() {
        if (!panel) return;
        state.update({
            isOpen: false
        });
        const closing = panel;
        panel = null;
        closing.cleanup();
        closing.element.classList.add("sdt-panel-exiting");
        setTimeout(()=>{
            if (wrapper.contains(closing.element)) wrapper.removeChild(closing.element);
        }, 150);
    }
    function togglePanel() {
        if (state.get().isOpen) closePanel();
        else {
            state.update({
                isOpen: true
            });
            openPanel();
        }
    }
    const trigger = createTrigger(togglePanel);
    wrapper.appendChild(trigger.element);
    if (state.get().isOpen) openPanel();
    const removeRequestListener = app[__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f40$stackframe$2b$stack$40$2$2e$8$2e$108_$40$types$2b$react$2d$dom$40$18$2e$3$2e$7_$40$types$2b$react$40$18$2e$3$2e$31_$5f40$types$2b$react$40$18$2e$3$2e$31_$5f$tqjf7xvnucvjx6rf5f5n65ykji$2f$node_modules$2f40$stackframe$2f$stack$2f$dist$2f$esm$2f$lib$2f$stack$2d$app$2f$common$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["stackAppInternalsSymbol"]].addRequestListener((entry)=>{
        const timestamp = Date.now();
        logStore.addApiLog({
            id: nextId(),
            timestamp,
            method: entry.method,
            url: entry.path,
            status: entry.status,
            duration: entry.duration,
            error: entry.error
        });
        if (entry.error) logStore.addEventLog({
            id: nextId(),
            timestamp,
            type: "error",
            message: `Network error on ${entry.method} ${entry.path}: ${entry.error}`
        });
        else if (entry.status && entry.status >= 400) logStore.addEventLog({
            id: nextId(),
            timestamp,
            type: "error",
            message: `API error ${entry.status} on ${entry.method} ${entry.path}`
        });
    });
    let didCleanup = false;
    const instance = {
        cleanup: ()=>{
            if (didCleanup) return;
            didCleanup = true;
            if (getGlobalDevToolInstance() === instance) setGlobalDevToolInstance(null);
            trigger.cleanup();
            removeRequestListener();
            panel?.cleanup();
            if (root.parentNode) root.parentNode.removeChild(root);
        }
    };
    setGlobalDevToolInstance(instance);
    return ()=>{
        instance.cleanup();
    };
}
;
}),
]);

//# sourceMappingURL=1tv8_%40stackframe_stack_dist_esm_dev-tool_0pzhrx3._.js.map