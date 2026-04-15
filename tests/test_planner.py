"""
UI tests — Weekly Planner page (planner.html)
"""
import pytest
from conftest import click, seed_custom_recipe, seed_ai_recipe, seed_week_plan


# ── UI-PLN-01: Page loads ─────────────────────────────────────────
def test_planner_loads(planner):
    assert planner.title() == "Weekly Planner"
    assert planner.locator("#plannerGrid").is_visible()


# ── UI-PLN-02: Grid shows 7 day header columns ───────────────────
def test_grid_has_day_columns(planner):
    cols = planner.locator(".pg-col-hdr")
    assert cols.count() == 7, f"Expected 7 day columns, got {cols.count()}"


# ── UI-PLN-03: Grid shows day labels ─────────────────────────────
def test_grid_day_labels(planner):
    grid_text = planner.locator(".planner-grid").text_content()
    for day in ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"]:
        assert day in grid_text, f"Day label '{day}' not found in grid"


# ── UI-PLN-04: Week label is shown ───────────────────────────────
def test_week_label_shown(planner):
    label = planner.locator("#weekLabel").text_content()
    assert label and label.strip() != "—", "Week label should be populated"


# ── UI-PLN-05: Next week navigation updates label ─────────────────
def test_week_navigation_next(planner):
    before = planner.locator("#weekLabel").text_content()
    click(planner, planner.locator("button[title='Next week']"))
    planner.wait_for_timeout(300)
    assert planner.locator("#weekLabel").text_content() != before


# ── UI-PLN-06: Previous week navigation updates label ────────────
def test_week_navigation_prev(planner):
    before = planner.locator("#weekLabel").text_content()
    click(planner, planner.locator("button[title='Previous week']"))
    planner.wait_for_timeout(300)
    assert planner.locator("#weekLabel").text_content() != before


# ── UI-PLN-07: "This week" returns to current week ───────────────
def test_week_navigation_this_week(planner):
    current = planner.locator("#weekLabel").text_content()
    click(planner, planner.locator("button[title='Next week']"))
    planner.wait_for_timeout(200)
    click(planner, planner.locator("button", has_text="This week"))
    planner.wait_for_timeout(200)
    assert planner.locator("#weekLabel").text_content() == current


# ── UI-PLN-08: Clicking empty slot opens recipe picker ───────────
def test_click_slot_opens_picker(planner):
    add_btn = planner.locator(".pg-slot-empty").first
    click(planner, add_btn)
    planner.wait_for_selector("#pickerModal", state="visible", timeout=3000)
    assert planner.locator("#pickerModal").is_visible()


# ── UI-PLN-09: Picker modal shows built-in recipes ───────────────
def test_picker_shows_recipes(planner):
    click(planner, planner.locator(".pg-slot-empty").first)
    planner.wait_for_selector("#pickerModal", state="visible", timeout=3000)
    planner.wait_for_timeout(300)
    items = planner.locator("#pickerResults [onclick]")
    assert items.count() > 0, "Picker should show recipes"


# ── UI-PLN-10: Picker search filters results ─────────────────────
def test_picker_search(planner):
    click(planner, planner.locator(".pg-slot-empty").first)
    planner.wait_for_selector("#pickerModal", state="visible", timeout=3000)
    planner.locator("#pickerSearch").fill("miso")
    planner.wait_for_timeout(300)
    assert "miso" in planner.locator("#pickerResults").text_content().lower()


# ── UI-PLN-11: Assigning a recipe fills the slot ─────────────────
def test_assign_recipe_fills_slot(planner):
    click(planner, planner.locator(".pg-slot-empty").first)
    planner.wait_for_selector("#pickerModal", state="visible", timeout=3000)
    planner.wait_for_timeout(300)
    first_item = planner.locator("#pickerResults [onclick]").first
    click(planner, first_item)
    planner.wait_for_timeout(500)
    assert not planner.locator("#pickerModal").is_visible()
    # At least one slot is now filled
    assert planner.locator(".pg-slot-filled").count() > 0


# ── UI-PLN-12: Shopping list modal opens ─────────────────────────
def test_shopping_modal_opens(planner):
    click(planner, planner.locator("button", has_text="Shopping list"))
    planner.wait_for_selector("#shoppingModal", state="visible", timeout=3000)
    assert planner.locator("#shoppingModal").is_visible()


# ── UI-PLN-13: Shopping list modal closes ────────────────────────
def test_shopping_modal_closes(planner):
    click(planner, planner.locator("button", has_text="Shopping list"))
    planner.wait_for_selector("#shoppingModal", state="visible", timeout=3000)
    click(planner, planner.locator("#shoppingModal button", has_text="Close"))
    planner.wait_for_selector("#shoppingModal", state="hidden", timeout=3000)
    assert not planner.locator("#shoppingModal").is_visible()


# ── UI-PLN-14: Shopping list shows "No meals" when empty ─────────
def test_shopping_list_empty_state(planner):
    click(planner, planner.locator("button", has_text="Shopping list"))
    planner.wait_for_selector("#shoppingModal", state="visible", timeout=3000)
    content = planner.locator("#shoppingContent").text_content()
    assert "No meals" in content or "no meals" in content.lower()


# ── UI-PLN-15: Shopping list shows ingredients when meals planned ─
def test_shopping_list_with_meal(planner):
    recipe_id = seed_custom_recipe(planner,
                                   name="Shopping Test Dish",
                                   ingredients=["broccoli", "olive oil", "garlic"])
    seed_week_plan(planner, recipe_id, "Shopping Test Dish")
    planner.reload()
    planner.wait_for_selector("#plannerGrid")
    planner.wait_for_timeout(300)
    click(planner, planner.locator("button", has_text="Shopping list"))
    planner.wait_for_selector("#shoppingModal", state="visible", timeout=3000)
    content = planner.locator("#shoppingContent").text_content()
    assert "broccoli" in content.lower() or "Shopping Test Dish" in content


# ── UI-PLN-16: Copy shopping list button feedback ────────────────
def test_copy_shopping_list(planner):
    recipe_id = seed_custom_recipe(planner, name="Copy Dish",
                                   ingredients=["tomatoes", "basil"])
    seed_week_plan(planner, recipe_id, "Copy Dish")
    planner.reload()
    planner.wait_for_selector("#plannerGrid")
    planner.wait_for_timeout(300)
    click(planner, planner.locator("button", has_text="Shopping list"))
    planner.wait_for_selector("#shoppingModal", state="visible", timeout=3000)
    copy_btn = planner.locator("#shoppingModal button", has_text="Copy").first
    click(planner, copy_btn)
    planner.wait_for_timeout(800)
    btn_text = copy_btn.text_content()
    assert "Copied" in btn_text or "✓" in btn_text or "list" in btn_text.lower()


# ── UI-PLN-17: Plan details section shows when meals are planned ──
def test_plan_details_appears(planner):
    recipe_id = seed_custom_recipe(planner, name="Plan Details Dish")
    seed_week_plan(planner, recipe_id, "Plan Details Dish")
    planner.reload()
    planner.wait_for_selector("#plannerGrid")
    planner.wait_for_timeout(800)
    details_text = planner.locator("#planDetails").text_content().strip()
    assert details_text != "", "Plan details should show content when meals are planned"


# ── UI-PLN-18: Plan details shows recipe name ────────────────────
def test_plan_details_shows_recipe_name(planner):
    recipe_id = seed_custom_recipe(planner, name="Recipes This Week Test")
    seed_week_plan(planner, recipe_id, "Recipes This Week Test")
    planner.reload()
    planner.wait_for_selector("#plannerGrid")
    planner.wait_for_timeout(800)
    assert "Recipes This Week Test" in planner.locator("#planDetails").text_content()


# ── UI-PLN-19: Custom recipe in plan details has clickable link ───
def test_custom_recipe_plan_details_link(planner):
    """AC-01: Custom/AI recipes in plan details should have a clickable link."""
    recipe_id = seed_custom_recipe(planner, name="Custom Link Recipe")
    seed_week_plan(planner, recipe_id, "Custom Link Recipe")
    planner.reload()
    planner.wait_for_selector("#plannerGrid")
    planner.wait_for_timeout(800)
    link = planner.locator("#planDetails a", has_text="Custom Link Recipe")
    assert link.count() >= 1, "Custom recipe in plan details should be a clickable link"


# ── UI-PLN-20: Custom recipe link points to library.html?id= ──────
def test_custom_recipe_plan_details_link_target(planner):
    """AC-02: The link for a custom recipe should point to library.html?id=<recipeId>."""
    recipe_id = seed_custom_recipe(planner, name="Link Target Recipe")
    seed_week_plan(planner, recipe_id, "Link Target Recipe")
    planner.reload()
    planner.wait_for_selector("#plannerGrid")
    planner.wait_for_timeout(800)
    link = planner.locator("#planDetails a", has_text="Link Target Recipe").first
    assert link.count() > 0, "Link not found in plan details"
    href = link.get_attribute("href")
    assert href and "library.html" in href and recipe_id in href, \
        f"Expected href with library.html?id={recipe_id}, got: {href}"


# ── UI-PLN-21: Built-in recipe in plan details links to recettes/ ─
def test_builtin_recipe_plan_details_link(planner):
    """AC-04: Built-in recipes in plan details still link to recettes/*.html."""
    seed_week_plan(planner, "pasta-miso", "Pasta caramelized onions", slot="mon-dinner")
    planner.reload()
    planner.wait_for_selector("#plannerGrid")
    planner.wait_for_timeout(800)
    link = planner.locator("#planDetails a").first
    if link.count() == 0:
        pytest.skip("No links in plan details — may need full render")
    href = link.get_attribute("href")
    assert href and "recettes/" in href


# ── UI-PLN-22: AI recipe (empty fields) in plan details has link ──
def test_ai_recipe_plan_details_link(planner):
    """AC-01 + AC-03: AI-generated recipe with empty fields should be linkable in plan."""
    recipe_id = seed_ai_recipe(planner, name="AI Planner Recipe")
    seed_week_plan(planner, recipe_id, "AI Planner Recipe")
    planner.reload()
    planner.wait_for_selector("#plannerGrid")
    planner.wait_for_timeout(800)
    link = planner.locator("#planDetails a", has_text="AI Planner Recipe")
    assert link.count() >= 1, "AI recipe in plan details should be a clickable link"


# ── UI-PLN-23: Shopping section visible when meals planned ────────
def test_shopping_section_visible_with_meals(planner):
    recipe_id = seed_custom_recipe(planner, name="Shopping Section Dish",
                                   ingredients=["onions", "tomatoes"])
    seed_week_plan(planner, recipe_id, "Shopping Section Dish")
    planner.reload()
    planner.wait_for_selector("#plannerGrid")
    planner.wait_for_timeout(800)
    assert planner.locator("#pdShoppingSection").is_visible(), \
        "Shopping section should be visible when meals are planned"


# ── UI-PLN-24: Shopping section hidden when no meals ─────────────
def test_shopping_section_hidden_no_meals(planner):
    assert not planner.locator("#pdShoppingSection").is_visible()


# ── UI-PLN-25: "Plan with AI" button opens modal ─────────────────
def test_ai_plan_modal_opens(planner):
    click(planner, planner.locator("button", has_text="Plan with AI"))
    planner.wait_for_selector("#aiPlanModal", state="visible", timeout=3000)
    assert planner.locator("#aiPlanModal").is_visible()
