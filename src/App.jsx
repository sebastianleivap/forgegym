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

function SessionModal({ onClose, onSave, profile }) {
  const [f, setF] = useState({ client: '', clientEmail: '', date: '', time: '', type: 'Fuerza', notes: '' })
  const [sending, setSending] = useState(false)
  const s = k => e => setF(p => ({ ...p, [k]: e.target.value }))
  const isMobile = window.innerWidth <= 480

  const handleSave = async () => {
    setSending(true)
    await onSave(f)
    // Enviar correo si hay email del alumno
    if (f.clientEmail) {
      try {
        // Intentar con Edge Function primero
        const { error } = await supabase.functions.invoke('dynamic-responder', {
          body: {
            studentEmail: f.clientEmail,
            studentName: f.client || f.clientEmail,
            trainerName: profile?.name || 'Tu entrenador',
            date: f.date ? new Date(f.date + 'T12:00:00').toLocaleDateString('es-CL', { weekday: 'long', day: 'numeric', month: 'long' }) : f.date,
            time: f.time,
            type: f.type,
            gymName: profile?.gym_name || 'ForgeGym',
          }
        })
        if (error) console.log('Edge function error:', error)
      } catch (e) {
        console.log('Email no enviado:', e)
      }
    }
    setSending(false)
    onClose()
  }

  const content = (
    <>
      <div className="g2">
        <div className="fg"><label>Nombre del alumno</label><input placeholder="Ej: Laura Torres" value={f.client} onChange={s('client')} /></div>
        <div className="fg"><label>Email del alumno</label><input type="email" placeholder="alumno@mail.com" value={f.clientEmail} onChange={s('clientEmail')} /></div>
      </div>
      <div className="g2">
        <div className="fg"><label>Fecha</label><input type="date" value={f.date} onChange={s('date')} /></div>
        <div className="fg"><label>Hora</label><input type="time" value={f.time} onChange={s('time')} /></div>
      </div>
      <div className="fg"><label>Tipo de sesión</label>
        <select value={f.type} onChange={s('type')}>
          {['Fuerza','HIIT','Yoga','Cardio','Funcional','Stretching'].map(t => <option key={t}>{t}</option>)}
        </select>
      </div>
      <div className="fg"><label>Notas</label><textarea placeholder="Indicaciones, objetivos..." value={f.notes} onChange={s('notes')} /></div>
      {f.clientEmail && (
        <div style={{ background: 'var(--accent-light)', border: '1px solid #b8d4bf', borderRadius: 8, padding: '8px 12px', fontSize: 12, color: 'var(--accent)', marginBottom: 8 }}>
          ✉️ Se enviará confirmación a <strong>{f.clientEmail}</strong>
        </div>
      )}
      <div style={{ display: 'flex', gap: 10, marginTop: 8 }}>
        <button className="btn btn-s" style={{ flex: 1 }} onClick={onClose} disabled={sending}>Cancelar</button>
        <button className="btn btn-p" style={{ flex: 2 }} onClick={handleSave} disabled={sending}>
          {sending ? 'Guardando...' : '✓ Guardar sesión'}
        </button>
      </div>
    </>
  )

  if (isMobile) return (
    <div className="sheet-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="sheet">
        <div className="sheet-handle" />
        <div className="sheet-title">Agendar Sesión</div>
        <div className="sheet-sub">Nueva sesión de entrenamiento</div>
        {content}
      </div>
    </div>
  )

  return (
    <div className="modal-ov" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal">
        <div className="modal-title">Agendar Sesión</div>
        <div className="modal-sub">Nueva sesión de entrenamiento</div>
        {content}
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
  const [sessions,  setSessions]  = useState([])
  const [showNP,   setShowNP]   = useState(false)
  const [showSM,   setShowSM]   = useState(false)
  const [toast,    setToast]    = useState(null)
  const panelRef = useRef()

  // ── Auth listener ──────────────────────────────────────────────
  useEffect(() => {
    supabase.auth.getSession().then(async ({ data: { session: s } }) => {
      if (s) await loadProfile(s.user)
      else setLoading(false)
    })
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_, s) => {
      if (s) await loadProfile(s.user)
      else { setSession(null); setProfile(null); setLoading(false) }
    })
    return () => subscription.unsubscribe()
  }, [])

  const loadProfile = async (user) => {
    setSession(user)
    const { data: p, error } = await supabase.from('profiles').select('*').eq('id', user.id).single()
    if (error || !p) {
      // Profile doesn't exist — log out and show auth screen
      await supabase.auth.signOut()
      setSession(null)
      setProfile(null)
      setLoading(false)
      return
    }
    setProfile(p)
    if (p?.role === 'trainer' || p?.role === 'admin') {
      // Cargar alumnos SOLO del mismo gimnasio
      const { data: cls } = await supabase
        .from('profiles')
        .select('*')
        .eq('role', 'student')
        .eq('gym_id', p.gym_id)
      setClients(cls || [])
      // Cargar sesiones reales
      const { data: sess } = await supabase.from('sessions').select('*').eq('trainer_id', user.id).order('date', { ascending: true })
      setSessions(sess || [])
      // Cargar datos del gimnasio (código + nombre)
      if (p?.gym_id) {
        const { data: gym } = await supabase.from('gyms').select('invite_code, name').eq('id', p.gym_id).single()
        if (gym) setProfile(prev => ({ ...prev, gym_invite_code: gym.invite_code, gym_name: gym.name }))
      }
      setNotifs(NOTIFS_T)
    } else {
      setNotifs(NOTIFS_S)
    }
    setLoading(false)
  }

  const handleAuth = (user, prof) => {
    setSession(user); setProfile(prof)
    setNotifs(prof?.role === 'student' ? NOTIFS_S : NOTIFS_T)
  }

  const handleLogout = async () => {
    try {
      await supabase.auth.signOut()
    } catch (e) {
      console.log('signout error:', e)
    }
    // Limpiar estado local siempre, incluso si falla el signOut
    setSession(null)
    setProfile(null)
    setPage('dashboard')
    setClients([])
    setWorkouts([])
    setNotifs([])
    // Forzar recarga para limpiar caché del service worker en Safari
    window.location.href = '/'
  }

  const handleSaveSession = async (form) => {
    // Guardar sesión en Supabase
    const { error } = await supabase.from('sessions').insert({
      trainer_id: session.id,
      client_email: form.clientEmail || form.client,
      date: form.date,
      time: form.time,
      type: form.type,
      notes: form.notes,
      status: 'confirmed',
    })
    if (error) {
      setToast('Error al guardar la sesión')
      return
    }
    // Recargar sesiones para actualizar el calendario
    await loadSessions()
    setToast('Sesión agendada correctamente ✓')
  }

  const loadSessions = async () => {
    const { data } = await supabase
      .from('sessions')
      .select('*')
      .eq('trainer_id', session.id)
      .order('date', { ascending: true })
    setSessions(data || [])
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
        {isTrainer && page === 'dashboard'    && <TrainerDashboard profile={profile} onNewSession={() => setShowSM(true)} clients={clients} onNavigate={setPage} sessions={sessions} />}
        {isTrainer && page === 'alumnos'      && <TrainerClients clients={clients} />}
        {isTrainer && page === 'planificador' && <WorkoutPlanner profile={profile} clients={clients} />}
        {isTrainer && page === 'agenda'       && <TrainerSchedule onNew={() => setShowSM(true)} sessions={sessions} />}
        {isTrainer && page === 'notif'        && <NotifPage notifs={notifs} onMarkAll={markAll} />}

        {/* Student pages */}
        {!isTrainer && page === 'dashboard' && <StudentDashboard profile={profile} workouts={workouts} onNavigate={setPage} />}
        {!isTrainer && page === 'progreso'  && <StudentProgress workouts={workouts} />}
        {!isTrainer && page === 'agenda'    && <StudentSchedule />}
        {!isTrainer && page === 'notif'     && <NotifPage notifs={notifs} onMarkAll={markAll} />}
      </main>

      {/* ── BOTTOM NAV (móvil) ── */}
      <nav className="bottom-nav">
        {isTrainer ? (
          <>
            <button className={`bottom-nav-item ${page==='dashboard'?'active':''}`} onClick={()=>setPage('dashboard')}><span className="bn-icon">🏠</span>Inicio</button>
            <button className={`bottom-nav-item ${page==='alumnos'?'active':''}`} onClick={()=>setPage('alumnos')}><span className="bn-icon">👥</span>Alumnos</button>
            <button className={`bottom-nav-item ${page==='planificador'?'active':''}`} onClick={()=>setPage('planificador')}><span className="bn-icon">📋</span>Rutinas</button>
            <button className={`bottom-nav-item ${page==='agenda'?'active':''}`} onClick={()=>setPage('agenda')}><span className="bn-icon">📅</span>Agenda</button>
            <button className={`bottom-nav-item ${page==='notif'?'active':''}`} onClick={()=>setPage('notif')}>
              <span className="bn-icon" style={{position:'relative'}}>
                🔔{unread>0&&<span style={{position:'absolute',top:-4,right:-4,width:8,height:8,background:'#e07b8a',borderRadius:'50%'}}/>}
              </span>
              Alertas
            </button>
          </>
        ) : (
          <>
            <button className={`bottom-nav-item ${page==='dashboard'?'active':''}`} onClick={()=>setPage('dashboard')}><span className="bn-icon">🏠</span>Inicio</button>
            <button className={`bottom-nav-item ${page==='progreso'?'active':''}`} onClick={()=>setPage('progreso')}><span className="bn-icon">📈</span>Progreso</button>
            <button className={`bottom-nav-item ${page==='agenda'?'active':''}`} onClick={()=>setPage('agenda')}><span className="bn-icon">📅</span>Agenda</button>
            <button className={`bottom-nav-item ${page==='notif'?'active':''}`} onClick={()=>setPage('notif')}>
              <span className="bn-icon" style={{position:'relative'}}>
                🔔{unread>0&&<span style={{position:'absolute',top:-4,right:-4,width:8,height:8,background:'#e07b8a',borderRadius:'50%'}}/>}
              </span>
              Alertas
            </button>
          </>
        )}
      </nav>

      {showSM  && <SessionModal onClose={() => setShowSM(false)} onSave={handleSaveSession} profile={profile} />}
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
