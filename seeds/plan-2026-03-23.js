/**
 * Seed: Late March 2026 weekly plan (week of 23 March)
 * Extracted from the original index.html editorial plan.
 *
 * How to use — run this in the browser console while logged in to your account
 * on the live site. It will save the plan to localStorage AND push it to Supabase.
 *
 *   1. Open https://schanceee.github.io/meal-plan/planner.html
 *   2. Open DevTools → Console
 *   3. Paste the entire contents of this file and press Enter
 */

(function () {
  var WEEK_KEY = '2026-03-23';

  function slot(recipeId, recipeName, tags) {
    return { recipeId: recipeId, recipeName: recipeName, tags: tags || [], isNew: false, aiSuggestion: null };
  }

  var plan = {
    slots: {
      'mon-lunch':  null,
      'mon-dinner': slot('pasta-miso',         'Pasta \xb7 caramelized onions \xb7 miso \xb7 Gruy\xe8re \xb7 sage',          ['vegetarian','miso']),
      'tue-lunch':  null,
      'tue-dinner': slot('bol-cereales',        'Grain bowl \xb7 roasted veg \xb7 lentils \xb7 tahini-tamari',                ['vegetarian','tamari']),
      'wed-lunch':  null,
      'wed-dinner': slot('poulet-chou-savoie',  'Braised chicken \xb7 Savoy cabbage \xb7 mustard',                            ['meat','chicken']),
      'thu-lunch':  null,
      'thu-dinner': slot('dal-lentilles',       'Lentil Dal \xb7 cumin tadka \xb7 kefir \xb7 rice',                           ['vegetarian','kefir']),
      'fri-lunch':  null,
      'fri-dinner': slot('perche-lac',          'Lake perch \xb7 wild garlic butter \xb7 spinach \xb7 potatoes',              ['fish']),
      'sat-lunch':  slot('salade-betteraves',   'Warm beet salad \xb7 lentils \xb7 farro \xb7 goat cheese',                  ['vegetarian']),
      'sat-dinner': slot('shakshuka',           'Spiced Shakshuka \xb7 roasted peppers \xb7 feta',                            ['vegetarian']),
      'sun-lunch':  slot('tarte-poireaux',      'Thin leek tart \xb7 Gruy\xe8re \xb7 cr\xe8me fra\xeeche',                   ['vegetarian']),
      'sun-dinner': slot('veloute-choufleur',   'Cauliflower velout\xe9 \xb7 miso \xb7 hazelnuts \xb7 goat cheese toast',    ['vegetarian','miso'])
    },
    notes: 'Late March \u2014 Lausanne. Mostly vegetarian, fermented ingredients, Sunday meal prep.',
    createdAt: 1742688000000,
    updatedAt: 1742688000000
  };

  // 1. Save to localStorage
  localStorage.setItem('weekPlan_' + WEEK_KEY, JSON.stringify(plan));
  console.log('[seed] Plan saved to localStorage for week', WEEK_KEY);

  // 2. Push to Supabase if user is logged in
  if (typeof window._syncPlan === 'function') {
    window._syncPlan(WEEK_KEY, plan);
    console.log('[seed] Plan pushed to Supabase.');
  } else {
    console.warn('[seed] _syncPlan not available \u2014 make sure you are logged in and on a page that loads nav.js.');
  }

  console.log('[seed] Done. Navigate to the planner and go back to the week of 23 March to verify.');
})();
