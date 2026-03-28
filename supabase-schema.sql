-- =====================================================
-- ForgeGym — Esquema de Base de Datos Supabase
-- Ejecuta esto en: Supabase → SQL Editor → New query
-- =====================================================

-- 1. PERFILES DE USUARIO
CREATE TABLE profiles (
  id         UUID REFERENCES auth.users(id) PRIMARY KEY,
  name       TEXT NOT NULL,
  email      TEXT NOT NULL,
  role       TEXT NOT NULL CHECK (role IN ('admin', 'trainer', 'student')),
  gym_name   TEXT,
  gym_id     UUID,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. SESIONES AGENDADAS
CREATE TABLE sessions (
  id           UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  trainer_id   UUID REFERENCES profiles(id),
  client_id    UUID REFERENCES profiles(id),
  client_email TEXT,
  date         DATE,
  time         TIME,
  type         TEXT,
  notes        TEXT,
  status       TEXT DEFAULT 'confirmed' CHECK (status IN ('confirmed','pending','cancelled','completed')),
  created_at   TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. HISTORIAL DE ENTRENAMIENTOS
CREATE TABLE workouts (
  id         UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  student_id UUID REFERENCES profiles(id),
  trainer_id UUID REFERENCES profiles(id),
  date       TEXT,
  type       TEXT,
  duration   TEXT,
  exercises  INTEGER,
  kg         INTEGER,
  notes      TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. RECORDS PERSONALES
CREATE TABLE personal_records (
  id         UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  student_id UUID REFERENCES profiles(id),
  exercise   TEXT NOT NULL,
  weight_kg  NUMERIC,
  reps       INTEGER,
  sets       TEXT,
  date       DATE DEFAULT CURRENT_DATE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 5. PLANES DE ENTRENAMIENTO
CREATE TABLE workout_plans (
  id            UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  trainer_id    UUID REFERENCES profiles(id),
  name          TEXT NOT NULL,
  type          TEXT,
  description   TEXT,
  muscle_groups TEXT[],
  duration_min  INTEGER,
  created_at    TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 6. EJERCICIOS DE UN PLAN
CREATE TABLE plan_exercises (
  id       UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  plan_id  UUID REFERENCES workout_plans(id) ON DELETE CASCADE,
  order    INTEGER DEFAULT 1,
  name     TEXT NOT NULL,
  sets     INTEGER,
  reps     TEXT,
  weight   TEXT,
  notes    TEXT
);

-- 7. ASIGNACIÓN DE PLANES A ALUMNOS
CREATE TABLE assigned_plans (
  id         UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  plan_id    UUID REFERENCES workout_plans(id),
  student_id UUID REFERENCES profiles(id),
  trainer_id UUID REFERENCES profiles(id),
  active     BOOLEAN DEFAULT TRUE,
  assigned_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- ROW LEVEL SECURITY (cada usuario ve solo sus datos)
-- =====================================================

ALTER TABLE profiles       ENABLE ROW LEVEL SECURITY;
ALTER TABLE sessions       ENABLE ROW LEVEL SECURITY;
ALTER TABLE workouts       ENABLE ROW LEVEL SECURITY;
ALTER TABLE personal_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE workout_plans  ENABLE ROW LEVEL SECURITY;
ALTER TABLE plan_exercises ENABLE ROW LEVEL SECURITY;
ALTER TABLE assigned_plans ENABLE ROW LEVEL SECURITY;

-- PROFILES
CREATE POLICY "Ver propio perfil"       ON profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Crear propio perfil"     ON profiles FOR INSERT WITH CHECK (auth.uid() = id);
CREATE POLICY "Actualizar propio perfil" ON profiles FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Entrenadores y admins ven todos los perfiles" ON profiles FOR SELECT USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('trainer','admin'))
);

-- SESSIONS
CREATE POLICY "Entrenadores ven sus sesiones"    ON sessions FOR SELECT USING (trainer_id = auth.uid());
CREATE POLICY "Entrenadores crean sesiones"      ON sessions FOR INSERT WITH CHECK (trainer_id = auth.uid());
CREATE POLICY "Entrenadores actualizan sesiones" ON sessions FOR UPDATE USING (trainer_id = auth.uid());
CREATE POLICY "Alumnos ven sus sesiones"         ON sessions FOR SELECT USING (client_id = auth.uid());

-- WORKOUTS
CREATE POLICY "Alumnos ven sus workouts"         ON workouts FOR SELECT USING (student_id = auth.uid());
CREATE POLICY "Entrenadores insertan workouts"   ON workouts FOR INSERT WITH CHECK (trainer_id = auth.uid());
CREATE POLICY "Entrenadores ven workouts de alumnos" ON workouts FOR SELECT USING (trainer_id = auth.uid());

-- PERSONAL RECORDS
CREATE POLICY "Alumnos ven sus PRs"    ON personal_records FOR SELECT USING (student_id = auth.uid());
CREATE POLICY "Entrenadores insertan PRs" ON personal_records FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('trainer','admin'))
);

-- WORKOUT PLANS
CREATE POLICY "Entrenadores ven sus planes"   ON workout_plans FOR SELECT USING (trainer_id = auth.uid());
CREATE POLICY "Entrenadores crean planes"     ON workout_plans FOR INSERT WITH CHECK (trainer_id = auth.uid());
CREATE POLICY "Entrenadores actualizan planes" ON workout_plans FOR UPDATE USING (trainer_id = auth.uid());
CREATE POLICY "Entrenadores eliminan planes"  ON workout_plans FOR DELETE USING (trainer_id = auth.uid());

-- PLAN EXERCISES
CREATE POLICY "Ver ejercicios de mis planes" ON plan_exercises FOR SELECT USING (
  EXISTS (SELECT 1 FROM workout_plans WHERE id = plan_id AND trainer_id = auth.uid())
);
CREATE POLICY "Insertar ejercicios" ON plan_exercises FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM workout_plans WHERE id = plan_id AND trainer_id = auth.uid())
);
CREATE POLICY "Eliminar ejercicios" ON plan_exercises FOR DELETE USING (
  EXISTS (SELECT 1 FROM workout_plans WHERE id = plan_id AND trainer_id = auth.uid())
);

-- ASSIGNED PLANS
CREATE POLICY "Entrenadores asignan planes" ON assigned_plans FOR INSERT WITH CHECK (trainer_id = auth.uid());
CREATE POLICY "Ver asignaciones propias"    ON assigned_plans FOR SELECT USING (
  trainer_id = auth.uid() OR student_id = auth.uid()
);
