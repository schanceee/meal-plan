"""
UI tests — Feedback modal (floating action button → #feedbackModal)
"""
import pytest
from conftest import click


def open_feedback(page):
    """Open the feedback modal via the floating action button."""
    fab = page.locator("#feedbackFab")
    if fab.count() == 0:
        pytest.skip("Feedback FAB (#feedbackFab) not found — nav.js may not have loaded")
    click(page, fab)
    page.wait_for_selector("#feedbackModal", state="visible", timeout=3000)


# ── UI-FB-01: Feedback FAB exists on library page ────────────────
def test_feedback_fab_exists(library):
    assert library.locator("#feedbackFab").count() > 0, \
        "Feedback floating action button (#feedbackFab) should be present"


# ── UI-FB-02: Feedback FAB exists on planner page ────────────────
def test_feedback_fab_on_planner(planner):
    assert planner.locator("#feedbackFab").count() > 0, \
        "Feedback FAB should be present on planner page"


# ── UI-FB-03: Clicking FAB opens feedback modal ───────────────────
def test_feedback_modal_opens(library):
    open_feedback(library)
    assert library.locator("#feedbackModal").is_visible()


# ── UI-FB-04: Feedback modal has textarea ────────────────────────
def test_feedback_has_textarea(library):
    open_feedback(library)
    assert library.locator("#feedbackText").is_visible()


# ── UI-FB-05: Feedback modal closes on Cancel ────────────────────
def test_feedback_modal_closes(library):
    open_feedback(library)
    click(library, library.locator("#feedbackModal button", has_text="Cancel"))
    library.wait_for_selector("#feedbackModal", state="hidden", timeout=3000)
    assert not library.locator("#feedbackModal").is_visible()


# ── UI-FB-06: Submit without text shows error or keeps modal open ─
def test_feedback_submit_empty(library):
    open_feedback(library)
    click(library, library.locator("#feedbackSubmitBtn"))
    library.wait_for_timeout(400)
    # Either stays open or shows an error
    still_open = library.locator("#feedbackModal").is_visible()
    err_text = library.locator("#feedbackErr").text_content()
    assert still_open or len(err_text) > 0, \
        "Empty feedback should fail gracefully"
