/* ════════════════════════════════════════════
   Constants
════════════════════════════════════════════ */
const LIFESPAN = 90;
const WPY      = 52;                      // weeks per year
const TOTAL_W  = LIFESPAN * WPY;          // 4,680 total weeks
const MS_DAY   = 86_400_000;
const MS_WEEK  = MS_DAY * 7;

const UNIVERSE_AGE_YR = 13_800_000_000;
const EARTH_AGE_YR    =  4_540_000_000;

// World population in billions — UN World Population Prospects
const WORLD_POP = [
  [1900, 1.60], [1910, 1.75], [1920, 1.86], [1930, 2.07], [1940, 2.30],
  [1950, 2.53], [1955, 2.77], [1960, 3.02], [1965, 3.34], [1970, 3.70],
  [1975, 4.07], [1980, 4.43], [1985, 4.83], [1990, 5.31], [1995, 5.72],
  [2000, 6.09], [2005, 6.51], [2010, 6.93], [2015, 7.38], [2020, 7.80],
  [2025, 8.16], [2026, 8.19]
];

// Global births per year in millions — UN / World Bank
const BIRTHS_M = [
  [1900, 50],  [1950, 97],  [1960, 120], [1970, 127], [1980, 123],
  [1990, 138], [2000, 132], [2010, 139], [2020, 140], [2026, 140]
];

// Global deaths per year in millions — UN
const DEATHS_M = [
  [1900, 48], [1950, 50], [1960, 52], [1970, 53], [1980, 52],
  [1990, 52], [2000, 56], [2010, 58], [2020, 62], [2026, 62]
];

/* ════════════════════════════════════════════
   Math helpers
════════════════════════════════════════════ */

function lerp(data, year) {
  if (year <= data[0][0])             return data[0][1];
  if (year >= data[data.length-1][0]) return data[data.length-1][1];
  for (let i = 0; i < data.length - 1; i++) {
    const [y0, v0] = data[i];
    const [y1, v1] = data[i + 1];
    if (year >= y0 && year <= y1)
      return v0 + (v1 - v0) * (year - y0) / (y1 - y0);
  }
}

function integrate(data, from, to, step = 0.25) {
  let s = 0;
  for (let y = from; y < to; y += step) s += lerp(data, y) * step;
  return s;
}

function comma(n) {
  return Math.round(n).toLocaleString('en-US');
}

function fmtBig(n) {
  if (n >= 1e15) return (n / 1e15).toFixed(1).replace(/\.0$/, '') + ' quadrillion';
  if (n >= 1e12) return (n / 1e12).toFixed(1).replace(/\.0$/, '') + ' trillion';
  if (n >= 1e9)  return (n / 1e9).toFixed(1).replace(/\.0$/, '')  + ' billion';
  if (n >= 1e6)  return (n / 1e6).toFixed(1).replace(/\.0$/, '')  + ' million';
  return comma(n);
}

function fmtPop(b) {
  return (Math.round(b * 10) / 10).toFixed(1) + ' billion';
}

function pctOf(part, whole, decimals = 6) {
  return ((part / whole) * 100).toFixed(decimals).replace(/\.?0+$/, '') + '%';
}

/* ════════════════════════════════════════════
   Step wiring
════════════════════════════════════════════ */
const monthEl = document.getElementById('dob-month');
const dayEl   = document.getElementById('dob-day');
const yearEl  = document.getElementById('dob-year');
const goBtn   = document.getElementById('go-btn');
const backBtn = document.getElementById('back-btn');
const s1      = document.getElementById('step1');
const s2      = document.getElementById('step2');

// Populate month options
const MONTHS = [
  'January','February','March','April','May','June',
  'July','August','September','October','November','December'
];
MONTHS.forEach((name, i) => {
  const opt = document.createElement('option');
  opt.value = i;
  opt.textContent = name;
  monthEl.appendChild(opt);
});

// Populate year options — current year down to 1920
const currentYear = new Date().getFullYear();
for (let y = currentYear; y >= 1920; y--) {
  const opt = document.createElement('option');
  opt.value = y;
  opt.textContent = y;
  yearEl.appendChild(opt);
}

// Populate day options, respecting the selected month/year
function updateDays() {
  const month      = parseInt(monthEl.value);
  const year       = parseInt(yearEl.value);
  const prevDay    = dayEl.value;

  // Work out how many days this month has (default 31 if month not yet chosen)
  const daysInMonth = isNaN(month)
    ? 31
    : new Date(isNaN(year) ? 2000 : year, month + 1, 0).getDate();

  dayEl.innerHTML = '<option value="">—</option>';
  for (let d = 1; d <= daysInMonth; d++) {
    const opt = document.createElement('option');
    opt.value = d;
    opt.textContent = d;
    dayEl.appendChild(opt);
  }

  // Restore the previously selected day if it still exists
  if (prevDay && parseInt(prevDay) <= daysInMonth) {
    dayEl.value = prevDay;
  }
}

updateDays();

// Enable Continue only when all three fields have a value
function syncBtn() {
  goBtn.disabled = !monthEl.value || !dayEl.value || !yearEl.value;
}

[monthEl, dayEl, yearEl].forEach(el => {
  el.addEventListener('change', () => {
    if (el === monthEl || el === yearEl) updateDays();
    syncBtn();
  });
});

// Continue → Step 2
goBtn.addEventListener('click', () => {
  if (!monthEl.value || !dayEl.value || !yearEl.value) return;
  const dob = new Date(parseInt(yearEl.value), parseInt(monthEl.value), parseInt(dayEl.value));
  if (dob > new Date()) return; // reject future dates
  s1.classList.remove('active');
  s2.classList.add('active');
  window.scrollTo(0, 0);
  build(dob);
});

// Back → Step 1
backBtn.addEventListener('click', () => {
  s2.classList.remove('active');
  s1.classList.add('active');
  window.scrollTo(0, 0);
});

/* ════════════════════════════════════════════
   Build visualisation
════════════════════════════════════════════ */
function build(dob) {
  const now     = new Date();
  const msLived = now - dob;
  const days    = msLived / MS_DAY;
  const weeks   = Math.floor(msLived / MS_WEEK);
  const years   = days / 365.25;
  const age     = Math.floor(years);
  const birthYr = dob.getFullYear();
  const nowYr   = now.getFullYear() + now.getMonth() / 12;
  const pct     = Math.min(100, (weeks / TOTAL_W) * 100);

  document.getElementById('age-tag').textContent = `— age ${age}`;

  buildGrid(weeks);

  setTimeout(() => {
    document.getElementById('prog-fill').style.width = pct.toFixed(3) + '%';
    document.getElementById('prog-pct').textContent  = pct.toFixed(1) + '%';
  }, 150);

  /* ── Time ── */
  rows('st-time', [
    ['Weeks lived',
      comma(weeks),
      `of ${comma(TOTAL_W)} in a 90-year life`],
    ['Weeks remaining',
      comma(Math.max(0, TOTAL_W - weeks)),
      'at a 90-year lifespan'],
    ['Days on earth',
      comma(Math.floor(days))],
    ['Hours lived',
      fmtBig(Math.floor(days * 24))],
    ['Full moons witnessed',
      comma(Math.floor(years * 12.3683)),
      'Moon orbits Earth every 29.53 days'],
    ['Seasons passed',
      comma(Math.floor(years * 4)),
      'spring, summer, autumn, winter'],
    ['Hours of sleep (estimated)',
      fmtBig(Math.floor(days * 8)),
      '~8 hours per night — roughly a third of your life'],
  ]);

  /* ── Societal context ── */
  const popBirth   = lerp(WORLD_POP, birthYr);
  const popNow     = lerp(WORLD_POP, nowYr);
  const popAdded   = popNow - popBirth;
  const popPctChg  = (popAdded / popBirth * 100).toFixed(0);
  const dailyBirth = Math.round(lerp(BIRTHS_M, birthYr) * 1e6 / 365.25);
  const totalBorn  = integrate(BIRTHS_M, birthYr, nowYr) * 1e6;
  const totalDied  = integrate(DEATHS_M, birthYr, nowYr) * 1e6;
  const everLived  = 108_000_000_000;

  rows('st-soc', [
    ['World population when you were born',
      fmtPop(popBirth),
      'UN World Population Prospects'],
    ['World population today',
      fmtPop(popNow),
      `+${popPctChg}% more people than when you arrived`],
    ['People added to the planet in your lifetime',
      fmtPop(popAdded),
      'net population increase'],
    ['Babies born on your birth day',
      comma(dailyBirth),
      'approximate global daily births that year'],
    ['People born since you',
      fmtBig(totalBorn),
      'UN birth-rate data, integrated year by year'],
    ['People who have died since your birth',
      fmtBig(totalDied),
      'UN mortality data, integrated year by year'],
    ['Humans who have ever lived',
      '~108 billion',
      `you are among the ${((popNow * 1e9 / everLived) * 100).toFixed(1)}% of them alive right now`],
  ]);

  /* ── Cosmic perspective ── */
  const earthKm    = years * 939_951_374;
  const sunKm      = years * 6_939_648_000;
  const mwKm       = years * 17_409_792_000;
  const supernovae = days * 86_400 * 634;
  const heartbeats = days * 1_440 * 70;
  const neutrinos  = days * 86_400 * 65e9 * 8_650;

  rows('st-cos', [
    ['Distance Earth has carried you around the sun',
      fmtBig(Math.round(earthKm)) + ' km',
      'Earth orbits at 29.78 km/s'],
    ['Distance the sun has moved through the Milky Way',
      fmtBig(Math.round(sunKm)) + ' km',
      'Sun orbits the galactic centre at ~220 km/s'],
    ['Distance the Milky Way has moved through space',
      fmtBig(Math.round(mwKm)) + ' km',
      'Milky Way moves at ~552 km/s relative to the CMB'],
    ['Your age as a fraction of the universe\'s age',
      pctOf(years, UNIVERSE_AGE_YR, 9),
      'Universe is ~13.8 billion years old'],
    ['Your age as a fraction of Earth\'s age',
      pctOf(years, EARTH_AGE_YR, 7),
      'Earth formed ~4.54 billion years ago'],
    ['Supernovae in the observable universe',
      fmtBig(Math.round(supernovae)),
      '~1 per century per galaxy × ~2 trillion galaxies'],
    ['Solar neutrinos that have passed through your body',
      fmtBig(Math.round(neutrinos)),
      '~65 billion per cm² per second (solar neutrino flux)'],
    ['Times your heart has beaten',
      fmtBig(Math.round(heartbeats)),
      '~70 beats per minute'],
  ]);

  /* ── Natural world ── */
  const sequoiaPct  = pctOf(years, 3200, 2);
  const sharkPct    = pctOf(years, 400, 2);
  const whalePct    = pctOf(years, 211, 2);
  const cellCycles  = (years / 7).toFixed(1);
  const treesFelled = years * 15_000_000_000;
  const treesPlanted= years *  5_000_000_000;
  const lightning   = days * 86_400 * 100;
  const newSpecies  = Math.round(years * 18_000);
  const breaths     = Math.round(days * 1_440 * 15);
  const steps       = Math.round(days * 7_000);

  rows('st-nat', [
    ['Breaths you have taken',
      fmtBig(breaths),
      '~15 breaths per minute at rest'],
    ['Steps you have walked (estimated)',
      fmtBig(steps),
      '~7,000 steps per day average'],
    ['Times your body\'s cells have been replaced',
      cellCycles + '×',
      'most cells turn over every ~7 years; you are not the same atoms you were born with'],
    ['Your lifespan as a share of a giant sequoia\'s',
      sequoiaPct,
      'sequoias can live up to 3,200 years'],
    ['Your lifespan as a share of a Greenland shark\'s',
      sharkPct,
      'Greenland sharks can live over 400 years — reaching sexual maturity at ~150'],
    ['Your lifespan as a share of a bowhead whale\'s',
      whalePct,
      'bowhead whales can live over 211 years'],
    ['Trees felled worldwide since your birth',
      fmtBig(Math.round(treesFelled)),
      '~15 billion per year (Nature, 2015)'],
    ['Trees replanted worldwide since your birth',
      fmtBig(Math.round(treesPlanted)),
      '~5 billion per year (FAO estimate)'],
    ['Lightning strikes on Earth since your birth',
      fmtBig(Math.round(lightning)),
      '~100 per second globally (NOAA / NASA)'],
    ['New species formally named by science since your birth',
      comma(newSpecies),
      '~18,000 described per year (IUCN / Catalogue of Life)'],
  ]);
}

/* ════════════════════════════════════════════
   Render stat rows
════════════════════════════════════════════ */
function rows(id, data) {
  document.getElementById(id).innerHTML = data
    .map(([name, val, sub]) => `
      <li>
        <span class="s-name">${name}</span>
        <span class="s-val">${val}${sub ? `<span class="s-sub">${sub}</span>` : ''}</span>
      </li>`)
    .join('');
}

/* ════════════════════════════════════════════
   Build week grid
════════════════════════════════════════════ */

function buildGrid(weeksLived) {
  const el = document.getElementById('grid');
  el.innerHTML = '';

  const avail = Math.max(200, el.parentElement.clientWidth - 32);
  const gap   = 2;
  const cell  = Math.max(4, Math.floor((avail - gap * (WPY - 1)) / WPY));

  el.style.gridTemplateColumns = `repeat(${WPY}, ${cell}px)`;
  el.style.gap = `${gap}px`;

  const frag = document.createDocumentFragment();
  for (let yr = 0; yr < LIFESPAN; yr++) {
    for (let wk = 0; wk < WPY; wk++) {
      const idx = yr * WPY + wk;
      const d   = document.createElement('div');
      d.className = 'w';
      if      (idx < weeksLived - 1)   d.classList.add('past');
      else if (idx === weeksLived - 1) d.classList.add('now');
      frag.appendChild(d);
    }
  }
  el.appendChild(frag);

  // Decade labels (0, 10, 20 … 80) on the left
  for (let dec = 0; dec < LIFESPAN; dec += 10) {
    const lbl = document.createElement('div');
    lbl.className = 'dec-lbl';
    lbl.style.top = (dec * (cell + gap)) + 'px';
    lbl.textContent = dec;
    el.appendChild(lbl);
  }
}
