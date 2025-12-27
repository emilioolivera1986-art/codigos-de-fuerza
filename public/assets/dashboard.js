/* ----------  A) NUEVA FUNCIÓN: cargarSemana  ---------- */
async function cargarSemana (userId) {
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

  // detectar día que toca hoy
  const hoyStr = hoy.toISOString().slice(0, 10)

  for (const d of dias) {
    const card = document.createElement('div')
    card.className = 'dia-card'
    const esFuturo = d.fecha > hoyStr
    const hecho    = d.completado
    const esHoy    = d.fecha === hoyStr && !hecho

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

/* ----------  B) NUEVA FUNCIÓN: entrenar  ---------- */
async function entrenar (diaId) {
  window.location.href = '/rutina.html?dia=' + diaId
}

/* ----------  C) BOTONES: distintos destinos  ---------- */
btnRutina.addEventListener('click', async () => {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return

  // ¿qué día toca hoy?
  const hoy   = new Date()
  const week  = getWeek(hoy)
  const year  = hoy.getFullYear()

  const { data: sem } = await supabase
    .from('semanas')
    .select('id')
    .eq('user_id', user.id)
    .eq('semana', week)
    .eq('año', year)
    .single()

  if (!sem) { window.location.href = '/perfil.html'; return }

  const hoyStr = hoy.toISOString().slice(0, 10)
  const { data: dia } = await supabase
    .from('dias_semana')
    .select('id')
    .eq('semana_id', sem.id)
    .eq('fecha', hoyStr)
    .single()

  if (dia && !dia.completado) {
    window.location.href = '/rutina.html?dia=' + dia.id   // <-- solo el día de hoy
  } else {
    window.location.href = '/rutina.html'                 // <-- rutina completa
  }
})

btnVerRutina.addEventListener('click', () => window.location.href = '/rutina.html')
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