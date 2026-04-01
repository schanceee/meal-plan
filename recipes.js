/**
 * recipes.js — localStorage data layer for the meal plan app.
 * Works in browser (global) and Node.js (CommonJS exports for testing).
 */

const STORAGE_KEY = 'recipeData';
let _idSeq = 0;
function _uid() { return 'custom-' + Date.now() + '-' + (++_idSeq); }

function getAll() {
  try { return JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}'); }
  catch { return {}; }
}

function _save(data) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}

function get(id) {
  return getAll()[id] || {};
}

function set(id, updates) {
  const all = getAll();
  all[id] = Object.assign(all[id] || {}, updates);
  _save(all);
  return all[id];
}

function remove(id) {
  const all = getAll();
  delete all[id];
  _save(all);
}

function getSaved() {
  const all = getAll();
  return Object.entries(all)
    .filter(([, r]) => r.saved)
    .map(([id, r]) => Object.assign({ id }, r));
}

/**
 * Add a new custom recipe to the saved collection.
 * @param {{ name: string, description?: string, ingredients?: string[],
 *           instructions?: string[], tags?: string[] }} recipe
 * @returns {object} saved recipe data
 * @throws {Error} if name is missing or blank
 */
function addCustomRecipe(recipe) {
  if (!recipe || !recipe.name || !recipe.name.trim()) {
    throw new Error('Recipe name is required');
  }
  const id = _uid();
  const data = {
    saved: true,
    custom: true,
    name: recipe.name.trim(),
    description: recipe.description || '',
    ingredients: Array.isArray(recipe.ingredients) ? recipe.ingredients : [],
    instructions: Array.isArray(recipe.instructions) ? recipe.instructions : [],
    tags: Array.isArray(recipe.tags) ? recipe.tags : [],
    rating: 0,
    note: '',
    createdAt: Date.now(),
  };
  return set(id, data);
}

/**
 * Update fields on an existing custom recipe.
 * @throws {Error} if recipe is not custom or not found
 */
function updateCustomRecipe(id, updates) {
  const rec = get(id);
  if (!rec.custom) throw new Error('Only custom recipes can be edited');
  if (updates.name !== undefined && !updates.name.trim()) {
    throw new Error('Recipe name is required');
  }
  return set(id, updates);
}

/**
 * Search saved recipes.
 * @param {string|null} query
 * @returns {object[]} filtered array of saved recipes
 */
function searchSaved(query) {
  const all = getSaved();
  if (!query || !query.trim()) return all;
  const q = query.toLowerCase().trim();
  return all.filter(r =>
    (r.name || '').toLowerCase().includes(q) ||
    (r.description || '').toLowerCase().includes(q) ||
    (r.ingredients || []).some(i => i.toLowerCase().includes(q)) ||
    (r.tags || []).some(t => t.toLowerCase().includes(q))
  );
}

// ── Export for Node.js (Jest) ──────────────────────────
if (typeof module !== 'undefined') {
  module.exports = { getAll, get, set, remove, getSaved, addCustomRecipe, updateCustomRecipe, searchSaved };
}
