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
  const MAX_CAPACITY = 3 // máx alumnos por bloque

  // Datos demo del calendario compartido
  const events = [
    { day: 0, hour: '6:00',  trainer: 'Carlos',  count: 2, color: TRAINER_COLORS[0] },
    { day: 0, hour: '7:00',  trainer: 'Carlos',  count: 3, color: TRAINER_COLORS[0] },
    { day: 0, hour: '7:00',  trainer: 'Sofía',   count: 1, color: TRAINER_COLORS[1] },
    { day: 0, hour: '9:00',  trainer: 'Andrés',  count: 2, color: TRAINER_COLORS[2] },
    { day: 1, hour: '6:00',  trainer: 'Sofía',   count: 3, color: TRAINER_COLORS[1] },
    { day: 1, hour: '8:00',  trainer: 'Carlos',  count: 1, color: TRAINER_COLORS[0] },
    { day: 1, hour: '18:00', trainer: 'Andrés',  count: 2, color: TRAINER_COLORS[2] },
    { day: 2, hour: '7:00',  trainer: 'Carlos',  count: 2, color: TRAINER_COLORS[0] },
    { day: 2, hour: '7:00',  trainer: 'Sofía',   count: 2, color: TRAINER_COLORS[1] },
    { day: 2, hour: '10:00', trainer: 'Andrés',  count: 1, color: TRAINER_COLORS[2] },
    { day: 3, hour: '6:00',  trainer: 'Carlos',  count: 3, color: TRAINER_COLORS[0] },
    { day: 3, hour: '17:00', trainer: 'Sofía',   count: 2, color: TRAINER_COLORS[1] },
    { day: 4, hour: '8:00',  trainer: 'Carlos',  count: 2, color: TRAINER_COLORS[0] },
    { day: 4, hour: '9:00',  trainer: 'Andrés',  count: 3, color: TRAINER_COLORS[2] },
    { day: 5, hour: '10:00', trainer: 'Sofía',   count: 1, color: TRAINER_COLORS[1] },
  ]

  const getEvents = (day, hour) => events.filter(e => e.day === day && e.hour === hour)
  const getTotalCount = (day, hour) => getEvents(day, hour).reduce((a, e) => a + e.count, 0)
  const isFull = (day, hour) => getTotalCount(day, hour) >= MAX_CAPACITY

  return (
    <div>
      {/* Leyenda de entrenadores */}
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

      {/* Grid del calendario */}
      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 500 }}>
          <thead>
            <tr>
              <th style={{ width: 60, padding: '8px', fontSize: 11, color: 'var(--ink2)', textAlign: 'right', paddingRight: 12 }}>Hora</th>
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
                  const total = getTotalCount(di, hour)
                  return (
                    <td key={di} style={{ padding: '3px', borderTop: '1px solid var(--border)', verticalAlign: 'top', minWidth: 70 }}>
                      {evts.length > 0 ? (
                        <div style={{ background: full ? '#fbeaea' : 'var(--surface2)', border: `1px solid ${full ? '#f5c6c6' : 'var(--border)'}`, borderRadius: 6, padding: '4px 6px', fontSize: 10 }}>
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
                        <div style={{ background: 'transparent', border: '1px dashed transparent', borderRadius: 6, padding: '4px 6px', fontSize: 10, color: 'var(--accent)', fontWeight: 500 }}>
                          libre
                        </div>
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
        * Capacidad máxima: {MAX_CAPACITY} alumnos por bloque horario. Los bloques en rojo están llenos.
      </p>
    </div>
  )
}

// ── Dashboard del entrenador ──
export function TrainerDashboard({ profile, onNewSession, clients, onNavigate }) {
  const [modal, setModal] = useState(null)
  const today = new Date().toLocaleDateString('es-CL', { weekday: 'long', day: 'numeric', month: 'long' })

  return (
    <div className="page">
      <div className="sh-row">
        <div className="sh-row-left">
          <h1>Buenos días, {profile?.name?.split(' ')[0] || 'Entrenador'} ☀️</h1>
          <p style={{ textTransform: 'capitalize' }}>{today} · {clients.length} alumnos activos</p>
        </div>
        <button className="btn btn-p" onClick={onNewSession}>+ Nueva sesión</button>
      </div>

      {/* Stats clickeables */}
      <div className="g4" style={{ marginBottom: 24 }}>
        <ClickableStat label="Sesiones hoy" value="4" sub="3 confirmadas · 1 pendiente"
          onClick={() => setModal('sesiones')} />
        <ClickableStat label="Alumnos activos" value={clients.length} sub="en tu programa"
          color="gold" onClick={() => onNavigate('alumnos')} />
        <ClickableStat label="Esta semana" value="12" sub="sesiones totales"
          color="blue" onClick={() => setModal('semana')} />
        <ClickableStat label="Asistencia" value="94%" sub="↑ promedio mensual"
          onClick={() => setModal('asistencia')} />
      </div>

      <div className="g2" style={{ gap: 24 }}>
        <div className="card cp">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
            <h2 className="card-title" style={{ marginBottom: 0 }}>Agenda de hoy</h2>
            <span className="tag tg">4 sesiones</span>
          </div>
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
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          <div className="card cp">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <h2 className="card-title" style={{ marginBottom: 0 }}>Mis alumnos</h2>
              <button className="btn btn-s btn-sm" onClick={() => onNavigate('alumnos')}>Ver todos</button>
            </div>
            {clients.length === 0
              ? <p style={{ color: 'var(--ink2)', fontSize: 14 }}>Aún no tienes alumnos registrados.</p>
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
            <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
              {['Carlos','Sofía','Andrés'].map((t, i) => (
                <div key={t} style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 11 }}>
                  <div style={{ width: 8, height: 8, borderRadius: '50%', background: TRAINER_COLORS[i] }} />
                  {t}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* ── Modales de detalle ── */}
      {modal === 'sesiones' && (
        <DetailModal title="Sesiones de hoy" onClose={() => setModal(null)}>
          <div className="sg">
            {DEMO_SCHED.filter(s => s.status !== 'available').map((s, i) => (
              <>
                <div className="ts" key={`t${i}`}>{s.time}</div>
                <div className="ss" key={`s${i}`}>
                  <div className="sb booked">
                    <div>
                      <div style={{ fontWeight: 500, color: 'var(--accent)' }}>{s.client}</div>
                      <div style={{ fontSize: 11, color: 'var(--ink2)', marginTop: 2 }}>{s.type} · 60 min</div>
                    </div>
                    <span className={`sbadge ${s.status === 'confirmed' ? 'ok' : 'pend'}`}>
                      {s.status === 'confirmed' ? 'Confirmado' : 'Pendiente'}
                    </span>
                  </div>
                </div>
              </>
            ))}
          </div>
        </DetailModal>
      )}

      {modal === 'semana' && (
        <DetailModal title="Sesiones esta semana" onClose={() => setModal(null)}>
          {['Lunes 28', 'Martes 29', 'Miércoles 30', 'Jueves 31', 'Viernes 1'].map((d, di) => (
            <div key={d} style={{ marginBottom: 16 }}>
              <div style={{ fontWeight: 600, fontSize: 13, marginBottom: 8, color: 'var(--accent)' }}>{d} Ene</div>
              {DEMO_SCHED.filter(s => s.status !== 'available').slice(0, 2 + di % 2).map((s, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '8px 12px', background: 'var(--surface2)', borderRadius: 8, marginBottom: 6 }}>
                  <span style={{ fontSize: 11, color: 'var(--ink2)', minWidth: 60 }}>{s.time}</span>
                  <span style={{ fontWeight: 500, fontSize: 13, flex: 1 }}>{s.client}</span>
                  <span className="chip">{s.type}</span>
                </div>
              ))}
            </div>
          ))}
        </DetailModal>
      )}

      {modal === 'asistencia' && (
        <DetailModal title="Reporte de asistencia" onClose={() => setModal(null)}>
          <div style={{ marginBottom: 20 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
              <span style={{ fontSize: 13 }}>Promedio mensual</span>
              <span style={{ fontFamily: "'DM Serif Display', serif", fontSize: 24, color: 'var(--accent)' }}>94%</span>
            </div>
            <div className="prog-track"><div className="prog-fill" style={{ width: '94%' }} /></div>
          </div>
          {clients.length > 0 ? clients.map((c, i) => (
            <div key={i} style={{ marginBottom: 14 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                <span style={{ fontSize: 13, fontWeight: 500 }}>{c.name}</span>
                <span style={{ fontSize: 13, color: 'var(--accent)', fontWeight: 600 }}>{85 + i * 4}%</span>
              </div>
              <div className="prog-track"><div className="prog-fill" style={{ width: `${85 + i * 4}%` }} /></div>
            </div>
          )) : (
            <p style={{ color: 'var(--ink2)', fontSize: 14 }}>Sin datos de alumnos aún.</p>
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

export function TrainerSchedule({ onNew }) {
  const [view, setView] = useState('personal') // 'personal' | 'shared'
  const days = ['Lun 28', 'Mar 29', 'Mié 30', 'Jue 31', 'Vie 1']
  const [day, setDay] = useState(0)

  return (
    <div className="page">
      <div className="sh-row">
        <div className="sh-row-left"><h1>Agenda</h1><p>Semana 28 Ene – 1 Feb</p></div>
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
            {days.map((d, i) => (
              <button key={d} onClick={() => setDay(i)} className={`btn ${day === i ? 'btn-p' : 'btn-s'}`} style={{ flex: 1, borderRadius: 10, fontSize: 13 }}>{d}</button>
            ))}
          </div>
          <div className="card cp">
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 20, alignItems: 'center' }}>
              <h2 className="card-title" style={{ marginBottom: 0 }}>{days[day]} · Enero 2025</h2>
              <div style={{ display: 'flex', gap: 8 }}><span className="tag tg">4 sesiones</span><span className="tag ty">1 pendiente</span></div>
            </div>
            <div className="sg">
              {DEMO_SCHED.map((s, i) => (
                <>
                  <div className="ts" key={`t${i}`}>{s.time}</div>
                  <div className="ss" key={`s${i}`}>
                    {s.status === 'available'
                      ? <div className="sb avail" onClick={onNew}>+ Agregar sesión</div>
                      : <div className="sb booked">
                          <div>
                            <div style={{ fontWeight: 500, color: 'var(--accent)' }}>{s.client}</div>
                            <div style={{ fontSize: 11, color: 'var(--ink2)', marginTop: 2 }}>{s.type} · 60 min</div>
                          </div>
                          <span className={`sbadge ${s.status === 'confirmed' ? 'ok' : 'pend'}`}>
                            {s.status === 'confirmed' ? 'Confirmado' : 'Pendiente'}
                          </span>
                        </div>}
                  </div>
                </>
              ))}
            </div>
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
