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
const $$ = (sel, root = document) => [...root.querySelectorAll(sel)];

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

  const logos = site.brand.logos
    .map((src) => `<img src="${esc(src)}" alt="logo" class="nav-logo-img" />`)
    .join('<div class="nav-sep"></div>');

  mount.innerHTML = `
    <div class="container">
      <div class="nav-inner">
        <a class="nav-logos" href="index.html">
          ${logos}
          <div class="nav-sep" style="margin-left:0.5rem"></div>
          <span class="nav-brand">${esc(site.brand.name)}</span>
        </a>
        <ul class="nav-links" id="navLinks">${links}</ul>
        <button class="nav-hamburger" id="hamburger" type="button"
          aria-label="Toggle navigation menu" aria-controls="navLinks" aria-expanded="false">
          <span></span><span></span><span></span>
        </button>
      </div>
    </div>`;

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

function renderFooter(site) {
  const mount = $('#footer-mount');
  if (!mount) return;
  const f = site.footer;

  const cols = f.columns
    .map(
      (c) => `
      <div class="footer-col">
        <h4>${esc(c.title)}</h4>
        <ul class="footer-links">
          ${c.links.map((l) => `<li><a href="${esc(l.href)}">${esc(l.label)}</a></li>`).join('')}
        </ul>
      </div>`
    )
    .join('');

  const socials = site.socials
    .map((s) => `<a href="${esc(s.href)}" class="footer-social" aria-label="${esc(s.label)}"><i class="${esc(s.icon)}"></i></a>`)
    .join('');

  mount.innerHTML = `
    <div class="container">
      <div class="footer-grid">
        <div>
          <div class="footer-brand-name">${esc(site.brand.name)}</div>
          <div class="footer-brand-sub">${f.blurb}</div>
        </div>
        ${cols}
      </div>
      <div class="footer-bottom">
        <span>${esc(f.copyright)}</span>
        <div class="footer-socials">${socials}</div>
      </div>
    </div>`;
}

/* ---- generic component builders (reused across pages) --------------- */
function trackCard(d) {
  const topics = (d.topics || []).map((t) => `<span class="topic-tag">${esc(t)}</span>`).join('');
  const badge = d.badge ? `<span class="domain-day-badge">${esc(d.badge)}</span>` : '';
  return `
    <div class="domain-card">
      ${badge}
      <div class="domain-icon ${esc(d.track || '')}"><i class="${esc(d.icon)}"></i></div>
      <h3 class="domain-title">${esc(d.title)}</h3>
      <p class="domain-desc">${esc(d.desc)}</p>
      <div class="domain-topics">${topics}</div>
    </div>`;
}

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

function eventCard(e) {
  return `
    <div class="event-card">
      <div class="event-card-img">${e.image ? `<img src="${esc(e.image)}" alt="${esc(e.name)}" />` : ''}</div>
      <div class="event-card-body">
        <span class="event-status ${esc(e.status || '')}">${esc(e.statusLabel || e.status || '')}</span>
        <h3 class="event-name">${esc(e.name)}</h3>
        <div class="event-meta">
          <span><i class="fa-regular fa-calendar"></i> ${esc(e.date)}</span>
          <span><i class="fa-solid fa-location-dot"></i> ${esc(e.venue)}</span>
        </div>
        <p class="event-desc">${esc(e.desc)}</p>
      </div>
    </div>`;
}

/* ---- section header helper ----------------------------------------- */
function sectionHead(label, title, sub) {
  return `
    <p class="section-label">${esc(label)}</p>
    <h2 class="section-title">${esc(title)}</h2>
    <div class="divider"></div>
    ${sub ? `<p class="section-sub">${esc(sub)}</p>` : ''}`;
}

function pageHero(site, data) {
  const mount = $('#page-hero-mount');
  if (!mount || !data.hero) return;
  mount.innerHTML = `
    <div class="container">
      <div class="breadcrumb"><a href="index.html">Home</a> / ${esc(data.hero.title)}</div>
      <h1 class="page-hero-title">${esc(data.hero.title)}</h1>
      ${data.hero.sub ? `<p class="page-hero-sub">${esc(data.hero.sub)}</p>` : ''}
    </div>`;
}

/* ---- per-page renderers -------------------------------------------- */
const pages = {
  async home(site) {
    const d = await loadJSON('home');
    if (!d) return;

    // hero
    $('#hero-mount').innerHTML = `
      <div class="container">
        <div class="hero-grid">
          <div class="hero-content">
            <div class="hero-eyebrow"><i class="fa-solid fa-circle-dot"></i> ${esc(d.hero.eyebrow)}</div>
            <h1 class="hero-title">${d.hero.title}</h1>
            <p class="hero-org">${d.hero.org}</p>
            <div class="hero-meta">
              ${d.hero.meta.map((m) => `<div class="hero-meta-item"><i class="${esc(m.icon)}"></i><span>${esc(m.text)}</span></div>`).join('')}
            </div>
            <div class="hero-actions">
              ${d.hero.actions.map((a) => `<a href="${esc(a.href)}" class="btn ${esc(a.style)}"><i class="${esc(a.icon)}"></i> ${esc(a.label)}</a>`).join('')}
            </div>
          </div>
          <div class="hero-visual">
            <div class="hero-card">
              <div class="hero-card-img"><img src="${esc(d.hero.image)}" alt="poster" /></div>
              <div class="hero-card-body">
                <div class="hero-stats">
                  ${d.hero.stats.map((s) => `<div class="hero-stat"><div class="hero-stat-num">${esc(s.num)}</div><div class="hero-stat-label">${esc(s.label)}</div></div>`).join('')}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>`;

    // about snippet
    $('#home-about').innerHTML = `
      <div class="container">
        <div class="about-grid">
          <div>
            ${sectionHead(d.about.label, d.about.title)}
            <div class="about-body">${d.about.body.map((p) => `<p>${esc(p)}</p>`).join('')}</div>
            <a href="about.html" class="btn btn-outline mt-2"><i class="fa-solid fa-arrow-right"></i> Learn more</a>
          </div>
          <div class="about-sidebar">
            ${d.about.pills.map((p) => `
              <div class="info-pill">
                <div class="info-pill-icon"><i class="${esc(p.icon)}"></i></div>
                <div class="info-pill-text"><strong>${esc(p.label)}</strong><span>${esc(p.value)}</span></div>
              </div>`).join('')}
          </div>
        </div>
      </div>`;

    // tracks
    $('#home-tracks').innerHTML = `
      <div class="container">
        ${sectionHead(d.tracks.label, d.tracks.title, d.tracks.sub)}
        <div class="domains-grid">${d.tracks.items.map(trackCard).join('')}</div>
      </div>`;

    // speakers preview
    $('#home-speakers').innerHTML = `
      <div class="container">
        ${sectionHead(d.speakers.label, d.speakers.title, d.speakers.sub)}
        <div class="speakers-grid">${d.speakers.items.map(speakerCard).join('')}</div>
        <div class="text-center mt-3"><a href="team.html" class="btn btn-outline">View full team</a></div>
      </div>`;

    // cta
    $('#home-cta').innerHTML = `
      <div class="container">
        <div class="cta-strip">
          <h2>${esc(d.cta.title)}</h2>
          <p>${esc(d.cta.sub)}</p>
          <a href="${esc(d.cta.href)}" class="btn btn-primary">${esc(d.cta.label)}</a>
        </div>
      </div>`;
  },

  async about(site) {
    const d = await loadJSON('about');
    if (!d) return;
    pageHero(site, d);

    $('#about-main').innerHTML = `
      <div class="container">
        <div class="about-grid">
          <div class="about-body">${d.body.map((p) => `<p>${esc(p)}</p>`).join('')}</div>
          <div class="about-sidebar">
            ${d.pills.map((p) => `
              <div class="info-pill">
                <div class="info-pill-icon"><i class="${esc(p.icon)}"></i></div>
                <div class="info-pill-text"><strong>${esc(p.label)}</strong><span>${esc(p.value)}</span></div>
              </div>`).join('')}
          </div>
        </div>
      </div>`;

    $('#about-tracks').innerHTML = `
      <div class="container">
        ${sectionHead(d.tracks.label, d.tracks.title, d.tracks.sub)}
        <div class="domains-grid">${d.tracks.items.map(trackCard).join('')}</div>
      </div>`;
  },

  async events(site) {
    const d = await loadJSON('events');
    if (!d) return;
    pageHero(site, d);

    // event cards
    $('#events-list').innerHTML = `
      <div class="container">
        ${sectionHead(d.list.label, d.list.title, d.list.sub)}
        <div class="events-grid">${d.list.items.map(eventCard).join('')}</div>
      </div>`;

    // schedule with day tabs
    const tabs = d.schedule.days
      .map((day, i) => `<button class="schedule-tab ${i === 0 ? 'active' : ''}" data-day="${i}">${esc(day.tab)}</button>`)
      .join('');
    const days = d.schedule.days
      .map(
        (day, i) => `
        <div class="schedule-day ${i === 0 ? 'active' : ''}" data-day="${i}">
          <div class="schedule-date-banner">
            <div class="sched-date-num">${esc(day.dateNum)}</div>
            <div class="sched-date-info"><strong>${esc(day.dateLabel)}</strong><span>${esc(day.venue)}</span></div>
          </div>
          <table class="schedule-table">
            <thead><tr><th>Time</th><th>Session</th><th style="text-align:right">Location</th></tr></thead>
            <tbody>
              ${day.rows.map((r) => `
                <tr>
                  <td class="sched-time">${esc(r.time)}</td>
                  <td>
                    <div class="sched-event-name">${esc(r.name)}</div>
                    ${(r.subs || []).map((s) => `<div class="sched-event-sub">${esc(s)}</div>`).join('')}
                  </td>
                  <td class="sched-venue">${esc(r.location)}</td>
                </tr>`).join('')}
            </tbody>
          </table>
        </div>`
      )
      .join('');

    $('#events-schedule').innerHTML = `
      <div class="container">
        ${sectionHead(d.schedule.label, d.schedule.title, d.schedule.sub)}
        <div class="schedule-tabs">${tabs}</div>
        ${days}
      </div>`;

    // wire tabs
    $$('#events-schedule .schedule-tab').forEach((btn) => {
      btn.addEventListener('click', () => {
        const idx = btn.dataset.day;
        $$('#events-schedule .schedule-tab').forEach((t) => t.classList.toggle('active', t.dataset.day === idx));
        $$('#events-schedule .schedule-day').forEach((dd) => dd.classList.toggle('active', dd.dataset.day === idx));
      });
    });
  },

  async team(site) {
    const d = await loadJSON('team');
    if (!d) return;
    pageHero(site, d);

    const groups = d.groups
      .map(
        (g) => `
        <div class="team-group">
          <h2 class="team-group-title">${esc(g.title)}</h2>
          <div class="speakers-grid">${g.members.map(speakerCard).join('')}</div>
        </div>`
      )
      .join('');
    $('#team-main').innerHTML = `<div class="container">${groups}</div>`;
  },

  async gallery(site) {
    const d = await loadJSON('gallery');
    if (!d) return;
    pageHero(site, d);

    const cats = ['All', ...new Set(d.items.map((i) => i.category).filter(Boolean))];
    const filters = cats
      .map((c, i) => `<button class="gallery-filter ${i === 0 ? 'active' : ''}" data-cat="${esc(c)}">${esc(c)}</button>`)
      .join('');

    const item = (i) => `
      <div class="gallery-item" data-cat="${esc(i.category || '')}">
        ${i.image ? `<img src="${esc(i.image)}" alt="${esc(i.caption || '')}" />` : '<div class="gallery-placeholder"><i class="fa-regular fa-image"></i></div>'}
        <div class="gallery-overlay"><span class="gallery-caption">${esc(i.caption || '')}</span></div>
      </div>`;

    $('#gallery-main').innerHTML = `
      <div class="container">
        <div class="gallery-filters">${filters}</div>
        <div class="gallery-grid">${d.items.map(item).join('')}</div>
      </div>`;

    $$('#gallery-main .gallery-filter').forEach((btn) => {
      btn.addEventListener('click', () => {
        const cat = btn.dataset.cat;
        $$('#gallery-main .gallery-filter').forEach((b) => b.classList.toggle('active', b === btn));
        $$('#gallery-main .gallery-item').forEach((it) => {
          it.style.display = cat === 'All' || it.dataset.cat === cat ? '' : 'none';
        });
      });
    });
  },

  async calendar(site) {
    const d = await loadJSON('calendar');
    if (!d) return;
    pageHero(site, d);

    const row = (e) => `
      <div class="calendar-row">
        <div class="cal-date">
          <div class="cal-date-day">${esc(e.day)}</div>
          <div class="cal-date-mon">${esc(e.month)}</div>
        </div>
        <div class="cal-body">
          <div class="cal-title">${esc(e.title)}</div>
          <div class="cal-meta">
            <span><i class="fa-regular fa-clock"></i> ${esc(e.time)}</span>
            <span><i class="fa-solid fa-location-dot"></i> ${esc(e.venue)}</span>
          </div>
        </div>
        <span class="cal-tag">${esc(e.tag)}</span>
      </div>`;

    $('#calendar-main').innerHTML = `
  <div class="container">
    ${sectionHead(d.label, d.title, d.sub)}
    <div class="calendar-list">${d.entries.map(row).join('')}</div>

    ${sectionHead(d.pastLabel, d.pastTitle, d.pastSub)}
    <div class="calendar-list">${d.pastEntries.map(row).join('')}</div>
  </div>`;
  },

  async newsletter(site) {
    const d = await loadJSON('newsletter');
    if (!d) return;
    pageHero(site, d);

    const issue = (n) => `
      <div class="issue-card">
        <div class="issue-num">${esc(n.number)}</div>
        <h3 class="issue-title">${esc(n.title)}</h3>
        <div class="issue-date">${esc(n.date)}</div>
        <p class="issue-summary">${esc(n.summary)}</p>
        <a class="issue-link" href="${esc(n.href || '#')}" target="_blank">Read issue <i class="fa-solid fa-arrow-right"></i></a>
      </div>`;

    $('#newsletter-main').innerHTML = `
      <div class="container">
        <div class="newsletter-signup">
          <h3 style="font-family:var(--serif);font-size:1.4rem;color:var(--navy)">${esc(d.signup.title)}</h3>
          <p style="color:var(--muted)">${esc(d.signup.sub)}</p>
          <form class="newsletter-form" id="newsletterForm">
            <input type="email" placeholder="${esc(d.signup.placeholder)}" required />
            <button type="submit" class="btn btn-primary">${esc(d.signup.button)}</button>
          </form>
          <p id="newsletterMsg" style="font-size:0.85rem;color:var(--tag-theory);display:none">Thanks — you're subscribed! (demo only)</p>
        </div>
        ${sectionHead(d.issues.label, d.issues.title, d.issues.sub)}
        <div class="issues-grid">${d.issues.items.map(issue).join('')}</div>
      </div>`;

    const form = $('#newsletterForm');
    form.addEventListener('submit', (ev) => {
      ev.preventDefault();
      form.reset();
      $('#newsletterMsg').style.display = 'block';
    });
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
