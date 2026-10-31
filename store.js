/* Shared data layer for the public site and the admin page.
   Talks to Supabase over plain REST (no libraries). With no config it runs in demo mode (browser only). */
(function () {
  'use strict';
  var cfg = window.SITE_CONFIG || {};
  var URL_ = (cfg.supabaseUrl || '').replace(/\/+$/, '');
  var KEY = cfg.supabaseAnonKey || '';
  var remote = !!(URL_ && KEY);
  var K = { pub: 'rs_content_v1', draft: 'rs_draft_v1', sess: 'rs_session_v1' };

  function lsGet(k) { try { return JSON.parse(localStorage.getItem(k)); } catch (e) { return null; } }
  function lsSet(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); return true; } catch (e) { return false; } }
  function lsDel(k) { try { localStorage.removeItem(k); } catch (e) {} }
  function isObj(v) { return v && typeof v === 'object' && !Array.isArray(v); }
  function clone(v) { return JSON.parse(JSON.stringify(v)); }
  function merge(d, c) {
    if (!isObj(d) || !isObj(c)) return c === undefined ? d : c;
    var o = {}, k;
    for (k in d) o[k] = d[k];
    for (k in c) o[k] = (k in d) ? merge(d[k], c[k]) : c[k];
    return o;
  }
  function slug(s) {
    return String(s || '').toLowerCase().replace(/&amp;|&/g, 'and').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
  }

  /* ---------- reading ---------- */
  async function fetchRemote(timeoutMs) {
    var ctl = new AbortController();
    var t = setTimeout(function () { ctl.abort(); }, timeoutMs || 3000);
    try {
      var r = await fetch(URL_ + '/rest/v1/site_content?id=eq.main&select=data', {
        headers: { apikey: KEY, Authorization: 'Bearer ' + KEY }, signal: ctl.signal, cache: 'no-store'
      });
      if (!r.ok) return null;
      var j = await r.json();
      return (j && j[0] && j[0].data) || null;
    } catch (e) { return null; } finally { clearTimeout(t); }
  }

  /* what visitors see */
  async function loadContent(opts) {
    opts = opts || {};
    var def = clone(window.DEFAULT_CONTENT);
    if (opts.preview) { var dr = lsGet(K.draft); if (dr) return merge(def, dr); }
    var data = null;
    if (remote) {
      data = await fetchRemote(opts.timeout);
      if (data) lsSet(K.pub, data); else data = lsGet(K.pub);
    } else data = lsGet(K.pub);
    return merge(def, data || {});
  }

  /* what the admin edits: the latest published copy (never the cache when online) */
  async function loadPublished() {
    var def = clone(window.DEFAULT_CONTENT);
    var data = null;
    if (remote) { data = await fetchRemote(6000); if (!data) data = lsGet(K.pub); } else data = lsGet(K.pub);
    return merge(def, data || {});
  }

  /* ---------- auth ---------- */
  function getSession() { return lsGet(K.sess); }
  function saveSession(j) {
    var s = {
      access_token: j.access_token, refresh_token: j.refresh_token,
      expires_at: j.expires_at || Math.floor(Date.now() / 1000) + (j.expires_in || 3600),
      email: (j.user && j.user.email) || (getSession() || {}).email || ''
    };
    lsSet(K.sess, s); return s;
  }
  async function login(email, password) {
    var r = await fetch(URL_ + '/auth/v1/token?grant_type=password', {
      method: 'POST', headers: { 'Content-Type': 'application/json', apikey: KEY },
      body: JSON.stringify({ email: email, password: password })
    });
    var j = await r.json().catch(function () { return {}; });
    if (!r.ok) throw new Error(j.error_description || j.msg || j.message || 'Login failed');
    return saveSession(j);
  }
  function logout() { lsDel(K.sess); }
  async function token() {
    var s = getSession();
    if (!s) return null;
    if (s.expires_at - 60 > Date.now() / 1000) return s.access_token;
    try {
      var r = await fetch(URL_ + '/auth/v1/token?grant_type=refresh_token', {
        method: 'POST', headers: { 'Content-Type': 'application/json', apikey: KEY },
        body: JSON.stringify({ refresh_token: s.refresh_token })
      });
      if (!r.ok) { lsDel(K.sess); return null; }
      return saveSession(await r.json()).access_token;
    } catch (e) { return s.access_token; }
  }
  async function isLoggedIn() { return remote ? !!(await token()) : true; }

  /* ---------- writing ---------- */
  async function save(content) {
    if (!remote) { if (!lsSet(K.pub, content)) throw new Error('This browser has no room left to save. Use smaller images.'); return; }
    var tk = await token();
    if (!tk) throw new Error('Your login expired. Please log in again.');
    var r = await fetch(URL_ + '/rest/v1/site_content?on_conflict=id', {
      method: 'POST',
      headers: { apikey: KEY, Authorization: 'Bearer ' + tk, 'Content-Type': 'application/json', Prefer: 'resolution=merge-duplicates,return=minimal' },
      body: JSON.stringify({ id: 'main', data: content, updated_at: new Date().toISOString() })
    });
    if (!r.ok) {
      throw new Error(r.status === 401 || r.status === 403
        ? 'Not allowed: this account is not an admin, or the login expired.'
        : 'Save failed (' + r.status + '). Try again.');
    }
    lsSet(K.pub, content);
  }

  /* shrink big photos before uploading (keeps the site fast) */
  function shrink(file, maxSide, quality) {
    return new Promise(function (resolve) {
      if (!/^image\/(jpeg|png|webp)$/.test(file.type)) return resolve(file);
      var img = new Image(), u = URL.createObjectURL(file);
      img.onload = function () {
        URL.revokeObjectURL(u);
        var w = img.naturalWidth, h = img.naturalHeight, m = Math.max(w, h);
        if (m <= maxSide) return resolve(file);
        var s = maxSide / m, c = document.createElement('canvas');
        c.width = Math.round(w * s); c.height = Math.round(h * s);
        c.getContext('2d').drawImage(img, 0, 0, c.width, c.height);
        c.toBlob(function (b) { resolve(b || file); }, 'image/jpeg', quality);
      };
      img.onerror = function () { URL.revokeObjectURL(u); resolve(file); };
      img.src = u;
    });
  }
  function toDataURL(blob) {
    return new Promise(function (res, rej) { var f = new FileReader(); f.onload = function () { res(f.result); }; f.onerror = rej; f.readAsDataURL(blob); });
  }

  /* uploads a photo or video, returns its public URL */
  async function upload(file, onProgress) {
    var isVideo = /^video\//.test(file.type);
    if (!remote) {
      if (isVideo) throw new Error('Video upload needs the Supabase connection. For now, paste a video link instead.');
      var small = await shrink(file, 1600, 0.85);
      return toDataURL(small);
    }
    var tk = await token();
    if (!tk) throw new Error('Your login expired. Please log in again.');
    var blob = isVideo ? file : await shrink(file, 2200, 0.88);
    var ext = (file.name.match(/\.([a-z0-9]+)$/i) || [, ''])[1].toLowerCase();
    if (blob !== file && blob.type === 'image/jpeg') ext = 'jpg';
    var base = slug(file.name.replace(/\.[^.]+$/, '')) || 'file';
    var path = Date.now().toString(36) + '-' + Math.random().toString(36).slice(2, 6) + '-' + base + (ext ? '.' + ext : '');
    await new Promise(function (resolve, reject) {
      var x = new XMLHttpRequest();
      x.open('POST', URL_ + '/storage/v1/object/media/' + path);
      x.setRequestHeader('apikey', KEY);
      x.setRequestHeader('Authorization', 'Bearer ' + tk);
      x.setRequestHeader('x-upsert', 'false');
      x.setRequestHeader('Content-Type', blob.type || file.type || 'application/octet-stream');
      x.upload.onprogress = function (e) { if (onProgress && e.lengthComputable) onProgress(e.loaded / e.total); };
      x.onload = function () {
        if (x.status >= 200 && x.status < 300) return resolve();
        reject(new Error(x.status === 413 ? 'That file is too big. Supabase allows up to 50 MB; compress it first.'
          : (x.status === 401 || x.status === 403) ? 'Not allowed to upload. Log in again.' : 'Upload failed (' + x.status + ').'));
      };
      x.onerror = function () { reject(new Error('Upload failed. Check your internet connection.')); };
      x.send(blob);
    });
    return URL_ + '/storage/v1/object/public/media/' + path;
  }

  window.Store = {
    remote: remote, merge: merge, clone: clone, slug: slug,
    loadContent: loadContent, loadPublished: loadPublished,
    getDraft: function () { return lsGet(K.draft); },
    saveDraft: function (c) { return lsSet(K.draft, c); },
    clearDraft: function () { lsDel(K.draft); },
    getSession: getSession, login: login, logout: logout, isLoggedIn: isLoggedIn,
    save: save, upload: upload
  };
})();
