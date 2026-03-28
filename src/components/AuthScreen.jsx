import { useState } from 'react'
import { supabase } from '../supabase.js'

export default function AuthScreen({ onAuth }) {
  const [tab,setTab]=useState('login')
  const [role,setRole]=useState('student')
  const [email,setEmail]=useState('')
  const [password,setPassword]=useState('')
  const [name,setName]=useState('')
  const [loading,setLoading]=useState(false)
  const [error,setError]=useState('')
  const [success,setSuccess]=useState('')

  const reset=t=>{setTab(t);setError('');setSuccess('')}

  const handleLogin=async()=>{
    if(!email||!password){setError('Ingresa tu email y contraseña.');return}
    setError('');setLoading(true)
    const{data,error:err}=await supabase.auth.signInWithPassword({email,password})
    if(err){
      setLoading(false)
      if(err.message.includes('Email not confirmed'))setError('Confirma tu email primero.')
      else if(err.message.includes('Invalid login credentials'))setError('Email o contraseña incorrectos.')
      else setError(err.message)
      return
    }
    const{data:profile,error:profErr}=await supabase.from('profiles').select('*').eq('id',data.user.id).single()
    setLoading(false)
    if(profErr||!profile){
      await supabase.auth.signOut()
      setError('Cuenta sin perfil. Por favor crea una cuenta nueva.')
      return
    }
    onAuth(data.user,profile)
  }

  const handleRegister=async()=>{
    if(!name.trim()){setError('Ingresa tu nombre.');return}
    if(!email.trim()){setError('Ingresa tu email.');return}
    if(password.length<6){setError('Contraseña mínimo 6 caracteres.');return}
    setError('');setLoading(true)
    const{data,error:err}=await supabase.auth.signUp({email,password})
    if(err){setLoading(false);setError(err.message);return}
    if(!data.user){setLoading(false);setError('No se pudo crear la cuenta.');return}
    const{error:insErr}=await supabase.from('profiles').insert({
      id:data.user.id,name:name.trim(),email:email.trim().toLowerCase(),role
    })
    setLoading(false)
    if(insErr){setError('Error al guardar perfil: '+insErr.message);return}
    if(data.session){
      onAuth(data.user,{id:data.user.id,name:name.trim(),email,role})
      return
    }
    setSuccess('¡Cuenta creada! Ahora inicia sesión.')
    reset('login')
  }

  const roles=[
    {id:'admin',icon:'🏢',label:'Gimnasio'},
    {id:'trainer',icon:'🏋️',label:'Entrenador'},
    {id:'student',icon:'🎯',label:'Alumno'},
  ]

  return(
    <div className="auth-wrap">
      <div className="auth-box">
        <div className="auth-logo">Forge<span>Gym</span></div>
        <p style={{color:'var(--ink2)',fontSize:14,marginBottom:28}}>Plataforma de gestión para gimnasios</p>
        <div className="auth-tabs">
          {['login','register'].map(t=>(
            <button key={t} className={`auth-tab ${tab===t?'active':''}`} onClick={()=>reset(t)}>
              {t==='login'?'Iniciar sesión':'Crear cuenta'}
            </button>
          ))}
        </div>
        {error&&<div style={{background:'#fbeaea',border:'1px solid #f5c6c6',color:'#c0392b',borderRadius:8,padding:'10px 14px',fontSize:13,marginBottom:16}}>⚠️ {error}</div>}
        {success&&<div style={{background:'var(--accent-light)',border:'1px solid #b8d4bf',color:'var(--accent)',borderRadius:8,padding:'10px 14px',fontSize:13,marginBottom:16}}>✓ {success}</div>}
        {tab==='register'&&(
          <>
            <div style={{marginBottom:18}}>
              <label>Tipo de cuenta</label>
              <div style={{display:'flex',gap:8,marginTop:8}}>
                {roles.map(r=>(
                  <div key={r.id} onClick={()=>setRole(r.id)} style={{flex:1,padding:'12px 8px',borderRadius:10,border:`2px solid ${role===r.id?'var(--accent)':'var(--border)'}`,background:role===r.id?'var(--accent-light)':'var(--surface)',textAlign:'center',cursor:'pointer'}}>
                    <div style={{fontSize:20,marginBottom:4}}>{r.icon}</div>
                    <div style={{fontSize:12,fontWeight:500}}>{r.label}</div>
                  </div>
                ))}
              </div>
            </div>
            <div className="fg">
              <label>Nombre completo</label>
              <input placeholder="Tu nombre" value={name} onChange={e=>setName(e.target.value)}/>
            </div>
          </>
        )}
        <div className="fg">
          <label>Email</label>
          <input type="email" placeholder="correo@mail.com" value={email} onChange={e=>setEmail(e.target.value)}/>
        </div>
        <div className="fg" style={{marginBottom:24}}>
          <label>Contraseña</label>
          <input type="password" placeholder="Mínimo 6 caracteres" value={password} onChange={e=>setPassword(e.target.value)} onKeyDown={e=>e.key==='Enter'&&(tab==='login'?handleLogin():handleRegister())}/>
        </div>
        <button className="btn btn-p btn-full" onClick={tab==='login'?handleLogin:handleRegister} disabled={loading}>
          {loading?'Cargando...':tab==='login'?'Iniciar sesión':'Crear cuenta'}
        </button>
        <p style={{textAlign:'center',marginTop:16,fontSize:13,color:'var(--ink2)'}}>
          {tab==='login'
            ?<><span>¿No tienes cuenta? </span><span style={{color:'var(--accent)',cursor:'pointer',fontWeight:500}} onClick={()=>reset('register')}>Regístrate gratis</span></>
            :<><span>¿Ya tienes cuenta? </span><span style={{color:'var(--accent)',cursor:'pointer',fontWeight:500}} onClick={()=>reset('login')}>Inicia sesión</span></>}
        </p>
      </div>
    </div>
  )
}
