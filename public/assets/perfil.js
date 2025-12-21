import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const supabaseUrl = 'https://zeihyrwfxmrlogrgvtif.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InplaWh5cndmeG1ybG9ncmd2dGlmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQxNzQzMTcsImV4cCI6MjA3OTc1MDMxN30.V46Oj1Pqwa0FqsIU3utbX2TPqlhKXIxKaFdnI7cUWss'
const supabase = createClient(supabaseUrl, supabaseKey)

const form = document.getElementById('form-perfil')
const mensaje = document.getElementById('mensaje')

form.addEventListener('submit', async (e) => {
  e.preventDefault()
  mensaje.textContent = ''

  const { data: { user }, error: userErr } = await supabase.auth.getUser()
  if (userErr) {
    mensaje.textContent = 'Error obteniendo sesión: ' + userErr.message
    return
  }
  if (!user) {
    mensaje.textContent = 'No estás logueado.'
    return
  }

  const nombre = document.getElementById('nombre').value.trim()
  const edad = parseInt(document.getElementById('edad').value, 10)
  const altura = parseInt(document.getElementById('altura').value, 10)
  const peso = parseFloat(document.getElementById('peso').value)
  const objetivo = document.getElementById('objetivo').value
  const nivel = document.getElementById('nivel').value
  const dias = parseInt(document.getElementById('dias').value, 10)
  const equipo = document.getElementById('equipo').value
  const tiempo = parseInt(document.getElementById('tiempo').value, 10)

  // Validaciones básicas rápidas
  if (!nombre) { mensaje.textContent = 'Ingresá tu nombre.'; return }
  if (!Number.isFinite(edad) || edad < 10 || edad > 99) { mensaje.textContent = 'Edad inválida.'; return }
  if (!Number.isFinite(altura) || altura < 120 || altura > 230) { mensaje.textContent = 'Altura inválida.'; return }
  if (!Number.isFinite(peso) || peso < 30 || peso > 250) { mensaje.textContent = 'Peso inválido.'; return }
  if (!objetivo || !nivel || !dias || !equipo || !tiempo) { mensaje.textContent = 'Completá todos los campos.'; return }

  const perfil = {
    id: user.id,
    nombre,
    edad,
    altura,
    peso,
    objetivo,
    nivel,
    dias,
    equipo,
    tiempo
  }

  const { error } = await supabase
    .from('perfiles')
    .upsert(perfil, { onConflict: 'id' })

  if (error) {
    mensaje.textContent = 'Error: ' + error.message
  } else {
    mensaje.textContent = 'Datos guardados.'
    setTimeout(() => window.location.replace('/dashboard.html#rutina'), 1200)
  }
})
