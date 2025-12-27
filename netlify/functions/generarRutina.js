// netlify/functions/generarRutina.js
export default async (req) => {
  try {
    if (req.method !== 'POST') {
      return new Response(JSON.stringify({ error: 'Método no permitido' }), { status: 405 })
    }

    const { user_id } = await req.json()
    if (!user_id) {
      return new Response(JSON.stringify({ error: 'Falta user_id' }), { status: 400 })
    }

    const SUPABASE_URL = process.env.SUPABASE_URL
    const SUPABASE_SERVICE_ROLE = process.env.SUPABASE_SERVICE_ROLE
    const OPENAI_API_KEY = process.env.OPENAI_API_KEY

    if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE || !OPENAI_API_KEY) {
      return new Response(JSON.stringify({
        error: 'Faltan variables de entorno (SUPABASE_URL, SUPABASE_SERVICE_ROLE, OPENAI_API_KEY).'
      }), { status: 500 })
    }

    // helper week number
    Date.prototype.getWeek = function () {
      const target = new Date(this.valueOf())
      const dayNr = (this.getDay() + 6) % 7
      target.setDate(target.getDate() - dayNr + 3)
      const firstThursday = target.valueOf()
      target.setMonth(0, 1)
      if (target.getDay() !== 4) target.setMonth(0, 1 + ((4 - target.getDay()) + 7) % 7)
      return 1 + Math.ceil((firstThursday - target) / 604800000)
    }

    // 1) Traer perfil
    const perfResp = await fetch(`${SUPABASE_URL}/rest/v1/perfiles?id=eq.${encodeURIComponent(user_id)}&select=*`, {
      headers: {
        apikey: SUPABASE_SERVICE_ROLE,
        Authorization: `Bearer ${SUPABASE_SERVICE_ROLE}`
      }
    })
    const perfiles = await perfResp.json()
    const perfil = perfiles?.[0]
    if (!perfil) {
      return new Response(JSON.stringify({ error: 'No se encontró el perfil.' }), { status: 400 })
    }

    // 2) Armar prompt
    const equipoLabel =
      perfil.equipo === 'nada' ? 'Nada (solo peso corporal)' :
      perfil.equipo === 'mancuernas_bandas' ? 'Mancuernas, bandas y accesorios' :
      perfil.equipo === 'gym_completo' ? 'Gimnasio completo' :
      String(perfil.equipo || 'No especificado')
    const tiempoLabel = (parseInt(perfil.tiempo, 10) === 90) ? '+90' : String(perfil.tiempo)

    const prompt = `
Crea una rutina de entrenamiento semanal y clara, solo en texto.
Datos:
- Edad: ${perfil.edad}
- Altura (cm): ${perfil.altura}
- Peso (kg): ${perfil.peso}
- Objetivo: ${perfil.objetivo}
- Nivel: ${perfil.nivel}
- Días por semana: ${perfil.dias}
- Equipo: ${equipoLabel}
- Duración por sesión: ${tiempoLabel} min

Reglas:
- Devolvé SOLO la rutina (sin prólogo).
- Formato por días: "Día 1 - Enfoque" + lista de ejercicios con series x reps.
- Incluí calentamiento breve y estiramiento final.
`.trim()

    // 3) Llamar a OpenAI
    const aiResp = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${OPENAI_API_KEY}`
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.7,
        max_tokens: 900
      })
    })
    const aiJson = await aiResp.json()
    if (!aiResp.ok) {
      return new Response(JSON.stringify({ error: aiJson?.error?.message || 'Error generando rutina' }), { status: 500 })
    }
    const rutina = (aiJson?.choices?.[0]?.message?.content || '').trim()
    if (!rutina) {
      return new Response(JSON.stringify({ error: 'La IA no devolvió rutina.' }), { status: 500 })
    }

    // 4) Guardar rutina
    const saveResp = await fetch(`${SUPABASE_URL}/rest/v1/rutinas`, {
      method: 'POST',
      headers: {
        apikey: SUPABASE_SERVICE_ROLE,
        Authorization: `Bearer ${SUPABASE_SERVICE_ROLE}`,
        'Content-Type': 'application/json',
        Prefer: 'resolution=merge-duplicates'
      },
      body: JSON.stringify({
        id: user_id,
        contenido: rutina,
        updated_at: new Date().toISOString()
      })
    })
    if (!saveResp.ok) {
      const saveTxt = await saveResp.text()
      return new Response(JSON.stringify({ error: 'Error guardando rutina: ' + saveTxt }), { status: 500 })
    }

    // 5) Desglose de días
    const week = new Date().getWeek()
    const year = new Date().getFullYear()

    // crear semana si no existe
    const semRowRes = await fetch(`${SUPABASE_URL}/rest/v1/semanas?user_id=eq.${user_id}&semana=eq.${week}&año=eq.${year}&select=id`, {
      headers: { apikey: SUPABASE_SERVICE_ROLE, Authorization: `Bearer ${SUPABASE_SERVICE_ROLE}` }
    })
    const semRow = await semRowRes.json()
    let semanaId = semRow?.[0]?.id
    if (!semanaId) {
      const semInsRes = await fetch(`${SUPABASE_URL}/rest/v1/semanas`, {
        method: 'POST',
        headers: {
          apikey: SUPABASE_SERVICE_ROLE,
          Authorization: `Bearer ${SUPABASE_SERVICE_ROLE}`,
          'Content-Type': 'application/json',
          Prefer: 'return=representation'
        },
        body: JSON.stringify({ user_id, semana: week, año: year })
      })
      const semIns = await semInsRes.json()
      semanaId = semIns[0].id
    }

    // parsear días
    const dias = rutina
      .split(/\n+/)
      .filter(l => l.match(/^Día \d+/i))
      .map(l => l.trim())

    // insertar cada día
    for (let i = 0; i < dias.length; i++) {
      const fecha = new Date()
      fecha.setDate(fecha.getDate() + i)
      await fetch(`${SUPABASE_URL}/rest/v1/dias_semana`, {
        method: 'POST',
        headers: {
          apikey: SUPABASE_SERVICE_ROLE,
          Authorization: `Bearer ${SUPABASE_SERVICE_ROLE}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          semana_id: semanaId,
          dia_txt: dias[i],
          fecha: fecha.toISOString().slice(0, 10)
        })
      })
    }

    return new Response(JSON.stringify({ rutina }), { status: 200 })
  } catch (e) {
    return new Response(JSON.stringify({ error: e?.message || String(e) }), { status: 500 })
  }
}