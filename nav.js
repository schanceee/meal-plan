/**
 * nav.js — Global navigation bar + shared recipe action functions.
 * Load AFTER recipes.js. Works from root (index.html) and recettes/*.html.
 */
(function () {
  'use strict';

  var isRecipe = /\/recettes\//.test(location.pathname);
  var root = isRecipe ? '../' : '';
  var recipeIdMeta = document.querySelector('meta[name="recipe-id"]');
  var PAGE_ID = recipeIdMeta ? recipeIdMeta.content : null;
  var _navEditId = null;

  // ── Global bar ──────────────────────────────────────────────────────────────

  function renderGlobalBar() {
    var count = getSaved().length;
    var bar = document.createElement('div');
    bar.id = 'globalBar';
    bar.className = 'global-bar';
    bar.innerHTML =
      '<a class="gb-home" href="' + root + 'index.html">Weekly plan</a>' +
      '<div class="gb-right">' +
        '<a class="gb-nav-link" href="' + root + 'library.html">Library</a>' +
        '<a class="gb-nav-link" href="' + root + 'planner.html">Planner</a>' +
        '<a class="gb-saved-link" href="' + root + 'saved.html">My recipes' +
          (count ? ' <span class="gb-badge">' + count + '</span>' : '') +
        '</a>' +
        '<input id="gbSearch" class="gb-search" type="search" placeholder="Search saved\u2026">' +
        '<button class="gb-add" onclick="openAddRecipe()">+ Add recipe</button>' +
      '</div>';
    document.body.insertBefore(bar, document.body.firstChild);
    document.body.style.paddingTop = '44px';
    document.getElementById('gbSearch').addEventListener('keydown', function (e) {
      if (e.key === 'Enter' && this.value.trim()) {
        location.href = root + 'saved.html?q=' + encodeURIComponent(this.value.trim());
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
    d.innerHTML =
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

  function _navFillForm(title, desc, servings, prep, cook, ingredients, instructions, tags) {
    document.getElementById('addTitle').value = title;
    document.getElementById('addDesc').value = desc;
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
    _navFillForm('', '', '', '', '', '', '', '');
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
      r.name || '', r.description || '',
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
      p.title || '', p.description || '',
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
    if (!id || id === 'addModal') _navEditId = null;
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
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape') {
        closeModal('noteModal');
        closeModal('addModal');
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
