# Specs — Meal Plan App

## Feature: Add Custom Recipe

### User stories
- As a user, I want to add a recipe I found elsewhere so I can keep it alongside my weekly plan.
- As a user, I want to edit a saved custom recipe so I can refine it over time.
- As a user, I want to delete a custom recipe I no longer want.

### Acceptance criteria
- An "Add recipe" button is visible in the Library and Planner sections.
- The form contains: **name** (required), description, ingredients (one per line), instructions (one per step), tags (comma-separated).
- Saving with an empty name shows a validation error — recipe is not created.
- On save, the recipe is immediately visible in the Library.
- Custom recipes are visually distinguished from weekly-plan recipes.
- Edit and Delete actions are available on all recipes.
- All data is persisted in `localStorage` under the key `recipeData`.

### Data shape
```json
{
  "custom-1711234567890-1234": {
    "saved": true,
    "custom": true,
    "name": "Pasta Primavera",
    "description": "Light spring pasta",
    "ingredients": ["200g pasta", "1 zucchini"],
    "instructions": ["Cook pasta.", "Sauté zucchini."],
    "tags": ["italian", "quick"],
    "category": "main",
    "rating": 4,
    "note": "Add lemon zest next time.",
    "createdAt": 1711234567890
  }
}
```

---

## Feature: Search Saved Recipes

### User stories
- As a user, I want to search my saved recipes so I can quickly find one by name or ingredient.

### Acceptance criteria
- A search input is visible in the Library whenever ≥ 1 recipe is saved.
- Filtering is real-time (on every keystroke).
- Search is **case-insensitive** and matches against: name, description, ingredients array, tags array.
- The result count updates as the user types (e.g. "3 recipes").
- When no recipes match, a "No recipes match your search" message is shown.
- Clearing the search input restores the full list.

---

## Feature: AI Weekly Plan Generation

### User stories
- As a user, I want to generate a full week plan using AI so I can plan meals quickly.
- As a user, I want to review and adjust the plan before applying it.
- As a user, I want new AI-suggested recipes saved to my library without extra steps.
- As a user, I want to save individual new recipes from the preview independently from saving the plan.
- As a user, I want no duplicate entries if I save a recipe before applying the whole plan.

### Acceptance criteria
- AI returns a plan with `slots` (day-meal assignments) and `newRecipes` (full details for new recipes).
- Preview shows the weekly grid and a list of new recipes with "+ Library" buttons.
- Clicking "+ Library" saves the recipe immediately (no modal) and changes button to "✓ Saved".
- Clicking "Apply this plan" saves all remaining unsaved new recipes automatically, then saves the plan.
- A recipe already saved via "+ Library" is not saved again when "Apply this plan" is clicked.
- After applying, planner slots show `↗` links to the recipe in the library.
- Dashboard week strip shows linked recipe names for custom recipes.

### _pendingAi data shape (in-memory only, not persisted)
```json
{
  "notes": "Planning rationale",
  "slots": {
    "mon-dinner": {
      "recipeId": null,
      "recipeName": "New Dish",
      "tags": ["vegetarian"],
      "isNew": true
    }
  },
  "newRecipes": [
    {
      "slotKey": "mon-dinner",
      "name": "New Dish",
      "description": "A hearty dish",
      "ingredients": ["onion", "lentils"],
      "instructions": ["Sauté onion", "Add lentils"],
      "tags": ["vegetarian"],
      "savedId": null
    }
  ]
}
```
`savedId` is set by the app (not the AI) when the user saves a recipe early via "+ Library".

### Invariants
- Every custom recipe in `localStorage` must have `custom: true` and `saved: true`.
- A plan slot's `recipeId` must either point to a valid `localStorage` entry or be `null`.
- Ghost slots (plan references a non-existent recipe) are cleaned up on planner load.

---

## Feature: Planner & Dashboard Recipe Links

### Acceptance criteria
- WEEKLY recipes in planner slots show `↗` linking to their HTML recipe page.
- Custom recipes in planner slots show `↗` linking to `library.html?q=<name>`.
- Dashboard week strip shows recipe names as clickable links (same rule as above).
- Custom recipes without a valid `recipeId` do not show a broken link.

---

## Out of scope (this iteration)
- Syncing recipes across devices.
- Importing recipes from external URLs.
- Nutrition info per recipe.
