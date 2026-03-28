import { useState, useEffect } from 'react'
import { supabase } from '../supabase.js'
import { Avatar, EmptyState, Modal } from './UI.jsx'

const EXERCISE_TYPES = ['Fuerza','HIIT','Cardio','Yoga','Funcional','Movilidad','Stretching']
const MUSCLE_GROUPS  = ['Pecho','Espalda','Hombros','Bíceps','Tríceps','Core','Cuádriceps','Isquiotibiales','Glúteos','Pantorrillas','Full Body']

const emptyExercise = () => ({ name: '', sets: '', reps: '', weight: '', notes: '' })

export default function WorkoutPlanner({ profile, clients }) {
  const [plans, setPlans]         = useState([])
  const [loading, setLoading]     = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [editPlan, setEditPlan]   = useState(null)
  const [tab, setTab]             = useState('plans')

  useEffect(() => { fetchPlans() }, [])

  const fetchPlans = async () => {
    setLoading(true)
    const { data } = await supabase
      .from('workout_plans')
      .select('*, plan_exercises(*)')
      .eq('trainer_id', profile.id)
      .order('created_at', { ascending: false })
    setPlans(data || [])
    setLoading(false)
  }

  const handleSave = async (planData) => {
    if (editPlan) {
      await supabase.from('workout_plans').update({
        name: planData.name, type: planData.type, description: planData.description,
        muscle_groups: planData.muscle_groups, duration_min: planData.duration_min,
      }).eq('id', editPlan.id)
      await supabase.from('plan_exercises').delete().eq('plan_id', editPlan.id)
    } else {
      const { data: newPlan } = await supabase.from('workout_plans').insert({
        trainer_id: profile.id,
        name: planData.name, type: planData.type, description: planData.description,
        muscle_groups: planData.muscle_groups, duration_min: planData.duration_min,
      }).select().single()
      planData.planId = newPlan.id
    }
    const pid = editPlan ? editPlan.id : planData.planId
    if (planData.exercises.length > 0) {
      await supabase.from('plan_exercises').insert(
        planData.exercises.filter(e => e.name.trim()).map((e, i) => ({
          plan_id: pid, order: i + 1,
          name: e.name, sets: parseInt(e.sets) || null,
          reps: e.reps, weight: e.weight, notes: e.notes
        }))
      )
    }
    setShowModal(false); setEditPlan(null); fetchPlans()
  }

  const handleDelete = async (id) => {
    if (!confirm('¿Eliminar este plan?')) return
    await supabase.from('plan_exercises').delete().eq('plan_id', id)
    await supabase.from('workout_plans').delete().eq('id', id)
    fetchPlans()
  }

  const handleAssign = async (planId, clientId) => {
    await supabase.from('assigned_plans').insert({ plan_id: planId, student_id: clientId, trainer_id: profile.id })
    alert('Plan asignado correctamente ✓')
  }

  return (
    <div className="page">
      <div className="sh-row">
        <div className="sh-row-left"><h1>Planificador</h1><p>Crea y asigna rutinas a tus alumnos</p></div>
        <button className="btn btn-p" onClick={() => { setEditPlan(null); setShowModal(true) }}>+ Nuevo plan</button>
      </div>

      <div className="tab-row">
        <button className={`tab-btn ${tab === 'plans' ? 'active' : ''}`} onClick={() => setTab('plans')}>Mis planes ({plans.length})</button>
        <button className={`tab-btn ${tab === 'assign' ? 'active' : ''}`} onClick={() => setTab('assign')}>Asignar a alumnos</button>
      </div>

      {tab === 'plans' && (
        loading
          ? <div style={{ textAlign: 'center', padding: 40, color: 'var(--ink2)' }}>Cargando planes...</div>
          : plans.length === 0
            ? <EmptyState icon="📋" title="Sin planes aún" desc="Crea tu primer plan de entrenamiento." />
            : <div className="g2">
                {plans.map(p => (
                  <PlanCard key={p.id} plan={p} onEdit={() => { setEditPlan(p); setShowModal(true) }} onDelete={() => handleDelete(p.id)} />
                ))}
              </div>
      )}

      {tab === 'assign' && (
        <AssignTab plans={plans} clients={clients} onAssign={handleAssign} />
      )}

      {showModal && (
        <PlanModal
          initialPlan={editPlan}
          onClose={() => { setShowModal(false); setEditPlan(null) }}
          onSave={handleSave}
        />
      )}
    </div>
  )
}

function PlanCard({ plan, onEdit, onDelete }) {
  const exercises = plan.plan_exercises || []
  return (
    <div className="plan-card">
      <div className="plan-card-header">
        <div>
          <div className="plan-card-name">{plan.name}</div>
          <div className="plan-card-meta">{plan.type} · {plan.duration_min || '?'} min · {exercises.length} ejercicios</div>
        </div>
        <div style={{ display: 'flex', gap: 6 }}>
          <button className="btn btn-s btn-sm" onClick={onEdit}>✏️</button>
          <button className="btn btn-danger btn-sm" onClick={onDelete}>🗑️</button>
        </div>
      </div>
      {plan.description && <p style={{ fontSize: 13, color: 'var(--ink2)', marginBottom: 10 }}>{plan.description}</p>}
      {exercises.length > 0 && (
        <div className="plan-exercises">
          {exercises.slice(0, 5).map((e, i) => (
            <span key={i} className="chip">{e.name} {e.sets && `${e.sets}×${e.reps}`}</span>
          ))}
          {exercises.length > 5 && <span className="chip">+{exercises.length - 5} más</span>}
        </div>
      )}
      {plan.muscle_groups && plan.muscle_groups.length > 0 && (
        <div style={{ marginTop: 10, display: 'flex', gap: 6, flexWrap: 'wrap' }}>
          {plan.muscle_groups.map(g => <span key={g} className="chip g" style={{ fontSize: 10 }}>{g}</span>)}
        </div>
      )}
    </div>
  )
}

function AssignTab({ plans, clients, onAssign }) {
  const [selectedPlan, setSelectedPlan] = useState('')
  const [selectedClient, setSelectedClient] = useState('')

  return (
    <div>
      <div className="card cp" style={{ marginBottom: 20 }}>
        <h2 className="card-title">Asignar plan a alumno</h2>
        <div className="g2">
          <div className="fg">
            <label>Seleccionar plan</label>
            <select value={selectedPlan} onChange={e => setSelectedPlan(e.target.value)}>
              <option value="">Elegir plan...</option>
              {plans.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
            </select>
          </div>
          <div className="fg">
            <label>Seleccionar alumno</label>
            <select value={selectedClient} onChange={e => setSelectedClient(e.target.value)}>
              <option value="">Elegir alumno...</option>
              {clients.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>
        </div>
        <button
          className="btn btn-p"
          disabled={!selectedPlan || !selectedClient}
          onClick={() => { onAssign(selectedPlan, selectedClient); setSelectedPlan(''); setSelectedClient('') }}>
          Asignar plan →
        </button>
      </div>
      {clients.length === 0 && <EmptyState icon="👥" title="Sin alumnos" desc="Registra alumnos para poder asignarles planes." />}
    </div>
  )
}

function PlanModal({ initialPlan, onClose, onSave }) {
  const exercises0 = initialPlan?.plan_exercises || [emptyExercise()]
  const [name, setName]         = useState(initialPlan?.name || '')
  const [type, setType]         = useState(initialPlan?.type || 'Fuerza')
  const [desc, setDesc]         = useState(initialPlan?.description || '')
  const [dur,  setDur]          = useState(initialPlan?.duration_min || '')
  const [muscleGroups, setMG]   = useState(initialPlan?.muscle_groups || [])
  const [exercises, setEx]      = useState(exercises0.length ? exercises0 : [emptyExercise()])
  const [saving, setSaving]     = useState(false)

  const updateEx = (i, field, val) => setEx(prev => prev.map((e, idx) => idx === i ? { ...e, [field]: val } : e))
  const addEx    = () => setEx(prev => [...prev, emptyExercise()])
  const removeEx = i  => setEx(prev => prev.filter((_, idx) => idx !== i))
  const toggleMG = g  => setMG(prev => prev.includes(g) ? prev.filter(x => x !== g) : [...prev, g])

  const handleSubmit = async () => {
    if (!name.trim()) { alert('El plan necesita un nombre.'); return }
    setSaving(true)
    await onSave({ name, type, description: desc, duration_min: parseInt(dur) || null, muscle_groups: muscleGroups, exercises })
    setSaving(false)
  }

  return (
    <div className="modal-ov" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal" style={{ width: 580 }}>
        <div className="modal-title">{initialPlan ? 'Editar plan' : 'Nuevo plan de entrenamiento'}</div>
        <div className="modal-sub">Define los ejercicios, series y cargas</div>

        <div className="g2">
          <div className="fg"><label>Nombre del plan *</label><input placeholder="Ej: Fuerza Upper A" value={name} onChange={e => setName(e.target.value)} /></div>
          <div className="fg"><label>Tipo</label>
            <select value={type} onChange={e => setType(e.target.value)}>
              {EXERCISE_TYPES.map(t => <option key={t}>{t}</option>)}
            </select>
          </div>
        </div>
        <div className="g2">
          <div className="fg"><label>Duración estimada (min)</label><input type="number" placeholder="60" value={dur} onChange={e => setDur(e.target.value)} /></div>
          <div className="fg"><label>Descripción (opcional)</label><input placeholder="Notas generales..." value={desc} onChange={e => setDesc(e.target.value)} /></div>
        </div>

        <div className="fg">
          <label>Grupos musculares</label>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 4 }}>
            {MUSCLE_GROUPS.map(g => (
              <span key={g} onClick={() => toggleMG(g)} style={{ cursor: 'pointer' }}
                className={`chip ${muscleGroups.includes(g) ? 'g' : ''}`}>{g}</span>
            ))}
          </div>
        </div>

        <div style={{ marginBottom: 8, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <label style={{ marginBottom: 0 }}>Ejercicios</label>
          <button className="btn btn-s btn-sm" onClick={addEx}>+ Agregar</button>
        </div>

        <div style={{ maxHeight: 280, overflowY: 'auto', paddingRight: 4 }}>
          {exercises.map((ex, i) => (
            <div className="exercise-row" key={i}>
              <div className="exercise-num">{i + 1}</div>
              <input style={{ flex: 2, minWidth: 100 }} placeholder="Ejercicio" value={ex.name} onChange={e => updateEx(i, 'name', e.target.value)} />
              <input style={{ width: 48 }} placeholder="Series" value={ex.sets} onChange={e => updateEx(i, 'sets', e.target.value)} />
              <input style={{ width: 60 }} placeholder="Reps" value={ex.reps} onChange={e => updateEx(i, 'reps', e.target.value)} />
              <input style={{ width: 64 }} placeholder="Carga" value={ex.weight} onChange={e => updateEx(i, 'weight', e.target.value)} />
              {exercises.length > 1 && (
                <button onClick={() => removeEx(i)} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 16, color: 'var(--danger)', flexShrink: 0 }}>✕</button>
              )}
            </div>
          ))}
        </div>

        <div className="modal-actions">
          <button className="btn btn-s" onClick={onClose}>Cancelar</button>
          <button className="btn btn-p" onClick={handleSubmit} disabled={saving}>{saving ? 'Guardando...' : 'Guardar plan'}</button>
        </div>
      </div>
    </div>
  )
}
