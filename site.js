/* Public website: renders everything from the content (defaults + whatever the admin published). */
(function () {
  'use strict';
  var T0 = Date.now();
  var $ = function (s) { return document.querySelector(s); };
  var $$ = function (s) { return Array.prototype.slice.call(document.querySelectorAll(s)); };
  var esc = function (s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); };
  var attr = function (s) { return esc(s).replace(/\n/g, '&#10;'); };
  var em = function (s) { return esc(s).replace(/\*([^*]+)\*/g, '<em>$1</em>'); };
  var lines = function (s) { return String(s || '').split(/\r?\n/).map(function (x) { return x.trim(); }).filter(Boolean); };
  var paras = function (s) { return String(s || '').split(/\n\s*\n/).map(function (x) { return x.trim(); }).filter(Boolean); };
  var slug = Store.slug;
  function ytId(u) { var m = String(u || '').match(/(?:youtube\.com\/(?:watch\?(?:.*&)?v=|embed\/|shorts\/)|youtu\.be\/)([A-Za-z0-9_-]{11})/); return m ? m[1] : ''; }
  function mediaTag(src, type, poster, alt, o) {
    o = o || {};
    if (!src) return '';
    var yt = ytId(src);
    if (yt) return '<img src="' + esc(poster || 'https://img.youtube.com/vi/' + yt + '/hqdefault.jpg') + '" alt="' + esc(alt) + '" loading="lazy">';
    if (type === 'video') return '<video src="' + esc(src) + '#t=0.1"' + (poster ? ' poster="' + esc(poster) + '"' : '') + ' muted loop playsinline preload="metadata" disablepictureinpicture' + (o.autoplay ? ' autoplay' : '') + '></video>';
    return '<img src="' + esc(src) + '" alt="' + esc(alt) + '" loading="lazy" onerror="this.style.display=\'none\'">';
  }
  var ROMAN = ['i', 'ii', 'iii', 'iv', 'v', 'vi', 'vii', 'viii'];
  var PREVIEW = /[?&]preview=1/.test(location.search);

  var C;                       // the content
  var BASE_TITLE = document.title;

  function ids(items) {
    var seen = {};
    return (items || []).map(function (x, i) {
      var id = x.id || slug(x.title) || ('item-' + (i + 1));
      while (seen[id]) id += '-2';
      seen[id] = 1;
      return Object.assign({}, x, { id: id });
    });
  }
  function mailAttrs(subject, body) { return 'data-mail data-ms="' + attr(subject) + '" data-mb="' + attr(body) + '"'; }

  /* ============================== RENDER ============================== */
  function render() {
    var S = C.sections || {}, on = function (k) { return S[k] !== false; };
    var N = C.site.mailName || 'there';
    var hello = mailAttrs('Hello from your website', 'Hi ' + N + ',\n\nI came across your portfolio and would like to get in touch about...\n\nThanks,');

    var navDef = [['about', 'About', 'about'], ['experience', 'Experience', 'experience'], ['portfolio', 'Portfolio', 'portfolio'], ['services', 'Services', 'services'], ['courses', 'Courses', 'courses'], ['store', 'Store', 'store'], ['blog', 'Blog', 'blog']]
      .filter(function (n) { return on(n[2]); });
    var nav = navDef.map(function (n) { return '<a href="#' + n[0] + '">' + n[1] + '</a>'; }).join('');
    var mnav = navDef.map(function (n) { return '<a href="#' + n[0] + '">' + n[1] + ' <i>·</i></a>'; }).join('') +
      (on('booking') ? '<a href="#book">Book a session <i>·</i></a>' : '') + '<a href="#contact">Contact <i>·</i></a>';

    var head = function (label, heading, intro) {
      return '<div class="head"><div><div class="label">' + esc(label) + '</div><h2>' + em(heading) + '</h2></div>' + (intro ? '<p>' + esc(intro) + '</p>' : '') + '</div>';
    };
    var bullets = function (s, cls) { return '<ul>' + lines(s).map(function (x) { return '<li>' + esc(x) + '</li>'; }).join('') + '</ul>'; };

    /* ---- header ---- */
    var h = '<header id="hdr"><div class="in"><a href="#top" class="logo"><i>' + esc(C.site.initial || (C.site.name || 'R').charAt(0)) + '</i>' + esc(C.site.name) + '</a>' +
      '<nav class="nav-links" aria-label="Main">' + nav + '</nav><div class="nav-right">' +
      (on('store') ? '<button class="cartbtn" id="cartBtn" aria-label="Open cart">🛒<b id="cartBadge">0</b></button>' : '') +
      (on('booking') ? '<a class="pill hide-m" href="#book">Book</a>' : '') +
      '<button class="pill hide-m" ' + hello + '>Contact</button>' +
      '<button class="burger" id="burger" aria-label="Menu" aria-expanded="false"><span></span><span></span><span></span></button></div></div></header>' +
      '<div class="mobile-menu" id="mMenu">' + mnav + '</div><main id="top">';

    /* ---- hero ---- */
    var hr = C.hero, words = [], wi = 0;
    hr.headline.split(/(\*[^*]+\*)/).forEach(function (part) {
      if (!part) return;
      var isEm = /^\*[^*]+\*$/.test(part), txt = isEm ? part.slice(1, -1) : part;
      txt.split(/\s+/).filter(Boolean).forEach(function (w) { words.push({ w: w, em: isEm }); });
    });
    var h1 = words.map(function (x) {
      return '<span class="m" aria-hidden="true"><span class="wd" style="--i:' + (wi++) + '">' + (x.em ? '<em>' : '') + esc(x.w) + (x.em ? '</em>' : '') + '</span></span>';
    }).join(' ');
    var slides = (hr.slides || []).filter(function (s) { return s && s.src; });
    var single = slides.length === 1;
    var slidesHTML = slides.map(function (s, i) {
      var inner = s.type === 'video'
        ? '<video src="' + esc(s.src) + '"' + (s.poster ? ' poster="' + esc(s.poster) + '"' : '') + ' muted playsinline preload="metadata" disablepictureinpicture' + (single ? ' loop' : '') + '></video>'
        : '<img src="' + esc(s.src) + '" alt="' + esc(s.alt || '') + '"' + (i === 0 ? ' fetchpriority="high"' : '') + ' onerror="this.style.display=\'none\'">';
      return '<div class="slide' + (i === 0 ? ' on' : '') + '">' + inner + '</div>';
    }).join('');
    var dots = slides.length > 1 ? '<div class="sdots">' + slides.map(function (s, i) { return '<button type="button" aria-label="Show slide ' + (i + 1) + '"' + (i === 0 ? ' class="on"' : '') + '></button>'; }).join('') + '</div>' : '';
    var stats = (hr.stats || []).map(function (s) { return '<div><b>' + esc(s.value) + '</b><span>' + esc(s.label) + '</span></div>'; }).join('');

    h += '<div class="hero" id="hero"><div class="blob b1"></div><div class="blob b2"></div><div class="blob b3"></div><div class="spot"></div><div class="grain"></div>' +
      '<div class="wrap"><div class="hero-main"><div class="hero-grid"><div>' +
      '<div class="eyebrow hr" style="--i:0"><span class="onair"><b></b>LIVE</span> ' + esc(hr.eyebrow) + '</div>' +
      '<h1 aria-label="' + esc(hr.headline.replace(/\*/g, '')) + '">' + h1 + '</h1>' +
      '<p class="lead hr" style="--i:5">' + esc(hr.lead) + '</p>' +
      '<div class="btns hr" style="--i:6"><a class="btn fill" href="#portfolio">' + esc(hr.btn1) + '</a><button class="btn" ' + hello + '>' + esc(hr.btn2) + '</button></div></div>' +
      '<div class="vf hr" id="vf" style="--i:3"><div class="vf-in"><div class="slides" id="slides">' + slidesHTML + '</div><div class="scan"></div></div>' +
      '<i class="c tl"></i><i class="c tr"></i><i class="c bl"></i><i class="c br"></i>' + dots +
      '<div class="rec"><b></b>REC</div><div class="cam">' + esc(hr.cam) + '<br><span id="tc">00:00:00:00</span></div>' +
      '<div class="meter" aria-hidden="true">' + [0, 1, 2, 3, 4, 5, 6, 7, 8, 9].map(function (i) { return '<span style="--i:' + i + '"></span>'; }).join('') + '</div>' +
      '<div class="lower">' + (hr.avatar ? '<img class="av" src="' + esc(hr.avatar) + '" alt="">' : '') + '<div><small>' + esc(hr.lowerSmall) + '</small><strong>' + esc(hr.lowerName) + '</strong><span>' + esc(hr.lowerSub) + '</span></div></div>' +
      '</div></div></div><div class="hstats hr" style="--i:8;--n:' + Math.max(1, (hr.stats || []).length) + '">' + stats + '</div></div></div>';

    /* ---- marquee ---- */
    var mq = lines(C.marquee && C.marquee.items);
    if (mq.length) {
      var one = mq.map(function (x) { return '<span>' + esc(x) + '</span><b>✦</b>'; }).join('');
      h += '<div class="marquee" aria-hidden="true" style="margin-top:clamp(36px,5vw,64px)"><div>' + one + one + '</div></div>';
    }

    /* ---- about ---- */
    if (on('about')) {
      var a = C.about;
      h += '<section id="about"><div class="wrap rv">' + head('About', a.heading, '') +
        '<div class="about-grid"><div class="about-cols">' + paras(a.text).map(function (p) { return '<p>' + esc(p) + '</p>'; }).join('') +
        '<div class="btns" style="margin-top:8px"><a class="btn fill" href="#experience">See experience</a>' + (on('booking') ? '<a class="btn" href="#book">Book a session</a>' : '') + '</div></div>' +
        (a.portrait ? '<figure class="portrait">' + mediaTag(a.portrait, a.portraitType, '', 'Portrait of ' + C.site.name, { autoplay: true }) + '<figcaption>' + esc(a.portraitCaption) + '</figcaption></figure>' : '') + '</div>' +
        '<div class="focus">' + (a.focus || []).map(function (f, i) { return '<a href="' + esc(f.link || '#about') + '"><span class="go">↗</span><span class="n">' + (ROMAN[i] || (i + 1)) + '.</span><h3>' + esc(f.title) + '</h3><p>' + esc(f.text) + '</p></a>'; }).join('') + '</div></div></section>';
    }

    /* ---- experience ---- */
    if (on('experience')) {
      var ex = C.experience;
      h += '<section id="experience" style="padding-top:0"><div class="wrap rv">' + head('Experience', ex.heading, ex.intro) +
        (ex.jobs || []).map(function (j) {
          return '<div class="job"><div><h3>' + esc(j.title) + '</h3><div class="meta"><strong>' + esc(j.org) + '</strong>' + esc(j.dates) + (j.place ? '<br>' + esc(j.place) : '') + '</div>' + (j.badge ? '<span class="badge">' + esc(j.badge) + '</span>' : '') + '</div>' +
            '<ul>' + lines(j.bullets).map(function (b) { return '<li>' + esc(b) + '</li>'; }).join('') + '</ul></div>';
        }).join('') + '</div></section>';
    }

    /* ---- on air ---- */
    if (on('onair')) {
      var oa = C.onair;
      h += '<section id="highlights" class="dark"><div class="wrap rv">' + head('On-Air', oa.heading, oa.intro) + '<div class="show">' +
        ids(oa.items).map(function (s) { return '<a href="#/segment/' + esc(s.id) + '" data-open="' + esc(s.id) + '"><small>' + esc(s.kicker) + '</small><h3>' + esc(s.title) + '</h3><p>' + esc(s.teaser) + '</p><span class="more">Details →</span></a>'; }).join('') +
        '</div></div></section>';
    }

    /* ---- education & skills ---- */
    if (on('education')) {
      var ed = C.education;
      h += '<section id="education"><div class="wrap rv">' + head('Education & Skills', ed.heading, ed.intro) + '<div class="edu-skills"><div class="edu">' +
        (ed.schools || []).map(function (s) { return '<div><span>' + esc(s.years) + '</span><h3>' + esc(s.title) + '</h3>' + (s.place ? '<span>' + esc(s.place) + '</span>' : '') + '</div>'; }).join('') + '</div><div>' +
        (ed.skills || []).map(function (g) { return '<div class="skillgroup"><h4>' + esc(g.group) + '</h4><div class="tags">' + String(g.tags || '').split(',').map(function (t) { return t.trim(); }).filter(Boolean).map(function (t) { return '<span>' + esc(t) + '</span>'; }).join('') + '</div></div>'; }).join('') +
        '</div></div></div></section>';
    }

    /* ---- portfolio ---- */
    if (on('portfolio')) {
      var po = C.portfolio, items = ids(po.items), cats = [];
      items.forEach(function (x) { var c = (x.category || '').trim(); if (c && cats.indexOf(c) < 0) cats.push(c); });
      h += '<section id="portfolio" style="padding-top:0"><div class="wrap rv">' + head('Portfolio', po.heading, po.intro) +
        (cats.length > 1 ? '<div class="filters"><button class="on" data-f="all">All</button>' + cats.map(function (c) { return '<button data-f="' + esc(slug(c)) + '">' + esc(c) + '</button>'; }).join('') + '</div>' : '') +
        '<div class="work">' + items.map(function (x) {
          return '<a href="#/work/' + esc(x.id) + '" class="tile" role="button" data-c="' + esc(slug(x.category)) + '" data-id="' + esc(x.id) + '" data-title="' + attr(x.title) + '" data-cat="' + attr(x.kicker) + '" data-desc="' + attr(x.desc) + '" data-type="' + esc(x.type || 'image') + '" data-src="' + esc(x.image || '') + '" data-poster="' + esc(x.poster || '') + '">' +
            mediaTag(x.image, x.type, x.poster, x.alt || x.title) + '<span class="ov"></span><span class="play">▶</span><span class="tx"><small>' + esc(x.kicker) + '</small><h3>' + esc(x.title) + '</h3></span></a>';
        }).join('') + '</div></div></section>';
    }

    /* ---- services ---- */
    if (on('services')) {
      var sv = C.services;
      h += '<section id="services" class="dark"><div class="wrap rv">' + head('Services', sv.heading, sv.intro) + '<div class="svc">' +
        (sv.items || []).map(function (s, i) { return '<a href="#/book/' + esc(slug(s.title)) + '" data-s="' + attr(s.title) + '"><span class="n">' + String(i + 1).padStart(2, '0') + '</span><h3>' + esc(s.title) + '</h3><p>' + esc(s.text) + '</p><span class="ar">→</span></a>'; }).join('') + '</div></div></section>';
    }

    /* ---- courses ---- */
    if (on('courses')) {
      var co = C.courses;
      h += '<section id="courses"><div class="wrap rv">' + head('Courses', co.heading, co.intro) + '<div class="cards">' +
        ids(co.items).map(function (x) {
          return '<div class="card' + (x.featured ? ' feat' : '') + '" data-id="' + esc(x.id) + '"><small>' + esc(x.level) + '</small><h3>' + esc(x.title) + '</h3><p>' + esc(x.text) + '</p>' + bullets(x.bullets) +
            '<button class="btn" ' + mailAttrs('Course enrolment: ' + x.title, 'Hi ' + N + ',\n\nI\'d like to enrol in the ' + x.title + ' course.\n\nName:\nPhone:\nExperience level:\nPreferred start date:\n\nPlease send me the schedule and fees.\n\nThanks,') + '>' + esc(x.button || 'Enrol') + '</button></div>';
        }).join('') + '</div></div></section>';
    }

    /* ---- memberships ---- */
    if (on('members')) {
      var me = C.members;
      h += '<section id="members" style="padding-top:0"><div class="wrap rv">' + head('Membership', me.heading, me.intro) + '<div class="cards">' +
        ids(me.items).map(function (x) {
          return '<div class="card' + (x.featured ? ' feat' : '') + '" data-id="' + esc(x.id) + '"><small>' + esc(x.tier) + '</small><h3>' + esc(x.title) + '</h3><p>' + esc(x.text) + '</p>' + bullets(x.bullets) +
            '<button class="btn" ' + mailAttrs('Membership request: ' + x.title, 'Hi ' + N + ',\n\nI\'d like to join the ' + x.title + ' membership (' + x.tier + ').\n\nName:\nEmail:\nWhat I\'d like from the membership:\n\nPlease let me know the next steps.\n\nThanks,') + '>' + esc(x.button || 'Join') + '</button></div>';
        }).join('') + '</div></div></section>';
    }

    /* ---- store ---- */
    if (on('store')) {
      var st = C.store;
      h += '<section id="store" class="dark"><div class="wrap rv">' + head('Store', st.heading, st.intro) + '<div class="cards" id="shop">' +
        ids(st.items).map(function (x) {
          return '<div class="card" data-id="' + esc(x.id) + '"><small>' + esc(x.kind) + '</small><h3>' + esc(x.title) + '</h3><p>' + esc(x.text) + '</p>' + (x.price ? '<span class="soon">' + esc(x.price) + '</span>' : '') + '<button class="btn" data-add="' + attr(x.title) + '">Add to cart</button></div>';
        }).join('') + '</div><div class="cartbar"><span>Cart: <b id="cartCount">0</b> item(s)</span><div class="btns"><button class="btn" id="viewCart">View cart</button><button class="btn fill" id="checkout">Request these items</button></div></div></div></section>';
    }

    /* ---- blog ---- */
    if (on('blog')) {
      var bl = C.blog;
      h += '<section id="blog"><div class="wrap rv">' + head('Journal', bl.heading, bl.intro) + '<div class="posts">' +
        ids(bl.items).map(function (p) { return '<article class="post" data-post="' + esc(p.id) + '"><small>' + esc(p.category) + '</small><h3>' + esc(p.title) + '</h3><p>' + esc(p.summary) + '</p><button class="rm">Read more</button></article>'; }).join('') + '</div></div></section>';
    }

    /* ---- booking ---- */
    if (on('booking')) {
      var bk = C.booking, opts = (C.services.items || []).map(function (s) { return s.title; }).concat(['Course enquiry', 'Membership enquiry']);
      h += '<section id="book" style="padding-top:0"><div class="wrap rv">' + head('Book', bk.heading, bk.intro) +
        '<form class="book" id="bookForm"><div><label for="svc">What for</label><select id="svc">' + opts.map(function (o) { return '<option>' + esc(o) + '</option>'; }).join('') + '</select>' +
        '<label for="date">Preferred date</label><input type="date" id="date" required><label>Preferred time (EAT)</label><div class="slots" id="slots">' +
        lines(bk.slots).map(function (s) { return '<button type="button">' + esc(s) + '</button>'; }).join('') + '</div></div>' +
        '<div><label for="nm">Your name</label><input id="nm" required autocomplete="name"><label for="em">Your email</label><input id="em" type="email" required autocomplete="email">' +
        '<label for="msg">Tell ' + esc(N) + ' about the project</label><textarea id="msg" rows="4"></textarea><button class="btn fill" type="submit">Review &amp; send request</button>' +
        '<p class="note">You\'ll see the full message first and can send it by email app or Gmail.</p><div id="bookShareHost"></div></div></form></div></section>';
    }

    /* ---- contact + footer ---- */
    var ct = C.contact;
    h += '<section id="contact" class="contact"><div class="wrap rv"><div class="eyebrow">Contact</div><h2>' + em(ct.heading) + '</h2><p>' + esc(ct.text) + (C.site.location ? ' ' + esc(C.site.location) + '.' : '') + '</p>' +
      '<div class="btns"><button class="btn fill" ' + hello + '>' + esc(ct.button || 'Send a Message') + '</button>' +
      (C.site.linkedin ? '<a class="btn" href="' + esc(C.site.linkedin) + '" target="_blank" rel="noopener">Connect on LinkedIn</a>' : '') + '</div>' +
      '<div class="chips">' + (ct.chips || []).map(function (c) { return '<button ' + mailAttrs(c.subject, c.body) + '>' + esc(c.label) + '</button>'; }).join('') + '</div></div></section></main>' +
      '<footer><span>© <span id="yr"></span> ' + esc(C.site.name) + '</span><span>' + esc(C.site.footer) + '</span><a class="top" href="#top">Back to top ↑</a></footer><button id="fab" aria-label="Back to top">↑</button>' +
      (PREVIEW ? '<div class="previewbar">Draft preview · not published yet</div>' : '');

    $('#root').innerHTML = h;
    $('#yr').textContent = new Date().getFullYear();

    /* page title and sharing tags */
    BASE_TITLE = C.site.title || document.title;
    document.title = BASE_TITLE;
    var md = $('meta[name="description"]'); if (md) md.content = C.site.description || '';
    var ot = $('meta[property="og:title"]'); if (ot) ot.content = BASE_TITLE;
    var od = $('meta[property="og:description"]'); if (od) od.content = C.site.description || '';
  }

  /* ============================== BEHAVIOUR ============================== */
  function boot() {
    var RYAN_EMAIL = C.site.email || '';
    var N = C.site.mailName || 'there';

    /* toast */
    var tt;
    function toast(m) { var t = $('#toast'); t.textContent = m; t.classList.add('show'); clearTimeout(tt); tt = setTimeout(function () { t.classList.remove('show'); }, 2400); }

    /* header, progress, back-to-top, active link */
    var hdr = $('#hdr'), prog = $('#prog'), fab = $('#fab');
    var navLinks = $$('.nav-links a');
    var secs = navLinks.map(function (a) { return document.querySelector(a.hash); }).filter(Boolean);
    addEventListener('scroll', function () {
      hdr.classList.toggle('scrolled', scrollY > 40);
      fab.classList.toggle('show', scrollY > 700);
      var hh = document.documentElement.scrollHeight - innerHeight;
      prog.style.width = (hh > 0 ? scrollY / hh * 100 : 0) + '%';
      var cur = -1;
      secs.forEach(function (s, i) { if (s.getBoundingClientRect().top <= 140) cur = i; });
      navLinks.forEach(function (a, i) { a.classList.toggle('active', i === cur); });
    }, { passive: true });
    fab.addEventListener('click', function () { scrollTo({ top: 0, behavior: 'smooth' }); });

    /* mobile menu */
    var burger = $('#burger'), mMenu = $('#mMenu');
    function closeMenu() { burger.classList.remove('open'); mMenu.classList.remove('open'); document.body.classList.remove('menu-open'); burger.setAttribute('aria-expanded', 'false'); if (!$('#modal').classList.contains('open')) document.body.style.overflow = ''; }
    burger.addEventListener('click', function () {
      var open = !mMenu.classList.contains('open');
      burger.classList.toggle('open', open); mMenu.classList.toggle('open', open); document.body.classList.toggle('menu-open', open);
      burger.setAttribute('aria-expanded', open); document.body.style.overflow = open ? 'hidden' : '';
    });
    mMenu.querySelectorAll('a').forEach(function (a) { a.addEventListener('click', closeMenu); });

    /* reveal on scroll, staggered children */
    $$('.cards,.work,.posts,.focus,.show,.svc').forEach(function (c) {
      [].slice.call(c.children).forEach(function (el, i) { el.classList.add('rv'); el.dataset.st = '1'; el.style.transitionDelay = (i % 3 * 110) + 'ms'; });
    });
    var io = new IntersectionObserver(function (es) {
      es.forEach(function (e) {
        if (!e.isIntersecting) return;
        var t = e.target; t.classList.add('in'); io.unobserve(t);
        if (t.dataset.st) setTimeout(function () { t.classList.remove('rv', 'in'); t.style.transitionDelay = ''; }, 1400);
      });
    }, { threshold: 0.06 });
    $$('.rv').forEach(function (el) { io.observe(el); });

    /* shareable-link helpers */
    var SECTION = { story: 'blog', work: 'portfolio', segment: 'highlights', course: 'courses', plan: 'members', product: 'store' };
    function urlFor(path) { return location.href.split('#')[0] + '#/' + path; }
    var routeOpen = false, firstLoad = true;
    function go(path, replace) {
      var hh = '#/' + path;
      if (replace || location.hash === hh) { history.replaceState(null, '', hh); route(); } else location.hash = hh;
    }

    /* modal */
    var modal = $('#modal'), sheet = $('#sheet'), mBody = $('#mBody');
    function openModal(html, wide) { mBody.innerHTML = html; sheet.classList.toggle('wide', !!wide); modal.classList.add('open'); document.body.style.overflow = 'hidden'; sheet.scrollTop = 0; }
    function closeModalRaw() { mBody.querySelectorAll('video').forEach(function (v) { v.pause(); }); mBody.innerHTML = ''; modal.classList.remove('open'); document.body.style.overflow = ''; }
    function closeModal() {
      closeModalRaw();
      if (routeOpen) { routeOpen = false; var m = location.hash.match(/^#\/([a-z]+)\//); history.replaceState(null, '', '#' + (SECTION[m && m[1]] || 'top')); document.title = BASE_TITLE; }
    }
    $('#mClose').addEventListener('click', closeModal);
    modal.addEventListener('click', function (e) { if (e.target === modal) closeModal(); });
    addEventListener('keydown', function (e) { if (e.key === 'Escape') { closeModal(); closeMenu(); } });

    function shareHTML() { return '<div class="sharebar"><span>Share</span><button type="button" data-sh="copy">Copy link</button><button type="button" data-sh="wa">WhatsApp</button><button type="button" data-sh="native">More…</button></div>'; }
    function wireShare(path, title, root) {
      root = root || mBody;
      var get = function () { return urlFor(typeof path === 'function' ? path() : path); };
      root.querySelectorAll('[data-sh]').forEach(function (b) {
        if (b.dataset.sh === 'native' && !navigator.share) { b.remove(); return; }
        b.addEventListener('click', async function () {
          var u = get();
          if (b.dataset.sh === 'copy') { try { await navigator.clipboard.writeText(u); toast('Link copied'); } catch (e) { prompt('Copy this link', u); } }
          else if (b.dataset.sh === 'wa') window.open('https://wa.me/?text=' + encodeURIComponent(title + ' – ' + u), '_blank', 'noopener');
          else { try { await navigator.share({ title: title, url: u }); } catch (e) {} }
        });
      });
    }

    /* prefilled message panel */
    function openMail(subject, body) {
      openModal('<div class="pad"><div class="k">Message</div><h3>Send to ' + esc(N) + '</h3><p>Edit the message if you like, then send it with your email app or Gmail.</p>' +
        '<label for="mSub">Subject</label><input id="mSub"><label for="mMsg">Message</label><textarea id="mMsg" rows="10"></textarea>' +
        '<div class="acts"><a class="btn fill" id="aMail" href="#">Open email app</a><a class="btn" id="aGmail" href="#" target="_blank" rel="noopener">Open Gmail</a><button class="btn" id="aCopy" type="button">Copy message</button></div>' +
        '<p class="note">Sending to: ' + esc(RYAN_EMAIL) + '</p></div>');
      var s = $('#mSub'), m = $('#mMsg'); s.value = subject; m.value = body;
      var upd = function () {
        var su = encodeURIComponent(s.value), bo = encodeURIComponent(m.value), to = encodeURIComponent(RYAN_EMAIL);
        $('#aMail').href = 'mailto:' + RYAN_EMAIL + '?subject=' + su + '&body=' + bo;
        $('#aGmail').href = 'https://mail.google.com/mail/?view=cm&fs=1&to=' + to + '&su=' + su + '&body=' + bo;
      };
      s.addEventListener('input', upd); m.addEventListener('input', upd); upd();
      $('#aCopy').addEventListener('click', async function () {
        var txt = 'To: ' + RYAN_EMAIL + '\nSubject: ' + s.value + '\n\n' + m.value;
        try { await navigator.clipboard.writeText(txt); toast('Message copied'); } catch (e) { m.select(); document.execCommand('copy'); toast('Message copied'); }
      });
      $('#aMail').addEventListener('click', function () { toast('Opening your email app…'); });
    }
    $$('[data-mail]').forEach(function (b) {
      b.addEventListener('click', function (e) { e.preventDefault(); openMail(b.dataset.ms || 'Hello', b.dataset.mb || ''); });
    });

    /* portfolio */
    $$('.filters button').forEach(function (b) {
      b.addEventListener('click', function () {
        $$('.filters button').forEach(function (x) { x.classList.remove('on'); });
        b.classList.add('on');
        $$('.tile').forEach(function (t) { t.classList.toggle('hide', b.dataset.f !== 'all' && t.dataset.c !== b.dataset.f); });
      });
    });
    function showTile(t) {
      var title = t.dataset.title, src = t.dataset.src, yt = ytId(src), media = '';
      if (yt) media = '<div class="cover vid"><iframe src="https://www.youtube-nocookie.com/embed/' + yt + '?autoplay=1&rel=0" title="' + esc(title) + '" allow="autoplay; encrypted-media; picture-in-picture; fullscreen" allowfullscreen></iframe></div>';
      else if (t.dataset.type === 'video' && src) media = '<video class="cover" src="' + esc(src) + '" controls autoplay playsinline' + (t.dataset.poster ? ' poster="' + esc(t.dataset.poster) + '"' : '') + '></video>';
      else if (src) media = '<img class="cover" src="' + esc(src) + '" alt="' + esc(title) + '">';
      openModal(media +
        '<div class="pad"><div class="k">' + esc(t.dataset.cat) + '</div><h3>' + esc(title) + '</h3><p>' + esc(t.dataset.desc) + '</p>' +
        '<div class="acts"><button class="btn fill" id="askWork">Ask about this work</button>' + (C.sections.booking !== false ? '<button class="btn" id="hireWork">Work with ' + esc(N) + '</button>' : '') + '</div>' + shareHTML() + '</div>', true);
      $('#askWork').addEventListener('click', function () { openMail('Question about: ' + title, 'Hi ' + N + ',\n\nI saw "' + title + '" in your portfolio and would like to know more about it.\n\nThanks,'); });
      var hw = $('#hireWork'); if (hw) hw.addEventListener('click', function () { closeModal(); location.hash = '#book'; });
      wireShare('work/' + t.dataset.id, title);
    }
    $$('.tile').forEach(function (t) {
      t.addEventListener('click', function (e) { e.preventDefault(); go('work/' + t.dataset.id); });
      t.addEventListener('keydown', function (e) { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); go('work/' + t.dataset.id); } });
    });

    /* videos in tiles / portrait play (muted) only while on screen */
    var vids = $$('.tile video, .portrait video');
    if (vids.length) {
      var still = matchMedia('(prefers-reduced-motion: reduce)').matches;
      var vio = new IntersectionObserver(function (es) {
        es.forEach(function (e) { var v = e.target; if (e.isIntersecting && !still) { v.muted = true; v.play().catch(function () {}); } else v.pause(); });
      }, { threshold: 0.35 });
      vids.forEach(function (v) { v.muted = true; vio.observe(v); });
    }

    /* on-air segments */
    var SEGS = {}; ids(C.onair.items).forEach(function (s) { SEGS[s.id] = s; });
    function showSeg(key) {
      var s = SEGS[key];
      openModal('<div class="pad"><div class="k">' + esc(s.kicker) + '</div><h3>' + esc(s.title) + '</h3><p>' + esc(s.detail || s.teaser) + '</p>' +
        '<div class="acts"><button class="btn fill" id="segAsk">Ask about this segment</button>' + (C.sections.portfolio !== false ? '<button class="btn" id="segPort">See related work</button>' : '') + '</div>' + shareHTML() + '</div>');
      $('#segAsk').addEventListener('click', function () { openMail('Question about: ' + s.title, 'Hi ' + N + ',\n\nI\'d like to know more about ' + s.title + '.\n\nThanks,'); });
      var sp = $('#segPort'); if (sp) sp.addEventListener('click', function () { closeModal(); location.hash = '#portfolio'; });
      wireShare('segment/' + key, s.title);
    }
    $$('[data-open]').forEach(function (a) { a.addEventListener('click', function (e) { e.preventDefault(); go('segment/' + a.dataset.open); }); });

    /* stories */
    var POSTS = {}, ORDER = [];
    ids(C.blog.items).forEach(function (p) { POSTS[p.id] = p; ORDER.push(p.id); });
    function showPost(key) {
      var p = POSTS[key], secsArr = p.sections || [];
      var words = [p.lede || ''].concat(secsArr.map(function (x) { return [x.heading, x.body, x.bullets, x.quote].join(' '); })).join(' ').split(/\s+/).filter(Boolean).length;
      var mins = Math.max(1, Math.round(words / 200));
      var body = secsArr.map(function (x) {
        if (x.kind === 'quote') return x.quote ? '<blockquote>' + esc(x.quote) + '</blockquote>' : '';
        return (x.heading ? '<h4>' + esc(x.heading) + '</h4>' : '') + paras(x.body).map(function (t) { return '<p>' + esc(t) + '</p>'; }).join('') + (lines(x.bullets).length ? '<ul>' + lines(x.bullets).map(function (t) { return '<li>' + esc(t) + '</li>'; }).join('') + '</ul>' : '');
      }).join('');
      var i = ORDER.indexOf(key), nxt = ORDER[(i + 1) % ORDER.length], prv = ORDER[(i + ORDER.length - 1) % ORDER.length];
      var more = ORDER.length > 1;
      openModal('<div class="pad article"><div class="k">' + esc(p.category) + '</div><h3>' + esc(p.title) + '</h3><div class="meta2">' + (p.author ? '<span>By ' + esc(p.author) + '</span><span>·</span>' : '') + (p.date ? '<span>' + esc(p.date) + '</span><span>·</span>' : '') + '<span>' + mins + ' min read</span></div>' +
        (p.lede ? '<p class="lede">' + esc(p.lede) + '</p>' : '') + body +
        '<div class="acts"><button class="btn fill" id="postTalk">Discuss this story with ' + esc(N) + '</button></div>' + shareHTML() +
        (more ? '<div class="pn"><button class="btn" id="postPrev">← ' + esc(POSTS[prv].title.slice(0, 32)) + '…</button><button class="btn" id="postNext">' + esc(POSTS[nxt].title.slice(0, 32)) + '… →</button></div>' : '') + '</div>', true);
      $('#postTalk').addEventListener('click', function () { openMail('Re: ' + p.title, 'Hi ' + N + ',\n\nI read "' + p.title + '" on your site and would like to continue the conversation.\n\nThanks,'); });
      wireShare('story/' + key, p.title);
      if (more) { $('#postPrev').addEventListener('click', function () { go('story/' + prv, true); }); $('#postNext').addEventListener('click', function () { go('story/' + nxt, true); }); }
    }
    $$('[data-post]').forEach(function (a) { a.addEventListener('click', function () { go('story/' + a.dataset.post); }); });

    /* booking */
    var svcSel = $('#svc'), slot = '';
    function bookSlug() { return slug(svcSel.options[svcSel.selectedIndex].textContent); }
    if (svcSel) {
      var msgBox = $('#msg'), msgTouched = false;
      var tpl = function (v) { return 'Hi ' + N + ',\n\nI\'d like to book you for: ' + v + '.\n\nAbout the project:\n'; };
      msgBox.value = tpl(svcSel.value);
      msgBox.addEventListener('input', function () { msgTouched = true; });
      svcSel.addEventListener('change', function () {
        if (!msgTouched) msgBox.value = tpl(svcSel.value);
        if (!location.hash || /^#(\/book\/|book$)/.test(location.hash)) history.replaceState(null, '', '#/book/' + bookSlug());
      });
      $$('[data-s]').forEach(function (a) {
        a.addEventListener('click', function () {
          var v = a.dataset.s, opt = [].slice.call(svcSel.options).find(function (o) { return o.textContent === v; });
          if (opt) { svcSel.value = opt.value; if (!msgTouched) msgBox.value = tpl(v); }
        });
      });
      $$('#slots button').forEach(function (b) {
        b.addEventListener('click', function () { $$('#slots button').forEach(function (x) { x.classList.remove('on'); }); b.classList.add('on'); slot = b.textContent; });
      });
      $('#date').min = new Date().toISOString().split('T')[0];
      $('#bookShareHost').innerHTML = shareHTML();
      wireShare(function () { return 'book/' + bookSlug(); }, 'Book a session with ' + C.site.name, $('#bookShareHost'));
      $('#bookForm').addEventListener('submit', function (e) {
        e.preventDefault();
        var g = function (id) { return document.getElementById(id).value; };
        var extra = g('msg').replace(/^Hi [^\n]*,[\s\S]*?About the project:\n/, '');
        openMail('Booking request: ' + g('svc'), 'Hi ' + N + ',\n\nI\'d like to request a session.\n\nName: ' + g('nm') + '\nEmail: ' + g('em') + '\nService: ' + g('svc') + '\nDate: ' + g('date') + '\nTime: ' + (slot || 'Flexible') + ' EAT\n\nAbout the project:\n' + extra + '\n\nThanks,\n' + g('nm'));
      });
    }

    /* cart */
    var cart = [];
    function syncCart() {
      var cc = $('#cartCount'); if (cc) cc.textContent = cart.length;
      var b = $('#cartBadge'); if (b) { b.textContent = cart.length; b.classList.toggle('has', cart.length > 0); }
      $$('[data-add]').forEach(function (btn) { var on = cart.indexOf(btn.dataset.add) > -1; btn.textContent = on ? 'Added ✓ (remove)' : 'Add to cart'; btn.classList.toggle('added', on); });
    }
    $$('[data-add]').forEach(function (btn) {
      btn.addEventListener('click', function () {
        var n = btn.dataset.add, i = cart.indexOf(n);
        if (i > -1) { cart.splice(i, 1); toast('Removed from cart'); } else { cart.push(n); toast('Added to cart'); }
        syncCart();
      });
    });
    function checkout() {
      if (!cart.length) { toast('Your cart is empty'); return; }
      openMail('Store request', 'Hi ' + N + ',\n\nI\'d like to get the following:\n' + cart.map(function (c) { return '- ' + c; }).join('\n') + '\n\nPlease send me the prices and how to pay.\n\nName:\n\nThanks,');
    }
    function showCart() {
      if (!cart.length) { openModal('<div class="pad"><div class="k">Cart</div><h3>Your cart is empty</h3><p>Add a template or guide from the store.</p><div class="acts"><a class="btn fill" href="#store" id="goStore">Go to store</a></div></div>'); $('#goStore').addEventListener('click', closeModal); return; }
      openModal('<div class="pad"><div class="k">Cart</div><h3>Your items</h3><ul class="cartlist">' + cart.map(function (c, i) { return '<li><span>' + esc(c) + '</span><button data-rm="' + i + '">Remove</button></li>'; }).join('') +
        '</ul><div class="acts"><button class="btn fill" id="cartSend">Request these items</button><button class="btn" id="cartClose">Keep browsing</button></div></div>');
      $$('[data-rm]').forEach(function (b) { b.addEventListener('click', function () { cart.splice(+b.dataset.rm, 1); syncCart(); showCart(); }); });
      $('#cartSend').addEventListener('click', checkout); $('#cartClose').addEventListener('click', closeModal);
    }
    var co = $('#checkout'); if (co) { co.addEventListener('click', checkout); $('#viewCart').addEventListener('click', showCart); }
    var cb = $('#cartBtn'); if (cb) cb.addEventListener('click', showCart);
    syncCart();

    /* detail pages for courses, memberships and products */
    var CARD_TYPES = { courses: 'course', members: 'plan', store: 'product' };
    Object.keys(CARD_TYPES).forEach(function (sec) {
      var type = CARD_TYPES[sec];
      $$('#' + sec + ' .card').forEach(function (card) {
        card.dataset.route = type + '/' + card.dataset.id;
        var b = document.createElement('button'); b.type = 'button'; b.className = 'dl'; b.textContent = 'Details & share';
        b.addEventListener('click', function () { go(card.dataset.route); });
        card.appendChild(b);
      });
    });
    function showCard(type, id) {
      var card = document.querySelector('[data-route="' + type + '/' + id + '"]');
      var kicker = card.querySelector('small').textContent, title = card.querySelector('h3').textContent, desc = card.querySelector('p').textContent;
      var bl = [].slice.call(card.querySelectorAll('li')).map(function (l) { return l.textContent; });
      var price = card.querySelector('.soon'), main = card.querySelector('.btn'), isProd = type === 'product';
      openModal('<div class="pad article"><div class="k">' + esc(kicker) + '</div><h3>' + esc(title) + '</h3><p class="lede">' + esc(desc) + '</p>' +
        (bl.length ? '<h4>What\'s included</h4><ul>' + bl.map(function (x) { return '<li>' + esc(x) + '</li>'; }).join('') + '</ul>' : '') +
        (price ? '<p><strong>' + esc(price.textContent) + '</strong></p>' : '') +
        '<div class="acts"><button class="btn fill" id="cdMain">' + (isProd ? 'Add to cart' : esc(main.textContent)) + '</button><button class="btn" id="cdAsk">' + (isProd ? 'Ask about price' : 'Ask a question') + '</button></div>' + shareHTML() + '</div>', true);
      $('#cdMain').addEventListener('click', function () { if (isProd) card.querySelector('[data-add]').click(); else main.click(); });
      $('#cdAsk').addEventListener('click', function () { openMail('Question about: ' + title, 'Hi ' + N + ',\n\nI have a question about "' + title + '".\n\nLink: ' + urlFor(type + '/' + id) + '\n\nThanks,'); });
      wireShare(type + '/' + id, title);
    }

    /* router: every item has its own link */
    function route() {
      var m = location.hash.match(/^#\/([a-z]+)\/([a-z0-9-]+)$/);
      if (!m) { if (routeOpen) { routeOpen = false; closeModalRaw(); document.title = BASE_TITLE; } firstLoad = false; return; }
      var type = m[1], id = m[2], title = '';
      if (type === 'book') {
        var opt = svcSel && [].slice.call(svcSel.options).find(function (o) { return slug(o.textContent) === id; });
        if (opt) {
          if (routeOpen) { routeOpen = false; closeModalRaw(); document.title = BASE_TITLE; }
          svcSel.value = opt.value; svcSel.dispatchEvent(new Event('change'));
          history.replaceState(null, '', '#/book/' + id);
          $('#book').scrollIntoView({ behavior: firstLoad ? 'instant' : 'smooth' });
        }
        firstLoad = false; return;
      }
      var tile = type === 'work' && $$('.tile').find(function (x) { return x.dataset.id === id; });
      if (type === 'story' && POSTS[id]) { showPost(id); title = POSTS[id].title; }
      else if (tile) { showTile(tile); title = tile.dataset.title; }
      else if (type === 'segment' && SEGS[id]) { showSeg(id); title = SEGS[id].title; }
      else if (Object.keys(CARD_TYPES).some(function (k) { return CARD_TYPES[k] === type; }) && document.querySelector('[data-route="' + type + '/' + id + '"]')) { showCard(type, id); title = document.querySelector('[data-route="' + type + '/' + id + '"] h3').textContent; }
      else { if (routeOpen) { routeOpen = false; closeModalRaw(); } history.replaceState(null, '', location.pathname + location.search); firstLoad = false; return; }
      routeOpen = true; document.title = title + ' | ' + C.site.name;
      if (firstLoad) { var sec = document.getElementById(SECTION[type]); if (sec) sec.scrollIntoView({ behavior: 'instant' }); }
      firstLoad = false;
    }
    addEventListener('hashchange', route);
    route();

    heroEffects();
  }

  /* ---------- hero: timecode, spotlight, tilt, magnetic buttons, parallax, slideshow/video ---------- */
  function heroEffects() {
    var hero = $('#hero'), vf = $('#vf'), tc = $('#tc');
    var calm = matchMedia('(prefers-reduced-motion: reduce)').matches;
    var fine = matchMedia('(hover:hover) and (pointer:fine)').matches;
    var vis = true;
    new IntersectionObserver(function (es) { vis = es[0].isIntersecting; }).observe(hero);
    var p2 = function (n) { return String(n).padStart(2, '0'); };
    (function tick() {
      if (vis) { var d = new Date(); tc.textContent = p2(d.getHours()) + ':' + p2(d.getMinutes()) + ':' + p2(d.getSeconds()) + ':' + p2(Math.floor(d.getMilliseconds() / 40)); }
      requestAnimationFrame(tick);
    })();
    if (fine && !calm) {
      hero.addEventListener('pointermove', function (e) {
        var r = hero.getBoundingClientRect(), x = (e.clientX - r.left) / r.width, y = (e.clientY - r.top) / r.height;
        hero.style.setProperty('--mx', (x * 100) + '%'); hero.style.setProperty('--my', (y * 100) + '%');
        vf.style.setProperty('--ry', ((x - 0.5) * 10) + 'deg'); vf.style.setProperty('--rx', ((0.5 - y) * 8) + 'deg');
      });
      hero.addEventListener('pointerleave', function () { vf.style.setProperty('--ry', '0deg'); vf.style.setProperty('--rx', '0deg'); });
      $$('.hero .btn, .pill, .cartbtn, .filters button').forEach(function (b) {
        b.addEventListener('pointermove', function (e) { var r = b.getBoundingClientRect(); b.style.transform = 'translate(' + ((e.clientX - r.left - r.width / 2) * 0.22) + 'px,' + ((e.clientY - r.top - r.height / 2) * 0.3) + 'px)'; });
        b.addEventListener('pointerleave', function () { b.style.transform = ''; });
      });
      var sl = $('#slides');
      addEventListener('scroll', function () { if (sl && scrollY < innerHeight * 1.3) sl.style.setProperty('--py', (-Math.min(scrollY * 0.06, 40)) + 'px'); }, { passive: true });
    }

    /* slideshow / video inside the frame */
    var slides = $$('#slides .slide'), dots = $$('.sdots button');
    if (!slides.length) return;
    var secs = Math.max(2, +C.hero.interval || 6) * 1000, cur = 0, timer = null, visible = true;
    var vid = function (i) { return slides[i].querySelector('video'); };
    slides.forEach(function (s, i) {
      var v = s.querySelector('video');
      if (v) { v.muted = true; v.setAttribute('muted', ''); v.addEventListener('error', function () { if (cur === i && slides.length > 1) next(); }); }
    });
    function paint(n) {
      cur = n;
      slides.forEach(function (s, i) { s.classList.toggle('on', i === n); });
      dots.forEach(function (d, i) { d.classList.toggle('on', i === n); });
      slides.forEach(function (s, i) { var v = vid(i); if (v && i !== n) setTimeout(function () { if (cur !== i) v.pause(); }, 1300); });
    }
    function play(n) {
      clearTimeout(timer); paint(n);
      var v = vid(n);
      if (slides.length < 2) { if (v && !calm && visible) v.play().catch(function () {}); return; }
      if (v) { try { v.currentTime = 0; } catch (e) {} v.onended = next; v.play().catch(function () {}); timer = setTimeout(next, 30000); }
      else timer = setTimeout(next, secs);
    }
    function next() { play((cur + 1) % slides.length); }
    dots.forEach(function (d, i) { d.addEventListener('click', function () { play(i); }); });
    paint(0);
    if (calm) return;
    new IntersectionObserver(function (es) {
      visible = es[0].isIntersecting;
      if (!visible) { clearTimeout(timer); var v = vid(cur); if (v) v.pause(); } else play(cur);
    }).observe(hero);
  }

  /* ============================== START ============================== */
  function ready() {
    var wait = Math.max(0, 1500 - (Date.now() - T0));
    setTimeout(function () { document.body.classList.add('ready'); }, wait);
  }
  setTimeout(function () { document.body.classList.add('ready'); }, 7000);   // failsafe

  Store.loadContent({ preview: PREVIEW, timeout: 3000 }).then(function (c) {
    C = c; render(); boot(); ready();
  }).catch(function (e) {
    console.error(e);
    C = Store.merge(JSON.parse(JSON.stringify(window.DEFAULT_CONTENT)), {}); render(); boot(); ready();
  });
})();
