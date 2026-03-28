import { useState, useEffect, useRef } from 'react'
import './styles.css'
import { supabase } from './supabase.js'
import AuthScreen from './components/AuthScreen.jsx'
import { Spinner, Toast, NotifPanel, Avatar } from './components/UI.jsx'
import { TrainerDashboard, TrainerClients, TrainerSchedule } from './components/TrainerPages.jsx'
import WorkoutPlanner from './components/WorkoutPlanner.jsx'
import { StudentDashboard, StudentProgress, StudentSchedule } from './components/StudentPages.jsx'

const NOTIFS_T = [
  { id:1, type:'session',  icon:'🏋️', text:'Laura Torres confirmó sesión mañana 7:00 AM',       time:'Hace 5 min',  read:false },
  { id:2, type:'reminder', icon:'⏰', text:'Sesión con Marcos Silva en 30 minutos',             time:'Hace 25 min', read:false },
  { id:3, type:'confirm',  icon:'✅', text:'Valeria Soto solicita sesión Miércoles 8:00 AM',   time:'Hace 1 hora', read:false },
  { id:4, type:'session',  icon:'📋', text:'Daniela Ríos completó su rutina semanal',           time:'Ayer',        read:true  },
]
const NOTIFS_S = [
  { id:1, type:'reminder', icon:'⏰', text:'Tu sesión es mañana a las 7:00 AM — ¡Prepárate!',  time:'Hace 2 horas', read:false },
  { id:2, type:'session',  icon:'🏆', text:'¡Nuevo PR! Lograste 90 kg en Hip Thrust',          time:'Hace 3 días',  read:false },
  { id:3, type:'confirm',  icon:'📋', text:'Tu entrenador actualizó tu rutina de la semana',   time:'Hace 4 días',  read:true  },
]

function SessionModal({ onClose, onSave }) {
  const [f, setF] = useState({ client: '', date: '', time: '', type: 'Fuerza', notes: '' })
  const s = k => e => setF(p => ({ ...p, [k]: e.target.value }))
  return (
    <div className="modal-ov" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal">
        <div className="modal-title">Agendar Sesión</div>
        <div className="modal-sub">Nueva sesión de entrenamiento</div>
        <div className="fg"><label>Cliente (email o nombre)</label><input placeholder="cliente@mail.com" value={f.client} onChange={s('client')} /></div>
        <div className="g2">
          <div className="fg"><label>Fecha</label><input type="date" value={f.date} onChange={s('date')} /></div>
          <div className="fg"><label>Hora</label><input type="time" value={f.time} onChange={s('time')} /></div>
        </div>
        <div className="fg"><label>Tipo</label>
          <select value={f.type} onChange={s('type')}>
            {['Fuerza','HIIT','Yoga','Cardio','Funcional','Stretching'].map(t => <option key={t}>{t}</option>)}
          </select>
        </div>
        <div className="fg"><label>Notas</label><textarea placeholder="Indicaciones, objetivos..." value={f.notes} onChange={s('notes')} /></div>
        <div className="modal-actions">
          <button className="btn btn-s" onClick={onClose}>Cancelar</button>
          <button className="btn btn-p" onClick={() => { onSave(f); onClose() }}>Guardar sesión</button>
        </div>
      </div>
    </div>
  )
}

export default function App() {
  const [session,  setSession]  = useState(null)
  const [profile,  setProfile]  = useState(null)
  const [loading,  setLoading]  = useState(true)
  const [page,     setPage]     = useState('dashboard')
  const [notifs,   setNotifs]   = useState([])
  const [clients,  setClients]  = useState([])
  const [workouts, setWorkouts] = useState([])
  const [showNP,   setShowNP]   = useState(false)
  const [showSM,   setShowSM]   = useState(false)
  const [toast,    setToast]    = useState(null)
  const panelRef = useRef()

  // ── Auth listener ──────────────────────────────────────────────
  useEffect(() => {
    supabase.auth.getSession().then(async ({ data: { session: s } }) => {
      if (s) await loadProfile(s.user)
      setLoading(false)
    })
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_, s) => {
      if (s) await loadProfile(s.user)
      else { setSession(null); setProfile(null) }
    })
    return () => subscription.unsubscribe()
  }, [])

  const loadProfile = async (user) => {
    setSession(user)
    const { data: p } = await supabase.from('profiles').select('*').eq('id', user.id).single()
    setProfile(p)
    if (p?.role === 'trainer' || p?.role === 'admin') {
      const { data: cls } = await supabase.from('profiles').select('*').eq('role', 'student')
      setClients(cls || [])
      setNotifs(NOTIFS_T)
    } else {
      setNotifs(NOTIFS_S)
    }
  }

  const handleAuth = (user, prof) => {
    setSession(user); setProfile(prof)
    setNotifs(prof?.role === 'student' ? NOTIFS_S : NOTIFS_T)
  }

  const handleLogout = async () => {
    await supabase.auth.signOut()
    setSession(null); setProfile(null); setPage('dashboard')
  }

  const handleSaveSession = async (form) => {
    await supabase.from('sessions').insert({
      trainer_id: session.id, client_email: form.client,
      date: form.date, time: form.time, type: form.type, notes: form.notes,
    })
    setToast('Sesión agendada correctamente')
  }

  // ── Close notif panel on outside click ──────────────────────────
  useEffect(() => {
    const h = e => { if (panelRef.current && !panelRef.current.contains(e.target)) setShowNP(false) }
    document.addEventListener('mousedown', h)
    return () => document.removeEventListener('mousedown', h)
  }, [])

  // ── Loading / Auth gates ─────────────────────────────────────────
  if (loading) return <Spinner />
  if (!session || !profile) return <AuthScreen onAuth={handleAuth} />

  const isTrainer = profile?.role === 'trainer' || profile?.role === 'admin'
  const isAdmin   = profile?.role === 'admin'
  const unread    = notifs.filter(n => !n.read).length
  const markAll   = () => setNotifs(n => n.map(x => ({ ...x, read: true })))

  const TRAINER_TABS = [
    { id: 'dashboard',   l: 'Dashboard'    },
    { id: 'alumnos',     l: 'Mis alumnos'  },
    { id: 'planificador', l: 'Planificador' },
    { id: 'agenda',      l: 'Agenda'       },
    { id: 'notif',       l: 'Notificaciones' },
  ]
  const STUDENT_TABS = [
    { id: 'dashboard', l: 'Inicio'          },
    { id: 'progreso',  l: 'Mi progreso'     },
    { id: 'agenda',    l: 'Mi agenda'       },
    { id: 'notif',     l: 'Notificaciones'  },
  ]
  const tabs = isTrainer ? TRAINER_TABS : STUDENT_TABS

  return (
    <div className="app">
      {/* ── NAV ── */}
      <nav className="nav">
        <div className="nav-logo" onClick={() => setPage('dashboard')}>Forge<span>Gym</span></div>
        <div className="nav-tabs">
          {tabs.map(t => (
            <button key={t.id} className={`nav-tab ${page === t.id ? 'active' : ''}`} onClick={() => setPage(t.id)}>{t.l}</button>
          ))}
        </div>
        <div className="nav-right">
          <div ref={panelRef} style={{ position: 'relative' }}>
            <button className="notif-btn" onClick={() => setShowNP(v => !v)}>
              🔔{unread > 0 && <span className="notif-dot" />}
            </button>
            {showNP && <NotifPanel notifs={notifs} onClear={() => { markAll(); setShowNP(false) }} />}
          </div>
          <div className="user-chip">
            <Avatar name={profile?.name} size={36} radius="50%" />
            <div>
              <div className="user-name-txt">{profile?.name?.split(' ')[0]}</div>
              <div className="user-role-txt">{isAdmin ? 'Admin / Gimnasio' : isTrainer ? 'Entrenador' : 'Alumno'}</div>
            </div>
          </div>
          <button className="logout-btn" onClick={handleLogout}>Salir</button>
        </div>
      </nav>

      {/* ── MAIN ── */}
      <main className="main">
        {/* Trainer / Admin pages */}
        {isTrainer && page === 'dashboard'    && <TrainerDashboard profile={profile} onNewSession={() => setShowSM(true)} clients={clients} />}
        {isTrainer && page === 'alumnos'      && <TrainerClients clients={clients} />}
        {isTrainer && page === 'planificador' && <WorkoutPlanner profile={profile} clients={clients} />}
        {isTrainer && page === 'agenda'       && <TrainerSchedule onNew={() => setShowSM(true)} />}
        {isTrainer && page === 'notif'        && <NotifPage notifs={notifs} onMarkAll={markAll} />}

        {/* Student pages */}
        {!isTrainer && page === 'dashboard' && <StudentDashboard profile={profile} workouts={workouts} />}
        {!isTrainer && page === 'progreso'  && <StudentProgress workouts={workouts} />}
        {!isTrainer && page === 'agenda'    && <StudentSchedule />}
        {!isTrainer && page === 'notif'     && <NotifPage notifs={notifs} onMarkAll={markAll} />}
      </main>

      {showSM  && <SessionModal onClose={() => setShowSM(false)} onSave={handleSaveSession} />}
      {toast   && <Toast msg={toast} onDone={() => setToast(null)} />}
    </div>
  )
}

function NotifPage({ notifs, onMarkAll }) {
  return (
    <div className="page">
      <div className="sh-row">
        <div className="sh-row-left"><h1>Notificaciones</h1><p>{notifs.filter(n=>!n.read).length} sin leer</p></div>
        <button className="btn btn-s" onClick={onMarkAll}>Marcar todas leídas</button>
      </div>
      <div className="card" style={{ overflow: 'hidden' }}>
        {notifs.length === 0
          ? <div style={{ textAlign: 'center', padding: '40px 20px', color: 'var(--ink2)' }}>Sin notificaciones</div>
          : notifs.map((n, i) => (
            <div key={n.id} style={{ display: 'flex', gap: 16, alignItems: 'flex-start', padding: '18px 24px', borderBottom: i < notifs.length - 1 ? '1px solid var(--border)' : 'none', background: n.read ? 'transparent' : 'var(--accent-light)' }}>
              <div className={`ni-icon ${n.type}`} style={{ width: 44, height: 44, borderRadius: 12, fontSize: 20 }}>{n.icon}</div>
              <div style={{ flex: 1 }}>
                <p style={{ fontSize: 14, lineHeight: 1.5 }}>{n.text}</p>
                <p style={{ fontSize: 12, color: 'var(--ink2)', marginTop: 4 }}>{n.time}</p>
              </div>
              {!n.read && <div style={{ width: 8, height: 8, background: 'var(--accent)', borderRadius: '50%', marginTop: 8 }} />}
            </div>
          ))}
      </div>
    </div>
  )
}
