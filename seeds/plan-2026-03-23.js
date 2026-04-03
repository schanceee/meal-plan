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

  var plan = {
    slots: {
      'mon-lunch':  null,
      'mon-dinner': 'pasta-miso',
      'tue-lunch':  null,
      'tue-dinner': 'bol-cereales',
      'wed-lunch':  null,
      'wed-dinner': 'poulet-chou-savoie',
      'thu-lunch':  null,
      'thu-dinner': 'dal-lentilles',
      'fri-lunch':  null,
      'fri-dinner': 'perche-lac',
      'sat-lunch':  'salade-betteraves',
      'sat-dinner': 'shakshuka',
      'sun-lunch':  'tarte-poireaux',
      'sun-dinner': 'veloute-choufleur'
    },
    notes: 'Late March — Lausanne. Mostly vegetarian, fermented ingredients, Sunday meal prep.',
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
    console.warn('[seed] _syncPlan not available — make sure you are logged in and on a page that loads nav.js.');
  }

  console.log('[seed] Done. Navigate to the planner and go back to the week of 23 March to verify.');
})();
