// public/assets/rutina.js 
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const supabaseUrl = 'https://zeihyrwfxmrlogrgvtif.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InplaWh5cndmeG1ybG9ncmd2dGlmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQxNzQzMTcsImV4cCI6MjA3OTc1MDMxN30.V46Oj1Pqwa0FqsIU3utbX2TPqlhKXIxKaFdnI7cUWss';
const supabase = createClient(supabaseUrl, supabaseKey);

const rutinaTexto = document.getElementById('rutina-texto');
const btnFinalizar = document.getElementById('btn-finalizar');

async function generarRutina() {
  rutinaTexto.textContent = 'Generando rutina...';

  const { data: { user }, error: userErr } = await supabase.auth.getUser();
  if (userErr) {
    rutinaTexto.textContent = 'Error obteniendo sesión: ' + userErr.message;
    return;
  }
  if (!user) {
    rutinaTexto.textContent = 'No estás logueado.';
    return;
  }

  // Si ya existe rutina en Supabase, la mostramos
  const { data: rutinaExistente, error: rutErr } = await supabase
    .from('rutinas')
    .select('contenido')
    .eq('id', user.id)
    .single();

  if (rutinaExistente && !rutErr) {
    rutinaTexto.textContent = rutinaExistente.contenido;
    btnFinalizar.textContent = 'Empecemos';
    btnFinalizar.onclick = () => window.location.replace('/dashboard.html');
    return;
  }

  // Pedimos a la Function que genere la rutina
  try {
    const resp = await fetch('/.netlify/functions/generarRutina', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ user_id: user.id })
    });

    const json = await resp.json();
    if (!resp.ok) {
      rutinaTexto.textContent = 'Error: ' + (json?.error || 'No se pudo generar la rutina.');
      return;
    }

    rutinaTexto.textContent = json.rutina || 'No se recibió rutina.';
    btnFinalizar.textContent = 'Empecemos';
    btnFinalizar.onclick = () => window.location.replace('/dashboard.html');
  } catch (e) {
    rutinaTexto.textContent = 'Error de red: ' + (e?.message || e);
  }
}

generarRutina();