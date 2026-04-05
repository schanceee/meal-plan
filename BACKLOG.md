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
