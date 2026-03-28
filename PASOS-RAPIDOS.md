# ⚡ ForgeGym — Listo para usar

## Tu proyecto ya está conectado a Supabase ✓
- URL: https://vlmoodcrcjhjtlxxtooz.supabase.co
- Las claves ya están configuradas en el código

---

## Pasos para correr en tu PC

### 1. Instalar Node.js (si no lo tienes)
Descarga en: https://nodejs.org → botón verde "LTS"

### 2. Abrir terminal en la carpeta del proyecto
- Windows: click derecho en la carpeta → "Abrir en Terminal"
- Mac: arrastra la carpeta al ícono de Terminal

### 3. Instalar dependencias (solo la primera vez)
```bash
npm install
```

### 4. Correr la app
```bash
npm run dev
```
Abre: http://localhost:5173

---

## Subir a GitHub y publicar gratis en Vercel

### Subir a GitHub
```bash
git init
git add .
git commit -m "ForgeGym v1.0"
git branch -M main
git remote add origin https://github.com/sebastianleivap/forgegym.git
git push -u origin main
```

### Publicar en Vercel (gratis)
1. Ve a https://vercel.com → Sign up with GitHub
2. New Project → importa "forgegym"
3. En "Environment Variables" agrega:
   - VITE_SUPABASE_URL = https://vlmoodcrcjhjtlxxtooz.supabase.co
   - VITE_SUPABASE_ANON_KEY = sb_publishable_biihpOFU-kb00A_FS1IIow_5SFzX3Vp
4. Click Deploy 🚀

Tu URL quedará: https://forgegym.vercel.app

---

## ¿Problemas?
Abre Claude y describe el error exacto que aparece en la terminal.
