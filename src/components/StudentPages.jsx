import { useState, useEffect } from 'react'
import { supabase } from '../supabase.js'
import { EmptyState } from './UI.jsx'
import {
  AreaChart, Area, BarChart, Bar, LineChart, Line,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend
} from 'recharts'

const DEMO_VOLUME = [
  { date: '13 Ene', kg: 455, sesion: 'Lower body' },
  { date: '15 Ene', kg: 360, sesion: 'Upper body' },
  { date: '17 Ene', kg: 210, sesion: 'Funcional'  },
  { date: '20 Ene', kg: 490, sesion: 'Lower body' },
  { date: '22 Ene', kg: 385, sesion: 'Upper body' },
]
const DEMO_PROGRESS = [
  { mes: 'Oct', sentadilla: 45, pressBanca: 32, pesomto: 60 },
  { mes: 'Nov', sentadilla: 50, pressBanca: 35, pesomto: 65 },
  { mes: 'Dic', sentadilla: 57, pressBanca: 38, pesomto: 72 },
  { mes: 'Ene', sentadilla: 65, pressBanca: 42, pesomto: 80 },
]
const DEMO_WORKOUTS = [
  { id: 1, date: 'Mié 22 Ene', type: 'Fuerza — Upper body', duration: '55 min', exercises: 6, kg: 385 },
  { id: 2, date: 'Lun 20 Ene', type: 'Fuerza — Lower body', duration: '60 min', exercises: 5, kg: 490 },
  { id: 3, date: 'Vie 17 Ene', type: 'Funcional',           duration: '45 min', exercises: 7, kg: 210 },
  { id: 4, date: 'Mié 15 Ene', type: 'Fuerza — Upper body', duration: '55 min', exercises: 6, kg: 360 },
  { id: 5, date: 'Lun 13 Ene', type: 'Fuerza — Lower body', duration: '60 min', exercises: 5, kg: 455 },
]
const DEMO_PRS = [
  { name: 'Sentadilla', icon: '🦵', sets: '4×8',  pr: '65 kg', trend: '+5 kg este mes'    },
  { name: 'Press Banca', icon: '💪', sets: '4×10', pr: '42 kg', trend: '+3 kg este mes'    },
  { name: 'Peso Muerto', icon: '🏋️', sets: '3×6',  pr: '80 kg', trend: '+7.5 kg este mes'  },
  { name: 'Hip Thrust',  icon: '🔥', sets: '4×12', pr: '90 kg', trend: '¡Nuevo PR!'        },
]

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null
  return (
    <div style={{ background: 'white', border: '1px solid var(--border)', borderRadius: 10, padding: '10px 14px', fontSize: 13, boxShadow: 'var(--sh)' }}>
      <p style={{ fontWeight: 600, marginBottom: 4 }}>{label}</p>
      {payload.map((p, i) => <p key={i} style={{ color: p.color }}>{p.name}: <strong>{p.value}{p.name.includes('kg') || p.name === 'kg' ? '' : 'kg'}</strong></p>)}
    </div>
  )
}

export function StudentDashboard({ profile, workouts, onNavigate }) {
  const [modal, setModal] = useState(null)
  const data = workouts.length ? workouts : DEMO_WORKOUTS
  const totalKg = data.reduce((a, w) => a + w.kg, 0)
  const goals = [
    { label: 'Sesiones completadas', current: data.length, target: 12, unit: 'sesiones' },
    { label: 'Peso levantado este mes', current: Math.min(data.slice(0,3).reduce((a,w)=>a+w.kg,0), 900), target: 900, unit: 'kg', color: 'gold' },
    { label: 'Días activos esta semana', current: 3, target: 5, unit: 'días', color: 'blue' },
  ]
  return (
    <div className="page">
      <div className="sh">
        <h1>Hola, {profile?.name?.split(' ')[0] || 'Atleta'} 💪</h1>
        <p>Tu progreso de entrenamiento personalizado</p>
      </div>

      <div className="banner">
        <div>
          <h3>Próxima sesión</h3>
          <p>Lunes 28 Ene · 7:00 AM</p>
          <p style={{ marginTop: 4, opacity: .9, fontSize: 14 }}>Fuerza — Upper body</p>
        </div>
        <div><div className="cval">14h</div><div className="clabel">para tu sesión</div></div>
      </div>

      {/* Stats clickeables */}
      <div className="g4" style={{ marginBottom: 24 }}>
        {[
          { label: 'Sesiones totales', value: data.length, sub: 'completadas', color: '', modal: 'historial' },
          { label: 'Este mes', value: data.slice(0,3).length, sub: 'sesiones', color: 'gold', modal: 'mes' },
          { label: 'Racha actual', value: 5, sub: 'semanas seguidas', color: 'blue', modal: 'racha' },
          { label: 'Total levantado', value: `${(totalKg/1000).toFixed(1)}t`, sub: 'acumulado', color: 'red', modal: 'pesos' },
        ].map(s => (
          <div key={s.modal} className={`sc ${s.color}`} onClick={() => setModal(s.modal)}
            style={{ cursor: 'pointer', transition: 'transform .15s, box-shadow .15s' }}
            onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = 'var(--sh-lg)' }}
            onMouseLeave={e => { e.currentTarget.style.transform = ''; e.currentTarget.style.boxShadow = '' }}>
            <div className="sc-label">{s.label}</div>
            <div className="sc-val">{s.value}</div>
            <div className="sc-sub">{s.sub}</div>
            <div style={{ fontSize: 10, color: 'var(--accent)', marginTop: 6, fontWeight: 600 }}>Ver detalle →</div>
          </div>
        ))}
      </div>

      {/* Volume chart */}
      <div className="card cp" style={{ marginBottom: 24 }}>
        <h2 className="card-title">Volumen por sesión (kg levantados)</h2>
        <ResponsiveContainer width="100%" height={180}>
          <BarChart data={DEMO_VOLUME} margin={{ top: 5, right: 10, bottom: 5, left: 0 }}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} />
            <XAxis dataKey="date" tick={{ fontSize: 12, fill: 'var(--ink2)' }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fontSize: 11, fill: 'var(--ink2)' }} axisLine={false} tickLine={false} />
            <Tooltip content={<CustomTooltip />} />
            <Bar dataKey="kg" fill="var(--accent)" radius={[6,6,0,0]} name="kg" />
          </BarChart>
        </ResponsiveContainer>
      </div>

      <div className="g2" style={{ gap: 24 }}>
        <div className="card cp">
          <h2 className="card-title">Metas del mes</h2>
          {goals.map((g, i) => (
            <div key={i} style={{ marginBottom: i < goals.length - 1 ? 22 : 0 }}>
              <div className="prog-label"><span>{g.label}</span><span style={{ fontWeight: 600 }}>{g.current}/{g.target} {g.unit}</span></div>
              <div className="prog-track"><div className={`prog-fill ${g.color || ''}`} style={{ width: `${Math.min(100, (g.current/g.target)*100)}%` }} /></div>
            </div>
          ))}
        </div>
        <div className="card cp">
          <h2 className="card-title">Últimos entrenamientos</h2>
          {data.slice(0, 4).map((w, i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: i < 3 ? 16 : 0 }}>
              <div style={{ width: 38, height: 38, borderRadius: 10, background: 'var(--surface2)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16 }}>🏋️</div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 13, fontWeight: 500 }}>{w.type}</div>
                <div style={{ fontSize: 11, color: 'var(--ink2)' }}>{w.date} · {w.duration}</div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontFamily: "'DM Serif Display', serif", fontSize: 16, color: 'var(--accent)' }}>{w.kg}kg</div>
                <div style={{ fontSize: 10, color: 'var(--ink2)' }}>levantados</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ── Modales de detalle ── */}
      {modal && (
        <div className="sheet-overlay" onClick={e => e.target === e.currentTarget && setModal(null)}>
          <div className="sheet" style={{ maxHeight: '85vh' }}>
            <div className="sheet-handle" />
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
              <h2 style={{ fontFamily: "'DM Serif Display', serif", fontSize: 20 }}>
                {modal === 'historial' && 'Historial completo'}
                {modal === 'mes' && 'Sesiones de este mes'}
                {modal === 'racha' && 'Tu racha de actividad'}
                {modal === 'pesos' && 'Detalle de peso levantado'}
              </h2>
              <button onClick={() => setModal(null)} style={{ background: 'none', border: 'none', fontSize: 20, cursor: 'pointer', color: 'var(--ink2)' }}>✕</button>
            </div>

            {(modal === 'historial' || modal === 'mes') && (
              <div>
                {data.slice(0, modal === 'mes' ? 3 : data.length).map((w, i) => (
                  <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '12px 0', borderBottom: i < data.length - 1 ? '1px solid var(--border)' : 'none' }}>
                    <div style={{ width: 40, height: 40, borderRadius: 10, background: 'var(--accent-light)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18, flexShrink: 0 }}>🏋️</div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 14, fontWeight: 500 }}>{w.type}</div>
                      <div style={{ fontSize: 12, color: 'var(--ink2)' }}>{w.date} · {w.duration} · {w.exercises} ejercicios</div>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontFamily: "'DM Serif Display', serif", fontSize: 18, color: 'var(--accent)' }}>{w.kg}kg</div>
                      <span className="tag tg" style={{ fontSize: 10 }}>Completado</span>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {modal === 'racha' && (
              <div>
                <div style={{ textAlign: 'center', padding: '20px 0 28px' }}>
                  <div style={{ fontFamily: "'DM Serif Display', serif", fontSize: 56, color: 'var(--accent)' }}>5</div>
                  <div style={{ fontSize: 16, fontWeight: 500, marginBottom: 4 }}>semanas consecutivas</div>
                  <div style={{ fontSize: 13, color: 'var(--ink2)' }}>¡Sigue así! Estás en tu mejor racha</div>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7,1fr)', gap: 6, marginBottom: 16 }}>
                  {['L','M','X','J','V','S','D'].map((d, i) => (
                    <div key={d} style={{ textAlign: 'center', fontSize: 11, color: 'var(--ink2)', marginBottom: 4 }}>{d}</div>
                  ))}
                  {Array.from({ length: 28 }).map((_, i) => {
                    const active = [1,3,5,8,10,12,15,17,19,22,24,26].includes(i)
                    return (
                      <div key={i} style={{ width: '100%', aspectRatio: '1', borderRadius: 4, background: active ? 'var(--accent)' : 'var(--surface2)', border: '1px solid var(--border)' }} />
                    )
                  })}
                </div>
                <p style={{ fontSize: 12, color: 'var(--ink2)', textAlign: 'center' }}>Últimas 4 semanas · Verde = día activo</p>
              </div>
            )}

            {modal === 'pesos' && (
              <div>
                <div style={{ marginBottom: 20 }}>
                  <div style={{ fontFamily: "'DM Serif Display', serif", fontSize: 36, color: 'var(--accent)', textAlign: 'center' }}>{(totalKg/1000).toFixed(2)} toneladas</div>
                  <p style={{ textAlign: 'center', color: 'var(--ink2)', fontSize: 13 }}>levantadas en total desde que empezaste</p>
                </div>
                {DEMO_PRS.map((ex, i) => (
                  <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '12px 0', borderBottom: i < DEMO_PRS.length - 1 ? '1px solid var(--border)' : 'none' }}>
                    <span style={{ fontSize: 24 }}>{ex.icon}</span>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 14, fontWeight: 500 }}>{ex.name}</div>
                      <div style={{ fontSize: 12, color: 'var(--accent)', marginTop: 2 }}>↑ {ex.trend}</div>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontFamily: "'DM Serif Display', serif", fontSize: 20, color: 'var(--accent)' }}>{ex.pr}</div>
                      <div style={{ fontSize: 10, color: 'var(--ink2)' }}>PR actual</div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
  const [tab, setTab] = useState('charts')
  const data = workouts.length ? workouts : DEMO_WORKOUTS

  return (
    <div className="page">
      <div className="sh"><h1>Mi Progreso</h1><p>Seguimiento detallado de tu rendimiento</p></div>
      <div className="tab-row">
        <button className={`tab-btn ${tab === 'charts' ? 'active' : ''}`} onClick={() => setTab('charts')}>Gráficos</button>
        <button className={`tab-btn ${tab === 'prs' ? 'active' : ''}`} onClick={() => setTab('prs')}>Records personales</button>
        <button className={`tab-btn ${tab === 'hist' ? 'active' : ''}`} onClick={() => setTab('hist')}>Historial</button>
      </div>

      {tab === 'charts' && (
        <>
          {/* Progresión de cargas */}
          <div className="card cp" style={{ marginBottom: 24 }}>
            <h2 className="card-title">Progresión de cargas (kg) por mes</h2>
            <ResponsiveContainer width="100%" height={220}>
              <LineChart data={DEMO_PROGRESS} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="mes" tick={{ fontSize: 12, fill: 'var(--ink2)' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11, fill: 'var(--ink2)' }} axisLine={false} tickLine={false} unit="kg" />
                <Tooltip content={<CustomTooltip />} />
                <Legend wrapperStyle={{ fontSize: 12, paddingTop: 12 }} />
                <Line type="monotone" dataKey="sentadilla" stroke="var(--accent)"  strokeWidth={2.5} dot={{ r: 4, fill: 'var(--accent)' }}  name="Sentadilla" />
                <Line type="monotone" dataKey="pressBanca" stroke="var(--accent2)" strokeWidth={2.5} dot={{ r: 4, fill: 'var(--accent2)' }} name="Press Banca" />
                <Line type="monotone" dataKey="pesomto"    stroke="var(--blue)"    strokeWidth={2.5} dot={{ r: 4, fill: 'var(--blue)' }}    name="Peso Muerto" />
              </LineChart>
            </ResponsiveContainer>
          </div>

          {/* Volumen semanal */}
          <div className="card cp">
            <h2 className="card-title">Volumen por sesión (kg totales)</h2>
            <ResponsiveContainer width="100%" height={200}>
              <AreaChart data={DEMO_VOLUME} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
                <defs>
                  <linearGradient id="volGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="var(--accent)" stopOpacity={0.15} />
                    <stop offset="95%" stopColor="var(--accent)" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="date" tick={{ fontSize: 12, fill: 'var(--ink2)' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11, fill: 'var(--ink2)' }} axisLine={false} tickLine={false} unit="kg" />
                <Tooltip content={<CustomTooltip />} />
                <Area type="monotone" dataKey="kg" stroke="var(--accent)" strokeWidth={2.5} fill="url(#volGrad)" name="kg" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </>
      )}

      {tab === 'prs' && (
        <div className="g2">
          {DEMO_PRS.map((ex, i) => (
            <div key={i} style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 12, padding: '18px 20px', display: 'flex', alignItems: 'center', gap: 16 }}>
              <div style={{ width: 44, height: 44, borderRadius: 12, background: 'var(--accent-light)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20, flexShrink: 0 }}>{ex.icon}</div>
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 600, fontSize: 14, marginBottom: 2 }}>{ex.name}</div>
                <div style={{ fontSize: 12, color: 'var(--ink2)' }}>{ex.sets}</div>
                <div style={{ fontSize: 11, color: 'var(--accent)', marginTop: 4, fontWeight: 500 }}>↑ {ex.trend}</div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontFamily: "'DM Serif Display', serif", fontSize: 22, color: 'var(--accent)' }}>{ex.pr}</div>
                <div style={{ fontSize: 10, color: 'var(--ink2)', textTransform: 'uppercase', letterSpacing: '0.3px' }}>PR actual</div>
              </div>
            </div>
          ))}
        </div>
      )}

      {tab === 'hist' && (
        data.length === 0
          ? <EmptyState icon="📋" title="Sin historial" desc="Tu entrenador registrará tus sesiones aquí." />
          : <div className="card" style={{ overflow: 'hidden' }}>
              <table className="tbl">
                <thead><tr><th>Fecha</th><th>Tipo</th><th>Duración</th><th>Ejercicios</th><th>Peso total</th></tr></thead>
                <tbody>
                  {data.map((w, i) => (
                    <tr key={i}>
                      <td style={{ fontWeight: 500 }}>{w.date}</td>
                      <td>{w.type}</td>
                      <td><span className="tag tb">{w.duration}</span></td>
                      <td style={{ color: 'var(--ink2)' }}>{w.exercises} ejerc.</td>
                      <td style={{ fontFamily: "'DM Serif Display', serif", fontSize: 16, color: 'var(--accent)' }}>{w.kg} kg</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
      )}
    </div>
  )
}

export function StudentSchedule() {
  const upcoming = [
    { day: '28', dow: 'Lun', time: '7:00 AM', type: 'Fuerza — Upper body', status: 'confirmed' },
    { day: '30', dow: 'Mié', time: '8:00 AM', type: 'Fuerza — Lower body', status: 'pending'   },
    { day: '1',  dow: 'Vie', time: '7:00 AM', type: 'Funcional',           status: 'confirmed' },
  ]
  return (
    <div className="page">
      <div className="sh"><h1>Mi Agenda</h1><p>Próximas sesiones de entrenamiento</p></div>
      <div className="banner" style={{ marginBottom: 24 }}>
        <div><h3>Próxima sesión confirmada</h3><p>Lunes 28 Ene · 7:00 AM</p><p style={{ marginTop: 4, opacity: .9, fontSize: 14 }}>Fuerza — Upper body</p></div>
        <div><div className="cval">14h</div><div className="clabel">faltan</div></div>
      </div>
      <div className="g2" style={{ gap: 24 }}>
        <div className="card cp">
          <h2 className="card-title">Sesiones agendadas</h2>
          {upcoming.map((s, i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: i < 2 ? 14 : 0, padding: '14px 16px', background: 'var(--surface2)', borderRadius: 10, border: '1px solid var(--border)' }}>
              <div style={{ textAlign: 'center', minWidth: 46 }}>
                <div style={{ fontFamily: "'DM Serif Display', serif", fontSize: 22, color: 'var(--accent)', lineHeight: 1 }}>{s.day}</div>
                <div style={{ fontSize: 10, color: 'var(--ink2)', textTransform: 'uppercase' }}>{s.dow}</div>
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 14, fontWeight: 500 }}>{s.type}</div>
                <div style={{ fontSize: 12, color: 'var(--ink2)' }}>⏰ {s.time}</div>
              </div>
              <span className={`sbadge ${s.status === 'confirmed' ? 'ok' : 'pend'}`}>{s.status === 'confirmed' ? 'Confirmado' : 'Pendiente'}</span>
            </div>
          ))}
        </div>
        <div className="card cp">
          <h2 className="card-title">Historial reciente</h2>
          {DEMO_WORKOUTS.slice(0, 4).map((w, i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: i < 3 ? 14 : 0 }}>
              <div style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--accent)', flexShrink: 0 }} />
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 13, fontWeight: 500 }}>{w.type}</div>
                <div style={{ fontSize: 11, color: 'var(--ink2)' }}>{w.date} · {w.duration}</div>
              </div>
              <span className="tag tg" style={{ fontSize: 10 }}>Completado</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
