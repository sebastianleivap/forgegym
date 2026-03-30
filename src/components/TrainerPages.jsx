import { useState, useEffect } from 'react'
import { supabase } from '../supabase.js'
import { Avatar, EmptyState } from './UI.jsx'

const DEMO_SCHED = [
  { time: '6:00 AM',  client: 'Marcos Silva',  type: 'HIIT',   status: 'confirmed' },
  { time: '7:00 AM',  client: 'Laura Torres',  type: 'Fuerza', status: 'confirmed' },
  { time: '7:30 AM',  client: 'Valeria Soto',  type: 'HIIT',   status: 'pending'   },
  { time: '8:00 AM',  client: null,            type: null,     status: 'available' },
  { time: '9:00 AM',  client: 'Pedro Navarro', type: 'Yoga',   status: 'confirmed' },
  { time: '10:00 AM', client: null,            type: null,     status: 'available' },
  { time: '11:00 AM', client: 'Daniela Ríos',  type: 'Fuerza', status: 'confirmed' },
]

// ── Colores por entrenador ──
const TRAINER_COLORS = ['#2d5a3d','#5b6dd9','#c8a96e','#e07b8a','#8d5bd9','#d97b5b']

// ── Modal de detalle ──
function DetailModal({ title, onClose, children }) {
  return (
    <div className="sheet-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="sheet" style={{ maxHeight: '85vh' }}>
        <div className="sheet-handle" />
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
          <h2 style={{ fontFamily: "'DM Serif Display', serif", fontSize: 20 }}>{title}</h2>
          <button onClick={onClose} style={{ background: 'none', border: 'none', fontSize: 20, cursor: 'pointer', color: 'var(--ink2)' }}>✕</button>
        </div>
        {children}
      </div>
    </div>
  )
}

// ── Stat card clickeable ──
function ClickableStat({ label, value, sub, color, onClick }) {
  return (
    <div className={`sc ${color || ''}`} onClick={onClick}
      style={{ cursor: 'pointer', transition: 'transform .15s, box-shadow .15s' }}
      onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = 'var(--sh-lg)' }}
      onMouseLeave={e => { e.currentTarget.style.transform = ''; e.currentTarget.style.boxShadow = '' }}>
      <div className="sc-label">{label}</div>
      <div className="sc-val">{value}</div>
      <div className="sc-sub">{sub}</div>
      <div style={{ fontSize: 10, color: 'var(--accent)', marginTop: 6, fontWeight: 600 }}>Ver detalle →</div>
    </div>
  )
}

// ── Calendario compartido de entrenadores ──
function SharedCalendar({ trainers }) {
  const days = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb']
  const hours = ['6:00', '7:00', '8:00', '9:00', '10:00', '11:00', '12:00', '17:00', '18:00', '19:00']
  const MAX_CAPACITY = 3
  const [selected, setSelected] = useState(null) // { day, hour, evts }

  // Datos demo con alumnos por bloque
  const events = [
    { day: 0, hour: '6:00',  trainer: 'Carlos',  color: TRAINER_COLORS[0], students: ['María González', 'José Pérez'] },
    { day: 0, hour: '7:00',  trainer: 'Carlos',  color: TRAINER_COLORS[0], students: ['Laura Torres', 'Diego Muñoz', 'Ana Soto'] },
    { day: 0, hour: '7:00',  trainer: 'Sofía',   color: TRAINER_COLORS[1], students: ['Roberto Vega'] },
    { day: 0, hour: '9:00',  trainer: 'Andrés',  color: TRAINER_COLORS[2], students: ['Paula Rojas', 'Felipe Castro'] },
    { day: 1, hour: '6:00',  trainer: 'Sofía',   color: TRAINER_COLORS[1], students: ['Carmen López', 'Ignacio Díaz', 'Valentina Ruiz'] },
    { day: 1, hour: '8:00',  trainer: 'Carlos',  color: TRAINER_COLORS[0], students: ['Daniela Ríos'] },
    { day: 1, hour: '18:00', trainer: 'Andrés',  color: TRAINER_COLORS[2], students: ['Marcos Silva', 'Valeria Soto'] },
    { day: 2, hour: '7:00',  trainer: 'Carlos',  color: TRAINER_COLORS[0], students: ['Laura Torres', 'Pedro Navarro'] },
    { day: 2, hour: '7:00',  trainer: 'Sofía',   color: TRAINER_COLORS[1], students: ['Carmen López', 'Roberto Vega'] },
    { day: 2, hour: '10:00', trainer: 'Andrés',  color: TRAINER_COLORS[2], students: ['Felipe Castro'] },
    { day: 3, hour: '6:00',  trainer: 'Carlos',  color: TRAINER_COLORS[0], students: ['María González', 'José Pérez', 'Ana Soto'] },
    { day: 3, hour: '17:00', trainer: 'Sofía',   color: TRAINER_COLORS[1], students: ['Valentina Ruiz', 'Ignacio Díaz'] },
    { day: 4, hour: '8:00',  trainer: 'Carlos',  color: TRAINER_COLORS[0], students: ['Diego Muñoz', 'Daniela Ríos'] },
    { day: 4, hour: '9:00',  trainer: 'Andrés',  color: TRAINER_COLORS[2], students: ['Paula Rojas', 'Marcos Silva', 'Felipe Castro'] },
    { day: 5, hour: '10:00', trainer: 'Sofía',   color: TRAINER_COLORS[1], students: ['Valeria Soto'] },
  ]

  const getEvents = (day, hour) => events.filter(e => e.day === day && e.hour === hour)
  const getTotalStudents = (day, hour) => getEvents(day, hour).reduce((a, e) => a + e.students.length, 0)
  const isFull = (day, hour) => getTotalStudents(day, hour) >= MAX_CAPACITY

  const handleBlockClick = (di, hour) => {
    const evts = getEvents(di, hour)
    if (evts.length > 0) setSelected({ day: days[di], hour, evts })
  }

  return (
    <div>
      {/* Leyenda */}
      <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginBottom: 20 }}>
        {['Carlos', 'Sofía', 'Andrés'].map((t, i) => (
          <div key={t} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12 }}>
            <div style={{ width: 12, height: 12, borderRadius: '50%', background: TRAINER_COLORS[i] }} />
            <span>{t}</span>
          </div>
        ))}
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, marginLeft: 'auto' }}>
          <div style={{ width: 12, height: 12, borderRadius: 3, background: '#fbeaea', border: '1px solid #f5c6c6' }} />
          <span style={{ color: 'var(--danger)' }}>Lleno ({MAX_CAPACITY}/{MAX_CAPACITY})</span>
        </div>
      </div>
      <p style={{ fontSize: 12, color: 'var(--ink2)', marginBottom: 12 }}>💡 Toca cualquier bloque ocupado para ver los alumnos agendados</p>

      {/* Grid */}
      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 500 }}>
          <thead>
            <tr>
              <th style={{ width: 60, padding: '8px 12px 8px 0', fontSize: 11, color: 'var(--ink2)', textAlign: 'right' }}>Hora</th>
              {days.map(d => (
                <th key={d} style={{ padding: '8px 4px', fontSize: 12, fontWeight: 600, color: 'var(--ink)', textAlign: 'center' }}>{d}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {hours.map(hour => (
              <tr key={hour}>
                <td style={{ padding: '4px 12px 4px 0', fontSize: 11, color: 'var(--ink2)', textAlign: 'right', whiteSpace: 'nowrap', borderTop: '1px solid var(--border)' }}>{hour}</td>
                {days.map((d, di) => {
                  const evts = getEvents(di, hour)
                  const full = isFull(di, hour)
                  const total = getTotalStudents(di, hour)
                  const hasEvents = evts.length > 0
                  return (
                    <td key={di} style={{ padding: '3px', borderTop: '1px solid var(--border)', verticalAlign: 'top', minWidth: 70 }}>
                      {hasEvents ? (
                        <div
                          onClick={() => handleBlockClick(di, hour)}
                          style={{
                            background: full ? '#fbeaea' : 'var(--surface2)',
                            border: `1px solid ${full ? '#f5c6c6' : 'var(--border)'}`,
                            borderRadius: 6, padding: '4px 6px', fontSize: 10,
                            cursor: 'pointer', transition: 'all .15s',
                          }}
                          onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--accent)'; e.currentTarget.style.transform = 'scale(1.03)' }}
                          onMouseLeave={e => { e.currentTarget.style.borderColor = full ? '#f5c6c6' : 'var(--border)'; e.currentTarget.style.transform = '' }}>
                          <div style={{ display: 'flex', gap: 3, marginBottom: 3, flexWrap: 'wrap' }}>
                            {evts.map((e, ei) => (
                              <div key={ei} style={{ width: 8, height: 8, borderRadius: '50%', background: e.color }} title={e.trainer} />
                            ))}
                          </div>
                          <div style={{ color: full ? 'var(--danger)' : 'var(--ink2)', fontWeight: full ? 700 : 400 }}>
                            {total}/{MAX_CAPACITY} {full ? '🔴' : ''}
                          </div>
                        </div>
                      ) : (
                        <div style={{ padding: '4px 6px', fontSize: 10, color: 'var(--accent)', opacity: 0.5 }}>libre</div>
                      )}
                    </td>
                  )
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p style={{ fontSize: 11, color: 'var(--ink2)', marginTop: 12 }}>
        * Capacidad máxima: {MAX_CAPACITY} alumnos por bloque horario.
      </p>

      {/* Popup de alumnos del bloque */}
      {selected && (
        <div className="sheet-overlay" onClick={e => e.target === e.currentTarget && setSelected(null)}>
          <div className="sheet">
            <div className="sheet-handle" />
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
              <div>
                <h2 style={{ fontFamily: "'DM Serif Display', serif", fontSize: 20 }}>
                  {selected.day} · {selected.hour}
                </h2>
                <p style={{ fontSize: 13, color: 'var(--ink2)', marginTop: 2 }}>
                  {selected.evts.reduce((a, e) => a + e.students.length, 0)} alumnos agendados
                </p>
              </div>
              <button onClick={() => setSelected(null)} style={{ background: 'none', border: 'none', fontSize: 20, cursor: 'pointer', color: 'var(--ink2)' }}>✕</button>
            </div>

            {selected.evts.map((evt, ei) => (
              <div key={ei} style={{ marginBottom: ei < selected.evts.length - 1 ? 20 : 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
                  <div style={{ width: 10, height: 10, borderRadius: '50%', background: evt.color }} />
                  <span style={{ fontWeight: 600, fontSize: 14 }}>{evt.trainer}</span>
                  <span className="chip" style={{ fontSize: 11 }}>{evt.students.length} alumno{evt.students.length !== 1 ? 's' : ''}</span>
                </div>
                {evt.students.map((s, si) => (
                  <div key={si} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 14px', background: 'var(--surface2)', borderRadius: 10, marginBottom: 6 }}>
                    <div style={{ width: 34, height: 34, borderRadius: '50%', background: evt.color, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 700, color: 'white', flexShrink: 0 }}>
                      {s.split(' ').map(w => w[0]).join('').slice(0, 2)}
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 14, fontWeight: 500 }}>{s}</div>
                      <div style={{ fontSize: 11, color: 'var(--ink2)' }}>Sesión confirmada · 60 min</div>
                    </div>
                    <span className="sbadge ok">✓</span>
                  </div>
                ))}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

// ── Dashboard del entrenador ──
const DEMO_EMAIL = ['demo.gimnasio@forgegym.cl', 'demo.entrenador@forgegym.cl', 'demo.alumno@forgegym.cl']
const isDemo = (email) => DEMO_EMAIL.includes(email)

export function TrainerDashboard({ profile, onNewSession, clients, onNavigate, sessions = [] }) {
  const [modal, setModal] = useState(null)
  const today = new Date().toLocaleDateString('es-CL', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })
  const demo = isDemo(profile?.email)

  // Sesiones de hoy (reales)
  const todayStr = new Date().toISOString().split('T')[0]
  const todaySessions = sessions.filter(s => s.date === todayStr)
  const weekSessions = sessions.filter(s => {
    const d = new Date(s.date)
    const now = new Date()
    const monday = new Date(now)
    monday.setDate(now.getDate() - (now.getDay() === 0 ? 6 : now.getDay() - 1))
    const sunday = new Date(monday)
    sunday.setDate(monday.getDate() + 6)
    return d >= monday && d <= sunday
  })

  return (
    <div className="page">
      <div className="sh-row">
        <div className="sh-row-left">
          <h1>Buenos días, {profile?.name?.split(' ')[0] || 'Entrenador'} ☀️</h1>
          <p style={{ textTransform: 'capitalize' }}>{today} · {clients.length} alumnos activos</p>
        </div>
        <button className="btn btn-p" onClick={onNewSession}>+ Nueva sesión</button>
      </div>

      {/* Código del gimnasio — solo para admin/gimnasio */}
      {profile?.role === 'admin' && (
        <div style={{ background: 'var(--accent)', color: 'white', borderRadius: 12, padding: '16px 20px', marginBottom: 24, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <div style={{ fontSize: 12, opacity: 0.8, marginBottom: 4, textTransform: 'uppercase', letterSpacing: 0.5 }}>Código de invitación de tu gimnasio</div>
            <div style={{ fontFamily: "'DM Serif Display', serif", fontSize: 28, letterSpacing: 4 }}>
              {profile?.gym_invite_code || 'Cargando...'}
            </div>
            <div style={{ fontSize: 12, opacity: 0.75, marginTop: 4 }}>Comparte este código con tus entrenadores y alumnos al registrarse</div>
          </div>
          <button
            onClick={() => { navigator.clipboard.writeText(profile?.gym_invite_code || ''); alert('Código copiado') }}
            style={{ background: 'white', color: 'var(--accent)', border: 'none', borderRadius: 8, padding: '8px 16px', fontWeight: 600, fontSize: 13, cursor: 'pointer', fontFamily: 'DM Sans, sans-serif' }}>
            📋 Copiar
          </button>
        </div>
      )}

      {/* Stats clickeables */}
      <div className="g4" style={{ marginBottom: 24 }}>
        <ClickableStat label="Sesiones hoy" value={demo ? 4 : todaySessions.length} sub={demo ? '3 confirmadas · 1 pendiente' : `${todaySessions.length} agendadas`}
          onClick={() => setModal('sesiones')} />
        <ClickableStat label="Alumnos activos" value={clients.length} sub="en tu programa"
          color="gold" onClick={() => onNavigate('alumnos')} />
        <ClickableStat label="Esta semana" value={demo ? 12 : weekSessions.length} sub="sesiones totales"
          color="blue" onClick={() => setModal('semana')} />
        <ClickableStat label="Asistencia" value={demo ? '94%' : clients.length > 0 ? '—' : 'Sin datos'} sub="promedio mensual"
          onClick={() => setModal('asistencia')} />
      </div>

      <div className="g2" style={{ gap: 24 }}>
        {/* Agenda de hoy — real o demo */}
        <div className="card cp">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
            <h2 className="card-title" style={{ marginBottom: 0 }}>Agenda de hoy</h2>
            <span className="tag tg">{demo ? 4 : todaySessions.length} sesiones</span>
          </div>
          {demo ? (
            <div className="sg">
              {DEMO_SCHED.map((s, i) => (
                <>
                  <div className="ts" key={`t${i}`}>{s.time}</div>
                  <div className="ss" key={`s${i}`}>
                    {s.status === 'available'
                      ? <div className="sb avail" onClick={onNewSession}>+ Disponible</div>
                      : <div className="sb booked">
                          <div>
                            <div style={{ fontWeight: 500, color: 'var(--accent)' }}>{s.client}</div>
                            <div style={{ fontSize: 11, color: 'var(--ink2)', marginTop: 2 }}>{s.type}</div>
                          </div>
                          <span className={`sbadge ${s.status === 'confirmed' ? 'ok' : 'pend'}`}>
                            {s.status === 'confirmed' ? 'Confirmado' : 'Pendiente'}
                          </span>
                        </div>}
                  </div>
                </>
              ))}
            </div>
          ) : todaySessions.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '28px 0', color: 'var(--ink2)' }}>
              <div style={{ fontSize: 32, marginBottom: 10 }}>📅</div>
              <p style={{ fontSize: 14, marginBottom: 12 }}>Sin sesiones para hoy</p>
              <button className="btn btn-p btn-sm" onClick={onNewSession}>+ Agendar sesión</button>
            </div>
          ) : (
            <div className="sg">
              {todaySessions.map((s, i) => (
                <>
                  <div className="ts" key={`t${i}`}>{s.time?.slice(0,5)}</div>
                  <div className="ss" key={`s${i}`}>
                    <div className="sb booked">
                      <div>
                        <div style={{ fontWeight: 500, color: 'var(--accent)' }}>{s.client_email}</div>
                        <div style={{ fontSize: 11, color: 'var(--ink2)', marginTop: 2 }}>{s.type}</div>
                      </div>
                      <span className="sbadge ok">Confirmado</span>
                    </div>
                  </div>
                </>
              ))}
            </div>
          )}
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          <div className="card cp">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <h2 className="card-title" style={{ marginBottom: 0 }}>Mis alumnos</h2>
              <button className="btn btn-s btn-sm" onClick={() => onNavigate('alumnos')}>Ver todos</button>
            </div>
            {clients.length === 0
              ? <div style={{ textAlign: 'center', padding: '16px 0', color: 'var(--ink2)' }}>
                  <p style={{ fontSize: 14 }}>Aún no tienes alumnos registrados.</p>
                  <p style={{ fontSize: 12, marginTop: 6 }}>Comparte tu código de gimnasio para que se unan.</p>
                </div>
              : clients.slice(0, 4).map(c => (
                <div key={c.id} style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 14 }}>
                  <Avatar name={c.name} size={36} radius="10px" />
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 14, fontWeight: 500 }}>{c.name}</div>
                    <div style={{ fontSize: 12, color: 'var(--ink2)' }}>{c.email}</div>
                  </div>
                  <span className="tag tg" style={{ fontSize: 10 }}>Activo</span>
                </div>
              ))}
          </div>

          {/* Calendario compartido preview */}
          <div className="card cp" style={{ cursor: 'pointer' }} onClick={() => setModal('calendario')}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
              <h2 className="card-title" style={{ marginBottom: 0 }}>📅 Calendario del gimnasio</h2>
              <span style={{ fontSize: 12, color: 'var(--accent)', fontWeight: 600 }}>Ver completo →</span>
            </div>
            <p style={{ fontSize: 13, color: 'var(--ink2)', lineHeight: 1.5 }}>
              Consulta la disponibilidad de todos los entrenadores antes de agendar.
            </p>
          </div>
        </div>
      </div>

      {/* ── Modales de detalle ── */}
      {modal === 'sesiones' && (
        <DetailModal title="Sesiones de hoy" onClose={() => setModal(null)}>
          {(demo ? DEMO_SCHED.filter(s => s.status !== 'available') : todaySessions).length === 0
            ? <p style={{ color: 'var(--ink2)', fontSize: 14, textAlign: 'center', padding: '20px 0' }}>Sin sesiones hoy.</p>
            : demo
              ? DEMO_SCHED.filter(s => s.status !== 'available').map((s, i) => (
                <div key={i} style={{ display: 'flex', gap: 14, padding: '12px 0', borderBottom: '1px solid var(--border)' }}>
                  <span style={{ fontSize: 12, color: 'var(--ink2)', minWidth: 65 }}>{s.time}</span>
                  <span style={{ fontWeight: 500, flex: 1 }}>{s.client}</span>
                  <span className="chip">{s.type}</span>
                </div>
              ))
              : todaySessions.map((s, i) => (
                <div key={i} style={{ display: 'flex', gap: 14, padding: '12px 0', borderBottom: '1px solid var(--border)' }}>
                  <span style={{ fontSize: 12, color: 'var(--ink2)', minWidth: 65 }}>{s.time?.slice(0,5)}</span>
                  <span style={{ fontWeight: 500, flex: 1 }}>{s.client_email}</span>
                  <span className="chip">{s.type}</span>
                </div>
              ))
          }
        </DetailModal>
      )}

      {modal === 'semana' && (
        <DetailModal title="Sesiones esta semana" onClose={() => setModal(null)}>
          {(demo ? null : weekSessions).length === 0 && !demo
            ? <p style={{ color: 'var(--ink2)', fontSize: 14, textAlign: 'center', padding: '20px 0' }}>Sin sesiones esta semana.</p>
            : demo
              ? ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes'].map((d, di) => (
                <div key={d} style={{ marginBottom: 16 }}>
                  <div style={{ fontWeight: 600, fontSize: 13, marginBottom: 8, color: 'var(--accent)' }}>{d}</div>
                  {DEMO_SCHED.filter(s => s.status !== 'available').slice(0, 2 + di % 2).map((s, i) => (
                    <div key={i} style={{ display: 'flex', gap: 12, padding: '8px 12px', background: 'var(--surface2)', borderRadius: 8, marginBottom: 6 }}>
                      <span style={{ fontSize: 11, color: 'var(--ink2)', minWidth: 60 }}>{s.time}</span>
                      <span style={{ fontWeight: 500, fontSize: 13, flex: 1 }}>{s.client}</span>
                      <span className="chip">{s.type}</span>
                    </div>
                  ))}
                </div>
              ))
              : weekSessions.map((s, i) => (
                <div key={i} style={{ display: 'flex', gap: 12, padding: '10px 12px', background: 'var(--surface2)', borderRadius: 8, marginBottom: 8 }}>
                  <span style={{ fontSize: 11, color: 'var(--ink2)', minWidth: 90 }}>{s.date} {s.time?.slice(0,5)}</span>
                  <span style={{ fontWeight: 500, fontSize: 13, flex: 1 }}>{s.client_email}</span>
                  <span className="chip">{s.type}</span>
                </div>
              ))
          }
        </DetailModal>
      )}

      {modal === 'asistencia' && (
        <DetailModal title="Reporte de asistencia" onClose={() => setModal(null)}>
          {demo ? (
            <>
              <div style={{ marginBottom: 20 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                  <span style={{ fontSize: 13 }}>Promedio mensual</span>
                  <span style={{ fontFamily: "'DM Serif Display', serif", fontSize: 24, color: 'var(--accent)' }}>94%</span>
                </div>
                <div className="prog-track"><div className="prog-fill" style={{ width: '94%' }} /></div>
              </div>
              {clients.slice(0, 3).map((c, i) => (
                <div key={i} style={{ marginBottom: 14 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                    <span style={{ fontSize: 13, fontWeight: 500 }}>{c.name}</span>
                    <span style={{ fontSize: 13, color: 'var(--accent)', fontWeight: 600 }}>{85 + i * 4}%</span>
                  </div>
                  <div className="prog-track"><div className="prog-fill" style={{ width: `${85 + i * 4}%` }} /></div>
                </div>
              ))}
            </>
          ) : (
            <p style={{ color: 'var(--ink2)', fontSize: 14, textAlign: 'center', padding: '20px 0' }}>
              Los reportes de asistencia estarán disponibles próximamente.
            </p>
          )}
        </DetailModal>
      )}

      {modal === 'calendario' && (
        <DetailModal title="Calendario compartido" onClose={() => setModal(null)}>
          <SharedCalendar trainers={[]} />
        </DetailModal>
      )}
    </div>
  )
}

export function TrainerClients({ clients }) {
  return (
    <div className="page">
      <div className="sh"><h1>Mis Alumnos</h1><p>{clients.length} alumnos en tu programa</p></div>
      {clients.length === 0
        ? <EmptyState icon="👥" title="Sin alumnos aún" desc="Cuando un alumno se registre y te sea asignado, aparecerá aquí." />
        : <div className="g2">
            {clients.map(c => (
              <div className="pc" key={c.id}>
                <Avatar name={c.name} size={52} radius="14px" />
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 15, fontWeight: 600, marginBottom: 3 }}>{c.name}</div>
                  <div style={{ fontSize: 12, color: 'var(--ink2)', marginBottom: 8 }}>{c.email}</div>
                  <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                    <span className="chip g">Alumno</span>
                    <span className="chip">Activo</span>
                  </div>
                </div>
              </div>
            ))}
          </div>}
    </div>
  )
}

export function TrainerSchedule({ onNew, sessions = [] }) {
  const [view, setView] = useState('personal')
  const [day, setDay] = useState(0)

  // Generar días reales de la semana actual
  const today = new Date()
  const monday = new Date(today)
  monday.setDate(today.getDate() - (today.getDay() === 0 ? 6 : today.getDay() - 1))
  const weekDays = Array.from({ length: 6 }, (_, i) => {
    const d = new Date(monday)
    d.setDate(monday.getDate() + i)
    const names = ['Lun','Mar','Mié','Jue','Vie','Sáb']
    // Format date as YYYY-MM-DD for comparison
    const dateStr = d.toISOString().split('T')[0]
    return {
      label: `${names[i]} ${d.getDate()}`,
      full: d.toLocaleDateString('es-CL', { weekday: 'long', day: 'numeric', month: 'long' }),
      date: d,
      dateStr,
    }
  })

  // Sesiones del día seleccionado desde Supabase
  const selectedDate = weekDays[day].dateStr
  const daySessions = sessions.filter(s => s.date === selectedDate)

  // Horas del día
  const HOURS = ['6:00','7:00','8:00','9:00','10:00','11:00','12:00','17:00','18:00','19:00','20:00']

  const getSessionAtHour = (hour) => {
    return daySessions.find(s => {
      const sHour = s.time ? s.time.slice(0, 5) : ''
      const hPad = hour.length === 4 ? '0' + hour : hour
      return sHour === hPad || sHour === hour
    })
  }

  return (
    <div className="page">
      <div className="sh-row">
        <div className="sh-row-left"><h1>Agenda</h1><p style={{ textTransform: 'capitalize' }}>{weekDays[0].date.toLocaleDateString('es-CL', { month: 'long', year: 'numeric' })}</p></div>
        <button className="btn btn-p" onClick={onNew}>+ Agendar</button>
      </div>

      {/* Toggle personal / compartido */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 20 }}>
        <button className={`btn ${view === 'personal' ? 'btn-p' : 'btn-s'}`} style={{ borderRadius: 10 }} onClick={() => setView('personal')}>
          📋 Mi agenda
        </button>
        <button className={`btn ${view === 'shared' ? 'btn-p' : 'btn-s'}`} style={{ borderRadius: 10 }} onClick={() => setView('shared')}>
          👥 Calendario del gimnasio
        </button>
      </div>

      {view === 'personal' && (
        <>
          <div style={{ display: 'flex', gap: 8, marginBottom: 24 }}>
            {weekDays.map((d, i) => (
              <button key={i} onClick={() => setDay(i)} className={`btn ${day === i ? 'btn-p' : 'btn-s'}`} style={{ flex: 1, borderRadius: 10, fontSize: 13 }}>{d.label}</button>
            ))}
          </div>
          <div className="card cp">
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 20, alignItems: 'center' }}>
              <h2 className="card-title" style={{ marginBottom: 0, textTransform: 'capitalize' }}>{weekDays[day].full}</h2>
              <div style={{ display: 'flex', gap: 8 }}>
                <span className="tag tg">{daySessions.length} sesiones</span>
              </div>
            </div>
            {daySessions.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '32px 20px', color: 'var(--ink2)' }}>
                <div style={{ fontSize: 32, marginBottom: 10 }}>📅</div>
                <p style={{ fontSize: 14, marginBottom: 12 }}>Sin sesiones agendadas para este día</p>
                <button className="btn btn-p btn-sm" onClick={onNew}>+ Agendar sesión</button>
              </div>
            ) : (
              <div className="sg">
                {HOURS.map((hour, i) => {
                  const sess = getSessionAtHour(hour)
                  return (
                    <>
                      <div className="ts" key={`t${i}`}>{hour}</div>
                      <div className="ss" key={`s${i}`}>
                        {sess ? (
                          <div className="sb booked">
                            <div>
                              <div style={{ fontWeight: 500, color: 'var(--accent)' }}>{sess.client_email}</div>
                              <div style={{ fontSize: 11, color: 'var(--ink2)', marginTop: 2 }}>{sess.type} · {sess.notes || '60 min'}</div>
                            </div>
                            <span className={`sbadge ${sess.status === 'confirmed' ? 'ok' : 'pend'}`}>
                              {sess.status === 'confirmed' ? 'Confirmado' : 'Pendiente'}
                            </span>
                          </div>
                        ) : (
                          <div className="sb avail" onClick={onNew}>+ Disponible</div>
                        )}
                      </div>
                    </>
                  )
                })}
              </div>
            )}
          </div>
        </>
      )}

      {view === 'shared' && (
        <div className="card cp">
          <div style={{ marginBottom: 16 }}>
            <h2 className="card-title">Disponibilidad del gimnasio — Semana actual</h2>
            <p style={{ fontSize: 13, color: 'var(--ink2)' }}>
              Consulta los bloques ocupados antes de agendar una nueva sesión.
            </p>
          </div>
          <SharedCalendar trainers={[]} />
        </div>
      )}
    </div>
  )
}
