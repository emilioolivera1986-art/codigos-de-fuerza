import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const supabaseUrl = 'https://zeihyrwfxmrlogrgvtif.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InplaWh5cndmeG1ybG9ncmd2dGlmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQxNzQzMTcsImV4cCI6MjA3OTc1MDMxN30.V46Oj1Pqwa0FqsIU3utbX2TPqlhKXIxKaFdnI7cUWss'

const supabase = createClient(supabaseUrl, supabaseKey)

const form = document.getElementById('form-reset')
const mensaje = document.getElementById('mensaje')

form.addEventListener('submit', async (e) => {
  e.preventDefault()

  const email = document.getElementById('email').value.trim()

  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: 'https://codigosdefuerza.com/set-new-password.html'
  })

  if (error) {
    mensaje.textContent = 'Error: ' + error.message
    mensaje.style.color = '#f97373'
  } else {
    mensaje.textContent = 'Revisá tu correo para restablecer tu contraseña.'
    mensaje.style.color = '#a3e635'
    form.reset()
  }
})