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

export function TrainerDashboard({ profile, onNewSession, clients }) {
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

      <div className="g4" style={{ marginBottom: 24 }}>
        <div className="sc"><div className="sc-label">Sesiones hoy</div><div className="sc-val">4</div><div className="sc-sub">3 confirmadas · 1 pendiente</div></div>
        <div className="sc gold"><div className="sc-label">Alumnos activos</div><div className="sc-val">{clients.length}</div><div className="sc-sub">en tu programa</div></div>
        <div className="sc blue"><div className="sc-label">Esta semana</div><div className="sc-val">12</div><div className="sc-sub">sesiones totales</div></div>
        <div className="sc"><div className="sc-label">Asistencia</div><div className="sc-val">94%</div><div className="sc-sub">↑ promedio mensual</div></div>
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
            <h2 className="card-title">Mis alumnos</h2>
            {clients.length === 0
              ? <p style={{ color: 'var(--ink2)', fontSize: 14 }}>Aún no tienes alumnos registrados.</p>
              : clients.slice(0, 5).map(c => (
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
          <div className="card cp">
            <h2 className="card-title">Alertas recientes</h2>
            {[
              { icon: '🏋️', text: 'Laura Torres confirmó sesión mañana 7:00 AM', time: 'Hace 5 min' },
              { icon: '⏰', text: 'Sesión con Marcos Silva en 30 minutos', time: 'Hace 25 min' },
              { icon: '✅', text: 'Valeria Soto solicita sesión Miércoles 8:00 AM', time: 'Hace 1 hora' },
            ].map((n, i) => (
              <div key={i} style={{ display: 'flex', gap: 10, marginBottom: i < 2 ? 12 : 0, alignItems: 'flex-start' }}>
                <span style={{ fontSize: 18 }}>{n.icon}</span>
                <div>
                  <p style={{ fontSize: 13, lineHeight: 1.4 }}>{n.text}</p>
                  <p style={{ fontSize: 11, color: 'var(--ink2)', marginTop: 2 }}>{n.time}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
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
  const days = ['Lun 28', 'Mar 29', 'Mié 30', 'Jue 31', 'Vie 1']
  const [day, setDay] = useState(0)
  return (
    <div className="page">
      <div className="sh-row">
        <div className="sh-row-left"><h1>Agenda</h1><p>Semana 28 Ene – 1 Feb</p></div>
        <button className="btn btn-p" onClick={onNew}>+ Agendar sesión</button>
      </div>
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
    </div>
  )
}
