"""
Shared fixtures and helpers for meal-plan UI tests.
"""
import json
import subprocess
import time
import socket
import pytest

PORT = 8889
BASE = f"http://localhost:{PORT}"

# ── Fake session pre-seeded into every guarded-page test ─────────
# Stored via browser_context_args (storage_state) so it is in
# localStorage BEFORE the first navigation — this is the reliable
# way to bypass auth-guard.js in non-auth tests.
# expires_at = 9999999999 (year 2286) so it never expires.
FAKE_SESSION = json.dumps({
    "access_token": "fake-test-access-token",
    "refresh_token": "fake-test-refresh-token",
    "expires_at": 9999999999,
    "user": {"id": "test-uid-abc123", "email": "test@example.com"}
})

# ── Ripple ring CSS injected into every page ──────────────────────
RIPPLE_CSS = """
._pw_ripple {
  position: fixed;
  width: 60px; height: 60px;
  border-radius: 50%;
  border: 3px solid orange;
  pointer-events: none;
  z-index: 999999;
  animation: _pw_pop 1.2s ease-out forwards;
}
@keyframes _pw_pop {
  0%   { transform: scale(0.3); opacity: 1; }
  100% { transform: scale(2.0); opacity: 0; }
}
"""


def click(page, locator, **kwargs):
    """Click with a visible orange ripple ring at the target element."""
    locator.scroll_into_view_if_needed()
    box = locator.bounding_box()
    if box:
        cx = box['x'] + box['width'] / 2
        cy = box['y'] + box['height'] / 2
        page.evaluate(f"""
            const r = document.createElement('div');
            r.className = '_pw_ripple';
            r.style.left = '{cx - 30}px';
            r.style.top  = '{cy - 30}px';
            document.body.appendChild(r);
            setTimeout(() => r.remove(), 1200);
        """)
        page.wait_for_timeout(180)
    locator.click(**kwargs)


def wait_for_text(page, selector, text, timeout=5000):
    """Wait for a locator containing text to be visible."""
    page.locator(selector, has_text=text).first.wait_for(state="visible", timeout=timeout)


def _port_free(port):
    with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as s:
        return s.connect_ex(('localhost', port)) != 0


@pytest.fixture(scope="session")
def http_server():
    """Serve the meal-plan directory on PORT for the test session."""
    import os
    if not _port_free(PORT):
        yield BASE
        return
    proc = subprocess.Popen(
        ["python3", "-m", "http.server", str(PORT)],
        cwd=os.path.dirname(os.path.dirname(__file__)),
        stdout=subprocess.DEVNULL,
        stderr=subprocess.DEVNULL,
    )
    time.sleep(0.8)
    yield BASE
    proc.terminate()
    proc.wait()


@pytest.fixture
def browser_context_args(browser_context_args):
    """Pre-seed localStorage with a valid auth session for all default-context tests.
    This runs before any navigation so auth-guard.js always finds a valid session.
    bare_page creates its own context without this, so it stays unauthenticated."""
    return {
        **browser_context_args,
        "storage_state": {
            "cookies": [],
            "origins": [{
                "origin": BASE,
                "localStorage": [{"name": "sbSession", "value": FAKE_SESSION}]
            }]
        }
    }


@pytest.fixture
def page(page, http_server):
    """Playwright page with ripple CSS pre-injected."""
    page.add_init_script(f"""
        (() => {{
            const style = document.createElement('style');
            style.textContent = `{RIPPLE_CSS}`;
            document.head.appendChild(style);
        }})();
    """)
    yield page


@pytest.fixture
def bare_page(browser, http_server):
    """Fresh browser context with NO session — for testing auth guard behaviour.
    Creates its own context (bypassing browser_context_args) so localStorage
    starts empty. Use exclusively in test_auth.py for unauthenticated tests."""
    context = browser.new_context()
    p = context.new_page()
    p.add_init_script(f"""
        (() => {{
            const style = document.createElement('style');
            style.textContent = `{RIPPLE_CSS}`;
            document.head.appendChild(style);
        }})();
    """)
    yield p
    context.close()


@pytest.fixture
def library(page, http_server):
    """Navigate to library.html, clear recipe data (keeping session), wait for render."""
    page.goto(f"{http_server}/library.html")
    # Clear recipe data but preserve the session so auth-guard.js passes on reloads.
    page.evaluate("""
        const session = localStorage.getItem('sbSession');
        localStorage.clear();
        if (session) localStorage.setItem('sbSession', session);
    """)
    page.wait_for_selector("#libraryGrid", timeout=5000)
    return page


@pytest.fixture
def planner(page, http_server):
    """Navigate to planner.html, clear recipe data (keeping session), wait for grid."""
    page.goto(f"{http_server}/planner.html")
    page.evaluate("""
        const session = localStorage.getItem('sbSession');
        localStorage.clear();
        if (session) localStorage.setItem('sbSession', session);
    """)
    page.wait_for_selector("#plannerGrid", timeout=5000)
    return page


def seed_custom_recipe(page, *, name="Test Pasta", ingredients=None, instructions=None,
                       tags=None, description="A tasty dish", category="main",
                       servings="2", prepTime="10 min", cookTime="20 min"):
    """Inject a custom recipe directly into localStorage."""
    if ingredients is None:
        ingredients = ["200g pasta", "2 tbsp olive oil", "2 cloves garlic"]
    if instructions is None:
        instructions = ["Boil pasta.", "Fry garlic in oil.", "Combine and serve."]
    if tags is None:
        tags = ["vegetarian", "quick"]

    ing_js = "[" + ", ".join(f'"{i}"' for i in ingredients) + "]"
    instr_js = "[" + ", ".join(f'"{i}"' for i in instructions) + "]"
    tags_js = "[" + ", ".join(f'"{t}"' for t in tags) + "]"

    page.evaluate(f"""
        const id = 'custom-test-' + Date.now() + '-' + Math.random().toString(36).slice(2);
        const all = JSON.parse(localStorage.getItem('recipeData') || '{{}}');
        all[id] = {{
            saved: true, custom: true,
            name: {repr(name)},
            description: {repr(description)},
            ingredients: {ing_js},
            instructions: {instr_js},
            tags: {tags_js},
            category: {repr(category)},
            servings: {repr(servings)},
            prepTime: {repr(prepTime)},
            cookTime: {repr(cookTime)},
            rating: 0, note: '', createdAt: Date.now()
        }};
        localStorage.setItem('recipeData', JSON.stringify(all));
        window._testRecipeId = id;
    """)
    return page.evaluate("window._testRecipeId")


def seed_ai_recipe(page, *, name="AI Stir Fry", tags=None):
    """Inject an AI-generated recipe (empty ingredients/instructions) into localStorage."""
    if tags is None:
        tags = ["quick", "wok"]
    tags_js = "[" + ", ".join(f'"{t}"' for t in tags) + "]"
    page.evaluate(f"""
        const id = 'custom-ai-' + Date.now() + '-' + Math.random().toString(36).slice(2);
        const all = JSON.parse(localStorage.getItem('recipeData') || '{{}}');
        all[id] = {{
            saved: true, custom: true,
            name: {repr(name)},
            description: 'AI generated from planner',
            ingredients: [],
            instructions: [],
            tags: {tags_js},
            category: 'main',
            rating: 0, note: '', createdAt: Date.now()
        }};
        localStorage.setItem('recipeData', JSON.stringify(all));
        window._testAiRecipeId = id;
    """)
    return page.evaluate("window._testAiRecipeId")


def seed_week_plan(page, recipe_id, recipe_name, *, slot="mon-lunch"):
    """Inject a meal plan slot for the current week into localStorage."""
    page.evaluate(f"""
        const today = new Date();
        const day = today.getDay();
        const diff = (day === 0 ? -6 : 1 - day);
        const mon = new Date(today);
        mon.setDate(today.getDate() + diff);
        const weekKey = mon.toISOString().slice(0, 10);
        const planKey = 'weekPlan_' + weekKey;
        const plan = JSON.parse(localStorage.getItem(planKey) || '{{"slots":{{}}}}');
        plan.slots[{repr(slot)}] = {{
            recipeId: {repr(recipe_id)},
            recipeName: {repr(recipe_name)},
            tags: [],
            isNew: false
        }};
        localStorage.setItem(planKey, JSON.stringify(plan));
        window._testWeekKey = weekKey;
    """)
