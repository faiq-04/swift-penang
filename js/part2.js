/* ==========================================================
   Part 2: My Alerts, Community Feedback, Help Centre
   Load AFTER main.js. It reuses switchView(), bindViewButtons()
   and the `disruptions` and `updates` arrays from main.js.
   ========================================================== */

/* ---------- Shared helpers ---------- */
const AREAS = ['Bayan Lepas', 'Gelugor', 'Komtar', 'Queensbay', 'Sungai Nibong'];
const DISRUPTION_TYPES = ['Road Closure', 'Pedestrian Access', 'Business Access'];

// Links a disruption's location text to an area, for notices without an `area` field
const AREA_KEYWORDS = {
  'Bayan Lepas': ['bayan lepas', 'airport'],
  'Gelugor': ['gelugor', 'sungai dua', 'sultan azlan shah'],
  'Komtar': ['komtar', 'jalan penang'],
  'Queensbay': ['queensbay'],
  'Sungai Nibong': ['sungai nibong']
};

const CHEVRON = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" aria-hidden="true"><path d="M6 9l6 6 6-6"/></svg>';

function getArea(notice) {
  if (notice.area) return notice.area;
  const text = (notice.location || '').toLowerCase();
  return AREAS.find(area => AREA_KEYWORDS[area].some(word => text.includes(word))) || 'Other';
}

// localStorage can be blocked (private mode), so every read and write is wrapped
function readStore(key, fallback) {
  try {
    const value = localStorage.getItem(key);
    return value ? JSON.parse(value) : fallback;
  } catch (e) {
    return fallback;
  }
}
function writeStore(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
    return true;
  } catch (e) {
    return false;
  }
}

// Stops user-typed text from being treated as HTML when we display it
function escapeHtml(text) {
  return String(text).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
}

function formatDate(d) { return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }); }
function formatTime(d) { return d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' }); }
function pad(n) { return String(n).padStart(2, '0'); }

// Concern statuses reuse the badge colours from styles.css
function badgeClass(status) {
  return { 'Submitted': 'scheduled-badge', 'In Progress': 'active-badge', 'Resolved': 'resolved-badge' }[status] || 'scheduled-badge';
}


/* ==========================================================
   1. MY ALERTS
   ========================================================== */
const ALERT_KEY = 'swiftPenangAlerts';
const alertPrefs = readStore(ALERT_KEY, { areas: [], types: [], includeResolved: false });

function renderChips(containerId, options, selected) {
  document.getElementById(containerId).innerHTML = options.map(option => {
    const on = selected.includes(option);
    return `<button class="filter-btn chip${on ? ' active' : ''}" type="button" data-value="${option}" aria-pressed="${on}">${option}</button>`;
  }).join('');
}

function setupChipGroup(containerId, listName) {
  document.getElementById(containerId).addEventListener('click', e => {
    const chip = e.target.closest('.chip');
    if (!chip) return;
    const list = alertPrefs[listName];
    const index = list.indexOf(chip.dataset.value);
    const turningOn = index === -1;
    if (turningOn) list.push(chip.dataset.value);
    else list.splice(index, 1);
    chip.classList.toggle('active', turningOn);
    chip.setAttribute('aria-pressed', String(turningOn));
    markUnsaved();
    renderAlerts();
  });
}

function markUnsaved() {
  const note = document.getElementById('saveNote');
  note.textContent = 'You have unsaved changes.';
  note.classList.add('pending');
}

function alertCard(d) {
  return `<article class="disruption-card">
    <div class="status-side">
      <span class="badge ${d.status.toLowerCase()}-badge">${d.status}</span>
      <div class="type">${d.type}</div>
      <div class="place">${getArea(d)}</div>
    </div>
    <div>
      <h2>${d.location}</h2>
      <p><strong>Dates:</strong> ${d.dates}</p>
      <p>${d.impact}</p>
      <p><strong>Alternative:</strong> ${d.alternate}</p>
    </div>
  </article>`;
}

function renderAlerts() {
  const list = document.getElementById('alertList');
  const count = document.getElementById('alertCount');
  const { areas, types, includeResolved } = alertPrefs;

  if (!areas.length || !types.length) {
    count.textContent = '';
    list.innerHTML = `<div class="all-clear"><strong>Choose what you want to follow</strong>
      <span>Select at least one area and one disruption type to see matching alerts.</span></div>`;
  } else {
    const matches = disruptions.filter(d =>
      areas.includes(getArea(d)) &&
      types.includes(d.type) &&
      (includeResolved || d.status !== 'Resolved'));

    count.textContent = matches.length === 1
      ? '1 alert matches your preferences'
      : `${matches.length} alerts match your preferences`;
    list.innerHTML = matches.length
      ? matches.map(alertCard).join('')
      : `<div class="all-clear"><strong>No disruptions in your selected areas</strong>
         <span>Nothing currently affects ${areas.join(', ')} for the disruption types you chose.</span></div>`;
  }
  renderAreaUpdates();
}

function renderAreaUpdates() {
  const box = document.getElementById('areaUpdates');
  const found = updates.filter(u => alertPrefs.areas.includes(u.location));
  if (found.length) {
    box.innerHTML = found.map(u => `<div class="update-row">
      <time class="date">${u.date}</time>
      <div><strong>${u.title}</strong><div class="date">${u.location}</div></div>
      <span class="tag">${u.category}</span>
    </div>`).join('');
  } else {
    box.innerHTML = `<div class="empty">${alertPrefs.areas.length
      ? 'No construction updates in your selected areas.'
      : 'Select an area to see construction work near you.'}</div>`;
  }
}

function initAlerts() {
  renderChips('areaChips', AREAS, alertPrefs.areas);
  renderChips('typeChips', DISRUPTION_TYPES, alertPrefs.types);
  setupChipGroup('areaChips', 'areas');
  setupChipGroup('typeChips', 'types');

  const resolvedBox = document.getElementById('includeResolved');
  resolvedBox.checked = alertPrefs.includeResolved;
  resolvedBox.addEventListener('change', () => {
    alertPrefs.includeResolved = resolvedBox.checked;
    markUnsaved();
    renderAlerts();
  });

  document.getElementById('saveAlerts').onclick = () => {
    const note = document.getElementById('saveNote');
    const saved = writeStore(ALERT_KEY, alertPrefs);
    note.classList.remove('pending');
    note.textContent = saved
      ? `Preferences saved on this device at ${formatTime(new Date())}.`
      : 'This browser blocked saving, but your filters still work for this visit.';
  };

  document.getElementById('clearAlerts').onclick = () => {
    alertPrefs.areas = [];
    alertPrefs.types = [];
    alertPrefs.includeResolved = false;
    resolvedBox.checked = false;
    writeStore(ALERT_KEY, alertPrefs);
    renderChips('areaChips', AREAS, []);
    renderChips('typeChips', DISRUPTION_TYPES, []);
    const note = document.getElementById('saveNote');
    note.classList.remove('pending');
    note.textContent = 'Preferences cleared.';
    renderAlerts();
  };

  renderAlerts();
}


/* ==========================================================
   2. COMMUNITY FEEDBACK
   ========================================================== */
const CONCERN_KEY = 'swiftPenangConcerns';

// Two example cases so the tracker can show every status during the demo
const SAMPLE_CONCERNS = [
  {
    ref: 'SP-261028-4821', category: 'Noise or vibration', area: 'Gelugor',
    location: 'Jalan Sultan Azlan Shah, opposite the shophouse row',
    description: 'Drilling continues past 11 PM on weeknights and keeps residents awake.',
    status: 'In Progress', submitted: '28 Oct 2026, 9:14 AM',
    history: [
      { date: '28 Oct 2026, 9:14 AM', status: 'Submitted', note: 'Concern received. A community officer will review it within 2 working days.' },
      { date: '29 Oct 2026, 3:40 PM', status: 'In Progress', note: 'Assigned to the Gelugor site team. Noise monitoring is scheduled for the night of 30 October.' }
    ]
  },
  {
    ref: 'SP-261015-1093', category: 'Business access', area: 'Komtar',
    location: 'Jalan Penang frontage, next to the pharmacy',
    description: 'New hoarding blocks the entrance to our shop and customers think we are closed.',
    status: 'Resolved', submitted: '15 Oct 2026, 11:02 AM',
    history: [
      { date: '15 Oct 2026, 11:02 AM', status: 'Submitted', note: 'Concern received. A community officer will review it within 2 working days.' },
      { date: '16 Oct 2026, 10:20 AM', status: 'In Progress', note: 'Site team is reviewing the hoarding position outside the shop.' },
      { date: '20 Oct 2026, 4:05 PM', status: 'Resolved', note: 'Hoarding moved 1.5 m to reopen the shop entrance. "Business open" signage installed.' }
    ]
  }
];

function getSavedConcerns() { return readStore(CONCERN_KEY, []); }

function findConcern(ref) {
  const wanted = ref.trim().toUpperCase();
  return getSavedConcerns().concat(SAMPLE_CONCERNS).find(c => c.ref === wanted);
}

// Format: SP-YYMMDD-NNNN, e.g. SP-261103-5274
function makeReference(date) {
  const datePart = String(date.getFullYear()).slice(2) + pad(date.getMonth() + 1) + pad(date.getDate());
  let ref;
  do {
    ref = `SP-${datePart}-${Math.floor(1000 + Math.random() * 9000)}`;
  } while (findConcern(ref));
  return ref;
}

/* ----- Tabs: Submit / Track ----- */
function showFeedbackTab(tab) {
  document.querySelectorAll('[data-fb-tab]').forEach(btn => {
    const on = btn.dataset.fbTab === tab;
    btn.classList.toggle('active', on);
    btn.setAttribute('aria-selected', String(on));
  });
  document.getElementById('submitPane').hidden = tab !== 'submit';
  document.getElementById('trackPane').hidden = tab !== 'track';
  if (tab === 'track') renderRecent();
}

/* ----- Form validation ----- */
const concernForm = document.getElementById('concernForm');

const rules = {
  name: v => v.trim().length >= 2 || 'Please enter your name.',
  email: v => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v.trim()) || 'Please enter a valid email address.',
  phone: v => !v.trim() || /^[0-9+\-\s]{9,15}$/.test(v.trim()) || 'Use digits only, for example 012-345 6789.',
  role: v => !!v || 'Please tell us who you are.',
  area: v => !!v || 'Please choose an area.',
  category: v => !!v || 'Please choose a category.',
  location: v => v.trim().length >= 5 || 'Please describe where this happened.',
  description: v => v.trim().length >= 20 || 'Please write at least 20 characters so the site team can act on it.',
  consent: (v, field) => field.checked || 'Please tick this box so we can follow up with you.'
};

function showError(name, message) {
  const field = concernForm.elements[name];
  concernForm.querySelector(`[data-error-for="${name}"]`).textContent = message;
  field.closest('label').classList.toggle('has-error', !!message);
  field.setAttribute('aria-invalid', String(!!message));
}

function validateField(name) {
  const field = concernForm.elements[name];
  const result = rules[name](field.value, field);
  showError(name, result === true ? '' : result);
  return result === true;
}

function clearErrors() {
  Object.keys(rules).forEach(name => showError(name, ''));
}

function updateCharCount() {
  const length = concernForm.elements.description.value.length;
  document.getElementById('charCount').textContent = `${length} / 500`;
}

function initFeedbackForm() {
  // Check each field when the user leaves it, and clear an error
  // as soon as the user fixes it (so the layout does not jump later)
  Object.keys(rules).forEach(name => {
    const field = concernForm.elements[name];
    field.addEventListener(field.type === 'checkbox' ? 'change' : 'blur', () => validateField(name));
    field.addEventListener('input', () => {
      if (field.getAttribute('aria-invalid') === 'true') validateField(name);
    });
  });

  concernForm.elements.description.addEventListener('input', updateCharCount);
  concernForm.elements.observed.max = new Date().toISOString().slice(0, 10);

  concernForm.addEventListener('reset', () => setTimeout(() => { clearErrors(); updateCharCount(); }, 0));

  concernForm.addEventListener('submit', e => {
    e.preventDefault();
    const allValid = Object.keys(rules).map(validateField).every(Boolean);
    if (!allValid) {
      concernForm.querySelector('[aria-invalid="true"]').focus();
      return;
    }

    const data = new FormData(concernForm);
    const now = new Date();
    const stamp = `${formatDate(now)}, ${formatTime(now)}`;
    const concern = {
      ref: makeReference(now),
      name: data.get('name').trim(),
      email: data.get('email').trim(),
      phone: data.get('phone').trim(),
      role: data.get('role'),
      area: data.get('area'),
      category: data.get('category'),
      location: data.get('location').trim(),
      observed: data.get('observed'),
      description: data.get('description').trim(),
      status: 'Submitted',
      submitted: stamp,
      history: [{ date: stamp, status: 'Submitted', note: 'Concern received. A community officer will review it within 2 working days.' }]
    };

    const saved = getSavedConcerns();
    saved.unshift(concern);
    const stored = writeStore(CONCERN_KEY, saved);

    showSuccess(concern.ref, stored);
    concernForm.reset();
  });

  document.getElementById('copyRef').onclick = () => {
    const ref = document.getElementById('newRef').textContent;
    const note = document.getElementById('copyNote');
    if (navigator.clipboard) {
      navigator.clipboard.writeText(ref)
        .then(() => { note.textContent = 'Reference copied.'; })
        .catch(() => { note.textContent = 'Copy blocked by the browser. Please write the number down.'; });
    } else {
      note.textContent = 'Please write the number down.';
    }
  };

  document.getElementById('trackNew').onclick = () => {
    showFeedbackTab('track');
    trackReference(document.getElementById('newRef').textContent);
  };

  document.getElementById('anotherConcern').onclick = () => {
    document.getElementById('concernSuccess').hidden = true;
    document.getElementById('concernFormPanel').hidden = false;
    concernForm.elements.name.focus();
  };
}

function showSuccess(ref, stored) {
  document.getElementById('newRef').textContent = ref;
  document.getElementById('copyNote').textContent = stored
    ? ''
    : 'This browser blocked saving, so tracking may not find this concern later.';
  document.getElementById('concernFormPanel').hidden = true;
  document.getElementById('concernSuccess').hidden = false;
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

/* ----- Tracking ----- */
function trackReference(ref) {
  document.getElementById('trackRef').value = ref;
  const error = document.getElementById('trackError');
  const result = document.getElementById('trackResult');
  const wanted = ref.trim().toUpperCase();
  error.textContent = '';

  if (!wanted) {
    error.textContent = 'Enter your reference number.';
    result.innerHTML = '';
    return;
  }
  if (!/^SP-\d{6}-\d{4}$/.test(wanted)) {
    error.textContent = 'Reference numbers look like SP-261028-4821.';
    result.innerHTML = '';
    return;
  }

  const concern = findConcern(wanted);
  result.innerHTML = concern
    ? trackCard(concern)
    : `<div class="empty">No concern found with reference <strong>${escapeHtml(wanted)}</strong>. Check the number and try again.</div>`;
}

function trackCard(c) {
  const steps = ['Submitted', 'In Progress', 'Resolved'];
  const current = steps.indexOf(c.status);
  const progress = steps.map((step, i) =>
    `<li class="${i <= current ? 'done' : ''}${i === current ? ' current' : ''}">${step}</li>`).join('');
  const timeline = c.history.slice().reverse().map(h =>
    `<li><strong>${h.status}</strong> <span class="date">${h.date}</span><p>${escapeHtml(h.note)}</p></li>`).join('');

  return `<article class="panel track-card">
    <div class="panel-title"><h2>${c.ref}</h2><span class="badge ${badgeClass(c.status)}">${c.status}</span></div>
    <div class="track-body">
      <ol class="progress">${progress}</ol>
      <dl class="track-details">
        <div><dt>Category</dt><dd>${escapeHtml(c.category)}</dd></div>
        <div><dt>Area</dt><dd>${escapeHtml(c.area)}</dd></div>
        <div><dt>Location</dt><dd>${escapeHtml(c.location)}</dd></div>
        <div><dt>Submitted</dt><dd>${c.submitted}</dd></div>
      </dl>
      <p class="track-desc">${escapeHtml(c.description)}</p>
      <h3>Updates</h3>
      <ul class="timeline">${timeline}</ul>
    </div>
  </article>`;
}

function renderRecent() {
  const saved = getSavedConcerns();
  const panel = document.getElementById('recentPanel');
  panel.hidden = !saved.length;
  document.getElementById('recentList').innerHTML = saved.slice(0, 5).map(c => `<div class="recent-item">
    <div><code>${c.ref}</code><small>${escapeHtml(c.category)} · ${c.submitted}</small></div>
    <span class="badge ${badgeClass(c.status)}">${c.status}</span>
    <button class="outline-button" type="button" data-track-ref="${c.ref}">Track</button>
  </div>`).join('');
}

function initTracking() {
  document.getElementById('trackForm').addEventListener('submit', e => {
    e.preventDefault();
    trackReference(document.getElementById('trackRef').value);
  });

  // Sample references and "Track" buttons in the recent list
  document.getElementById('trackPane').addEventListener('click', e => {
    const button = e.target.closest('[data-sample], [data-track-ref]');
    if (button) trackReference(button.dataset.sample || button.dataset.trackRef);
  });

  document.querySelectorAll('[data-fb-tab]').forEach(btn => {
    btn.onclick = () => showFeedbackTab(btn.dataset.fbTab);
  });
}


/* ==========================================================
   3. HELP CENTRE
   ========================================================== */
const FAQS = [
  { cat: 'Using the portal', q: 'What is Swift Penang?',
    a: 'Swift Penang is a community platform that brings together construction notices, road and pedestrian disruptions, access guides and a way to raise concerns about Mutiara Line construction, so residents, commuters and businesses can plan ahead.' },
  { cat: 'Using the portal', q: 'Do I need an account?',
    a: 'No. All information is public. My Alerts and the concerns you submit are remembered on the device you use, so use the same browser to see them again.' },
  { cat: 'Disruptions and access', q: 'How do I find out if a road near me is closed?',
    a: 'Open Disruptions and search for the road or area, or filter by Active and Scheduled notices. Each notice lists the dates, the impact and a suggested alternative route.',
    view: 'disruptions', label: 'Go to Disruptions' },
  { cat: 'Disruptions and access', q: 'Will shops near the works stay open?',
    a: 'In most cases, yes. Business access notices and the Business Access guides explain loading windows, temporary entrances and protected walkways for each area.',
    view: 'guides', label: 'Open Access Guides' },
  { cat: 'Disruptions and access', q: 'Is there a safe walking route for wheelchair users?',
    a: 'Pedestrian access notices describe the assisted route around each work zone, including controlled crossings. If a route is blocked, report it under "Pedestrian access or safety" so it can be fixed quickly.' },
  { cat: 'My Alerts', q: 'How do I set up My Alerts?',
    a: 'Go to My Alerts, choose the areas you travel through and the disruption types you care about, then press Save preferences. Matching notices appear straight away.',
    view: 'alerts', label: 'Set up My Alerts' },
  { cat: 'My Alerts', q: 'Why am I not seeing any alerts?',
    a: 'You need at least one area and one disruption type selected. If both are selected and nothing appears, there are no current disruptions matching your choices. Tick "Include resolved notices" to see past ones.' },
  { cat: 'Feedback', q: 'How do I report a problem caused by the construction?',
    a: 'Use Community Feedback to submit a concern. Choose a category, say where it happened and describe the issue. You get a reference number straight away.',
    feedback: 'submit', label: 'Submit a concern' },
  { cat: 'Feedback', q: 'What does each status mean?',
    a: 'Submitted means your concern has been received. In Progress means a site team has been assigned and is working on it. Resolved means action has been taken and the case is closed, with a note explaining what was done.' },
  { cat: 'Feedback', q: 'I lost my reference number. What can I do?',
    a: 'If you submitted from this device, open Track a concern and your recent submissions are listed below the search box. Otherwise, submit a new concern and mention the earlier one in the description.',
    feedback: 'track', label: 'Track a concern' },
  { cat: 'Feedback', q: 'How long does it take to get a response?',
    a: 'A community officer aims to review new concerns within 2 working days. For urgent safety issues on site, also call the hotline shown on the site hoarding.' }
];

let faqCategory = 'All';

function faqItem(f) {
  let action = '';
  if (f.view) action = `<button class="outline-button" type="button" data-view="${f.view}">${f.label}</button>`;
  if (f.feedback) action = `<button class="outline-button" type="button" data-goto-feedback="${f.feedback}">${f.label}</button>`;
  return `<div class="faq-item">
    <button class="faq-q" type="button" aria-expanded="false" aria-controls="faq-${f.id}">
      <span><small class="faq-cat">${f.cat}</small>${f.q}</span>${CHEVRON}
    </button>
    <div class="faq-a" id="faq-${f.id}" hidden><p>${f.a}</p>${action}</div>
  </div>`;
}

function renderFaqCategories() {
  const cats = ['All', ...new Set(FAQS.map(f => f.cat))];
  document.getElementById('faqCats').innerHTML = cats.map(c =>
    `<button class="filter-btn${c === faqCategory ? ' active' : ''}" type="button" data-faq-cat="${c}">${c}</button>`).join('');
}

function renderFaqs() {
  const query = document.getElementById('faqSearch').value.trim().toLowerCase();
  const found = FAQS
    .map((f, i) => ({ ...f, id: i }))
    .filter(f => (faqCategory === 'All' || f.cat === faqCategory) && `${f.q} ${f.a}`.toLowerCase().includes(query));

  document.getElementById('faqCount').textContent = `Showing ${found.length} of ${FAQS.length} questions`;
  document.getElementById('faqHeading').textContent = faqCategory === 'All' ? 'All questions' : faqCategory;
  document.getElementById('expandAll').textContent = 'Expand all';

  const list = document.getElementById('faqList');
  list.innerHTML = found.length
    ? found.map(faqItem).join('')
    : `<div class="empty">No questions match "${escapeHtml(query)}". Try another word, or
       <button class="link-button" type="button" data-goto-feedback="submit">ask us directly</button>.</div>`;

  // While searching, open the matching answers so the user sees them at once
  if (query) list.querySelectorAll('.faq-q').forEach(btn => setFaqOpen(btn, true));

  bindViewButtons(); // makes the new data-view buttons work
}

function setFaqOpen(button, open) {
  button.setAttribute('aria-expanded', String(open));
  document.getElementById(button.getAttribute('aria-controls')).hidden = !open;
}

function initHelp() {
  renderFaqCategories();
  renderFaqs();

  document.getElementById('faqSearch').addEventListener('input', renderFaqs);

  document.getElementById('faqCats').addEventListener('click', e => {
    const btn = e.target.closest('[data-faq-cat]');
    if (!btn) return;
    faqCategory = btn.dataset.faqCat;
    renderFaqCategories();
    renderFaqs();
  });

  document.getElementById('faqList').addEventListener('click', e => {
    const btn = e.target.closest('.faq-q');
    if (btn) setFaqOpen(btn, btn.getAttribute('aria-expanded') !== 'true');
  });

  document.getElementById('expandAll').onclick = function () {
    const open = this.textContent === 'Expand all';
    document.querySelectorAll('#faqList .faq-q').forEach(btn => setFaqOpen(btn, open));
    this.textContent = open ? 'Collapse all' : 'Expand all';
  };
}


/* ==========================================================
   4. NAVIGATION GLUE
   ========================================================== */
const PART2_VIEWS = ['alerts', 'feedback', 'help'];

// Any button with data-goto-feedback="submit" or "track" opens that tab
document.addEventListener('click', e => {
  const link = e.target.closest('[data-goto-feedback]');
  if (!link) return;
  switchView('feedback');
  showFeedbackTab(link.dataset.gotoFeedback);
});

// The "Share feedback" card on the home page now opens the Feedback page
document.getElementById('feedbackButton').onclick = () => {
  switchView('feedback');
  showFeedbackTab('submit');
};

// Lets links like index.html#feedback open our pages
function openPart2FromHash() {
  const view = location.hash.slice(1);
  if (PART2_VIEWS.includes(view)) switchView(view);
}
window.addEventListener('hashchange', openPart2FromHash);

/* ---------- Start ---------- */
initAlerts();
initFeedbackForm();
initTracking();
initHelp();
bindViewButtons();
openPart2FromHash();
