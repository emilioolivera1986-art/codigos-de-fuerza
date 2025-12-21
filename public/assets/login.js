import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const supabaseUrl = 'https://zeihyrwfxmrlogrgvtif.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InplaWh5cndmeG1ybG9ncmd2dGlmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQxNzQzMTcsImV4cCI6MjA3OTc1MDMxN30.V46Oj1Pqwa0FqsIU3utbX2TPqlhKXIxKaFdnI7cUWss'
const supabase = createClient(supabaseUrl, supabaseKey)

const form = document.getElementById('form-login')
const mensaje = document.getElementById('mensaje')

form.addEventListener('submit', async (e) => {
  e.preventDefault()

  const email = document.getElementById('email').value.trim()
  const password = document.getElementById('password').value

  const { data, error } = await supabase.auth.signInWithPassword({ email, password })

  if (error) {
    mensaje.textContent = 'Error: ' + error.message
    return
  }

  // ¿Tiene rutina guardada?
  const { data: rutina } = await supabase.from('rutinas').select('id').eq('id', data.user.id).single()

  if (rutina) {
    // Sí tiene rutina → dashboard directo
    window.location.replace('/dashboard.html#rutina')
  } else {
    // No tiene rutina → cuestionario
    window.location.replace('/perfil.html')
  }
})