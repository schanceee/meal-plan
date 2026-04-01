# Specs — Meal Plan App

## Feature: Add Custom Recipe

### User stories
- As a user, I want to add a recipe I found elsewhere so I can keep it alongside my weekly plan.
- As a user, I want to edit a saved custom recipe so I can refine it over time.
- As a user, I want to delete a custom recipe I no longer want.

### Acceptance criteria
- An "Add recipe" button is visible in the Saved Recipes section.
- The form contains: **name** (required), description, ingredients (one per line), instructions (one per step), tags (comma-separated).
- Saving with an empty name shows a validation error — recipe is not created.
- On save, the recipe is immediately visible in the Saved Recipes section.
- Custom recipes are visually distinguished from weekly-plan recipes (badge "Custom").
- Edit and Delete actions are available only on custom recipes.
- All data is persisted in `localStorage` under the key `recipeData`.

### Data shape
```json
{
  "custom-1711234567890": {
    "saved": true,
    "custom": true,
    "name": "Pasta Primavera",
    "description": "Light spring pasta",
    "ingredients": ["200g pasta", "1 zucchini"],
    "instructions": ["Cook pasta.", "Sauté zucchini."],
    "tags": ["italian", "quick"],
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
- A search input is visible in the Saved Recipes section whenever ≥ 1 recipe is saved.
- Filtering is real-time (on every keystroke).
- Search is **case-insensitive** and matches against: name, description, ingredients array, tags array.
- The result count updates as the user types (e.g. "3 recipes").
- When no recipes match, a "No recipes match your search" message is shown.
- Clearing the search input restores the full saved list.

---

## Out of scope (this iteration)
- Syncing recipes across devices.
- Importing recipes from external URLs.
- Generating a shopping list from saved recipes.
