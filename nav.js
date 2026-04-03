/**
 * nav.js — Global navigation bar + shared recipe action functions.
 * Load AFTER recipes.js. Works from root (index.html) and recettes/*.html.
 */

// ── Supabase config — edit these when you have your credentials ──────────────
// Get from: supabase.com → your project → Settings → API
window.SUPABASE_URL  = 'https://uqdyllxyvstgeaeycsxx.supabase.co';   // https://xxxx.supabase.co
window.SUPABASE_ANON = 'sb_publishable_9Ak9MPrC8iYcBGeiqo0c3A_1Lr9m6EG';
// ─────────────────────────────────────────────────────────────────────────────

(function () {
  'use strict';

  var isRecipe = /\/recettes\//.test(location.pathname);
  var root = isRecipe ? '../' : '';
  var recipeIdMeta = document.querySelector('meta[name="recipe-id"]');
  var PAGE_ID = recipeIdMeta ? recipeIdMeta.content : null;
  var _navEditId = null;

  // ── Auth ─────────────────────────────────────────────────────────────────────
  var _session = (function () {
    try { return JSON.parse(localStorage.getItem('sbSession')) || null; }
    catch (e) { return null; }
  })();

  window._authUser  = function () { return _session && _session.user  || null; };
  window._authToken = function () { return _session && _session.access_token || null; };

  function _supaReady() {
    return !!(window.SUPABASE_URL && window.SUPABASE_URL !== 'YOUR_SUPABASE_URL');
  }
  function _saveSession(s) {
    _session = s;
    if (s) localStorage.setItem('sbSession', JSON.stringify(s));
    else   localStorage.removeItem('sbSession');
  }
  function _sbPost(path, body) {
    return fetch(window.SUPABASE_URL + path, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'apikey': window.SUPABASE_ANON },
      body: JSON.stringify(body)
    }).then(function (r) {
      return r.json().then(function (d) {
        if (!r.ok) throw new Error(d.error_description || d.msg || d.message || 'Auth error ' + r.status);
        return d;
      });
    });
  }

  window.openAuthModal = function (tab) {
    var t = tab || 'signin';
    ['signin', 'signup'].forEach(function (x) {
      document.getElementById('authTab_' + x).classList.toggle('active', x === t);
      document.getElementById('authForm_' + x).style.display = x === t ? 'block' : 'none';
    });
    document.getElementById('authErr').style.display = 'none';
    document.getElementById('authModal').style.display = 'flex';
    setTimeout(function () {
      var el = document.getElementById(t === 'signin' ? 'authEmail' : 'authSignupEmail');
      if (el) el.focus();
    }, 80);
  };

  window.authSignIn = function () {
    if (!_supaReady()) { _showAuthErr('Supabase not configured in nav.js yet.'); return; }
    var email = document.getElementById('authEmail').value.trim();
    var pass  = document.getElementById('authPassword').value;
    if (!email || !pass) { _showAuthErr('Email and password required.'); return; }
    var btn = document.getElementById('authSigninBtn');
    btn.textContent = 'Signing in\u2026'; btn.disabled = true;
    document.getElementById('authErr').style.display = 'none';
    _sbPost('/auth/v1/token?grant_type=password', { email: email, password: pass })
      .then(function (d) {
        _saveSession(d); closeModal('authModal'); _updateAuthBar(); _pullFromSupabase();
      })
      .catch(function (e) { _showAuthErr(e.message); })
      .finally(function () { btn.textContent = 'Sign in'; btn.disabled = false; });
  };

  window.authSignUp = function () {
    if (!_supaReady()) { _showAuthErr('Supabase not configured in nav.js yet.'); return; }
    var email = document.getElementById('authSignupEmail').value.trim();
    var pass  = document.getElementById('authSignupPass').value;
    var pass2 = document.getElementById('authSignupPass2').value;
    if (!email || !pass) { _showAuthErr('Email and password required.'); return; }
    if (pass !== pass2)  { _showAuthErr('Passwords do not match.'); return; }
    if (pass.length < 8) { _showAuthErr('Password must be at least 8 characters.'); return; }
    var btn = document.getElementById('authSignupBtn');
    btn.textContent = 'Creating account\u2026'; btn.disabled = true;
    document.getElementById('authErr').style.display = 'none';
    _sbPost('/auth/v1/signup', { email: email, password: pass })
      .then(function (d) {
        if (d.access_token) {
          _saveSession(d); closeModal('authModal'); _updateAuthBar(); _pushStarterRecipes();
        } else {
          var el = document.getElementById('authErr');
          el.style.color = 'var(--green)';
          el.textContent = '\u2713 Account created! Check your email to confirm, then sign in.';
          el.style.display = 'block';
        }
      })
      .catch(function (e) { _showAuthErr(e.message); })
      .finally(function () { btn.textContent = 'Create account'; btn.disabled = false; });
  };

  window.authSignOut = function () {
    if (_session && _supaReady()) {
      fetch(window.SUPABASE_URL + '/auth/v1/logout', {
        method: 'POST',
        headers: { 'apikey': window.SUPABASE_ANON, 'Authorization': 'Bearer ' + _session.access_token }
      }).catch(function () {});
    }
    _saveSession(null); _updateAuthBar();
  };

  function _showAuthErr(msg) {
    var el = document.getElementById('authErr');
    el.style.color = '#c0392b'; el.textContent = msg; el.style.display = 'block';
  }

  function _updateAuthBar() {
    var sinEl = document.getElementById('gbSignIn');
    var usEl  = document.getElementById('gbUser');
    if (!sinEl || !usEl) return;
    var user = _session && _session.user;
    if (user) {
      var ini = (user.email || 'U').charAt(0).toUpperCase();
      sinEl.style.display = 'none'; usEl.style.display = 'flex';
      usEl.innerHTML =
        '<span class="gb-avatar" title="' + (user.email || '') + '">' + ini + '</span>' +
        '<button class="gb-signout-btn" onclick="authSignOut()">Sign out</button>';
    } else {
      sinEl.style.display = 'flex'; usEl.style.display = 'none'; usEl.innerHTML = '';
    }
  }

  // ── Starter recipes ──────────────────────────────────────────────────────────
  var _STARTERS = [
    { name: 'Classic French Onion Soup', description: 'Deeply flavoured starter with caramelized onions, beef broth, and a Gruyère crouton.', category: 'starter', servings: '4 servings', prepTime: '10 min', cookTime: '1h', ingredients: ['6 large yellow onions, thinly sliced', '50g butter', '1 tbsp olive oil', '1.5L beef or vegetable stock', '200ml dry white wine', '1 tsp sugar', '4 slices sourdough', '120g Gruyère, grated', 'Salt, black pepper'], instructions: ['Melt butter and oil over low heat. Add onions and a pinch of salt. Cook 45–50 min, stirring often, until deeply golden.', 'Add sugar, stir 1 min. Add wine, scrape the bottom, cook 3 min. Add stock, simmer 15 min. Season.', 'Toast bread, top with Gruyère and grill until bubbling. Float on each bowl of soup.'], tags: ['vegetarian', 'french', 'winter', 'soup'] },
    { name: 'Cauliflower Soup · curry · coconut', description: 'Velvety roasted cauliflower with warming curry spices and coconut milk.', category: 'starter', servings: '4 servings', prepTime: '10 min', cookTime: '35 min', ingredients: ['1 large cauliflower, cut into florets', '1 onion, diced', '3 garlic cloves', '2 tsp curry powder', '400ml coconut milk', '700ml vegetable stock', '3 tbsp olive oil', 'Fresh coriander', 'Salt, black pepper'], instructions: ['Preheat 200°C. Toss cauliflower with 2 tbsp oil + salt. Roast 25 min until golden.', 'Sauté onion in 1 tbsp oil 5 min. Add garlic and curry powder, cook 1 min. Add cauliflower, stock, coconut milk. Simmer 10 min. Blend until smooth. Season.', 'Serve topped with coriander and reserved roasted florets.'], tags: ['vegetarian', 'vegan', 'soup', 'winter'] },
    { name: 'Roasted Salmon · miso glaze', description: 'Quick weeknight main: miso-glazed salmon roasted in 12 minutes.', category: 'main', servings: '2 servings', prepTime: '5 min', cookTime: '12 min', ingredients: ['2 salmon fillets (180g each)', '2 tbsp white miso', '1 tbsp honey', '1 tbsp soy sauce', '1 tsp sesame oil', '1 tsp fresh ginger, grated', '1 tbsp sesame seeds', '2 spring onions'], instructions: ['Preheat oven to 220°C. Mix miso, honey, soy sauce, sesame oil and ginger into a glaze.', 'Spread glaze over salmon fillets. Roast 10–12 min until caramelized and just cooked through. Scatter sesame seeds and sliced spring onions.'], tags: ['fish', 'japanese', 'quick'] },
    { name: 'Mushroom Risotto · parmesan · thyme', description: 'Classic creamy risotto with mixed mushrooms. A satisfying vegetarian main.', category: 'main', servings: '4 servings', prepTime: '10 min', cookTime: '30 min', ingredients: ['350g Arborio rice', '300g mixed mushrooms (cremini, porcini)', '1 shallot, diced', '2 garlic cloves', '150ml dry white wine', '1.2L warm vegetable stock', '80g Parmesan, grated', '50g butter', '3 tbsp olive oil', 'Fresh thyme', 'Salt, pepper'], instructions: ['Sauté mushrooms in 2 tbsp oil over high heat until golden, 5–6 min. Season. Set aside.', 'Soften shallot in 1 tbsp oil + half the butter. Add garlic and rice, toast 2 min. Add wine, stir until absorbed.', 'Add warm stock one ladle at a time, stirring constantly, 18–20 min total. Off heat stir in remaining butter and Parmesan. Fold in mushrooms. Season.'], tags: ['vegetarian', 'italian', 'comfort'] },
    { name: 'Green Lentil Salad · herbs · lemon', description: 'Bright, protein-rich side that pairs with anything. Great made ahead.', category: 'side', servings: '4 servings', prepTime: '10 min', cookTime: '25 min', ingredients: ['300g Puy lentils', '1 shallot, finely diced', '4 tbsp olive oil', '2 tbsp red wine vinegar', '1 lemon, zest and juice', 'Large handful flat-leaf parsley', 'Fresh mint leaves', 'Salt, black pepper'], instructions: ['Simmer lentils in salted water 20–25 min until just tender. Drain.', 'While warm, toss with shallot, olive oil, vinegar, lemon zest and juice. Season generously.', 'Fold in herbs just before serving.'], tags: ['vegetarian', 'vegan', 'salad', 'make-ahead'] },
    { name: 'Tabbouleh · bulgur · fresh herbs', description: 'Herb-forward Lebanese-style side with lemon and good olive oil.', category: 'side', servings: '4 servings', prepTime: '20 min', cookTime: '0 min', ingredients: ['100g fine bulgur wheat', '150g flat-leaf parsley', 'Small bunch fresh mint', '4 ripe tomatoes, finely diced', '3 spring onions, finely sliced', 'Juice of 2 lemons', '4 tbsp good olive oil', 'Salt, black pepper'], instructions: ['Pour boiling water over bulgur to just cover. Cover and soak 15–20 min until tender. Drain and squeeze dry.', 'Finely chop parsley and mint — herbs should be the star.', 'Combine bulgur, tomatoes, spring onions and herbs. Dress with lemon juice and olive oil. Season generously. Rest 10 min before serving.'], tags: ['vegetarian', 'vegan', 'lebanese', 'summer'] }
  ];

  function _pushStarterRecipes() {
    // Load into localStorage immediately so user sees them right away
    _STARTERS.forEach(function (r) {
      var id = 'starter-' + Date.now() + '-' + Math.floor(Math.random() * 9999);
      set(id, Object.assign({}, r, { saved: true, custom: true, rating: 0, note: '', createdAt: Date.now() }));
    });
    window._updateGlobalBar && window._updateGlobalBar();
    window._onNavAction && window._onNavAction('add');

    if (!_supaReady() || !_session) return;
    var uid = _session.user.id, tok = _session.access_token;
    var rows = [];
    var local = getAll();
    Object.keys(local).forEach(function (id) {
      var r = local[id];
      if (r && r.name) rows.push({ user_id: uid, local_id: id, name: r.name, description: r.description || '', servings: r.servings || '', prep_time: r.prepTime || '', cook_time: r.cookTime || '', ingredients: r.ingredients || [], instructions: r.instructions || [], tags: r.tags || [], category: r.category || 'main', rating: r.rating || 0, note: r.note || '', saved: true, custom: true });
    });
    _STARTERS.forEach(function (r) {
      rows.push({ user_id: uid, local_id: null, name: r.name, description: r.description || '', servings: r.servings || '', prep_time: r.prepTime || '', cook_time: r.cookTime || '', ingredients: r.ingredients || [], instructions: r.instructions || [], tags: r.tags || [], category: r.category, rating: 0, note: '', saved: true, custom: true });
    });
    if (!rows.length) return;
    fetch(window.SUPABASE_URL + '/rest/v1/user_recipes', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'apikey': window.SUPABASE_ANON, 'Authorization': 'Bearer ' + tok, 'Prefer': 'return=minimal' },
      body: JSON.stringify(rows)
    }).catch(function (e) { console.warn('Supabase push error', e); });
  }

  function _pullFromSupabase() {
    if (!_supaReady() || !_session) return;
    var tok = _session.access_token;
    fetch(window.SUPABASE_URL + '/rest/v1/user_recipes?select=*&order=created_at.asc', {
      headers: { 'apikey': window.SUPABASE_ANON, 'Authorization': 'Bearer ' + tok }
    })
      .then(function (r) { return r.json(); })
      .then(function (rows) {
        if (!Array.isArray(rows) || !rows.length) return;
        var changed = false;
        rows.forEach(function (r) {
          var lid = r.local_id || ('sb-' + r.id.slice(0, 8));
          if (!get(lid).name) {
            set(lid, { name: r.name, description: r.description || '', servings: r.servings || '', prepTime: r.prep_time || '', cookTime: r.cook_time || '', ingredients: r.ingredients || [], instructions: r.instructions || [], tags: r.tags || [], category: r.category || 'main', rating: r.rating || 0, note: r.note || '', saved: true, custom: true, createdAt: new Date(r.created_at).getTime() });
            changed = true;
          }
        });
        if (changed) {
          window._updateGlobalBar && window._updateGlobalBar();
          window._onNavAction && window._onNavAction('add');
        }
      })
      .catch(function (e) { console.warn('Supabase pull error', e); });
    _pullPlansFromSupabase();
  }

  function _pullPlansFromSupabase() {
    if (!_supaReady() || !_session) return;
    var tok = _session.access_token;
    fetch(window.SUPABASE_URL + '/rest/v1/user_plans?select=*&order=week_key.desc', {
      headers: { 'apikey': window.SUPABASE_ANON, 'Authorization': 'Bearer ' + tok }
    })
      .then(function (r) { return r.json(); })
      .then(function (rows) {
        if (!Array.isArray(rows)) return;
        rows.forEach(function (r) {
          var key = 'weekPlan_' + r.week_key;
          if (!localStorage.getItem(key)) {
            localStorage.setItem(key, JSON.stringify({
              slots:     r.slots     || {},
              notes:     r.notes     || '',
              createdAt: new Date(r.created_at).getTime(),
              updatedAt: new Date(r.updated_at).getTime()
            }));
          }
        });
      })
      .catch(function (e) { console.warn('Plans pull error', e); });
  }

  function _syncRecipe(localId, data) {
    if (!_supaReady() || !_session) return;
    var tok = _session.access_token, uid = _session.user.id;
    var body = { name: data.name, description: data.description || '', servings: data.servings || '', prep_time: data.prepTime || '', cook_time: data.cookTime || '', ingredients: data.ingredients || [], instructions: data.instructions || [], tags: data.tags || [], category: data.category || 'main', rating: data.rating || 0, note: data.note || '', updated_at: new Date().toISOString() };
    fetch(window.SUPABASE_URL + '/rest/v1/user_recipes?local_id=eq.' + encodeURIComponent(localId), {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', 'apikey': window.SUPABASE_ANON, 'Authorization': 'Bearer ' + tok, 'Prefer': 'return=representation' },
      body: JSON.stringify(body)
    })
      .then(function (r) { return r.json(); })
      .then(function (rows) {
        if (!rows || !rows.length) {
          fetch(window.SUPABASE_URL + '/rest/v1/user_recipes', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'apikey': window.SUPABASE_ANON, 'Authorization': 'Bearer ' + tok, 'Prefer': 'return=minimal' },
            body: JSON.stringify(Object.assign({ user_id: uid, local_id: localId, saved: true, custom: true }, body))
          }).catch(function (e) { console.warn(e); });
        }
      })
      .catch(function (e) { console.warn('Sync error', e); });
  }

  window._syncPlan = function (weekKey, planData) {
    if (!_supaReady() || !_session) return;
    var tok = _session.access_token, uid = _session.user.id;
    var body = { slots: planData.slots || {}, notes: planData.notes || '', updated_at: new Date().toISOString() };
    fetch(window.SUPABASE_URL + '/rest/v1/user_plans?user_id=eq.' + uid + '&week_key=eq.' + encodeURIComponent(weekKey), {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', 'apikey': window.SUPABASE_ANON, 'Authorization': 'Bearer ' + tok, 'Prefer': 'return=representation' },
      body: JSON.stringify(body)
    })
      .then(function (r) { return r.json(); })
      .then(function (rows) {
        if (!rows || !rows.length) {
          fetch(window.SUPABASE_URL + '/rest/v1/user_plans', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'apikey': window.SUPABASE_ANON, 'Authorization': 'Bearer ' + tok, 'Prefer': 'return=minimal' },
            body: JSON.stringify(Object.assign({ user_id: uid, week_key: weekKey }, body))
          }).catch(function (e) { console.warn('Plan insert error', e); });
        }
      })
      .catch(function (e) { console.warn('Plan sync error', e); });
  };

  // ── Global bar ──────────────────────────────────────────────────────────────

  function renderGlobalBar() {
    var count = getSaved().length;
    var bar = document.createElement('div');
    bar.id = 'globalBar';
    bar.className = 'global-bar';
    bar.innerHTML =
      '<a class="gb-home" href="' + root + 'index.html">Home</a>' +
      '<div class="gb-right">' +
        '<a class="gb-nav-link" href="' + root + 'library.html">Library</a>' +
        '<a class="gb-nav-link" href="' + root + 'planner.html">Planner</a>' +
        '<a class="gb-saved-link" href="' + root + 'library.html">Saved' +
          (count ? ' <span class="gb-badge">' + count + '</span>' : '') +
        '</a>' +
        '<input id="gbSearch" class="gb-search" type="search" placeholder="Search library\u2026">' +
        '<span id="gbSignIn" style="display:flex;align-items:center;">' +
          '<button class="gb-signin-btn" onclick="openAuthModal()">Sign in</button>' +
        '</span>' +
        '<span id="gbUser" style="display:none;align-items:center;gap:8px;"></span>' +
        '<button class="gb-add" onclick="openAddRecipe()">+ Add recipe</button>' +
      '</div>';
    document.body.insertBefore(bar, document.body.firstChild);
    document.body.style.paddingTop = '44px';
    _updateAuthBar();
    document.getElementById('gbSearch').addEventListener('keydown', function (e) {
      if (e.key === 'Enter' && this.value.trim()) {
        location.href = root + 'library.html?q=' + encodeURIComponent(this.value.trim());
      }
    });
  }

  window._updateGlobalBar = function () {
    var link = document.querySelector('.gb-saved-link');
    if (!link) return;
    var count = getSaved().length;
    var badge = link.querySelector('.gb-badge');
    if (count > 0) {
      if (badge) { badge.textContent = count; }
      else { link.insertAdjacentHTML('beforeend', ' <span class="gb-badge">' + count + '</span>'); }
    } else {
      if (badge) badge.parentNode.removeChild(badge);
    }
  };

  // ── Modals ──────────────────────────────────────────────────────────────────

  function injectModals() {
    if (document.getElementById('noteModal')) return;
    var d = document.createElement('div');
    var _inp = 'width:100%;border:1px solid var(--border);border-radius:8px;padding:9px 12px;font-family:Georgia,serif;font-size:14px;color:var(--text);box-sizing:border-box;';
    d.innerHTML =
      // ── Auth modal ──
      '<div id="authModal" class="modal-overlay" style="display:none" onclick="if(event.target===this)closeModal(\'authModal\')">' +
        '<div class="modal-box" style="max-width:380px;">' +
          '<div class="auth-tabs">' +
            '<button id="authTab_signin" class="auth-tab active" onclick="openAuthModal(\'signin\')">Sign in</button>' +
            '<button id="authTab_signup" class="auth-tab" onclick="openAuthModal(\'signup\')">Create account</button>' +
          '</div>' +
          // Sign-in form
          '<div id="authForm_signin">' +
            '<div style="display:flex;flex-direction:column;gap:10px;margin-top:14px;">' +
              '<input id="authEmail" type="email" placeholder="Email" autocomplete="email" style="' + _inp + '">' +
              '<input id="authPassword" type="password" placeholder="Password" autocomplete="current-password" style="' + _inp + '">' +
            '</div>' +
            '<div class="modal-actions" style="margin-top:14px;">' +
              '<button id="authSigninBtn" class="btn btn-teal" style="width:100%;" onclick="authSignIn()">Sign in</button>' +
            '</div>' +
            '<p style="text-align:center;margin-top:10px;font-size:12px;font-family:sans-serif;color:var(--muted);">No account yet? <button onclick="openAuthModal(\'signup\')" style="background:none;border:none;color:var(--teal);cursor:pointer;font-size:12px;text-decoration:underline;padding:0;">Create one</button></p>' +
          '</div>' +
          // Sign-up form
          '<div id="authForm_signup" style="display:none;">' +
            '<div style="display:flex;flex-direction:column;gap:10px;margin-top:14px;">' +
              '<input id="authSignupEmail" type="email" placeholder="Email" autocomplete="email" style="' + _inp + '">' +
              '<input id="authSignupPass" type="password" placeholder="Password \u2014 min 8 characters" autocomplete="new-password" style="' + _inp + '">' +
              '<input id="authSignupPass2" type="password" placeholder="Confirm password" autocomplete="new-password" style="' + _inp + '">' +
              '<p style="font-size:12px;color:var(--muted);font-family:sans-serif;line-height:1.5;margin:0;">Your recipes sync across devices. Any recipes already saved on this device are migrated to your account automatically.</p>' +
            '</div>' +
            '<div class="modal-actions" style="margin-top:14px;">' +
              '<button id="authSignupBtn" class="btn btn-teal" style="width:100%;" onclick="authSignUp()">Create account</button>' +
            '</div>' +
          '</div>' +
          '<div id="authErr" style="display:none;font-size:13px;font-family:sans-serif;margin-top:8px;text-align:center;"></div>' +
        '</div>' +
      '</div>' +
      // ── Note modal ──
      '<div id="noteModal" class="modal-overlay" style="display:none" onclick="if(event.target===this)closeModal(\'noteModal\')">' +
        '<div class="modal-box">' +
          '<div class="modal-label">Notes for next time</div>' +
          '<div class="modal-recipe-name" id="noteModalTitle"></div>' +
          '<textarea id="noteText" rows="5" placeholder="What would you do differently? Any tweaks, substitutions, timing notes\u2026"></textarea>' +
          '<div class="modal-actions">' +
            '<button class="btn btn-outline" onclick="closeModal(\'noteModal\')">Cancel</button>' +
            '<button class="btn btn-teal" onclick="_navSaveNote()">Save note</button>' +
          '</div>' +
        '</div>' +
      '</div>' +
      // ── Add / edit recipe modal ──
      '<div id="addModal" class="modal-overlay" style="display:none" onclick="if(event.target===this)closeModal(\'addModal\')">' +
        '<div class="modal-box" style="max-width:640px;max-height:92vh;overflow-y:auto;">' +
          '<div class="modal-label" id="addModalLabel">Add recipe</div>' +
          // ── URL import
          '<div style="display:flex;gap:8px;margin-top:10px;">' +
            '<input id="addUrlInput" type="url" placeholder="Paste a recipe URL to import automatically\u2026" ' +
              'style="flex:1;border:1px solid var(--border);border-radius:8px;padding:9px 12px;' +
              'font-family:Georgia,serif;font-size:14px;color:var(--text);min-width:0;box-sizing:border-box;">' +
            '<button id="addFetchBtn" class="btn btn-teal" onclick="_navFetchUrl()">Fetch</button>' +
          '</div>' +
          // ── Divider
          '<div style="display:flex;align-items:center;gap:10px;margin:10px 0;font-size:11px;' +
            'color:var(--muted);font-family:sans-serif;letter-spacing:.06em;text-transform:uppercase;">' +
            '<div style="flex:1;height:1px;background:var(--border);"></div>' +
            'or paste text' +
            '<div style="flex:1;height:1px;background:var(--border);"></div>' +
          '</div>' +
          // ── Text paste area
          '<textarea id="addPasteArea" rows="3" placeholder="Paste recipe text here to auto-parse\u2026" style="width:100%;border:1px solid var(--border);border-radius:8px;padding:9px 12px;font-family:Georgia,serif;font-size:14px;color:var(--text);resize:vertical;box-sizing:border-box;"></textarea>' +
          '<div style="display:flex;align-items:center;gap:10px;margin-top:8px;flex-wrap:wrap;">' +
            '<button id="addParseBtn" class="btn btn-teal" onclick="_navRunAiParse()">\u2728 Parse with AI</button>' +
            '<button onclick="_navRunHeuristic()" style="background:none;border:none;font-size:12px;color:var(--muted);cursor:pointer;font-family:sans-serif;text-decoration:underline;padding:0;">Parse without AI</button>' +
            '<span id="addParseErr" style="display:none;color:#c0392b;font-size:12px;font-family:sans-serif;"></span>' +
          '</div>' +
          '<div style="border-top:1px solid var(--border);margin:14px 0 10px;"></div>' +
          '<div style="display:flex;flex-direction:column;gap:12px;">' +
            '<div>' +
              '<div class="modal-label" style="margin-bottom:4px;">Title <span style="color:#c0392b">*</span></div>' +
              '<input id="addTitle" type="text" placeholder="Recipe title" style="width:100%;border:1px solid var(--border);border-radius:8px;padding:9px 12px;font-family:Georgia,serif;font-size:15px;color:var(--text);box-sizing:border-box;">' +
            '</div>' +
            '<div>' +
              '<div class="modal-label" style="margin-bottom:4px;">Description</div>' +
              '<input id="addDesc" type="text" placeholder="Short description" style="width:100%;border:1px solid var(--border);border-radius:8px;padding:9px 12px;font-family:Georgia,serif;font-size:14px;color:var(--text);box-sizing:border-box;">' +
            '</div>' +
            '<div>' +
              '<div class="modal-label" style="margin-bottom:6px;">Category</div>' +
              '<div style="display:flex;gap:6px;">' +
                '<button type="button" class="cat-pill" data-cat="starter" onclick="_navSetCat(this)">Starter</button>' +
                '<button type="button" class="cat-pill active" data-cat="main" onclick="_navSetCat(this)">Main</button>' +
                '<button type="button" class="cat-pill" data-cat="side" onclick="_navSetCat(this)">Side</button>' +
              '</div>' +
              '<input type="hidden" id="addCategory" value="main">' +
            '</div>' +
            '<div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:10px;">' +
              '<div>' +
                '<div class="modal-label" style="margin-bottom:4px;">Servings</div>' +
                '<input id="addServings" type="text" placeholder="4 servings" style="width:100%;border:1px solid var(--border);border-radius:8px;padding:8px 10px;font-family:Georgia,serif;font-size:13px;color:var(--text);box-sizing:border-box;">' +
              '</div>' +
              '<div>' +
                '<div class="modal-label" style="margin-bottom:4px;">Prep time</div>' +
                '<input id="addPrep" type="text" placeholder="15 min" style="width:100%;border:1px solid var(--border);border-radius:8px;padding:8px 10px;font-family:Georgia,serif;font-size:13px;color:var(--text);box-sizing:border-box;">' +
              '</div>' +
              '<div>' +
                '<div class="modal-label" style="margin-bottom:4px;">Cook time</div>' +
                '<input id="addCook" type="text" placeholder="30 min" style="width:100%;border:1px solid var(--border);border-radius:8px;padding:8px 10px;font-family:Georgia,serif;font-size:13px;color:var(--text);box-sizing:border-box;">' +
              '</div>' +
            '</div>' +
            '<div>' +
              '<div class="modal-label" style="margin-bottom:4px;">Ingredients <span style="color:var(--muted);font-weight:400;text-transform:none;letter-spacing:0">\u2014 one per line</span></div>' +
              '<textarea id="addIngredients" rows="6" placeholder="500g pasta&#10;1 onion&#10;2 tbsp olive oil" style="width:100%;border:1px solid var(--border);border-radius:8px;padding:9px 12px;font-family:Georgia,serif;font-size:14px;color:var(--text);resize:vertical;box-sizing:border-box;"></textarea>' +
            '</div>' +
            '<div>' +
              '<div class="modal-label" style="margin-bottom:4px;">Instructions <span style="color:var(--muted);font-weight:400;text-transform:none;letter-spacing:0">\u2014 one step per line</span></div>' +
              '<textarea id="addInstructions" rows="6" placeholder="Cook pasta al dente.&#10;Saut\xe9 onion in olive oil 5 min." style="width:100%;border:1px solid var(--border);border-radius:8px;padding:9px 12px;font-family:Georgia,serif;font-size:14px;color:var(--text);resize:vertical;box-sizing:border-box;"></textarea>' +
            '</div>' +
            '<div>' +
              '<div class="modal-label" style="margin-bottom:4px;">Tags <span style="color:var(--muted);font-weight:400;text-transform:none;letter-spacing:0">\u2014 comma separated</span></div>' +
              '<input id="addTags" type="text" placeholder="vegetarian, italian, quick" style="width:100%;border:1px solid var(--border);border-radius:8px;padding:9px 12px;font-family:Georgia,serif;font-size:14px;color:var(--text);box-sizing:border-box;">' +
            '</div>' +
          '</div>' +
          '<div id="addModalError" style="display:none;color:#c0392b;font-size:13px;font-family:sans-serif;margin-top:8px;"></div>' +
          '<div class="modal-actions" style="margin-top:16px;">' +
            '<button class="btn btn-outline" onclick="closeModal(\'addModal\')">Cancel</button>' +
            '<button class="btn btn-teal" onclick="_navSaveAddRecipe()">Save recipe</button>' +
          '</div>' +
        '</div>' +
      '</div>' +
      // ── Feedback / bug-report modal ──
      '<div id="feedbackModal" class="modal-overlay" style="display:none" onclick="if(event.target===this)closeModal(\'feedbackModal\')">' +
        '<div class="modal-box" style="max-width:480px;">' +
          '<div class="modal-label">Report a bug &nbsp;&middot;&nbsp; Send feedback</div>' +
          '<p style="font-size:13px;color:var(--muted);font-family:sans-serif;margin-top:4px;line-height:1.5;">' +
            'Describe what happened or what you\u2019d like to improve. Type or speak.' +
          '</p>' +
          '<textarea id="feedbackText" rows="5" placeholder="e.g. \u201cThe planner shows the wrong week\u201d or \u201cI\u2019d love a dark mode\u2026\u201d" ' +
            'style="width:100%;margin-top:12px;border:1px solid var(--border);border-radius:8px;padding:9px 12px;' +
            'font-family:Georgia,serif;font-size:14px;color:var(--text);resize:vertical;min-height:100px;box-sizing:border-box;"></textarea>' +
          '<div style="display:flex;align-items:center;gap:10px;margin-top:8px;flex-wrap:wrap;">' +
            '<button id="feedbackMicBtn" class="btn btn-outline" onclick="_navToggleMic()" style="padding:8px 14px;">' +
              '\uD83C\uDF99\uFE0F Voice' +
            '</button>' +
            '<span id="feedbackMicStatus" style="font-size:12px;font-family:sans-serif;color:var(--muted);"></span>' +
            '<span id="feedbackMicErr" style="display:none;font-size:12px;color:#c0392b;font-family:sans-serif;"></span>' +
          '</div>' +
          '<div id="feedbackErr" style="display:none;color:#c0392b;font-size:13px;font-family:sans-serif;margin-top:6px;"></div>' +
          '<div class="modal-actions" style="margin-top:16px;">' +
            '<button class="btn btn-outline" onclick="closeModal(\'feedbackModal\')">Cancel</button>' +
            '<button id="feedbackSubmitBtn" class="btn btn-teal" onclick="_navSubmitFeedback()">Send feedback</button>' +
          '</div>' +
        '</div>' +
      '</div>' +
      // ── API key modal ──
      '<div id="apiModal" class="modal-overlay" style="display:none" onclick="if(event.target===this)closeApiSettings()">' +
        '<div class="modal-box" style="max-width:480px;">' +
          '<div class="modal-label">Claude API key</div>' +
          '<p style="font-size:13px;color:var(--muted);font-family:sans-serif;line-height:1.6;margin-top:4px;">Used only for AI recipe parsing. Stored in your browser only \u2014 never sent anywhere except Anthropic\'s API. Get yours at <strong>console.anthropic.com</strong> &rarr; API Keys.</p>' +
          '<div style="position:relative;margin-top:8px;">' +
            '<input id="apiKeyInput" type="password" placeholder="sk-ant-api03-\u2026" style="width:100%;border:1px solid var(--border);border-radius:8px;padding:10px 12px;font-family:monospace;font-size:13px;color:var(--text);box-sizing:border-box;">' +
          '</div>' +
          '<label style="display:flex;align-items:center;gap:6px;margin-top:6px;font-size:12px;color:var(--muted);font-family:sans-serif;cursor:pointer;">' +
            '<input type="checkbox" onchange="document.getElementById(\'apiKeyInput\').type=this.checked?\'text\':\'password\'">' +
            'Show key' +
          '</label>' +
          '<div id="apiStatus" style="font-size:13px;font-family:sans-serif;margin-top:6px;min-height:18px;"></div>' +
          '<div class="modal-actions">' +
            '<button class="btn btn-outline" onclick="clearApiKey()">Clear key</button>' +
            '<button class="btn btn-teal" onclick="saveApiKey()">Save key</button>' +
          '</div>' +
        '</div>' +
      '</div>';
    while (d.firstChild) document.body.appendChild(d.firstChild);
  }

  // ── Stars ───────────────────────────────────────────────────────────────────

  function buildStars(id, rating) {
    var h = '<div class="rc-stars">';
    for (var i = 1; i <= 5; i++) {
      h += '<span class="rc-star' + (i <= rating ? ' on' : '') + '"' +
        ' onclick="_navSetRating(event,\'' + id + '\',' + i + ')"' +
        ' onmouseover="_navHoverS(this,' + i + ')"' +
        ' onmouseout="_navResetS(this,' + rating + ')">' +
        (i <= rating ? '\u2605' : '\u2606') + '</span>';
    }
    return h + '</div>';
  }

  window._navHoverS = function (el, val) {
    el.parentElement.querySelectorAll('.rc-star').forEach(function (s, i) {
      s.textContent = i < val ? '\u2605' : '\u2606';
      s.classList.toggle('on', i < val);
    });
  };
  window._navResetS = function (el, rating) {
    el.parentElement.querySelectorAll('.rc-star').forEach(function (s, i) {
      s.textContent = i < rating ? '\u2605' : '\u2606';
      s.classList.toggle('on', i < rating);
    });
  };
  window._navSetRating = function (e, id, val) {
    e.preventDefault(); e.stopPropagation();
    var cur = get(id).rating || 0;
    set(id, { rating: cur === val ? 0 : val });
    _refresh(id);
  };

  // ── Note modal ──────────────────────────────────────────────────────────────

  var _noteId = null;
  window.openNote = function (e, id, optName) {
    e.preventDefault(); e.stopPropagation();
    _noteId = id;
    var nameEl = document.querySelector('.recipe-card[data-id="' + id + '"] .rc-name');
    var heroH1 = PAGE_ID === id ? document.querySelector('.recipe-hero h1') : null;
    var name = optName ||
      (nameEl && nameEl.textContent) ||
      (heroH1 && heroH1.textContent) ||
      get(id).name || id;
    document.getElementById('noteModalTitle').textContent = name;
    document.getElementById('noteText').value = get(id).note || '';
    document.getElementById('noteModal').style.display = 'flex';
    setTimeout(function () { document.getElementById('noteText').focus(); }, 80);
  };
  window._navSaveNote = function () {
    set(_noteId, { note: document.getElementById('noteText').value.trim() });
    closeModal('noteModal');
    _refresh(_noteId);
  };

  // ── Add / edit recipe modal ─────────────────────────────────────────────────

  window._navSetCat = function (btn) {
    document.querySelectorAll('.cat-pill').forEach(function (b) { b.classList.remove('active'); });
    btn.classList.add('active');
    document.getElementById('addCategory').value = btn.dataset.cat;
  };

  function _navSetCatValue(cat) {
    var c = cat || 'main';
    document.getElementById('addCategory').value = c;
    document.querySelectorAll('.cat-pill').forEach(function (b) {
      b.classList.toggle('active', b.dataset.cat === c);
    });
  }

  function _navFillForm(title, desc, category, servings, prep, cook, ingredients, instructions, tags) {
    document.getElementById('addTitle').value = title;
    document.getElementById('addDesc').value = desc;
    _navSetCatValue(category);
    document.getElementById('addServings').value = servings;
    document.getElementById('addPrep').value = prep;
    document.getElementById('addCook').value = cook;
    document.getElementById('addIngredients').value = ingredients;
    document.getElementById('addInstructions').value = instructions;
    document.getElementById('addTags').value = tags;
    document.getElementById('addModalError').style.display = 'none';
  }

  window.openAddRecipe = function () {
    _navEditId = null;
    document.getElementById('addModalLabel').textContent = 'Add recipe';
    document.getElementById('addUrlInput').value = '';
    document.getElementById('addPasteArea').value = '';
    document.getElementById('addParseErr').style.display = 'none';
    _navFillForm('', '', 'main', '', '', '', '', '', '');
    document.getElementById('addModal').style.display = 'flex';
    setTimeout(function () { document.getElementById('addUrlInput').focus(); }, 80);
  };

  window.openEditRecipe = function (id) {
    _navEditId = id;
    var r = get(id);
    document.getElementById('addModalLabel').textContent = 'Edit recipe';
    document.getElementById('addPasteArea').value = '';
    document.getElementById('addParseErr').style.display = 'none';
    _navFillForm(
      r.name || '', r.description || '', r.category || 'main',
      r.servings || '', r.prepTime || '', r.cookTime || '',
      (r.ingredients || []).join('\n'),
      (r.instructions || []).join('\n'),
      (r.tags || []).join(', ')
    );
    document.getElementById('addModal').style.display = 'flex';
    setTimeout(function () { document.getElementById('addTitle').focus(); }, 80);
  };

  window._navSaveAddRecipe = function () {
    var errEl = document.getElementById('addModalError');
    var title = document.getElementById('addTitle').value.trim();
    if (!title) {
      errEl.textContent = 'Title is required.';
      errEl.style.display = 'block';
      document.getElementById('addTitle').focus();
      return;
    }
    var ingredients = document.getElementById('addIngredients').value.split('\n').map(function (s) { return s.trim(); }).filter(Boolean);
    var instructions = document.getElementById('addInstructions').value.split('\n').map(function (s) { return s.trim(); }).filter(Boolean);
    var tags = document.getElementById('addTags').value.split(',').map(function (s) { return s.trim(); }).filter(Boolean);
    var data = {
      name: title,
      description: document.getElementById('addDesc').value.trim(),
      category: document.getElementById('addCategory').value || 'main',
      servings: document.getElementById('addServings').value.trim(),
      prepTime: document.getElementById('addPrep').value.trim(),
      cookTime: document.getElementById('addCook').value.trim(),
      ingredients: ingredients,
      instructions: instructions,
      tags: tags
    };

    var savedId;
    if (_navEditId) {
      set(_navEditId, data);
      savedId = _navEditId;
    } else {
      var id = 'custom-' + Date.now() + '-' + Math.floor(Math.random() * 10000);
      set(id, Object.assign(data, { saved: true, custom: true, rating: 0, note: '', createdAt: Date.now() }));
      savedId = id;
    }

    _syncRecipe(savedId, get(savedId));
    closeModal('addModal');
    window._updateGlobalBar();
    if (typeof window._onNavAction === 'function') window._onNavAction(_navEditId ? 'update' : 'add');
    if (typeof window._plannerOnRecipeSaved === 'function') {
      window._plannerOnRecipeSaved(savedId);
      window._plannerOnRecipeSaved = null;
    }
  };

  // ── AI parsing ──────────────────────────────────────────────────────────────

  window._navRunAiParse = function () {
    var text = document.getElementById('addPasteArea').value.trim();
    if (!text) { _navShowParseErr('Please paste a recipe first.'); return; }

    var key = localStorage.getItem('claudeApiKey');
    if (!key) {
      var errEl = document.getElementById('addParseErr');
      errEl.innerHTML = 'No API key \u2014 <button onclick="openApiSettings()" style="background:none;border:none;color:var(--teal);cursor:pointer;font-size:12px;font-family:sans-serif;text-decoration:underline;padding:0;">set it here</button>, or use basic parsing below.';
      errEl.style.display = 'block';
      return;
    }

    var btn = document.getElementById('addParseBtn');
    btn.textContent = 'Parsing\u2026';
    btn.disabled = true;
    document.getElementById('addParseErr').style.display = 'none';

    var prompt =
      'Parse the following recipe text and return ONLY a valid JSON object with these exact fields:\n' +
      '{\n' +
      '  "title": "recipe name",\n' +
      '  "description": "1-2 sentence description",\n' +
      '  "servings": "e.g. 4 servings",\n' +
      '  "prepTime": "e.g. 15 min",\n' +
      '  "cookTime": "e.g. 30 min",\n' +
      '  "ingredients": ["quantity + ingredient, e.g. 500g pasta"],\n' +
      '  "instructions": ["Full text of step 1", "Full text of step 2"],\n' +
      '  "tags": ["2-5 tags: cuisine type, dietary, quick/slow, etc."]\n' +
      '}\n' +
      'Rules: use "" or [] for missing fields. Return ONLY the JSON, no explanation.\n\n' +
      'Recipe text:\n"""\n' + text + '\n"""';

    fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': key,
        'anthropic-version': '2023-06-01',
        'anthropic-dangerous-direct-browser-access': 'true'
      },
      body: JSON.stringify({
        model: 'claude-haiku-4-5-20251001',
        max_tokens: 2048,
        messages: [{ role: 'user', content: prompt }]
      })
    })
    .then(function (res) {
      if (!res.ok) return res.json().then(function (e) { throw new Error(e.error && e.error.message || 'API error ' + res.status); });
      return res.json();
    })
    .then(function (data) {
      var raw = data.content && data.content[0] && data.content[0].text || '';
      var jsonStr = raw.replace(/```json\s*/gi, '').replace(/```\s*/g, '').trim();
      _navApplyParsed(JSON.parse(jsonStr));
    })
    .catch(function (err) {
      _navShowParseErr('Parsing failed: ' + err.message + '. Try basic parsing below.');
    })
    .finally(function () {
      btn.textContent = '\u2728 Parse with AI';
      btn.disabled = false;
    });
  };

  window._navRunHeuristic = function () {
    var text = document.getElementById('addPasteArea').value.trim();
    if (!text) { _navShowParseErr('Please paste a recipe first.'); return; }
    _navApplyParsed(_navParseHeuristic(text));
  };

  function _navParseHeuristic(text) {
    var lines = text.split('\n').map(function (l) { return l.trim(); }).filter(Boolean);
    var title = lines[0] || '';
    var ingredients = [], instructions = [], inI = false, inS = false;
    lines.forEach(function (line) {
      var low = line.toLowerCase();
      if (/^ingredients?:?\s*$/.test(low) || /^what you need/.test(low)) { inI = true; inS = false; return; }
      if (/^(instructions?|method|directions?|steps?|how to|preparation):?\s*$/.test(low)) { inS = true; inI = false; return; }
      if (inI && /^[-\u2022*\xb7]/.test(line)) ingredients.push(line.replace(/^[-\u2022*\xb7]\s*/, ''));
      else if (inS && /^\d+[.)]\s/.test(line)) instructions.push(line.replace(/^\d+[.)]\s*/, ''));
      else if (!inI && !inS && /^[-\u2022*\xb7]/.test(line) && lines.indexOf(line) > 0) ingredients.push(line.replace(/^[-\u2022*\xb7]\s*/, ''));
    });
    var svm = text.match(/serves?\s+([\d\u2013\-]+)/i) || text.match(/([\d]+)\s+servings?/i);
    var ppm = text.match(/prep(?:\s*time)?:?\s*(\d+\s*(?:min(?:utes?)?|h(?:ours?)?))/i);
    var ckm = text.match(/cook(?:ing)?(?:\s*time)?:?\s*(\d+\s*(?:min(?:utes?)?|h(?:ours?)?))/i);
    return { title: title, description: '', servings: svm ? svm[0] : '', prepTime: ppm ? ppm[1] : '', cookTime: ckm ? ckm[1] : '', ingredients: ingredients, instructions: instructions, tags: [] };
  }

  function _navApplyParsed(p) {
    _navFillForm(
      p.title || '', p.description || '', p.category || 'main',
      p.servings || '', p.prepTime || '', p.cookTime || '',
      (p.ingredients || []).join('\n'),
      (p.instructions || []).join('\n'),
      (p.tags || []).join(', ')
    );
    setTimeout(function () { document.getElementById('addTitle').focus(); }, 80);
  }

  function _navShowParseErr(msg) {
    var el = document.getElementById('addParseErr');
    el.textContent = msg;
    el.style.display = 'block';
  }

  // ── URL import ──────────────────────────────────────────────────────────────

  window._navFetchUrl = function () {
    var raw = document.getElementById('addUrlInput').value.trim();
    if (!raw) { _navShowParseErr('Please enter a URL.'); return; }
    if (!/^https?:\/\//i.test(raw)) raw = 'https://' + raw;

    var btn = document.getElementById('addFetchBtn');
    btn.textContent = 'Fetching\u2026'; btn.disabled = true;
    document.getElementById('addParseErr').style.display = 'none';

    fetch('https://api.allorigins.win/get?url=' + encodeURIComponent(raw))
    .then(function (res) {
      if (!res.ok) throw new Error('Proxy error ' + res.status);
      return res.json();
    })
    .then(function (data) {
      var html = data.contents || '';
      if (!html) throw new Error('Empty page returned');

      // 1. Try structured JSON-LD (schema.org/Recipe) — no AI needed
      var structured = _navParseJsonLd(html);
      if (structured) {
        _navApplyParsed(structured);
        return;
      }

      // 2. Fall back: strip HTML, put in paste area, trigger AI parse
      var text = _navStripHtml(html).slice(0, 10000);
      document.getElementById('addPasteArea').value = text;
      var key = localStorage.getItem('claudeApiKey');
      if (key) {
        _navRunAiParse();
      } else {
        _navShowParseErr('No schema.org data found on this page. Paste your API key (\u2699) and click \u2728 Parse with AI, or edit the fields manually.');
      }
    })
    .catch(function (err) {
      _navShowParseErr('Could not fetch the page (' + err.message + '). Try pasting the recipe text instead.');
    })
    .finally(function () {
      btn.textContent = 'Fetch'; btn.disabled = false;
    });
  };

  // Parse schema.org Recipe from JSON-LD blocks in raw HTML
  function _navParseJsonLd(html) {
    var re = /<script[^>]+type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi;
    var m;
    while ((m = re.exec(html)) !== null) {
      try {
        var data = JSON.parse(m[1]);
        // Handle @graph arrays
        var items = data['@graph'] ? data['@graph'] : (Array.isArray(data) ? data : [data]);
        for (var i = 0; i < items.length; i++) {
          var r = _navExtractRecipe(items[i]);
          if (r) return r;
        }
      } catch (e) { /* malformed JSON — skip */ }
    }
    return null;
  }

  function _navExtractRecipe(d) {
    if (!d) return null;
    var type = d['@type'];
    if (Array.isArray(type)) type = type[0];
    if (type !== 'Recipe') return null;

    function txt(v) {
      if (!v) return '';
      if (typeof v === 'string') return v.replace(/<[^>]+>/g, '').trim();
      if (v.text) return txt(v.text);
      if (Array.isArray(v)) return v.map(txt).filter(Boolean).join('. ');
      return '';
    }

    // Instructions: handle HowToStep, HowToSection, plain string
    var steps = [];
    (function collectSteps(node) {
      if (!node) return;
      if (typeof node === 'string') { var s = node.replace(/<[^>]+>/g,'').trim(); if (s) steps.push(s); return; }
      if (node.text) { steps.push(node.text.replace(/<[^>]+>/g,'').trim()); return; }
      if (node.itemListElement) node.itemListElement.forEach(collectSteps);
      if (Array.isArray(node)) node.forEach(collectSteps);
    })(d.recipeInstructions);

    function parseDur(s) {
      if (!s) return '';
      var mm = s.match(/PT(?:(\d+)H)?(?:(\d+)M)?/);
      if (!mm) return s;
      var h = parseInt(mm[1] || 0), min = parseInt(mm[2] || 0);
      return (h ? h + 'h ' : '') + (min ? min + ' min' : '') || s;
    }

    var tags = [];
    if (d.recipeCuisine) tags.push(Array.isArray(d.recipeCuisine) ? d.recipeCuisine[0] : d.recipeCuisine);
    if (d.recipeCategory) tags.push(Array.isArray(d.recipeCategory) ? d.recipeCategory[0] : d.recipeCategory);
    if (d.keywords) {
      var kw = typeof d.keywords === 'string' ? d.keywords.split(',') : (Array.isArray(d.keywords) ? d.keywords : []);
      kw.slice(0, 4).forEach(function (k) { tags.push(k.trim()); });
    }
    tags = tags.filter(Boolean).map(function(t){ return t.toLowerCase(); });
    // dedupe
    tags = tags.filter(function(t,i){ return tags.indexOf(t)===i; }).slice(0,6);

    var yield_ = d.recipeYield;
    var servings = Array.isArray(yield_) ? yield_[0] : (yield_ || '');

    return {
      title:       d.name       || '',
      description: txt(d.description),
      servings:    servings + '',
      prepTime:    parseDur(d.prepTime),
      cookTime:    parseDur(d.cookTime || d.totalTime),
      ingredients: (d.recipeIngredient || []).map(function(i){ return txt(i); }).filter(Boolean),
      instructions: steps,
      tags:         tags
    };
  }

  function _navStripHtml(html) {
    return html
      .replace(/<script[\s\S]*?<\/script>/gi, '')
      .replace(/<style[\s\S]*?<\/style>/gi, '')
      .replace(/<[^>]+>/g, ' ')
      .replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&nbsp;/g, ' ').replace(/&#\d+;/g, ' ')
      .replace(/\s+/g, ' ').trim();
  }

  // ── Feedback / bug-report ────────────────────────────────────────────────────

  window.openFeedback = function () {
    document.getElementById('feedbackText').value = '';
    document.getElementById('feedbackErr').style.display = 'none';
    document.getElementById('feedbackMicErr').style.display = 'none';
    document.getElementById('feedbackMicStatus').textContent = '';
    document.getElementById('feedbackModal').style.display = 'flex';
    setTimeout(function () { document.getElementById('feedbackText').focus(); }, 80);
  };

  var _micActive = false;
  var _micRecognition = null;

  window._navToggleMic = function () {
    if (_micActive) {
      if (_micRecognition) _micRecognition.stop();
      return;
    }
    var SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SR) {
      var e = document.getElementById('feedbackMicErr');
      e.textContent = 'Voice not supported in this browser — please type your feedback.';
      e.style.display = 'block';
      return;
    }
    document.getElementById('feedbackMicErr').style.display = 'none';
    _micRecognition = new SR();
    _micRecognition.continuous = true;
    _micRecognition.interimResults = true;
    _micRecognition.lang = navigator.language || 'en-US';

    var btn = document.getElementById('feedbackMicBtn');
    var status = document.getElementById('feedbackMicStatus');
    _micActive = true;
    btn.innerHTML = '\u23F9\uFE0F Stop recording';
    btn.style.background = '#c0392b'; btn.style.color = 'white'; btn.style.borderColor = '#c0392b';
    status.textContent = '\u25CF Recording\u2026';

    _micRecognition.onresult = function (ev) {
      var t = '';
      for (var i = 0; i < ev.results.length; i++) t += ev.results[i][0].transcript;
      document.getElementById('feedbackText').value = t;
    };
    _micRecognition.onerror = function (ev) {
      _micActive = false;
      btn.innerHTML = '\uD83C\uDF99\uFE0F Voice'; btn.style.background = ''; btn.style.color = ''; btn.style.borderColor = '';
      status.textContent = '';
      if (ev.error !== 'no-speech') {
        var e2 = document.getElementById('feedbackMicErr');
        e2.textContent = 'Mic error: ' + ev.error + '. Check browser permissions.';
        e2.style.display = 'block';
      }
    };
    _micRecognition.onend = function () {
      _micActive = false;
      btn.innerHTML = '\uD83C\uDF99\uFE0F Voice'; btn.style.background = ''; btn.style.color = ''; btn.style.borderColor = '';
      status.textContent = '';
    };
    _micRecognition.start();
  };

  window._navSubmitFeedback = function () {
    var msg = document.getElementById('feedbackText').value.trim();
    var errEl = document.getElementById('feedbackErr');
    if (!msg) {
      errEl.textContent = 'Please enter a message.'; errEl.style.display = 'block'; return;
    }
    errEl.style.display = 'none';

    // If Supabase is not yet configured, show a graceful message
    if (!window.SUPABASE_URL || window.SUPABASE_URL === 'YOUR_SUPABASE_URL') {
      closeModal('feedbackModal');
      _navShowFeedbackToast('\u26A0\uFE0F Feedback not yet connected \u2014 Supabase URL missing.');
      return;
    }

    var btn = document.getElementById('feedbackSubmitBtn');
    btn.textContent = 'Sending\u2026'; btn.disabled = true;

    fetch(window.SUPABASE_URL + '/rest/v1/feedback', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': window.SUPABASE_ANON,
        'Authorization': 'Bearer ' + window.SUPABASE_ANON,
        'Prefer': 'return=minimal'
      },
      body: JSON.stringify({ message: msg, page_url: location.href })
    })
    .then(function (r) {
      if (!r.ok) return r.text().then(function (t) { throw new Error('HTTP ' + r.status + ' ' + t); });
      document.getElementById('feedbackText').value = '';
      closeModal('feedbackModal');
      _navShowFeedbackToast('\u2713 Feedback sent \u2014 thank you!');
    })
    .catch(function (err) {
      errEl.textContent = 'Could not send: ' + err.message; errEl.style.display = 'block';
    })
    .finally(function () { btn.textContent = 'Send feedback'; btn.disabled = false; });
  };

  function _navShowFeedbackToast(msg) {
    var t = document.createElement('div');
    t.className = 'feedback-toast';
    t.textContent = msg;
    document.body.appendChild(t);
    setTimeout(function () { t.classList.add('feedback-toast-hide'); }, 2500);
    setTimeout(function () { t.parentNode && t.parentNode.removeChild(t); }, 3000);
  }

  function injectFeedbackFab() {
    var fab = document.createElement('button');
    fab.id = 'feedbackFab';
    fab.className = 'feedback-fab';
    fab.title = 'Report a bug or send feedback';
    fab.setAttribute('aria-label', 'Feedback');
    fab.innerHTML = '&#128172;';
    fab.addEventListener('click', window.openFeedback);
    document.body.appendChild(fab);
  }

  // ── API key settings ────────────────────────────────────────────────────────

  window.openApiSettings = function () {
    var existing = localStorage.getItem('claudeApiKey') || '';
    document.getElementById('apiKeyInput').value = existing;
    document.getElementById('apiStatus').textContent = existing ? '\u2705 Key saved' : 'No key saved';
    document.getElementById('apiStatus').style.color = existing ? 'var(--green)' : 'var(--muted)';
    document.getElementById('apiModal').style.display = 'flex';
    if (!existing) setTimeout(function () { document.getElementById('apiKeyInput').focus(); }, 80);
  };

  window.closeApiSettings = function () {
    document.getElementById('apiModal').style.display = 'none';
  };

  window.saveApiKey = function () {
    var key = document.getElementById('apiKeyInput').value.trim();
    if (!key) { window.clearApiKey(); return; }
    localStorage.setItem('claudeApiKey', key);
    document.getElementById('apiStatus').textContent = '\u2705 Key saved';
    document.getElementById('apiStatus').style.color = 'var(--green)';
    setTimeout(window.closeApiSettings, 800);
  };

  window.clearApiKey = function () {
    localStorage.removeItem('claudeApiKey');
    document.getElementById('apiKeyInput').value = '';
    document.getElementById('apiStatus').textContent = 'Key cleared';
    document.getElementById('apiStatus').style.color = 'var(--muted)';
  };

  // ── Close modal ─────────────────────────────────────────────────────────────

  window.closeModal = function (id) {
    if (id) { document.getElementById(id).style.display = 'none'; }
    if (!id || id === 'noteModal') _noteId = null;
    if (!id || id === 'addModal') {
      _navEditId = null;
      window._plannerOnRecipeSaved = null;
    }
  };

  // ── Save / unsave / delete ──────────────────────────────────────────────────

  window.toggleSave = function (e, id) {
    e.preventDefault(); e.stopPropagation();
    var willSave = !get(id).saved;
    var updates = { saved: willSave };
    if (willSave) {
      var card = document.querySelector('.recipe-card[data-id="' + id + '"]');
      if (card) { updates.name = card.querySelector('.rc-name').textContent; }
      else if (PAGE_ID === id) {
        var h1 = document.querySelector('.recipe-hero h1');
        if (h1) updates.name = h1.textContent;
      }
    }
    set(id, updates);
    _refresh(id);
    window._updateGlobalBar();
  };

  window.deleteCustom = function (e, id) {
    e.preventDefault(); e.stopPropagation();
    remove(id);
    window._updateGlobalBar();
    if (typeof window._onNavAction === 'function') window._onNavAction('delete', id);
  };

  // ── Action bar HTML (for homepage recipe cards) ─────────────────────────────

  window._buildActionsHTML = function (id) {
    var rec = get(id);
    var rating = rec.rating || 0;
    return '<div class="rc-actions">' +
      buildStars(id, rating) +
      '<button class="rc-action-btn' + (rec.note ? ' has-note' : '') + '" onclick="openNote(event,\'' + id + '\')">' +
        (rec.note ? '\uD83D\uDCDD Note' : '+ Note') +
      '</button>' +
      '<button class="rc-save-btn' + (rec.saved ? ' saved' : '') + '" onclick="toggleSave(event,\'' + id + '\')">' +
        (rec.saved ? '\u2665 Saved' : '\u2661 Save') +
      '</button>' +
      '</div>';
  };

  // ── Internal refresh ────────────────────────────────────────────────────────

  function _refresh(id) {
    var card = document.querySelector('.recipe-card[data-id="' + id + '"]');
    if (card) {
      var ex = card.querySelector('.rc-actions');
      if (ex) ex.parentNode.removeChild(ex);
      card.querySelector('.rc-body').insertAdjacentHTML('beforeend', window._buildActionsHTML(id));
    }
    if (PAGE_ID === id) {
      var bar = document.getElementById('recipePageBar');
      if (bar) bar.innerHTML = _recipePageBarHTML(id);
    }
    if (typeof window._onNavAction === 'function') window._onNavAction('update', id);
  }

  // ── Recipe page action bar ──────────────────────────────────────────────────

  function _recipePageBarHTML(id) {
    var rec = get(id);
    var rating = rec.rating || 0;
    return buildStars(id, rating) +
      '<button class="rc-action-btn' + (rec.note ? ' has-note' : '') + '" onclick="openNote(event,\'' + id + '\')">' +
        (rec.note ? '\uD83D\uDCDD Edit note' : '+ Add note') +
      '</button>' +
      '<button class="rc-save-btn' + (rec.saved ? ' saved' : '') + '" onclick="toggleSave(event,\'' + id + '\')">' +
        (rec.saved ? '\u2665 Saved' : '\u2661 Save') +
      '</button>' +
      (rec.note ? '<div class="recipe-page-note">\u201c' + rec.note + '\u201d</div>' : '');
  }

  function injectRecipePageBar() {
    if (!PAGE_ID) return;
    var bar = document.createElement('div');
    bar.id = 'recipePageBar';
    bar.className = 'recipe-page-bar rc-actions';
    bar.innerHTML = _recipePageBarHTML(PAGE_ID);
    var narrow = document.querySelector('.container-narrow');
    var bring = document.querySelector('.bring-box');
    if (narrow && bring) {
      narrow.insertBefore(bar, bring);
    } else if (narrow) {
      narrow.insertBefore(bar, narrow.firstChild);
    }
  }

  // ── Init ────────────────────────────────────────────────────────────────────

  function init() {
    injectModals();
    renderGlobalBar();
    injectRecipePageBar();
    injectFeedbackFab();
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape') {
        closeModal('noteModal');
        closeModal('addModal');
        closeModal('authModal');
        closeModal('feedbackModal');
        window.closeApiSettings();
      }
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
