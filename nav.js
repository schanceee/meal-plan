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

  // ── Global bar ──────────────────────────────────────────────────────────────

  function renderGlobalBar() {
    var count = getSaved().length;
    var bar = document.createElement('div');
    bar.id = 'globalBar';
    bar.className = 'global-bar';
    bar.innerHTML =
      '<a class="gb-home" href="' + root + 'index.html">Weekly plan</a>' +
      '<div class="gb-right">' +
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
      '<div id="addModal" class="modal-overlay" style="display:none" onclick="if(event.target===this)closeModal(\'addModal\')">' +
        '<div class="modal-box" style="max-width:560px;">' +
          '<div class="modal-label">Add a recipe</div>' +
          '<div id="addModalError" style="display:none;color:#c0392b;font-size:13px;font-family:sans-serif;margin-bottom:4px;"></div>' +
          '<div style="display:flex;flex-direction:column;gap:14px;">' +
            '<div><div class="modal-label" style="margin-bottom:4px;">Name <span style="color:#c0392b">*</span></div>' +
              '<input id="addName" type="text" placeholder="e.g. Roasted salmon with herbs" style="width:100%;border:1px solid var(--border);border-radius:8px;padding:9px 12px;font-family:Georgia,serif;font-size:14px;color:var(--text);"></div>' +
            '<div><div class="modal-label" style="margin-bottom:4px;">Description</div>' +
              '<input id="addDesc" type="text" placeholder="Short description" style="width:100%;border:1px solid var(--border);border-radius:8px;padding:9px 12px;font-family:Georgia,serif;font-size:14px;color:var(--text);"></div>' +
            '<div><div class="modal-label" style="margin-bottom:4px;">Ingredients <span style="color:var(--muted);font-weight:400;text-transform:none;letter-spacing:0">\u2014 one per line</span></div>' +
              '<textarea id="addIngredients" rows="4" placeholder="200g pasta&#10;1 zucchini&#10;2 tbsp olive oil" style="width:100%;border:1px solid var(--border);border-radius:8px;padding:9px 12px;font-family:Georgia,serif;font-size:14px;color:var(--text);resize:vertical;"></textarea></div>' +
            '<div><div class="modal-label" style="margin-bottom:4px;">Instructions <span style="color:var(--muted);font-weight:400;text-transform:none;letter-spacing:0">\u2014 one step per line</span></div>' +
              '<textarea id="addInstructions" rows="4" placeholder="Cook pasta al dente.&#10;Saut\xe9 zucchini in olive oil 5 min." style="width:100%;border:1px solid var(--border);border-radius:8px;padding:9px 12px;font-family:Georgia,serif;font-size:14px;color:var(--text);resize:vertical;"></textarea></div>' +
            '<div><div class="modal-label" style="margin-bottom:4px;">Tags <span style="color:var(--muted);font-weight:400;text-transform:none;letter-spacing:0">\u2014 comma separated</span></div>' +
              '<input id="addTags" type="text" placeholder="italian, quick, vegetarian" style="width:100%;border:1px solid var(--border);border-radius:8px;padding:9px 12px;font-family:Georgia,serif;font-size:14px;color:var(--text);"></div>' +
          '</div>' +
          '<div class="modal-actions" style="margin-top:4px;">' +
            '<button class="btn btn-outline" onclick="closeModal(\'addModal\')">Cancel</button>' +
            '<button class="btn btn-teal" onclick="_navSaveAddRecipe()">Save recipe</button>' +
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

  // ── Add recipe modal ────────────────────────────────────────────────────────

  window.openAddRecipe = function () {
    ['addName', 'addDesc', 'addIngredients', 'addInstructions', 'addTags'].forEach(function (id) {
      document.getElementById(id).value = '';
    });
    document.getElementById('addModalError').style.display = 'none';
    document.getElementById('addModal').style.display = 'flex';
    setTimeout(function () { document.getElementById('addName').focus(); }, 80);
  };
  window._navSaveAddRecipe = function () {
    var errEl = document.getElementById('addModalError');
    try {
      var ingredients = document.getElementById('addIngredients').value.split('\n').map(function (s) { return s.trim(); }).filter(Boolean);
      var instructions = document.getElementById('addInstructions').value.split('\n').map(function (s) { return s.trim(); }).filter(Boolean);
      var tags = document.getElementById('addTags').value.split(',').map(function (s) { return s.trim(); }).filter(Boolean);
      addCustomRecipe({
        name: document.getElementById('addName').value,
        description: document.getElementById('addDesc').value,
        ingredients: ingredients,
        instructions: instructions,
        tags: tags
      });
      closeModal('addModal');
      window._updateGlobalBar();
      if (typeof window._onNavAction === 'function') window._onNavAction('add');
    } catch (err) {
      errEl.textContent = err.message;
      errEl.style.display = 'block';
      document.getElementById('addName').focus();
    }
  };

  // ── Close modal ─────────────────────────────────────────────────────────────

  window.closeModal = function (id) {
    if (id) { document.getElementById(id).style.display = 'none'; }
    if (!id || id === 'noteModal') _noteId = null;
  };

  // ── Save / unsave / delete ──────────────────────────────────────────────────

  window.toggleSave = function (e, id) {
    e.preventDefault(); e.stopPropagation();
    var willSave = !get(id).saved;
    var updates = { saved: willSave };
    if (willSave) {
      // Capture name from DOM for display on saved.html
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
    // Refresh homepage recipe card action bar
    var card = document.querySelector('.recipe-card[data-id="' + id + '"]');
    if (card) {
      var ex = card.querySelector('.rc-actions');
      if (ex) ex.parentNode.removeChild(ex);
      card.querySelector('.rc-body').insertAdjacentHTML('beforeend', window._buildActionsHTML(id));
    }
    // Refresh recipe page action bar
    if (PAGE_ID === id) {
      var bar = document.getElementById('recipePageBar');
      if (bar) bar.innerHTML = _recipePageBarHTML(id);
    }
    // Hook for saved.html or other listeners
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
      }
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
