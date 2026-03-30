import { useState } from 'react'
import { supabase } from '../supabase.js'

// ── Cuentas demo ──────────────────────────────────────────────────
const DEMO_ACCOUNTS = [
  { role: 'admin',   email: 'demo.gimnasio@forgegym.cl',   password: 'demo1234', label: 'Gimnasio Demo',    icon: '🏢', desc: 'Ver panel de administración' },
  { role: 'trainer', email: 'demo.entrenador@forgegym.cl', password: 'demo1234', label: 'Entrenador Demo',  icon: '🏋️', desc: 'Ver gestión de alumnos' },
  { role: 'student', email: 'demo.alumno@forgegym.cl',     password: 'demo1234', label: 'Alumno Demo',      icon: '🎯', desc: 'Ver progreso y rutinas' },
]

export default function AuthScreen({ onAuth }) {
  const [tab,      setTab]      = useState('login')
  const [role,     setRole]     = useState('student')
  const [email,    setEmail]    = useState('')
  const [password, setPassword] = useState('')
  const [name,     setName]     = useState('')
  const [gymCode,  setGymCode]  = useState('')
  const [loading,  setLoading]  = useState(false)
  const [demoLoading, setDemoLoading] = useState(null)
  const [error,    setError]    = useState('')
  const [success,  setSuccess]  = useState('')
  const [showDemo, setShowDemo] = useState(false)

  const reset = t => { setTab(t); setError(''); setSuccess('') }

  const handleLogin = async () => {
    if (!email || !password) { setError('Ingresa tu email y contraseña.'); return }
    setError(''); setLoading(true)
    const { data, error: err } = await supabase.auth.signInWithPassword({ email, password })
    if (err) {
      setLoading(false)
      if (err.message.includes('Email not confirmed')) setError('Confirma tu email primero.')
      else if (err.message.includes('Invalid login credentials')) setError('Email o contraseña incorrectos.')
      else setError(err.message)
      return
    }
    const { data: profile, error: profErr } = await supabase.from('profiles').select('*').eq('id', data.user.id).single()
    setLoading(false)
    if (profErr || !profile) {
      await supabase.auth.signOut()
      setError('Cuenta sin perfil. Por favor crea una cuenta nueva.')
      return
    }
    onAuth(data.user, profile)
  }

  const handleRegister = async () => {
    if (!name.trim())        { setError('Ingresa tu nombre completo.'); return }
    if (!email.trim())       { setError('Ingresa tu email.'); return }
    if (password.length < 6) { setError('La contraseña debe tener al menos 6 caracteres.'); return }

    // Validar código de gimnasio si es entrenador o alumno
    let gymId = null
    if (role !== 'admin') {
      if (!gymCode.trim()) { setError('Ingresa el código de tu gimnasio.'); return }
      const { data: gym, error: gymErr } = await supabase
        .from('gyms').select('id, name').eq('invite_code', gymCode.trim().toUpperCase()).single()
      if (gymErr || !gym) { setError('Código de gimnasio inválido. Pídele el código a tu gimnasio.'); return }
      gymId = gym.id
    }

    setError(''); setLoading(true)
    const { data, error: err } = await supabase.auth.signUp({ email, password })
    if (err) {
      setLoading(false)
      if (err.message.includes('already registered')) setError('Este email ya está registrado.')
      else setError(err.message)
      return
    }
    if (!data.user) { setLoading(false); setError('No se pudo crear la cuenta.'); return }

    // Si es admin, crear gymansio automáticamente con código único
    let finalGymId = gymId
    if (role === 'admin') {
      const code = name.trim().toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 6) + Math.floor(Math.random() * 900 + 100)
      const { data: gym, error: gymErr } = await supabase.from('gyms').insert({
        name: name.trim(),
        invite_code: code,
        owner_id: data.user.id,
      }).select().single()
      if (gym) finalGymId = gym.id
    }

    const { error: insErr } = await supabase.from('profiles').insert({
      id: data.user.id, name: name.trim(),
      email: email.trim().toLowerCase(),
      role, gym_id: finalGymId,
    })
    setLoading(false)
    if (insErr) { setError('Error al guardar perfil: ' + insErr.message); return }
    if (data.session) {
      onAuth(data.user, { id: data.user.id, name: name.trim(), email, role, gym_id: finalGymId })
      return
    }
    setSuccess('¡Cuenta creada! Ahora inicia sesión.')
    reset('login')
  }

  const handleDemo = async (account) => {
    setDemoLoading(account.role); setError('')
    const { data, error: err } = await supabase.auth.signInWithPassword({
      email: account.email, password: account.password
    })
    if (err) { setDemoLoading(null); setError('Error al cargar demo. Intenta de nuevo.'); return }
    const { data: profile } = await supabase.from('profiles').select('*').eq('id', data.user.id).single()
    setDemoLoading(null)
    if (profile) onAuth(data.user, profile)
    else setError('Cuenta demo no disponible.')
  }

  const handleKey = e => { if (e.key === 'Enter') tab === 'login' ? handleLogin() : handleRegister() }

  const roles = [
    { id: 'admin',   icon: '🏢', label: 'Gimnasio' },
    { id: 'trainer', icon: '🏋️', label: 'Entrenador' },
    { id: 'student', icon: '🎯', label: 'Alumno' },
  ]

  return (
    <div className="auth-wrap">
      <div className="auth-box">
        <div className="auth-logo">Forge<span>Gym</span></div>
        <p style={{ color: 'var(--ink2)', fontSize: 14, marginBottom: 24 }}>
          Plataforma de gestión para gimnasios
        </p>

        {/* ── Demo Banner ── */}
        <div style={{ background: 'var(--accent-light)', border: '1px solid #b8d4bf', borderRadius: 10, padding: '12px 16px', marginBottom: 20 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: showDemo ? 12 : 0 }}>
            <div>
              <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--accent)' }}>🎮 Probar sin registrarse</div>
              <div style={{ fontSize: 12, color: 'var(--ink2)' }}>Explora la app con cuentas demo</div>
            </div>
            <button onClick={() => setShowDemo(v => !v)}
              style={{ background: 'var(--accent)', color: 'white', border: 'none', borderRadius: 8, padding: '6px 14px', fontSize: 12, fontWeight: 600, cursor: 'pointer', fontFamily: 'DM Sans, sans-serif' }}>
              {showDemo ? 'Cerrar' : 'Ver demos'}
            </button>
          </div>
          {showDemo && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {DEMO_ACCOUNTS.map(a => (
                <button key={a.role} onClick={() => handleDemo(a)} disabled={demoLoading === a.role}
                  style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 14px', background: 'white', border: '1px solid var(--border)', borderRadius: 8, cursor: 'pointer', fontFamily: 'DM Sans, sans-serif', transition: 'all .15s', textAlign: 'left' }}
                  onMouseEnter={e => e.currentTarget.style.borderColor = 'var(--accent)'}
                  onMouseLeave={e => e.currentTarget.style.borderColor = 'var(--border)'}>
                  <span style={{ fontSize: 22 }}>{a.icon}</span>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 13, fontWeight: 600 }}>{a.label}</div>
                    <div style={{ fontSize: 11, color: 'var(--ink2)' }}>{a.desc}</div>
                  </div>
                  <span style={{ fontSize: 12, color: 'var(--accent)', fontWeight: 600 }}>
                    {demoLoading === a.role ? 'Cargando...' : 'Entrar →'}
                  </span>
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="auth-tabs">
          {['login', 'register'].map(t => (
            <button key={t} className={`auth-tab ${tab === t ? 'active' : ''}`} onClick={() => reset(t)}>
              {t === 'login' ? 'Iniciar sesión' : 'Crear cuenta'}
            </button>
          ))}
        </div>

        {error   && <div style={{ background: '#fbeaea', border: '1px solid #f5c6c6', color: '#c0392b', borderRadius: 8, padding: '10px 14px', fontSize: 13, marginBottom: 16 }}>⚠️ {error}</div>}
        {success && <div style={{ background: 'var(--accent-light)', border: '1px solid #b8d4bf', color: 'var(--accent)', borderRadius: 8, padding: '10px 14px', fontSize: 13, marginBottom: 16 }}>✓ {success}</div>}

        {tab === 'register' && (
          <>
            <div style={{ marginBottom: 18 }}>
              <label>Tipo de cuenta</label>
              <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
                {roles.map(r => (
                  <div key={r.id} onClick={() => setRole(r.id)} style={{ flex: 1, padding: '12px 8px', borderRadius: 10, border: `2px solid ${role === r.id ? 'var(--accent)' : 'var(--border)'}`, background: role === r.id ? 'var(--accent-light)' : 'var(--surface)', textAlign: 'center', cursor: 'pointer', transition: 'all .15s' }}>
                    <div style={{ fontSize: 20, marginBottom: 4 }}>{r.icon}</div>
                    <div style={{ fontSize: 12, fontWeight: 500 }}>{r.label}</div>
                  </div>
                ))}
              </div>
            </div>
            <div className="fg">
              <label>Nombre completo</label>
              <input placeholder="Tu nombre" value={name} onChange={e => setName(e.target.value)} onKeyDown={handleKey} />
            </div>
            {role !== 'admin' && (
              <div className="fg">
                <label>Código del gimnasio</label>
                <input placeholder="Ej: DEMO2024 (pídelo a tu gimnasio)"
                  value={gymCode} onChange={e => setGymCode(e.target.value.toUpperCase())} onKeyDown={handleKey}
                  style={{ textTransform: 'uppercase', letterSpacing: 2, fontWeight: 600 }} />
                <div style={{ fontSize: 11, color: 'var(--ink2)', marginTop: 4 }}>
                  Tu gimnasio te entregará este código al registrarte
                </div>
              </div>
            )}
          </>
        )}

        <div className="fg">
          <label>Email</label>
          <input type="email" placeholder="correo@mail.com" value={email} onChange={e => setEmail(e.target.value)} onKeyDown={handleKey} />
        </div>
        <div className="fg" style={{ marginBottom: 24 }}>
          <label>Contraseña</label>
          <input type="password" placeholder="Mínimo 6 caracteres" value={password} onChange={e => setPassword(e.target.value)} onKeyDown={handleKey} />
        </div>

        <button className="btn btn-p btn-full" onClick={tab === 'login' ? handleLogin : handleRegister} disabled={loading}>
          {loading ? 'Cargando...' : tab === 'login' ? 'Iniciar sesión' : 'Crear cuenta'}
        </button>

        <p style={{ textAlign: 'center', marginTop: 16, fontSize: 13, color: 'var(--ink2)' }}>
          {tab === 'login'
            ? <><span>¿No tienes cuenta? </span><span style={{ color: 'var(--accent)', cursor: 'pointer', fontWeight: 500 }} onClick={() => reset('register')}>Regístrate gratis</span></>
            : <><span>¿Ya tienes cuenta? </span><span style={{ color: 'var(--accent)', cursor: 'pointer', fontWeight: 500 }} onClick={() => reset('login')}>Inicia sesión</span></>}
        </p>
      </div>
    </div>
  )
}
