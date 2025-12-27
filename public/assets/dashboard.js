import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const supabaseUrl = 'https://zeihyrwfxmrlogrgvtif.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InplaWh5cndmeG1ybG9ncmd2dGlmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQxNzQzMTcsImV4cCI6MjA3OTc1MDMxN30.V46Oj1Pqwa0FqsIU3utbX2TPqlhKXIxKaFdnI7cUWss'
const supabase = createClient(supabaseUrl, supabaseKey)

// ---------- ELEMENTOS ----------
const welcomeEl   = document.getElementById('welcome')
const emailEl     = document.getElementById('user-email')
const diasEl      = document.getElementById('dias-registro')
const verifEl     = document.getElementById('verif-status')
const btnRutina   = document.getElementById('btn-rutina')
const btnVerRut   = document.getElementById('btn-ver-rutina')
const imcValorEl  = document.getElementById('imc-valor')
const imcLabelEl  = document.getElementById('imc-etiqueta')
const diasContainerEl = document.getElementById('dias-container')
const semanaVaciaEl   = document.getElementById('semana-vacia')

// ---------- CERRAR SESIÓN ----------
document.getElementById('salir').addEventListener('click', async () => {
  await supabase.auth.signOut()
  window.location.replace('/login.html')
})

// ---------- MAIN ----------
;(async function init () {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) { window.location.replace('/login.html'); return }

  // bienvenida
  const { data: perfil } = await supabase.from('perfiles').select('*').eq('id', user.id).single()
  const nombre = perfil?.nombre || user.email.split('@')[0]
  welcomeEl.textContent = `¡Hola, ${nombre}! 💪`
  emailEl.textContent   = user.email

  // días desde registro
  const created = new Date(user.created_at)
  const dias  = Math.floor((Date.now() - created) / 86400000)
  diasEl.textContent = `Día ${dias + 1} con nosotros`

  // verificación
  verifEl.innerHTML = user.email_confirmed_at
    ? '✅ Email verificado'
    : '⚠️ Verificá tu email para acceso completo'

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

  // semana y días
  await cargarSemana(user.id)

  // botones rutina
  const { data: rutina } = await supabase.from('rutinas').select('contenido').eq('id', user.id).single()
  if (rutina) {
    btnRutina.textContent = 'Entrenar hoy'
    btnVerRut.style.display = 'inline-block'
  } else {
    btnRutina.textContent = 'Crear mi rutina'
    btnVerRut.style.display = 'none'
  }

  btnRutina.addEventListener('click', () => {
    rutina ? window.location.href = '/rutina.html' : window.location.href = '/perfil.html'
  })
  btnVerRut.addEventListener('click', () => window.location.href = '/rutina.html')
})()

// ---------- CARGAR SEMANA ----------
async function cargarSemana (userId) {
  // semana actual
  const hoy   = new Date()
  const week  = getWeek(hoy)
  const year  = hoy.getFullYear()

  const { data: sem } = await supabase
    .from('semanas')
    .select('id')
    .eq('user_id', userId)
    .eq('semana', week)
    .eq('año', year)
    .single()

  if (!sem) { semanaVaciaEl.style.display = 'block'; return }

  const { data: dias } = await supabase
    .from('dias_semana')
    .select('*')
    .eq('semana_id', sem.id)
    .order('fecha', { ascending: true })

  if (!dias || !dias.length) { semanaVaciaEl.style.display = 'block'; return }

  semanaVaciaEl.style.display = 'none'
  diasContainerEl.innerHTML = ''

  for (const d of dias) {
    const card = document.createElement('div')
    card.className = 'dia-card'
    const esFuturo = new Date(d.fecha) > new Date()
    const hecho    = d.completado

    if (hecho) card.classList.add('done')
    if (esFuturo && !hecho) card.classList.add('future')

    card.innerHTML = `
      <div class="dia-title">${d.dia_txt.split(' - ')[0]}</div>
      <div class="dia-fecha">${new Date(d.fecha).toLocaleDateString('es-AR')}</div>
      <div class="check">${hecho ? '✅' : esFuturo ? '🔒' : '⏳'}</div>
      ${!hecho && !esFuturo ? `<button class="btn btn-block" onclick="entrenar('${d.id}')">Entrenar</button>` : ''}
    `
    diasContainerEl.appendChild(card)
  }
}

// ---------- ENTRENAR ----------
async function entrenar (diaId) {
  window.location.href = '/rutina.html?dia=' + diaId
}

// ---------- HELPERS ----------
function getWeek (date) {
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