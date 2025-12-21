import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const supabaseUrl = 'https://zeihyrwfxmrlogrgvtif.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InplaWh5cndmeG1ybG9ncmd2dGlmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQxNzQzMTcsImV4cCI6MjA3OTc1MDMxN30.V46Oj1Pqwa0FqsIU3utbX2TPqlhKXIxKaFdnI7cUWss'

const supabase = createClient(supabaseUrl, supabaseKey)

const form = document.getElementById('form-new-password')
const mensaje = document.getElementById('mensaje')

form.addEventListener('submit', async (e) => {
  e.preventDefault()

  const newPass = document.getElementById('new-password').value
  const confirmPass = document.getElementById('confirm-password').value

  if (newPass !== confirmPass) {
    mensaje.textContent = 'Las contraseñas no coinciden.'
    mensaje.style.color = '#f97373'
    return
  }

  const { error } = await supabase.auth.updateUser({ password: newPass })

  if (error) {
    mensaje.textContent = 'Error: ' + error.message
    mensaje.style.color = '#f97373'
  } else {
    mensaje.textContent = 'Contraseña actualizada correctamente.'
    mensaje.style.color = '#a3e635'
    setTimeout(() => {
      window.location.href = 'login.html'
    }, 2000)
  }
})