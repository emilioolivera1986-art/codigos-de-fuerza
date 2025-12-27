import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const supabaseUrl = 'https://zeihyrwfxmrlogrgvtif.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InplaWh5cndmeG1ybG9ncmd2dGlmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQxNzQzMTcsImV4cCI6MjA3OTc1MDMxN30.V46Oj1Pqwa0FqsIU3utbX2TPqlhKXIxKaFdnI7cUWss'
const supabase = createClient(supabaseUrl, supabaseKey)

const rutinaTexto = document.getElementById('rutina-texto')
const btnFinalizar = document.getElementById('btn-finalizar')
const diaInfo      = document.getElementById('dia-info')
const titulo       = document.getElementById('titulo-rutina')

// ---------- ARRANQUE ----------
;(async function () {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) { window.location.replace('/login.html'); return }

  // ¿viene de un día específico?
  const urlParams = new URLSearchParams(window.location.search)
  const diaId     = urlParams.get('dia')

  let rutinaContent = ''
  let diaTxt        = ''

  if (diaId) {
    // mostramos solo ese día
    const { data: dia } = await supabase
      .from('dias_semana')
      .select('*')
      .eq('id', diaId)
      .single()
    if (!dia) { rutinaTexto.textContent = 'Día no encontrado'; return }

    diaTxt = dia.dia_txt
    diaInfo.textContent = diaTxt
    titulo.textContent  = 'Hoy toca:'

    // buscamos la rutina completa y filtramos el día
    const { data: rut } = await supabase.from('rutinas').select('contenido').eq('id', user.id).single()
    if (!rut) { rutinaTexto.textContent = 'No hay rutina'; return }

    // extraemos solo el bloque de hoy
    const bloques = rut.contenido.split(/\n+(?=Día \d+)/i)
    const hoy     = bloques.find(b => b.trim().startsWith(diaTxt.split(' - ')[0]))
    rutinaContent = hoy ? hoy.trim() : 'Sin ejercicios para hoy'
  } else {
    // mostramos toda la rutina
    const { data: rut } = await supabase.from('rutinas').select('contenido').eq('id', user.id).single()
    if (!rut) { window.location.replace('/perfil.html'); return }
    rutinaContent = rut.contenido
    diaInfo.style.display = 'none'
  }

  rutinaTexto.textContent = rutinaContent

  // ---------- FINALIZAR ----------
  btnFinalizar.addEventListener('click', async () => {
    if (!diaId) { window.location.replace('/dashboard.html'); return }

    // marcar día completado
    await supabase
      .from('dias_semana')
      .update({ completado: true })
      .eq('id', diaId)

    // guardar entrenamiento
    await supabase.from('entrenamientos').insert({
      user_id: user.id,
      dia_id: diaId,
      fecha: new Date().toISOString().slice(0, 10)
    })

    alert('¡Entrenamiento completado! 💪')
    window.location.replace('/dashboard.html')
  })
})()