import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const supabaseUrl = 'https://zeihyrwfxmrlogrgvtif.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InplaWh5cndmeG1ybG9ncmd2dGlmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQxNzQzMTcsImV4cCI6MjA3OTc1MDMxN30.V46Oj1Pqwa0FqsIU3utbX2TPqlhKXIxKaFdnI7cUWss'

const supabase = createClient(supabaseUrl, supabaseKey)

const form = document.getElementById('form-registro')
const mensaje = document.getElementById('mensaje')

function mostrarMensaje(texto, tipo = 'error') {
  mensaje.textContent = texto
  mensaje.classList.remove('error', 'ok')
  mensaje.classList.add(tipo)
}

// Validación de contraseña en el frontend (para no mostrar el choclo de Supabase)
function validarPassword(password) {
  const tieneMinimo = password.length >= 8
  const tieneMinuscula = /[a-z]/.test(password)
  const tieneMayuscula = /[A-Z]/.test(password)
  const tieneNumero = /[0-9]/.test(password)
  const tieneSimbolo = /[^A-Za-z0-9]/.test(password)

  return (
    tieneMinimo &&
    tieneMinuscula &&
    tieneMayuscula &&
    tieneNumero &&
    tieneSimbolo
  )
}

form.addEventListener('submit', async (e) => {
  e.preventDefault()
  mostrarMensaje('', 'error') // limpiar

  const email = document.getElementById('email').value.trim()
  const password = document.getElementById('password').value

  // Validación básica de email
  if (!email) {
    mostrarMensaje('Ingresá un correo electrónico válido.')
    return
  }

  // Validar contraseña antes de llamar a Supabase
  if (!validarPassword(password)) {
    mostrarMensaje(
      'La contraseña debe tener al menos 8 caracteres, una mayúscula, una minúscula, un número y un símbolo.',
      'error'
    )
    return
  }

  // Llamada a Supabase con redirección al panel de usuario luego de confirmar el mail
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      emailRedirectTo: 'https://codigosdefuerza.com/login.html'
    }
  })

  if (error) {
    let msg = error.message || 'Ocurrió un problema al crear la cuenta.'

    // Si por alguna razón vuelve error de password desde Supabase, lo suavizamos
    if (msg.toLowerCase().includes('password')) {
      msg = 'La contraseña no cumple los requisitos. Verificala e intentá de nuevo.'
    }

    if (msg.toLowerCase().includes('user already registered') ||
        msg.toLowerCase().includes('already registered')) {
      msg = 'Este correo ya está registrado. Probá iniciar sesión.'
    }

    mostrarMensaje(msg, 'error')
    return
  }

  // Si todo salió bien
  mostrarMensaje(
    'Cuenta creada. Revisá tu correo y seguí el enlace para activar tu cuenta.',
    'ok'
  )
  form.reset()
})
