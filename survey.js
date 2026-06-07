/* ─────────────────────────────────────────
   MONGI SKIN — Survey Logic
   ─────────────────────────────────────────

   State shape:
   {
     answers:      { age, ciudad, tipo, kbNivel, satisfaccion, budget } — single-select
     multiAnswers: { prob[], prod[], barrera[] }                        — multi-select
     wish:         string                                               — free text
   }

   TODO: replace SUPABASE_URL and SUPABASE_KEY with real values
   before going live. Store them in a .env or inject via CI/CD
   — never commit real keys to the repo.
   ───────────────────────────────────────── */

/* ── SUPABASE CONFIG (placeholder) ── */
const SUPABASE_URL = 'https://YOUR_PROJECT.supabase.co';
const SUPABASE_KEY = 'YOUR_ANON_PUBLIC_KEY';
const TABLE_NAME   = 'survey_responses';

/* ── STATE ── */
const state = {
  answers:      {},   // single-select fields
  multiAnswers: {},   // multi-select fields (arrays)
  wish:         '',   // free-text field (P10)
};

const TOTAL_STEPS = 11;

/* ══════════════════════════════════════════
   NAVIGATION
══════════════════════════════════════════ */

/**
 * Show a specific step and hide all others.
 * @param {number} stepNum
 */
function goToStep(stepNum) {
  document.querySelectorAll('.step').forEach(s => s.classList.remove('active'));

  const target = document.getElementById('s' + stepNum);
  if (target) {
    target.classList.add('active');
    updateProgress(stepNum);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }
}

/**
 * Update the progress bar and label.
 * @param {number} stepNum
 */
function updateProgress(stepNum) {
  const pct = ((stepNum - 1) / TOTAL_STEPS) * 100;
  document.getElementById('progressFill').style.width = pct + '%';
  document.getElementById('progressLabel').textContent =
    `Pregunta ${stepNum} de ${TOTAL_STEPS}`;
}

/* ══════════════════════════════════════════
   SELECTION HANDLERS
══════════════════════════════════════════ */

/**
 * Handle single-select option click.
 * Deselects siblings, saves answer, enables Next button.
 * @param {HTMLElement} btn
 */
function handleSingleSelect(btn) {
  const key = btn.dataset.key;
  const val = btn.dataset.val;

  // Deselect all options with the same key in this step
  btn.closest('.opts').querySelectorAll('.opt').forEach(o => o.classList.remove('selected'));
  btn.classList.add('selected');

  state.answers[key] = val;

  // Enable the Next button in this step
  const nextBtn = btn.closest('.step').querySelector('.btn-next');
  if (nextBtn) nextBtn.disabled = false;
}

/**
 * Handle multi-select option click.
 * Toggles selection, always keeps Next button enabled.
 * @param {HTMLElement} btn
 */
function handleMultiSelect(btn) {
  const key = btn.dataset.key;
  const val = btn.dataset.val;

  if (!state.multiAnswers[key]) state.multiAnswers[key] = [];

  if (btn.classList.contains('selected')) {
    btn.classList.remove('selected');
    state.multiAnswers[key] = state.multiAnswers[key].filter(v => v !== val);
  } else {
    btn.classList.add('selected');
    state.multiAnswers[key].push(val);
  }
}

/**
 * Handle satisfaction scale click.
 * Fills scale up to selected value (visual effect), saves answer.
 * @param {HTMLElement} dot  — the clicked scale-opt element
 */
function handleScale(dot) {
  const val = parseInt(dot.dataset.val, 10);

  document.querySelectorAll('#scaleOpts .scale-opt').forEach((o, i) => {
    o.classList.toggle('selected', i < val);
  });

  state.answers['satisfaccion'] = val;
  document.querySelector('#s6 .btn-next').disabled = false;
}

/* ══════════════════════════════════════════
   FREE TEXT (P10)
══════════════════════════════════════════ */

function handleWishInput(e) {
  state.wish = e.target.value.trim();
  // The Finalizar button is always enabled (users can also skip),
  // but we still track the value.
}

/* ══════════════════════════════════════════
   SUBMIT & RESULT
══════════════════════════════════════════ */

/**
 * Build the final payload, send to Supabase, show the result screen.
 */
async function submitSurvey() {
  const payload = buildPayload();

  try {
    await saveToSupabase(payload);
  } catch (err) {
    // Non-blocking: we show the result regardless.
    // In production, consider logging to an error-tracking service.
    console.error('Supabase save failed:', err);
  }

  showResult();
}

/**
 * Flatten state into a single flat object ready for DB insertion.
 * Multi-select arrays are stored as PostgreSQL text[] (Supabase handles the serialization).
 * @returns {Object}
 */
function buildPayload() {
  return {
    // Single-select
    age:          state.answers.age          ?? null,
    ciudad:       state.answers.ciudad       ?? null,
    tipo_piel:    state.answers.tipo         ?? null,
    kb_nivel:     state.answers.kbNivel      ?? null,
    satisfaccion: state.answers.satisfaccion ?? null,
    budget:       state.answers.budget       ?? null,
    frecuencia:   state.answers.frecuencia   ?? null,

    // Multi-select (arrays)
    prob_piel:    state.multiAnswers.prob    ?? [],
    productos:    state.multiAnswers.prod    ?? [],
    barreras:     state.multiAnswers.barrera ?? [],

    // Free text
    wish:         state.wish || null,

    // Metadata
    submitted_at: new Date().toISOString(),
  };
}

/**
 * POST the payload to Supabase via the REST API.
 * @param {Object} payload
 */
async function saveToSupabase(payload) {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/${TABLE_NAME}`, {
    method: 'POST',
    headers: {
      'Content-Type':  'application/json',
      'apikey':        SUPABASE_KEY,
      'Authorization': `Bearer ${SUPABASE_KEY}`,
      'Prefer':        'return=minimal',   // don't need the row back
    },
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Supabase error ${res.status}: ${text}`);
  }
}

/**
 * Hide all steps, show the result screen, complete the progress bar.
 */
function showResult() {
  document.querySelectorAll('.step').forEach(s => s.classList.remove('active'));
  document.getElementById('resultWrap').classList.add('active');
  document.getElementById('progressFill').style.width = '100%';
  document.getElementById('progressLabel').textContent = '¡Encuesta completada!';
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

/* ══════════════════════════════════════════
   EVENT BINDING
   All listeners attached here — zero inline
   onclick/onchange in the HTML.
══════════════════════════════════════════ */

document.addEventListener('DOMContentLoaded', () => {

  /* ── Single-select options ── */
  document.querySelectorAll('.opt:not(.multi)').forEach(btn => {
    btn.addEventListener('click', () => handleSingleSelect(btn));
  });

  /* ── Multi-select options ── */
  document.querySelectorAll('.opt.multi').forEach(btn => {
    btn.addEventListener('click', () => handleMultiSelect(btn));
  });

  /* ── Satisfaction scale ── */
  document.querySelectorAll('#scaleOpts .scale-opt').forEach(dot => {
    dot.addEventListener('click', () => handleScale(dot));
  });

  /* ── Next buttons (steps 1–9) ── */
  document.querySelectorAll('.btn-next[data-next]').forEach(btn => {
    btn.addEventListener('click', () => {
      if (!btn.disabled) goToStep(parseInt(btn.dataset.next, 10));
    });
  });

  /* ── Back buttons ── */
  document.querySelectorAll('.btn-back[data-prev]').forEach(btn => {
    btn.addEventListener('click', () => goToStep(parseInt(btn.dataset.prev, 10)));
  });

  /* ── P10: wish textarea ── */
  const wishInput = document.getElementById('wishInput');
  if (wishInput) {
    wishInput.addEventListener('input', handleWishInput);
  }

  /* ── P10: Finalizar button ── */
  const btnFinish = document.getElementById('btnFinish');
  if (btnFinish) {
    btnFinish.addEventListener('click', submitSurvey);
  }

  /* ── P10: Omitir button ── */
  const btnSkip = document.getElementById('btnSkip');
  if (btnSkip) {
    btnSkip.addEventListener('click', submitSurvey);
  }

  /* ── Result CTA ── */
  const btnCta = document.getElementById('btnCta');
  if (btnCta) {
    btnCta.addEventListener('click', () => {
      window.open('https://www.tiktok.com/@mongiskin', '_blank');
    });
  }

  /* ── Init ── */
  updateProgress(1);
});
