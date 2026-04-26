# Backlog — Meal Plan App

## Done ✓

- [x] Weekly meal plan with 12 editorial recipes
- [x] Multi-page recipe site with schema.org/Recipe JSON-LD
- [x] Bring! widget on planner shopping section
- [x] GitHub Pages deployment (schanceee.github.io/meal-plan)
- [x] Sunday meal prep instructions (AI-generated, step cards)
- [x] Star ratings (1–5) per recipe with localStorage persistence
- [x] Personal notes per recipe (modal)
- [x] Like / save recipes
- [x] Add, edit, delete custom recipes
- [x] Recipe Library with search, filter by type/category, saved filter
- [x] Weekly Planner with AI-generated plan (full week + single slot)
- [x] AI plan preview: new recipe list with per-recipe "+ Library" save
- [x] Shopping list modal with Bring! export and clipboard copy
- [x] Bottom tab bar for mobile (Home / Library / Planner)
- [x] Recipe links in planner slots and dashboard week strip (custom → library?q=)
- [x] Back navigation on recipe pages (history.back() with fallback)
- [x] Supabase auth (sign in / sign up / sign out)

## Feature: Authentication — Login Page

Implementation order: AUTH-01 → AUTH-02 → AUTH-03 → AUTH-04 → AUTH-05 → AUTH-06

- **AUTH-01** (S) — Create `auth-guard.js` — FR-01, TR-02 — _no deps_
- **AUTH-02** (S) — Add guard `<script>` to `index.html`, `library.html`, `planner.html` — FR-01, TR-07 — _needs AUTH-01_
- **AUTH-03** (M) — Create `login.html`: layout, tabs, email/password sign-in + sign-up — FR-02, FR-03, FR-04, TR-01, TR-08 — _no deps_
- **AUTH-04** (M) — Add Google + Apple OAuth to `login.html`, handle callback — FR-05, FR-06, FR-07, TR-04, TR-05 — _needs AUTH-03_
- **AUTH-05** (S) — Remove auth modal from `nav.js` (`openAuthModal`, `authSignIn`, `authSignUp`, `#authModal` HTML) — TR-06 — _needs AUTH-03_
- **AUTH-06** (S) — Simplify nav bar (always-authenticated), `authSignOut` redirects to `login.html` — TR-06, TR-03 — _needs AUTH-05_

---

## In Progress 🔨

- [ ] AI new-recipe save flow: fix "+ Library" to save directly (no modal), deduplicate on "Apply this plan"
- [ ] Ghost recipe cleanup: slots pointing to missing library entries cleared on planner load
- [ ] Ensure picker only shows recipes that exist in the library

## Backlog 📋

### Short-term

- [ ] Recipe detail modal for custom recipes (full view with ingredients + instructions)
- [ ] Export saved recipes as printable PDF
- [ ] Planner: drag-and-drop to rearrange meal slots

### Medium-term

- [ ] Mobile PWA (offline support, add to home screen)
- [ ] Nutrition info per recipe (manual entry)
- [ ] Share a recipe via URL (encode data in URL hash)

### Long-term

- [ ] Sync recipes across devices (requires backend or third-party storage)
- [ ] Import recipes from external URLs (recipe scraper)
