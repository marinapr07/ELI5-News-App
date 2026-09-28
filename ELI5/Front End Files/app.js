/* ============================================================
   ELI5 — app.js
   Swipe feed + article expansion + category filter
   ============================================================ */

// ── SVG ICONS ────────────────────────────────────────────────
const ICONS = {
  heart:   `<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#e11d48" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>`,
  comment: `<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#2563eb" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>`,
  share:   `<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#16a34a" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg>`,
  extLink: `<svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/></svg>`,
  back:    `<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="15 18 9 12 15 6"/></svg>`,
  expand:  `<svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="15 3 21 3 21 9"/><polyline points="9 21 3 21 3 15"/><line x1="21" y1="3" x2="14" y2="10"/><line x1="3" y1="21" x2="10" y2="14"/></svg>`,
};

// ── FALLBACK HERO ILLUSTRATIONS ───────────────────────────────
const HERO_SVG = {
  tech:     `<svg viewBox="0 0 375 130" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="xMidYMid slice"><rect width="375" height="130" fill="#e8e8fd"/><rect x="40" y="18" width="108" height="75" rx="9" fill="#c7c8f8" opacity=".7"/><rect x="52" y="30" width="84" height="46" rx="5" fill="#5b5ef4" opacity=".3"/><circle cx="94" cy="110" r="9" fill="#5b5ef4" opacity=".4"/><rect x="168" y="8" width="152" height="102" rx="9" fill="#afafec" opacity=".5"/><rect x="182" y="20" width="124" height="66" rx="5" fill="#5b5ef4" opacity=".22"/></svg>`,
  business: `<svg viewBox="0 0 375 130" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="xMidYMid slice"><rect width="375" height="130" fill="#fff3d6"/><rect x="28" y="78" width="30" height="48" rx="3" fill="#f59e0b" opacity=".5"/><rect x="74" y="57" width="30" height="69" rx="3" fill="#f59e0b" opacity=".6"/><rect x="120" y="36" width="30" height="90" rx="3" fill="#f59e0b" opacity=".7"/><rect x="166" y="14" width="30" height="112" rx="3" fill="#f59e0b" opacity=".85"/><rect x="212" y="42" width="30" height="84" rx="3" fill="#f59e0b" opacity=".65"/><rect x="258" y="57" width="30" height="69" rx="3" fill="#f59e0b" opacity=".5"/><rect x="304" y="70" width="30" height="56" rx="3" fill="#f59e0b" opacity=".4"/><polyline points="43,74 89,53 135,32 181,10 227,38 273,53 319,67" fill="none" stroke="#b07a00" stroke-width="2.5" stroke-linecap="round"/></svg>`,
  world:    `<svg viewBox="0 0 375 130" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="xMidYMid slice"><rect width="375" height="130" fill="#e1f5ee"/><circle cx="187" cy="65" r="54" fill="#9fe1cb" opacity=".4"/><circle cx="187" cy="65" r="54" fill="none" stroke="#1d9e75" stroke-width="1" opacity=".3"/><ellipse cx="187" cy="65" rx="22" ry="54" fill="none" stroke="#1d9e75" stroke-width="1" opacity=".25"/><ellipse cx="187" cy="65" rx="54" ry="14" fill="none" stroke="#1d9e75" stroke-width="1" opacity=".25"/><circle cx="154" cy="54" r="5" fill="#1d9e75" opacity=".7"/><circle cx="216" cy="44" r="4" fill="#1d9e75" opacity=".7"/></svg>`,
  ent:      `<svg viewBox="0 0 375 130" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="xMidYMid slice"><rect width="375" height="130" fill="#fce8f3"/><circle cx="187" cy="65" r="52" fill="#f4c0d1" opacity=".5"/><polygon points="170,40 210,65 170,90" fill="#d4537e" opacity=".6"/><circle cx="187" cy="65" r="52" fill="none" stroke="#d4537e" stroke-width="1.5" opacity=".3"/><circle cx="298" cy="26" r="20" fill="#f4c0d1" opacity=".4"/></svg>`,
  us:       `<svg viewBox="0 0 375 130" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="xMidYMid slice"><rect width="375" height="130" fill="#fde8e8"/><rect x="152" y="12" width="70" height="85" rx="5" fill="#f09595" opacity=".5"/><polygon points="187,6 202,40 242,40 210,60 222,96 187,75 152,96 164,60 132,40 172,40" fill="#e24b4a" opacity=".35"/><circle cx="187" cy="62" r="12" fill="#e24b4a" opacity=".4"/></svg>`,
  culture:  `<svg viewBox="0 0 375 130" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="xMidYMid slice"><rect width="375" height="130" fill="#f0eafd"/><polygon points="187,6 214,80 290,80 228,122 250,196 187,154 124,196 146,122 84,80 160,80" fill="#dcc4f5" opacity=".6"/><circle cx="187" cy="74" r="30" fill="#c7a0ec" opacity=".4"/><circle cx="187" cy="74" r="14" fill="#9b59d0" opacity=".3"/></svg>`,
};

// ── CATEGORIES ────────────────────────────────────────────────
const CATEGORIES = [
  { id: 'all',      label: 'All categories',        color: '#5b5ef4' },
  { id: 'tech',     label: 'Tech',                  color: '#4040c0' },
  { id: 'business', label: 'Business',              color: '#b07a00' },
  { id: 'ent',      label: 'Entertainment',         color: '#a0337a' },
  { id: 'world',    label: 'World News / Politics', color: '#0f6e56' },
  { id: 'us',       label: 'US News',               color: '#a03030' },
  { id: 'culture',  label: 'Art, Culture & Fashion',color: '#6b35c0' },
];

// ── STATE ─────────────────────────────────────────────────────
let allArticles = [];
let filtered    = [];
let cur         = 0;
let activeCat   = 'all';
let ddOpen      = false;

// ── INIT ──────────────────────────────────────────────────────
async function init() {
  buildDropdown();
  setupCatButton();
  setupSwipe();
  await fetchArticles();
}

// ── FETCH ─────────────────────────────────────────────────────
async function fetchArticles(category = 'all') {
  showLoading();
  try {
    const res  = await fetch(`/api/articles?category=${category}`);
    const data = await res.json();
    allArticles = data;
    applyFilter();
  } catch (err) {
    console.error('Failed to fetch articles:', err);
    showError();
  }
}

function showLoading() {
  document.getElementById('cardStack').innerHTML = `
    <div class="loading-state">
      <div class="loading-spinner"></div>
      <p>getting the news fr fr…</p>
    </div>`;
}

function showError() {
  document.getElementById('cardStack').innerHTML = `
    <div class="no-results">couldn't load articles rn 😭 try again later</div>`;
}

// ── CATEGORY DROPDOWN ─────────────────────────────────────────
function buildDropdown() {
  document.getElementById('catDD').innerHTML = CATEGORIES.map(c => `
    <div class="cat-option${c.id === activeCat ? ' selected' : ''}" data-cat="${c.id}">
      <div class="cat-dot" style="background:${c.color}"></div>
      <span>${c.label}</span>
    </div>`).join('');

  document.querySelectorAll('.cat-option').forEach(el => {
    el.addEventListener('click', () => {
      activeCat = el.dataset.cat;
      ddOpen    = false;
      document.getElementById('catDD').classList.remove('open');
      applyFilter();
      buildDropdown();
    });
  });
}

function setupCatButton() {
  document.getElementById('catBtn').addEventListener('click', e => {
    e.stopPropagation();
    ddOpen = !ddOpen;
    document.getElementById('catDD').classList.toggle('open', ddOpen);
  });

  document.addEventListener('click', e => {
    if (!e.target.closest('#catBtn') && !e.target.closest('#catDD')) {
      ddOpen = false;
      document.getElementById('catDD').classList.remove('open');
    }
  });
}

// ── FILTER + BUILD ────────────────────────────────────────────
function applyFilter() {
  filtered = activeCat === 'all'
    ? allArticles.slice()
    : allArticles.filter(a => a.tc === activeCat);
  cur = 0;
  buildStack();
}

function heroContent(a) {
  if (a.imageUrl) {
    return `<img class="card-hero-img"
               src="${a.imageUrl}"
               onerror="this.style.display='none';this.nextSibling.style.display='block'"
               alt="" />
            <div class="card-hero-fallback" style="display:none">${HERO_SVG[a.hk] || HERO_SVG.world}</div>`;
  }
  return HERO_SVG[a.hk] || HERO_SVG.world;
}

function buildStack() {
  const stack = document.getElementById('cardStack');
  stack.innerHTML = '';

  if (!filtered.length) {
    stack.innerHTML = '<div class="no-results">no stories in this category yet</div>';
    return;
  }

  filtered.forEach((a, i) => {
    const card = document.createElement('div');
    card.className = 'card hidden-below';
    card.dataset.i  = i;
    card.innerHTML  = `
      <div class="card-hero">${heroContent(a)}</div>
      <div class="card-body">
        <div class="card-meta">
          <span class="tag ${a.tc}">${a.tl}</span>
          <span class="time">${a.time}</span>
        </div>
        <div class="card-headline">${a.hl}</div>
        <div class="card-summary">${a.sm}</div>
      </div>
      <div class="card-footer">
        <a class="source-link" href="${a.url}" target="_blank" rel="noopener"
           onclick="event.stopPropagation()">
          via ${a.src} ${ICONS.extLink}
        </a>
        <div class="reactions">
          <button class="rbtn like"    title="Like"    onclick="event.stopPropagation();this.classList.toggle('reacted')">${ICONS.heart}</button>
          <button class="rbtn comment" title="Comment" onclick="event.stopPropagation();this.classList.toggle('reacted')">${ICONS.comment}</button>
          <button class="rbtn share"   title="Share"   onclick="event.stopPropagation();this.classList.toggle('reacted')">${ICONS.share}</button>
        </div>
      </div>`;

    card.addEventListener('click', () => {
      if (card.classList.contains('c0')) openArticle(i);
    });

    stack.appendChild(card);
  });

  positionCards();
}

// ── CARD POSITIONING ──────────────────────────────────────────
function positionCards() {
  document.querySelectorAll('#cardStack .card').forEach(card => {
    card.classList.remove('c0','c1','c2','c3','hidden-below','exit-up');
    const offset = parseInt(card.dataset.i) - cur;
    if      (offset === 0) card.classList.add('c0');
    else if (offset === 1) card.classList.add('c1');
    else if (offset === 2) card.classList.add('c2');
    else if (offset === 3) card.classList.add('c3');
    else if (offset  >  3) card.classList.add('hidden-below');
    else                   card.classList.add('exit-up');
  });
}

// ── SWIPE NAVIGATION ──────────────────────────────────────────
function swipeNext() {
  if (cur >= filtered.length - 1) return;
  const top = document.querySelector('#cardStack .card.c0');
  if (top) { top.classList.remove('c0'); top.classList.add('exit-up'); }
  cur++;
  setTimeout(positionCards, 50);
}

function swipePrev() {
  if (cur <= 0) return;
  cur--;
  positionCards();
}

function setupSwipe() {
  const stage = document.getElementById('swipeStage');
  let ty0 = 0, my0 = 0, mouseDown = false;

  stage.addEventListener('touchstart', e => { ty0 = e.touches[0].clientY; }, { passive: true });
  stage.addEventListener('touchend', e => {
    const dy = ty0 - e.changedTouches[0].clientY;
    if (dy > 45) swipeNext();
    else if (dy < -45) swipePrev();
  });

  stage.addEventListener('mousedown', e => { my0 = e.clientY; mouseDown = true; });
  document.addEventListener('mouseup', e => {
    if (!mouseDown) return;
    mouseDown = false;
    const dy = my0 - e.clientY;
    if (dy > 45) swipeNext();
    else if (dy < -45) swipePrev();
  });

  document.addEventListener('keydown', e => {
    if (e.key === 'ArrowUp')   swipePrev();
    if (e.key === 'ArrowDown') swipeNext();
  });
}

// ── ARTICLE VIEW ──────────────────────────────────────────────
function openArticle(i) {
  const a = filtered[i];
  const v = document.getElementById('articleView');

  const statsHtml = (a.stats || []).map(s => `
    <div class="stat-card">
      <span class="stat-lbl">${s.l}</span>
      <span class="stat-val">${s.v}</span>
      <span class="stat-d ${s.c || ''}">${s.d}</span>
    </div>`).join('');

  const barsHtml = (a.chartBars || []).map(b => `
    <div class="bar-row">
      <span class="bar-lbl">${b.l}</span>
      <div class="bar-track">
        <div class="bar-fill" style="width:${b.p}%;background:${b.col};">
          <span class="bar-v">${b.p}%</span>
        </div>
      </div>
    </div>`).join('');

  const heroHtml = a.imageUrl
    ? `<img class="article-hero-img" src="${a.imageUrl}"
            onerror="this.style.display='none'" alt="" />`
    : (HERO_SVG[a.hk] || HERO_SVG.world);

  v.innerHTML = `
    <div class="article-hero">
      ${heroHtml}
      <button class="hero-back" onclick="closeArticle()">${ICONS.back}</button>
    </div>
    <div class="article-body">
      <div class="article-tag-row">
        <span class="tag ${a.tc}">${a.tl}</span>
        <span class="article-time">${a.time}</span>
      </div>
      <div class="article-headline">${a.hl}</div>
      <div class="article-lede">${a.ld}</div>

      ${statsHtml ? `
        <hr class="a-divider"/>
        <div class="s-label">by the numbers</div>
        <div class="stat-grid">${statsHtml}</div>` : ''}

      <hr class="a-divider"/>
      <div class="s-label">what's going on</div>
      <div class="article-text">${a.bd}</div>

      ${a.pq ? `<div class="pullquote">${a.pq}</div>` : ''}

      ${barsHtml ? `
        <div class="chart-wrap">
          <div class="chart-title">${a.chartTitle || ''}</div>
          <div class="bar-chart">${barsHtml}</div>
        </div>` : ''}

      <div class="a-footer">
        <a class="source-link" href="${a.url}" target="_blank" rel="noopener">
          via ${a.src} ${ICONS.extLink}
        </a>
        <div class="reactions">
          <button class="rbtn like"    onclick="this.classList.toggle('reacted')">${ICONS.heart}</button>
          <button class="rbtn comment" onclick="this.classList.toggle('reacted')">${ICONS.comment}</button>
          <button class="rbtn share"   onclick="this.classList.toggle('reacted')">${ICONS.share}</button>
        </div>
      </div>
    </div>`;

  document.getElementById('feedView').classList.add('hidden');
  v.classList.add('visible');
  v.scrollTop = 0;
}

function closeArticle() {
  document.getElementById('articleView').classList.remove('visible');
  document.getElementById('feedView').classList.remove('hidden');
}

// ── BOOT ─────────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', init);
