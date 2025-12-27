import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const supabaseUrl = 'https://zeihyrwfxmrlogrgvtif.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InplaWh5cndmeG1ybG9ncmd2dGlmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQxNzQzMTcsImV4cCI6MjA3OTc1MDMxN30.V46Oj1Pqwa0FqsIU3utbX2TPqlhKXIxKaFdnI7cUWss'
const supabase = createClient(supabaseUrl, supabaseKey)

// ELEMENTOS
const welcomeEl   = document.getElementById('welcome')
const emailEl     = document.getElementById('user-email')
const diasEl      = document.getElementById('dias-registro')
const verifEl     = document.getElementById('verif-status')
const btnRutina   = document.getElementById('btn-rutina')
const btnVerRut   = document.getElementById('btn-ver-rutina')
const imcValorEl  = document.getElementById('imc-valor')
const imcLabelEl  = document.getElementById('imc-etiqueta')
const semanaVaciaEl   = document.getElementById('semana-vacia')
const diasContainerEl = document.getElementById('dias-container')

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

  // bienvenida
  const { data: perfil } = await supabase.from('perfiles').select('*').eq('id', user.id).single()
  const nombre = perfil?.nombre || user.email.split('@')[0]
  welcomeEl.textContent = `¡Hola, ${nombre}! 💪`
  emailEl.textContent = user.email

  // IMC
  if (perfil?.imc) {
    const v = parseFloat(perfil.imc)
    imcValorEl.textContent = v.toFixed(1)
    let label = ''
    if (v < 18.5)      label = 'Bajo peso'
    else if (v < 25)   label = 'Normal'
    else if (v < 30)   label = 'Sobrepeso'
    else               label = 'Obesidad'
    imcLabelEl.textContent = label
  }

  // días desde registro
  const created = new Date(user.created_at)
  const dias = Math.floor((Date.now() - created) / 86400000)
  diasEl.textContent = `Día ${dias + 1} con nosotros`

  // verificación
  verifEl.innerHTML = user.email_confirmed_at
    ? '✅ Email verificado'
    : '⚠️ Verificá tu email para acceso completo'

  // ¿Tiene rutina?
  const { data: rutina } = await supabase.from('rutinas').select('contenido').eq('id', user.id).single()
  if (rutina) {
    btnRutina.textContent = 'Entrenar hoy'
    btnVerRut.style.display = 'inline-block'
  } else {
    btnRutina.textContent = 'Crear mi rutina'
    btnVerRut.style.display = 'none'
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

  btnVerRutina.addEventListener('click', mostrarRutina)

  // ---------- MI SEMANA ----------
  await cargarSemana(user.id)
})()

// ---------- FUNCIONES ----------
async function cargarSemana(userId) {
  const hoy   = new Date()
  const week  = getWeek(hoy)
  const year  = hoy.getFullYear()

  // buscar semana
  const { data: sem } = await supabase
    .from('semanas')
    .select('id')
    .eq('user_id', userId)
    .eq('semana', week)
    .eq('año', year)
    .single()
  if (!sem) { semanaVaciaEl.style.display = 'block'; return }

  // buscar días
  const { data: dias } = await supabase
    .from('dias_semana')
    .select('*')
    .eq('semana_id', sem.id)
    .order('fecha', { ascending: true })
  if (!dias || !dias.length) { semanaVaciaEl.style.display = 'block'; return }

  semanaVaciaEl.style.display = 'none'
  diasContainerEl.innerHTML = ''

  const hoyStr = hoy.toISOString().slice(0, 10)

  for (const d of dias) {
    const card = document.createElement('div')
    card.className = 'dia-card'
    const hecho    = d.completado
    const esHoy    = d.fecha === hoyStr && !hecho
    const esFuturo = d.fecha > hoyStr

    if (hecho) card.classList.add('done')
    if (esHoy) card.classList.add('today')

    card.innerHTML = `
      <div class="dia-title">${d.dia_txt.split(' - ')[0]}</div>
      <div class="check">${hecho ? '✅' : esFuturo ? '🔒' : '⏳'}</div>
      ${esHoy ? `<button class="btn btn-block" onclick="entrenar('${d.id}')">Entrenar</button>` : ''}
    `
    diasContainerEl.appendChild(card)
  }
}

function entrenar(diaId) {
  window.location.href = '/rutina.html?dia=' + diaId
}

function getWeek(date) {
  const target = new Date(date.valueOf())
  const dayNr  = (date.getDay() + 6) % 7
  target.setDate(target.getDate() - dayNr + 3)
  const firstThursday = target.valueOf()
  target.setMonth(0, 1)
  if (target.getDay() !== 4) {
    target.setMonth(0, 1 + ((4 - target.getDay()) + 7) % 7)
  }
  return 1 + Math.ceil((firstThursday - target) / 604800000)
}

// MOSTRAR RUTINA (sin tocar)
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

  document.getElementById('btn-guardar-rutina').onclick = async () => {
    await supabase.from('rutinas').upsert({
      id: user.id,
      contenido: rutinaText,
      updated_at: new Date().toISOString()
    }, { onConflict: 'id' })
    alert('Rutina guardada.')
  }
}