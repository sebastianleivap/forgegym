import { useEffect } from 'react'

export const COLORS = ['#2d5a3d','#5b6dd9','#c8a96e','#e07b8a','#8d5bd9','#d97b5b','#5bd9b0','#d95b5b']
export const initials = name => name ? name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase() : '??'
export const avatarColor = name => COLORS[name ? name.charCodeAt(0) % COLORS.length : 0]

export function Spinner() {
  const handleExit = async () => {
    const { createClient } = await import('@supabase/supabase-js')
    const sb = createClient(
      import.meta.env.VITE_SUPABASE_URL,
      import.meta.env.VITE_SUPABASE_ANON_KEY
    )
    await sb.auth.signOut()
    window.location.href = '/'
  }
  return (
    <div className="spinner-wrap">
      <div className="spinner" />
      <button onClick={handleExit} style={{
        marginTop: 32, background: 'none', border: '1px solid var(--border)',
        borderRadius: 8, padding: '8px 16px', fontSize: 13, color: 'var(--ink2)',
        cursor: 'pointer', fontFamily: 'DM Sans, sans-serif'
      }}>
        ¿Cargando demasiado? Salir
      </button>
    </div>
  )
}

export function Toast({ msg, onDone }) {
  useEffect(() => { const t = setTimeout(onDone, 2800); return () => clearTimeout(t) }, [])
  return <div className="toast"><span>✓</span>{msg}</div>
}

export function NotifPanel({ notifs, onClear }) {
  return (
    <div className="notif-panel">
      <div className="notif-hdr">
        <h3>Notificaciones <span style={{ color: 'var(--accent2)', fontSize: 12 }}>({notifs.filter(n => !n.read).length} nuevas)</span></h3>
        <button className="notif-clear" onClick={onClear}>Marcar leídas</button>
      </div>
      {notifs.length === 0
        ? <div style={{ padding: '20px', textAlign: 'center', color: 'var(--ink2)', fontSize: 13 }}>Sin notificaciones</div>
        : notifs.map(n => (
          <div className="ni" key={n.id}>
            <div className={`ni-icon ${n.type}`}>{n.icon}</div>
            <div className="ni-text"><p>{n.text}</p><span>{n.time}</span></div>
            {!n.read && <div className="ni-dot" />}
          </div>
        ))}
    </div>
  )
}

export function EmptyState({ icon, title, desc }) {
  return (
    <div className="empty-state">
      <div className="ei">{icon}</div>
      <h3>{title}</h3>
      <p>{desc}</p>
    </div>
  )
}

export function Modal({ title, sub, onClose, children, actions }) {
  return (
    <div className="modal-ov" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal">
        {title && <div className="modal-title">{title}</div>}
        {sub   && <div className="modal-sub">{sub}</div>}
        {children}
        {actions && <div className="modal-actions">{actions}</div>}
      </div>
    </div>
  )
}

export function Avatar({ name, size = 44, radius = '14px' }) {
  return (
    <div className="pa avatar" style={{ width: size, height: size, background: avatarColor(name), borderRadius: radius, fontSize: Math.round(size * 0.32) }}>
      {initials(name)}
    </div>
  )
}
