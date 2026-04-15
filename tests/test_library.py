"""
UI tests — Recipe Library page (library.html)
"""
import pytest
from conftest import click, seed_custom_recipe, seed_ai_recipe


# ── UI-LIB-01: Page loads ─────────────────────────────────────────
def test_library_loads(library):
    assert library.title() == "Recipe Library"
    assert library.locator("#libraryGrid").is_visible()


# ── UI-LIB-02: Built-in recipes visible by default ────────────────
def test_builtin_recipes_shown(library):
    cards = library.locator(".recipe-card")
    assert cards.count() > 0, "Expected built-in recipe cards to render"


# ── UI-LIB-03: Search filters by name ────────────────────────────
def test_search_filters_by_name(library):
    library.locator("#libSearch").fill("miso")
    library.wait_for_timeout(300)
    subtitle = library.locator("#libSubtitle").text_content()
    assert "miso" in subtitle.lower()


# ── UI-LIB-04: Search with no match shows empty message ───────────
def test_search_no_match(library):
    library.locator("#libSearch").fill("xyznonexistent")
    library.wait_for_timeout(300)
    body = library.locator("#libraryGrid").text_content()
    assert "No recipes" in body


# ── UI-LIB-05: Category filter "Starters" ────────────────────────
def test_category_filter_starters(library):
    click(library, library.locator(".lib-cat-bar button", has_text="Starters"))
    library.wait_for_timeout(300)
    subtitle = library.locator("#libSubtitle").text_content()
    count = int(subtitle.split(" recipe")[0].strip())
    assert count >= 3, f"Expected ≥3 starters, got {count}"


# ── UI-LIB-06: Category filter "Mains" ───────────────────────────
def test_category_filter_mains(library):
    click(library, library.locator(".lib-cat-bar button", has_text="Mains"))
    library.wait_for_timeout(300)
    subtitle = library.locator("#libSubtitle").text_content()
    count = int(subtitle.split(" recipe")[0].strip())
    assert count >= 8, f"Expected ≥8 mains, got {count}"


# ── UI-LIB-07: "All types" resets category filter ─────────────────
def test_category_filter_reset(library):
    click(library, library.locator(".lib-cat-bar button", has_text="Starters"))
    library.wait_for_timeout(200)
    click(library, library.locator(".lib-cat-bar button", has_text="All types"))
    library.wait_for_timeout(200)
    subtitle = library.locator("#libSubtitle").text_content()
    count = int(subtitle.split(" recipe")[0].strip())
    assert count >= 12


# ── UI-LIB-08: Custom recipe appears after reload ────────────────
def test_custom_recipe_shown(library):
    seed_custom_recipe(library, name="My Special Dish")
    library.reload()
    library.wait_for_selector("#libraryGrid")
    library.wait_for_timeout(300)
    assert library.locator(".recipe-card", has_text="My Special Dish").count() >= 1


# ── UI-LIB-09: Custom recipe card opens detail modal ─────────────
def test_custom_recipe_opens_detail(library):
    seed_custom_recipe(library, name="Detail Test Recipe")
    library.reload()
    library.wait_for_selector("#libraryGrid")
    library.locator(".recipe-card", has_text="Detail Test Recipe").first.wait_for(state="visible")
    click(library, library.locator(".recipe-card", has_text="Detail Test Recipe").first)
    library.wait_for_selector("#detailModal", state="visible", timeout=3000)
    assert library.locator("#detailModal").is_visible()


# ── UI-LIB-10: Detail modal shows recipe name ─────────────────────
def test_detail_modal_shows_name(library):
    seed_custom_recipe(library, name="Modal Name Test")
    library.reload()
    library.wait_for_selector("#libraryGrid")
    library.locator(".recipe-card", has_text="Modal Name Test").first.wait_for(state="visible")
    click(library, library.locator(".recipe-card", has_text="Modal Name Test").first)
    library.wait_for_selector("#detailModal", state="visible", timeout=3000)
    assert "Modal Name Test" in library.locator("#detailModal").text_content()


# ── UI-LIB-11: Detail modal shows ingredients ────────────────────
def test_detail_modal_shows_ingredients(library):
    seed_custom_recipe(library, name="Ingredients Test",
                       ingredients=["500g flour", "3 eggs", "200ml milk"])
    library.reload()
    library.wait_for_selector("#libraryGrid")
    library.locator(".recipe-card", has_text="Ingredients Test").first.wait_for(state="visible")
    click(library, library.locator(".recipe-card", has_text="Ingredients Test").first)
    library.wait_for_selector("#detailModal", state="visible", timeout=3000)
    modal_text = library.locator("#detailModal").text_content()
    assert "500g flour" in modal_text
    assert "3 eggs" in modal_text


# ── UI-LIB-12: Detail modal shows instructions ───────────────────
def test_detail_modal_shows_instructions(library):
    seed_custom_recipe(library, name="Instructions Test",
                       instructions=["Mix dry ingredients.", "Bake 30 min."])
    library.reload()
    library.wait_for_selector("#libraryGrid")
    library.locator(".recipe-card", has_text="Instructions Test").first.wait_for(state="visible")
    click(library, library.locator(".recipe-card", has_text="Instructions Test").first)
    library.wait_for_selector("#detailModal", state="visible", timeout=3000)
    assert "Mix dry ingredients" in library.locator("#detailModal").text_content()


# ── UI-LIB-13: AI recipe (empty fields) opens modal without crashing ─
def test_ai_recipe_detail_no_crash(library):
    """AC-03: AI-generated recipes with empty ingredients/instructions display gracefully."""
    seed_ai_recipe(library, name="AI Generated Pasta")
    library.reload()
    library.wait_for_selector("#libraryGrid")
    library.locator(".recipe-card", has_text="AI Generated Pasta").first.wait_for(state="visible")
    click(library, library.locator(".recipe-card", has_text="AI Generated Pasta").first)
    library.wait_for_selector("#detailModal", state="visible", timeout=3000)
    assert "AI Generated Pasta" in library.locator("#detailModal").text_content()


# ── UI-LIB-14: Detail modal shows placeholder when ingredients empty ─
def test_detail_modal_empty_ingredients_placeholder(library):
    """AC-03: Empty ingredients array should show a graceful placeholder."""
    seed_ai_recipe(library, name="Empty Ingredients Recipe")
    library.reload()
    library.wait_for_selector("#libraryGrid")
    library.locator(".recipe-card", has_text="Empty Ingredients Recipe").first.wait_for(state="visible")
    click(library, library.locator(".recipe-card", has_text="Empty Ingredients Recipe").first)
    library.wait_for_selector("#detailModal", state="visible", timeout=3000)
    modal_text = library.locator("#detailModal").text_content()
    has_placeholder = (
        "No ingredients" in modal_text
        or "not yet" in modal_text.lower()
        or "edit" in modal_text.lower()
    )
    assert has_placeholder, f"Expected empty-ingredients placeholder. Got: {modal_text[:300]}"


# ── UI-LIB-15: Detail modal closes on overlay click ──────────────
def test_detail_modal_closes(library):
    seed_custom_recipe(library, name="Close Test")
    library.reload()
    library.wait_for_selector("#libraryGrid")
    library.locator(".recipe-card", has_text="Close Test").first.wait_for(state="visible")
    click(library, library.locator(".recipe-card", has_text="Close Test").first)
    library.wait_for_selector("#detailModal", state="visible", timeout=3000)
    library.locator("#detailModal").click(position={"x": 5, "y": 5})
    library.wait_for_selector("#detailModal", state="hidden", timeout=3000)
    assert not library.locator("#detailModal").is_visible()


# ── UI-LIB-16: Built-in recipe card links to dedicated page ───────
def test_builtin_recipe_has_link(library):
    """AC-04: Built-in recipes still link to recettes/*.html."""
    links = library.locator("a.recipe-card")
    assert links.count() > 0, "Expected built-in recipe cards to be <a> elements with href"
    assert "recettes/" in links.first.get_attribute("href")


# ── UI-LIB-17: "Add recipe" button opens modal ────────────────────
def test_add_recipe_button(library):
    # Use the in-page button (not the nav bar duplicate)
    click(library, library.locator(".btn.btn-teal", has_text="+ Add recipe").first)
    library.wait_for_selector("#addModal", state="visible", timeout=3000)
    assert library.locator("#addModal").is_visible()


# ── UI-LIB-18: Add recipe modal has all input sections ───────────
def test_add_recipe_modal_tabs(library):
    click(library, library.locator(".btn.btn-teal", has_text="+ Add recipe").first)
    library.wait_for_selector("#addModal", state="visible", timeout=3000)
    modal_text = library.locator("#addModal").text_content()
    assert "Generate with AI" in modal_text or "AI" in modal_text
    assert "URL" in modal_text or "url" in modal_text.lower()


# ── UI-LIB-19: Manual recipe entry saves to library ───────────────
def test_manual_recipe_add(library):
    click(library, library.locator(".btn.btn-teal", has_text="+ Add recipe").first)
    library.wait_for_selector("#addModal", state="visible", timeout=3000)

    # Switch to manual tab if needed
    manual_tab = library.locator("#addModal button", has_text="Manual").first
    if manual_tab.count() > 0:
        click(library, manual_tab)
        library.wait_for_timeout(300)

    library.locator("#addTitle").fill("UI Test Recipe")
    ings = library.locator("#addIngredients").first
    if ings.count() > 0:
        ings.fill("2 eggs\n1 cup flour")

    click(library, library.locator("#addModal button", has_text="Save").last)
    library.wait_for_timeout(500)
    assert library.locator(".recipe-card", has_text="UI Test Recipe").count() >= 1


# ── UI-LIB-20: Delete custom recipe removes it ───────────────────
def test_delete_custom_recipe(library):
    seed_custom_recipe(library, name="Recipe To Delete")
    library.reload()
    library.wait_for_selector("#libraryGrid")
    library.locator(".recipe-card", has_text="Recipe To Delete").first.wait_for(state="visible")
    delete_btn = library.locator(".recipe-card", has_text="Recipe To Delete") \
                        .locator("button", has_text="Delete").first
    # Accept the confirm() dialog
    library.on("dialog", lambda d: d.accept())
    click(library, delete_btn)
    library.wait_for_timeout(500)
    assert library.locator(".recipe-card", has_text="Recipe To Delete").count() == 0


# ── UI-LIB-21: Like/save toggle changes button state ─────────────
def test_toggle_save(library):
    seed_custom_recipe(library, name="Like Toggle Test")
    library.reload()
    library.wait_for_selector("#libraryGrid")
    library.locator(".recipe-card", has_text="Like Toggle Test").first.wait_for(state="visible")
    save_btn = library.locator(".recipe-card", has_text="Like Toggle Test") \
                      .locator(".rc-save-btn").first
    initial_text = save_btn.text_content()
    click(library, save_btn)
    library.wait_for_timeout(300)
    assert save_btn.text_content() != initial_text, "Save button state should toggle"


# ── UI-LIB-22: library.html?id= auto-opens detail modal ──────────
def test_direct_url_opens_detail(library, http_server):
    """AC-02: Navigating to library.html?id=<id> should auto-open the detail modal."""
    recipe_id = seed_custom_recipe(library, name="Direct URL Recipe")
    library.goto(f"{http_server}/library.html?id={recipe_id}")
    library.wait_for_selector("#detailModal", state="visible", timeout=4000)
    assert "Direct URL Recipe" in library.locator("#detailModal").text_content()


# ── UI-LIB-23: Search matches ingredient in custom recipe ─────────
def test_search_by_ingredient(library):
    seed_custom_recipe(library, name="Tomato Bisque",
                       ingredients=["500g crushed tomatoes", "cream", "basil"])
    library.reload()
    library.wait_for_selector("#libraryGrid")
    library.wait_for_timeout(300)
    library.locator("#libSearch").fill("crushed tomatoes")
    library.wait_for_timeout(400)
    assert library.locator(".recipe-card", has_text="Tomato Bisque").count() >= 1


# ── UI-LIB-24: "Saved" filter shows only saved recipes ───────────
def test_saved_filter(library):
    library.evaluate("""
        const all = JSON.parse(localStorage.getItem('recipeData') || '{}');
        all['custom-saved-1'] = {
            saved: true, custom: true, name: 'Saved Recipe X',
            ingredients: [], instructions: [], tags: [], rating: 0, note: '', createdAt: Date.now()
        };
        all['custom-unsaved-1'] = {
            saved: false, custom: true, name: 'Unsaved Recipe Y',
            ingredients: [], instructions: [], tags: [], rating: 0, note: '', createdAt: Date.now()
        };
        localStorage.setItem('recipeData', JSON.stringify(all));
    """)
    library.reload()
    library.wait_for_selector("#libraryGrid")
    library.wait_for_timeout(300)
    click(library, library.locator(".lib-filters button", has_text="Saved"))
    library.wait_for_timeout(300)
    assert library.locator(".recipe-card", has_text="Saved Recipe X").count() >= 1
    assert library.locator(".recipe-card", has_text="Unsaved Recipe Y").count() == 0
