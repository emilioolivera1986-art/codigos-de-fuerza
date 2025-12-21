// public/assets/dashboard.js
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const supabaseUrl = 'https://zeihyrwfxmrlogrgvtif.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InplaWh5cndmeG1ybG9ncmd2dGlmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQxNzQzMTcsImV4cCI6MjA3OTc1MDMxN30.V46Oj1Pqwa0FqsIU3utbX2TPqlhKXIxKaFdnI7cUWss'
const supabase = createClient(supabaseUrl, supabaseKey)

// ELEMENTOS
const welcomeEl = document.getElementById('welcome')
const emailEl = document.getElementById('user-email')
const diasEl = document.getElementById('dias-registro')
const verifEl = document.getElementById('verif-status')
const btnRutina = document.getElementById('btn-rutina')
const btnVerRutina = document.getElementById('btn-ver-rutina')

// CERRAR SESIÓN
document.getElementById('salir').addEventListener('click', async () => {
  await supabase.auth.signOut()
  window.location.replace('/login.html')
})

// HASH #rutina
if (location.hash === '#rutina') mostrarRutina()

// MAIN
;(async function init() {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    window.location.replace('/login.html')
    return
  }

  // Nombre y email
  const { data: perfil } = await supabase.from('perfiles').select('nombre').eq('id', user.id).single()
  const nombre = perfil?.nombre || user.email.split('@')[0]
  welcomeEl.textContent = `¡Hola, ${nombre}! 💪`
  emailEl.textContent = user.email

  // Días desde registro
  const created = new Date(user.created_at)
  const dias = Math.floor((Date.now() - created) / 86400000)
  diasEl.textContent = `Día ${dias + 1} con nosotros`

  // Verificación
  verifEl.innerHTML = user.email_confirmed_at
    ? '✅ Email verificado'
    : '⚠️ Verificá tu email para acceso completo'

  // ¿Tiene rutina?
  const { data: rutina } = await supabase.from('rutinas').select('contenido').eq('id', user.id).single()
  if (rutina) {
    btnRutina.textContent = 'Entrenar hoy'
    btnVerRutina.style.display = 'inline-block'
  } else {
    btnRutina.textContent = 'Crear mi rutina'
    btnVerRutina.style.display = 'none'
  }

  btnRutina.addEventListener('click', async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const { data: rutina } = await supabase.from('rutinas').select('contenido').eq('id', user.id).single()
    if (rutina) {
      window.location.href = '/rutina.html'
    } else {
      window.location.href = '/perfil.html'
    }
  })

  btnVerRutina?.addEventListener('click', mostrarRutina)
})()

// MOSTRAR RUTINA
async function mostrarRutina() {
  document.getElementById('solapa-rutina').style.display = 'block'
  const cont = document.getElementById('rutina-contenido')
  cont.textContent = 'Generando rutina...'

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return

  const { data: perfil } = await supabase.from('perfiles').select('*').eq('id', user.id).single()
  if (!perfil) {
    cont.textContent = 'Completá tus datos primero.'
    return
  }

  // Llamamos a la Netlify Function (sin key)
  const functionResp = await fetch('/.netlify/functions/generarRutina', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ user_id: user.id })
  })

  const json = await functionResp.json()
  if (!functionResp.ok) {
    cont.textContent = 'Error: ' + (json?.error || 'No se pudo generar la rutina.')
    return
  }
  const rutinaText = json.rutina
  cont.textContent = rutinaText

  // Guardar rutina
  document.getElementById('btn-guardar-rutina').onclick = async () => {
    await supabase.from('rutinas').upsert({
      id: user.id,
      contenido: rutinaText,
      updated_at: new Date().toISOString(),
    }, { onConflict: 'id' })

    alert('Rutina guardada.')
  }
}