const { getAll, get, set, remove, getSaved, addCustomRecipe, updateCustomRecipe, searchSaved } = require('./recipes');

// ── localStorage mock ─────────────────────────────────
const localStorageMock = (() => {
  let store = {};
  return {
    getItem:  (k)    => store[k] ?? null,
    setItem:  (k, v) => { store[k] = String(v); },
    clear:    ()     => { store = {}; },
  };
})();
global.localStorage = localStorageMock;

beforeEach(() => localStorage.clear());

// ── addCustomRecipe ───────────────────────────────────

describe('addCustomRecipe', () => {
  test('creates a recipe with the given name', () => {
    const r = addCustomRecipe({ name: 'Pasta Primavera' });
    expect(r.name).toBe('Pasta Primavera');
  });

  test('marks the recipe as saved and custom', () => {
    const r = addCustomRecipe({ name: 'Test' });
    expect(r.saved).toBe(true);
    expect(r.custom).toBe(true);
  });

  test('trims whitespace from name', () => {
    const r = addCustomRecipe({ name: '  Pasta  ' });
    expect(r.name).toBe('Pasta');
  });

  test('throws when name is missing', () => {
    expect(() => addCustomRecipe({ description: 'No name' })).toThrow('Recipe name is required');
  });

  test('throws when name is blank', () => {
    expect(() => addCustomRecipe({ name: '   ' })).toThrow('Recipe name is required');
  });

  test('throws when called with no argument', () => {
    expect(() => addCustomRecipe()).toThrow('Recipe name is required');
  });

  test('stores ingredients array', () => {
    const r = addCustomRecipe({ name: 'Test', ingredients: ['egg', 'flour'] });
    expect(r.ingredients).toEqual(['egg', 'flour']);
  });

  test('defaults to empty arrays when fields are omitted', () => {
    const r = addCustomRecipe({ name: 'Minimal' });
    expect(r.ingredients).toEqual([]);
    expect(r.instructions).toEqual([]);
    expect(r.tags).toEqual([]);
  });

  test('stores instructions array', () => {
    const r = addCustomRecipe({ name: 'Test', instructions: ['Boil water', 'Add pasta'] });
    expect(r.instructions).toEqual(['Boil water', 'Add pasta']);
  });

  test('stores tags array', () => {
    const r = addCustomRecipe({ name: 'Test', tags: ['italian', 'quick'] });
    expect(r.tags).toEqual(['italian', 'quick']);
  });

  test('generates unique ids for multiple recipes', () => {
    addCustomRecipe({ name: 'A' });
    addCustomRecipe({ name: 'B' });
    const ids = Object.keys(getAll());
    expect(new Set(ids).size).toBe(2);
    expect(ids.every(id => id.startsWith('custom-'))).toBe(true);
  });

  test('sets createdAt timestamp', () => {
    const before = Date.now();
    const r = addCustomRecipe({ name: 'Timed' });
    expect(r.createdAt).toBeGreaterThanOrEqual(before);
    expect(r.createdAt).toBeLessThanOrEqual(Date.now());
  });
});

// ── updateCustomRecipe ────────────────────────────────

describe('updateCustomRecipe', () => {
  test('updates the name of a custom recipe', () => {
    addCustomRecipe({ name: 'Old Name' });
    const id = Object.keys(getAll())[0];
    const r = updateCustomRecipe(id, { name: 'New Name' });
    expect(r.name).toBe('New Name');
  });

  test('throws when trying to edit a non-custom recipe', () => {
    set('weekly-1', { name: 'Weekly dish', saved: true, custom: false });
    expect(() => updateCustomRecipe('weekly-1', { name: 'Hack' })).toThrow('Only custom recipes can be edited');
  });

  test('throws when updated name is blank', () => {
    addCustomRecipe({ name: 'Good' });
    const id = Object.keys(getAll())[0];
    expect(() => updateCustomRecipe(id, { name: '  ' })).toThrow('Recipe name is required');
  });
});

// ── searchSaved ───────────────────────────────────────

describe('searchSaved', () => {
  beforeEach(() => {
    addCustomRecipe({ name: 'Pasta Primavera', description: 'Light spring pasta', ingredients: ['pasta', 'zucchini'], tags: ['italian'] });
    addCustomRecipe({ name: 'Miso Soup',       description: 'Japanese classic',   ingredients: ['miso', 'tofu'],    tags: ['japanese', 'soup'] });
    addCustomRecipe({ name: 'Shakshuka',       description: 'Eggs in tomato sauce', ingredients: ['eggs', 'tomatoes'], tags: ['middle-eastern'] });
  });

  test('returns all saved recipes when query is empty string', () => {
    expect(searchSaved('')).toHaveLength(3);
  });

  test('returns all saved recipes when query is null', () => {
    expect(searchSaved(null)).toHaveLength(3);
  });

  test('returns all saved recipes when query is whitespace', () => {
    expect(searchSaved('   ')).toHaveLength(3);
  });

  test('filters by name (exact, case-insensitive)', () => {
    expect(searchSaved('pasta')).toHaveLength(1);
    expect(searchSaved('PASTA')).toHaveLength(1);
    expect(searchSaved('Pasta')).toHaveLength(1);
  });

  test('filters by partial name match', () => {
    expect(searchSaved('miso')).toHaveLength(1);
  });

  test('filters by description', () => {
    expect(searchSaved('spring')).toHaveLength(1);
    expect(searchSaved('classic')).toHaveLength(1);
  });

  test('filters by ingredient', () => {
    expect(searchSaved('tofu')).toHaveLength(1);
    expect(searchSaved('eggs')).toHaveLength(1);
  });

  test('filters by tag', () => {
    expect(searchSaved('italian')).toHaveLength(1);
    expect(searchSaved('soup')).toHaveLength(1);
  });

  test('returns empty array when nothing matches', () => {
    expect(searchSaved('nonexistent')).toHaveLength(0);
  });

  test('returns ids on each result', () => {
    const results = searchSaved('pasta');
    expect(results[0].id).toMatch(/^custom-/);
  });

  test('only returns saved recipes', () => {
    set('unsaved-1', { name: 'Pasta unsaved', saved: false });
    expect(searchSaved('pasta')).toHaveLength(1); // unsaved one excluded
  });
});

// ── getSaved ──────────────────────────────────────────

describe('getSaved', () => {
  test('returns empty array when nothing is saved', () => {
    expect(getSaved()).toEqual([]);
  });

  test('excludes recipes where saved is false', () => {
    set('r1', { name: 'Saved',   saved: true });
    set('r2', { name: 'Unsaved', saved: false });
    expect(getSaved()).toHaveLength(1);
    expect(getSaved()[0].name).toBe('Saved');
  });

  test('includes the id field on each result', () => {
    set('r1', { name: 'Test', saved: true });
    expect(getSaved()[0].id).toBe('r1');
  });
});

// ── remove ────────────────────────────────────────────

describe('remove', () => {
  test('deletes a recipe from storage', () => {
    addCustomRecipe({ name: 'To Delete' });
    const id = Object.keys(getAll())[0];
    remove(id);
    expect(getAll()[id]).toBeUndefined();
  });

  test('does not affect other recipes', () => {
    addCustomRecipe({ name: 'Keep' });
    addCustomRecipe({ name: 'Delete me' });
    const [keepId, deleteId] = Object.keys(getAll());
    remove(deleteId);
    expect(getAll()[keepId]).toBeDefined();
  });
});
