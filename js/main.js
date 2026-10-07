/* =====================================================================
   main.js — shared render engine
   ---------------------------------------------------------------------
   - Loads JSON from /data and renders content into the page.
   - Injects the shared navbar + footer (from site.json) on every page.
   - Each page sets <body data-page="home"> etc; the matching render
     function runs after site.json + that page's JSON have loaded.
   ===================================================================== */

/* ---- tiny helpers --------------------------------------------------- */
const $ = (sel, root = document) => root.querySelector(sel);

// Escape text so JSON content can't inject markup.
function esc(str = '') {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

// Fetch a JSON file from the data folder. Returns null on failure.
async function loadJSON(name) {
  try {
    const res = await fetch(`data/${name}.json`, { cache: 'no-cache' });
    if (!res.ok) throw new Error(`${res.status} ${res.statusText}`);
    return await res.json();
  } catch (err) {
    console.error(`Could not load data/${name}.json —`, err.message);
    return null;
  }
}

/* ---- shared chrome: navbar + footer -------------------------------- */
function renderNavbar(site) {
  const mount = $('#navbar-mount');
  if (!mount) return;
  const current = document.body.dataset.page;

  const links = site.nav
    .map((l) => {
      const isCta = l.cta ? ' nav-cta' : '';
      const isActive = l.page === current ? ' active' : '';
      const cls = `${isCta}${isActive}`.trim();
      return `<li><a href="${esc(l.href)}"${cls ? ` class="${cls}"` : ''}>${esc(l.label)}</a></li>`;
    })
    .join('');

  // A logo is a path, or { src, dark } to swap in a night-mode version (CSS picks which shows).
  const logos = site.brand.logos
    .map((l) => (typeof l === 'string' ? { src: l } : l))
    .map((l) => l.dark
      ? `<img src="${esc(l.src)}" alt="logo" class="nav-logo-img logo-light" /><img src="${esc(l.dark)}" alt="logo" class="nav-logo-img logo-dark" />`
      : `<img src="${esc(l.src)}" alt="logo" class="nav-logo-img" />`)
    .join('<div class="nav-sep"></div>');

  mount.innerHTML = `
    <div class="container">
      <div class="nav-inner">
        <a class="nav-logos" href="index.html" aria-label="${esc(site.brand.name)} home">
          ${logos}
        </a>
        <ul class="nav-links" id="navLinks">${links}</ul>
        <div class="nav-actions">
          <button class="theme-toggle" id="themeToggle" type="button"></button>
          <button class="nav-hamburger" id="hamburger" type="button"
            aria-label="Toggle navigation menu" aria-controls="navLinks" aria-expanded="false">
            <span></span><span></span><span></span>
          </button>
        </div>
      </div>
    </div>`;

  // Night mode toggle. The <head> script applies the saved/OS theme before paint;
  // this keeps the button in sync and saves the choice.
  const themeBtn = $('#themeToggle');
  const syncThemeBtn = () => {
    const dark = document.documentElement.dataset.theme === 'dark';
    themeBtn.innerHTML = `<i class="fa-solid ${dark ? 'fa-sun' : 'fa-moon'}"></i>`;
    themeBtn.setAttribute('aria-label', dark ? 'Switch to light mode' : 'Switch to dark mode');
  };
  themeBtn.addEventListener('click', () => {
    const next = document.documentElement.dataset.theme === 'dark' ? 'light' : 'dark';
    document.documentElement.dataset.theme = next;
    try { localStorage.setItem('theme', next); } catch (e) { /* private mode: just don't persist */ }
    syncThemeBtn();
  });
  syncThemeBtn();

  const hamburger = $('#hamburger');
  const navLinks = $('#navLinks');

  const setMenu = (open) => {
    navLinks.classList.toggle('mobile-open', open);
    hamburger.classList.toggle('active', open);
    hamburger.setAttribute('aria-expanded', String(open));
    document.body.classList.toggle('nav-open', open);
  };

  hamburger.addEventListener('click', () => setMenu(!navLinks.classList.contains('mobile-open')));

  // Close after tapping a link
  navLinks.addEventListener('click', (e) => {
    if (e.target.closest('a')) setMenu(false);
  });

  // Close on Escape
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') setMenu(false);
  });

  // Close when tapping outside the navbar
  document.addEventListener('click', (e) => {
    if (navLinks.classList.contains('mobile-open') && !e.target.closest('#navbar')) setMenu(false);
  });

  // Reset when growing past the mobile breakpoint
  window.addEventListener('resize', () => {
    if (window.innerWidth > 980) setMenu(false);
  });
}

// Footer: columns of links or plain text lines, then a copyright bar.
function renderFooter(site) {
  const mount = $('#footer-mount');
  if (!mount || !site.footer) return;
  const f = site.footer;

  const link = (l) => {
    const external = /^https?:/.test(l.href);
    return `<li><a href="${esc(l.href)}"${external ? ' target="_blank" rel="noopener"' : ''}>${esc(l.label)}</a></li>`;
  };
  const sections = f.sections
    .map(
      (sec) => `
      <div class="footer-col">
        <h4>${esc(sec.title)}</h4>
        ${sec.links ? `<ul class="footer-links">${sec.links.map(link).join('')}</ul>` : ''}
        ${sec.lines ? `<p class="footer-text">${sec.lines.map(esc).join('<br />')}</p>` : ''}
      </div>`
    )
    .join('');

  mount.innerHTML = `
    <div class="container">
      <div class="footer-grid">${sections}</div>
      <div class="footer-bottom">${esc(f.copyright)}</div>
    </div>`;
}

/* ---- generic component builders (reused across pages) --------------- */
function speakerCard(p) {
  const img = p.image
    ? `<img src="${esc(p.image)}" alt="${esc(p.name)}" class="${p.noCrop ? 'no-crop' : ''}" />`
    : `<div class="speaker-img-placeholder"><i class="fa-solid fa-user"></i></div>`;
  const socials = (p.socials || [])
    .map((s) => `<a href="${esc(s.href)}" target="_blank" aria-label="${esc(s.label)}"><i class="${esc(s.icon)}"></i></a>`)
    .join('');
  const domain = p.domainLabel
    ? `<span class="speaker-domain ${esc(p.track || '')}">${esc(p.domainLabel)}</span>`
    : '<span></span>';
  const tag = "div";
  // const tag = "href" in p ? "a" : "div";
  const href = p.href ? ` href="${esc(p.href)}" target="_blank"` : '';
  return `
    <${tag} class="speaker-card"${href}>
      <div class="speaker-img-wrap">
        ${img}
        <div class="speaker-track-bar ${esc(p.track || '')}"></div>
      </div>
      <div class="speaker-body">
        <div class="speaker-name">${esc(p.name)}</div>
        <div class="speaker-title">${esc(p.role)}</div>
        <div class="speaker-bio">${esc(p.bio)}</div>
        <div class="speaker-footer">
          ${domain}
          <div class="speaker-socials">${socials}</div>
        </div>
      </div>
    </${tag}>`;
}

function eventCard(e, photos = 0, past = false) {
  const linked = e.id && photos > 0;
  const tag = linked ? 'a' : 'div';
  const status = `${e.badge ? `${e.badge} · ` : ''}${past ? 'Past' : 'Upcoming'}`;
  return `
    <${tag} class="event-card"${linked ? ` href="${galleryHref(e.id)}"` : ''}>
      ${e.image ? `<div class="event-card-img"><img src="${esc(e.image)}" alt="${esc(e.name)}" /></div>` : ''}
      <div class="event-card-body">
        <span class="event-status ${past ? 'past' : 'upcoming'}">${esc(status)}</span>
        <h3 class="event-name">${esc(e.name)}</h3>
        <div class="event-meta">
          <span><i class="fa-regular fa-calendar"></i> ${esc(eventDateText(e))}</span>
          ${e.time ? `<span><i class="fa-regular fa-clock"></i> ${esc(e.time)}</span>` : ''}
          ${e.venue ? `<span><i class="fa-solid fa-location-dot"></i> ${esc(e.venue)}</span>` : ''}
        </div>
        ${e.desc ? `<p class="event-desc">${esc(e.desc)}</p>` : ''}
      </div>
    </${tag}>`;
}

/* ---- event ↔ gallery linking ---------------------------------------- */
// Gallery items tag themselves with an event id ("event": "freshers-party");
// this counts photos per event so pages only link to galleries that exist.
function photoCounts(gallery) {
  const counts = {};
  for (const i of gallery?.items || []) if (i.event) counts[i.event] = (counts[i.event] || 0) + 1;
  return counts;
}

const galleryHref = (id) => `gallery.html?event=${encodeURIComponent(id)}`;

const photoLabel = (n) => `${n} photo${n === 1 ? '' : 's'}`;

// Event dates are "YYYY-MM-DD", or "YYYY-MM" when only the month is known
// (then the event counts as upcoming until that month ends).
function eventSpan(date) {
  const [y, m, d] = date.split('-').map(Number);
  return d
    ? { start: new Date(y, m - 1, d), end: new Date(y, m - 1, d) }
    : { start: new Date(y, m - 1, 1), end: new Date(y, m, 0) };
}

const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'];

// Shown on cards: "dateLabel" if given, else "19 October 2026" / "December 2026".
function eventDateText(e) {
  if (e.dateLabel) return e.dateLabel;
  const [y, m, d] = e.date.split('-').map(Number);
  return `${d ? `${d} ` : ''}${MONTHS[m - 1]} ${y}`;
}

// Dashed box shown where a photo hasn't been added yet.
const photoPlaceholder = (label) =>
  `<div class="photo-placeholder"><i class="fa-regular fa-image"></i><span>${esc(label)}</span></div>`;

/* ---- section header helper ----------------------------------------- */
function sectionHead(label, title, sub) {
  return `
    ${label ? `<p class="section-label">${esc(label)}</p>` : ''}
    <h2 class="section-title">${esc(title)}</h2>
    <div class="divider"></div>
    ${sub ? `<p class="section-sub">${esc(sub)}</p>` : ''}`;
}

function pageHero(site, data) {
  const mount = $('#page-hero-mount');
  if (!mount || !data.hero) return;
  mount.innerHTML = `
    <div class="container">
      <h1 class="page-hero-title">${esc(data.hero.title)}</h1>
      ${data.hero.sub ? `<p class="page-hero-sub">${esc(data.hero.sub)}</p>` : ''}
    </div>`;
}

/* ---- per-page renderers -------------------------------------------- */
const pages = {
  async home(site) {
    const d = await loadJSON('home');
    if (!d) return;

    // hero (an empty "poster" keeps the slot as a placeholder)
    const poster = d.hero.poster
      ? `<img src="${esc(d.hero.poster)}" alt="${esc(d.hero.title)} poster" />`
      : photoPlaceholder('Poster');
    $('#hero-mount').innerHTML = `
      <div class="container">
        <div class="hero-grid">
          <div>
            <h1 class="hero-title">${d.hero.title}</h1>
            <p class="hero-intro">${esc(d.hero.intro)}</p>
          </div>
          <div class="hero-poster${d.hero.poster ? '' : ' empty'}">${poster}</div>
        </div>
      </div>`;

    // what we do: photo slot (none = placeholder, 1 = single, 2–4 = collage) + page links
    const w = d.whatWeDo;
    const shots = (w.photos || []).slice(0, 4);
    const photoCls = shots.length ? `count-${shots.length}${shots.length === 3 ? ' odd' : ''}` : 'empty';
    $('#home-what-we-do').innerHTML = `
      <div class="container">
        ${sectionHead('', w.title)}
        <div class="wwd-grid">
          <div class="wwd-photos ${photoCls}">
            ${shots.length ? shots.map((src) => `<img src="${esc(src)}" alt="" />`).join('') : photoPlaceholder('Photos')}
          </div>
          <div class="wwd-links">
            ${w.items.map((l) => `<a class="wwd-link" href="${esc(l.href)}">${esc(l.title)}</a>`).join('')}
          </div>
        </div>
      </div>`;

    // speakers preview
    $('#home-speakers').innerHTML = `
      <div class="container">
        ${sectionHead(d.speakers.label, d.speakers.title, d.speakers.sub)}
        <div class="speakers-grid">${d.speakers.items.map(speakerCard).join('')}</div>
        <div class="text-center mt-3"><a href="team.html" class="btn btn-outline">View full team</a></div>
      </div>`;
  },

  async events(site) {
    const [d, gallery] = await Promise.all([loadJSON('events'), loadJSON('gallery')]);
    if (!d) return;
    pageHero(site, d);
    const photos = photoCounts(gallery);

    // ── Calendar ────────────────────────────────────────────────────
    // Only events whose date is strictly YYYY-MM-DD (10-char ISO full date) are
    // plotted on the calendar. Month-only dates like "2026-12" are skipped.
    const ISO_FULL = /^\d{4}-\d{2}-\d{2}$/;

    // Build a map: "YYYY-MM-DD" → [event, …]  (multiple events on one day OK)
    const eventsByDate = {};
    for (const ev of d.items) {
      if (!ISO_FULL.test(ev.date)) continue;
      if (!eventsByDate[ev.date]) eventsByDate[ev.date] = [];
      eventsByDate[ev.date].push(ev);
    }

    const MONTH_NAMES = ['January','February','March','April','May','June',
                         'July','August','September','October','November','December'];
    const DOW_LABELS  = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];

    // current view state (starts at today's month)
    let viewYear  = new Date().getFullYear();
    let viewMonth = new Date().getMonth(); // 0-based

    /** Zero-pad a number to width 2. */
    const pad2 = (n) => String(n).padStart(2, '0');

    /** Render the grid for the current viewYear / viewMonth into the mount. */
    function renderCalendar() {
      const mount = $('#events-calendar-mount');
      if (!mount) return;

      const today     = new Date();
      const todayStr  = `${today.getFullYear()}-${pad2(today.getMonth() + 1)}-${pad2(today.getDate())}`;
      const firstDay  = new Date(viewYear, viewMonth, 1);
      const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();
      const startDow  = firstDay.getDay(); // 0 = Sunday

      // DOW header cells
      const dowCells = DOW_LABELS.map(d => `<div class="cal-dow">${d}</div>`).join('');

      // blank padding cells before day 1
      const blanks = Array.from({ length: startDow }, () => `<div class="cal-day empty"></div>`).join('');

      // day cells
      const dayCells = Array.from({ length: daysInMonth }, (_, i) => {
        const day     = i + 1;
        const dateStr = `${viewYear}-${pad2(viewMonth + 1)}-${pad2(day)}`;
        const evs     = eventsByDate[dateStr] || [];
        const isToday = dateStr === todayStr;

        const dots = evs.length
          ? `<div class="cal-dots">${evs.slice(0, 3).map(() => `<span class="cal-dot"></span>`).join('')}</div>`
          : '';

        const tooltipItems = evs.map(ev =>
          `<div class="cal-tooltip-item">${esc(ev.name)}${ev.time ? `<div class="cal-tooltip-time">${esc(ev.time)}</div>` : ''}</div>`
        ).join('');
        const tooltip = evs.length ? `<div class="cal-tooltip">${tooltipItems}</div>` : '';

        const cls = ['cal-day', isToday ? 'today' : '', evs.length ? 'has-event' : ''].filter(Boolean).join(' ');
        return `<div class="${cls}">${day}${dots}${tooltip}</div>`;
      }).join('');

      mount.innerHTML = `
        <div class="container">
          ${sectionHead('', 'Event Calendar')}
          <div class="cal-wrap">
            <div class="cal-header">
              <span class="cal-month-label">${MONTH_NAMES[viewMonth]} ${viewYear}</span>
              <div class="cal-nav">
                <button class="cal-nav-btn" id="calPrev" aria-label="Previous month"><i class="fa-solid fa-chevron-left"></i></button>
                <button class="cal-nav-btn" id="calNext" aria-label="Next month"><i class="fa-solid fa-chevron-right"></i></button>
              </div>
              <button class="cal-export-btn" id="calExport"><i class="fa-solid fa-calendar-arrow-up"></i> Export .ics</button>
            </div>
            <div class="cal-grid">
              ${dowCells}
              ${blanks}
              ${dayCells}
            </div>
          </div>
        </div>`;

      // Wire navigation
      $('#calPrev').addEventListener('click', () => {
        if (viewMonth === 0) { viewMonth = 11; viewYear--; } else { viewMonth--; }
        renderCalendar();
      });
      $('#calNext').addEventListener('click', () => {
        if (viewMonth === 11) { viewMonth = 0; viewYear++; } else { viewMonth++; }
        renderCalendar();
      });

      // Wire .ics export — generates a valid RFC-5545 iCalendar file with ALL
      // full-date events (not just the visible month) so the file is complete.
      $('#calExport').addEventListener('click', () => exportICS(d.items));
    }

    /** Build and trigger download of an RFC-5545 .ics file for all full-date events. */
    function exportICS(items) {
      const lines = [
        'BEGIN:VCALENDAR',
        'VERSION:2.0',
        'PRODID:-//ACES-ACM IIT Delhi//Events//EN',
        'CALSCALE:GREGORIAN',
        'METHOD:PUBLISH',
        'X-WR-CALNAME:ACES-ACM Events',
        'X-WR-TIMEZONE:Asia/Kolkata',
      ];

      const now = new Date();
      const stamp = `${now.getFullYear()}${pad2(now.getMonth()+1)}${pad2(now.getDate())}` +
                    `T${pad2(now.getHours())}${pad2(now.getMinutes())}${pad2(now.getSeconds())}Z`;

      for (const ev of items) {
        if (!ISO_FULL.test(ev.date)) continue; // skip month-only dates
        const [y, m, dd] = ev.date.split('-');
        // DTSTART / DTEND as DATE (all-day) unless a time is given
        let dtStart, dtEnd;
        if (ev.time) {
          // Parse simple "6:30 PM" / "10:00 AM" style times
          const match = ev.time.match(/(\d+):(\d+)\s*(AM|PM)/i);
          if (match) {
            let h = parseInt(match[1], 10);
            const min = match[2];
            if (/PM/i.test(match[3]) && h !== 12) h += 12;
            if (/AM/i.test(match[3]) && h === 12) h = 0;
            dtStart = `${y}${m}${dd}T${pad2(h)}${min}00`;
            dtEnd   = `${y}${m}${dd}T${pad2(h + 1)}${min}00`;
          }
        }
        if (!dtStart) {
          // All-day: DTEND = next day
          const nextDay = new Date(parseInt(y), parseInt(m) - 1, parseInt(dd) + 1);
          const ny = nextDay.getFullYear();
          const nm = pad2(nextDay.getMonth() + 1);
          const nd = pad2(nextDay.getDate());
          dtStart = `${y}${m}${dd}`;
          dtEnd   = `${ny}${nm}${nd}`;
        }

        // Fold long lines at 75 octets per RFC 5545 §3.1
        const fold = (str) => {
          const out = [];
          while (str.length > 75) { out.push(str.slice(0, 75)); str = ' ' + str.slice(75); }
          out.push(str);
          return out.join('\r\n');
        };

        lines.push('BEGIN:VEVENT');
        lines.push(`UID:${ev.id || ev.name.replace(/\s+/g,'-').toLowerCase()}-${ev.date}@aces-acm.iitd`);
        lines.push(`DTSTAMP:${stamp}Z`);
        if (ev.time) {
          lines.push(`DTSTART;TZID=Asia/Kolkata:${dtStart}`);
          lines.push(`DTEND;TZID=Asia/Kolkata:${dtEnd}`);
        } else {
          lines.push(`DTSTART;VALUE=DATE:${dtStart}`);
          lines.push(`DTEND;VALUE=DATE:${dtEnd}`);
        }
        lines.push(fold(`SUMMARY:${ev.name}`));
        if (ev.venue) lines.push(fold(`LOCATION:${ev.venue}`));
        if (ev.desc && !ev.desc.startsWith('TODO:')) lines.push(fold(`DESCRIPTION:${ev.desc.replace(/\n/g,'\\n')}`));
        lines.push('END:VEVENT');
      }

      lines.push('END:VCALENDAR');
      const blob = new Blob([lines.join('\r\n')], { type: 'text/calendar;charset=utf-8' });
      const url  = URL.createObjectURL(blob);
      const a    = Object.assign(document.createElement('a'), { href: url, download: 'aces-acm-events.ics' });
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    }

    renderCalendar();

    // ── Event lists (upcoming / past) ────────────────────────────────
    // split on today's date: upcoming soonest first, past most recent first
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const items = d.items.map((e) => ({ ...e, ...eventSpan(e.date) }));
    const upcoming = items.filter((e) => e.end >= today).sort((a, b) => a.start - b.start);
    const past = items.filter((e) => e.end < today).sort((a, b) => b.start - a.start);

    // cards link to the event's gallery when it has photos
    const grid = (list, isPast) =>
      `<div class="events-grid">${list.map((e) => eventCard(e, photos[e.id], isPast)).join('')}</div>`;

    $('#events-upcoming').innerHTML = `
      <div class="container">
        ${sectionHead('', d.upcomingTitle)}
        ${upcoming.length ? grid(upcoming, false) : `<p class="events-empty">${esc(d.upcomingEmpty)}</p>`}
      </div>`;

    $('#events-past').innerHTML = `
      <div class="container">
        ${sectionHead('', d.pastTitle)}
        ${grid(past, true)}
      </div>`;
  },

  async team(site) {
    const d = await loadJSON('team');
    if (!d) return;
    pageHero(site, d);

    const groups = d.groups
      .map(
        (g) => `
        <div class="team-group${g.align === 'left' ? ' align-left' : ''}">
          <h2 class="team-group-title">${esc(g.title)}</h2>
          <div class="speakers-grid">${g.members.map(speakerCard).join('')}</div>
        </div>`
      )
      .join('');
    $('#team-main').innerHTML = `<div class="container">${groups}</div>`;
  },

  async gallery(site) {
    const [d, events] = await Promise.all([loadJSON('gallery'), loadJSON('events')]);
    if (!d) return;
    pageHero(site, d);

    // In the full gallery, photos tagged with an event link to that event's gallery.
    const item = (i, linkEvent) => {
      const tag = linkEvent && i.event ? 'a' : 'div';
      return `
      <${tag} class="gallery-item"${tag === 'a' ? ` href="${galleryHref(i.event)}"` : ''}>
        ${i.image ? `<img src="${esc(i.image)}" alt="${esc(i.caption || '')}" />` : '<div class="gallery-placeholder"><i class="fa-regular fa-image"></i></div>'}
        <div class="gallery-overlay"><span class="gallery-caption">${esc(i.caption || '')}</span></div>
      </${tag}>`;
    };

    // gallery.html?event=<id> — just that event's photos
    const eventId = new URLSearchParams(location.search).get('event');
    if (eventId) {
      const ev = (events?.items || []).find((e) => e.id === eventId);
      const shots = d.items.filter((i) => i.event === eventId);
      if (ev) document.title = `${ev.name} — Gallery — ACES-ACM`;
      $('#gallery-main').innerHTML = `
        <div class="container">
          <a href="gallery.html" class="gallery-back"><i class="fa-solid fa-arrow-left"></i> All photos</a>
          <h2 class="section-title">${esc(ev ? ev.name : 'Event photos')}</h2>
          <div class="event-meta gallery-event-meta">
            ${ev ? `<span><i class="fa-regular fa-calendar"></i> ${esc(eventDateText(ev))}</span>
            <span><i class="fa-solid fa-location-dot"></i> ${esc(ev.venue)}</span>` : ''}
            <span><i class="fa-regular fa-images"></i> ${photoLabel(shots.length)}</span>
          </div>
          ${shots.length
            ? `<div class="gallery-grid">${shots.map((i) => item(i, false)).join('')}</div>`
            : '<p class="gallery-empty">No photos from this event yet.</p>'}
        </div>`;
      return;
    }

    $('#gallery-main').innerHTML = `
      <div class="container">
        <div class="gallery-grid">${d.items.map((i) => item(i, true)).join('')}</div>
      </div>`;
  },
};

/* ---- boot ----------------------------------------------------------- */
async function boot() {
  const site = await loadJSON('site');
  if (site) {
    renderNavbar(site);
    renderFooter(site);
  }

  const page = document.body.dataset.page;
  if (page && pages[page]) await pages[page](site || {});

  // navbar scroll shadow
  window.addEventListener('scroll', () => {
    const nav = $('#navbar');
    if (nav) nav.classList.toggle('scrolled', window.scrollY > 10);
  });
}

document.addEventListener('DOMContentLoaded', boot);
