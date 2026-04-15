"""
UI tests — Add Recipe modal (all entry paths)
"""
import pytest
from conftest import click, seed_custom_recipe


def open_add_modal(page):
    """Click the in-page Add recipe button (not the nav bar duplicate)."""
    click(page, page.locator(".btn.btn-teal", has_text="+ Add recipe").first)
    page.wait_for_selector("#addModal", state="visible", timeout=3000)


# ── UI-ADD-01: Add modal opens ────────────────────────────────────
def test_add_modal_opens(library):
    open_add_modal(library)
    assert library.locator("#addModal").is_visible()


# ── UI-ADD-02: Modal has Generate with AI section ─────────────────
def test_modal_has_ai_section(library):
    open_add_modal(library)
    modal_text = library.locator("#addModal").text_content()
    assert "Generate with AI" in modal_text or "AI" in modal_text


# ── UI-ADD-03: Modal has URL import input ────────────────────────
def test_modal_has_url_section(library):
    open_add_modal(library)
    assert library.locator("#addModal").text_content().lower().find("url") >= 0


# ── UI-ADD-04: Modal has name input ──────────────────────────────
def test_modal_has_name_input(library):
    open_add_modal(library)
    assert library.locator("#addTitle").count() > 0


# ── UI-ADD-05: Modal closes on cancel ────────────────────────────
def test_modal_closes_on_cancel(library):
    open_add_modal(library)
    cancel_btn = library.locator("#addModal button", has_text="Cancel").first
    if cancel_btn.count() == 0:
        cancel_btn = library.locator("#addModal button", has_text="Close").first
    click(library, cancel_btn)
    library.wait_for_selector("#addModal", state="hidden", timeout=3000)
    assert not library.locator("#addModal").is_visible()


# ── UI-ADD-06: Name required — modal stays open when blank ────────
def test_name_required(library):
    open_add_modal(library)
    click(library, library.locator("#addModal button", has_text="Save").last)
    library.wait_for_timeout(300)
    assert library.locator("#addModal").is_visible(), \
        "Modal should remain open when name is missing"


# ── UI-ADD-07: Manual save — recipe appears in library ────────────
def test_manual_save_appears(library):
    open_add_modal(library)

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


# ── UI-ADD-08: Edit recipe pre-populates form fields ─────────────
def test_edit_recipe_prepopulates(library):
    seed_custom_recipe(library, name="Prepopulate Test",
                       ingredients=["item1", "item2"])
    library.reload()
    library.wait_for_selector("#libraryGrid")
    library.locator(".recipe-card", has_text="Prepopulate Test").first.wait_for(state="visible")
    edit_btn = library.locator(".recipe-card", has_text="Prepopulate Test") \
                      .locator("button", has_text="Edit").first
    click(library, edit_btn)
    library.wait_for_selector("#addModal", state="visible", timeout=3000)
    assert "Prepopulate Test" in library.locator("#addTitle").input_value()


# ── UI-ADD-09: Edit recipe saves updated name ────────────────────
def test_edit_recipe_saves_update(library):
    seed_custom_recipe(library, name="Before Edit")
    library.reload()
    library.wait_for_selector("#libraryGrid")
    library.locator(".recipe-card", has_text="Before Edit").first.wait_for(state="visible")
    edit_btn = library.locator(".recipe-card", has_text="Before Edit") \
                      .locator("button", has_text="Edit").first
    click(library, edit_btn)
    library.wait_for_selector("#addModal", state="visible", timeout=3000)
    library.locator("#addTitle").fill("After Edit")
    click(library, library.locator("#addModal button", has_text="Save").last)
    library.wait_for_timeout(500)
    assert library.locator(".recipe-card", has_text="After Edit").count() >= 1
    assert library.locator(".recipe-card", has_text="Before Edit").count() == 0


# ── UI-ADD-10: AI Generate button is present ─────────────────────
def test_ai_generate_button(library):
    open_add_modal(library)
    gen_btn = library.locator("#addGenBtn, [onclick*='GenerateWithAi'], [onclick*='generateWithAi']").first
    if gen_btn.count() == 0:
        gen_btn = library.locator("#addModal button", has_text="Generate").first
    assert gen_btn.count() > 0, "Generate with AI button should be in modal"


# ── UI-ADD-11: Generate without API key shows error ───────────────
def test_ai_generate_no_key_shows_error(library):
    library.evaluate("localStorage.removeItem('claudeApiKey')")
    open_add_modal(library)

    prompt_area = library.locator("#addGenPrompt").first
    if prompt_area.count() > 0:
        prompt_area.fill("chicken pasta")

    gen_btn = library.locator("#addGenBtn").first
    if gen_btn.count() == 0:
        gen_btn = library.locator("#addModal button", has_text="Generate").first
    if gen_btn.count() == 0:
        pytest.skip("Generate button not found")

    click(library, gen_btn)
    library.wait_for_timeout(500)

    modal_text = library.locator("#addModal").text_content()
    assert "api key" in modal_text.lower() or "key" in modal_text.lower(), \
        "Should show API key error when key is not set"
