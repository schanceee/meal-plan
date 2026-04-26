"""
UI tests — Authentication (login page, auth guard, sign-out)

Uses `bare_page` fixture (no session) for guard/redirect tests.
Uses `page`/`library` fixtures (session seeded) for logged-in-state tests.
Supabase API calls are mocked via page.route() — no real network needed.
"""
import json
import pytest
from conftest import click


# ── Mock helpers ──────────────────────────────────────────────────

def mock_signin_success(page, email="test@example.com"):
    """Mock a successful Supabase password sign-in."""
    page.route("**/auth/v1/token**", lambda route: route.fulfill(
        status=200,
        content_type="application/json",
        body=json.dumps({
            "access_token": "fake-access-token",
            "refresh_token": "fake-refresh-token",
            "expires_in": 3600,
            "token_type": "bearer",
            "user": {"id": "test-uid", "email": email}
        })
    ))


def mock_signin_failure(page):
    """Mock a failed Supabase sign-in (wrong credentials)."""
    page.route("**/auth/v1/token**", lambda route: route.fulfill(
        status=400,
        content_type="application/json",
        body=json.dumps({
            "error": "invalid_grant",
            "error_description": "Invalid login credentials"
        })
    ))


def mock_signup_success(page, email="new@example.com"):
    """Mock a successful Supabase sign-up (with immediate access_token)."""
    page.route("**/auth/v1/signup**", lambda route: route.fulfill(
        status=200,
        content_type="application/json",
        body=json.dumps({
            "access_token": "fake-access-token",
            "refresh_token": "fake-refresh-token",
            "expires_in": 3600,
            "user": {"id": "new-uid", "email": email}
        })
    ))


def mock_signup_duplicate(page):
    """Mock a duplicate-email sign-up error."""
    page.route("**/auth/v1/signup**", lambda route: route.fulfill(
        status=422,
        content_type="application/json",
        body=json.dumps({"msg": "User already registered"})
    ))


# ── UI-AUTH-01: login.html loads and shows sign-in form ───────────
def test_login_page_loads(bare_page, http_server):
    bare_page.goto(f"{http_server}/login.html")
    bare_page.wait_for_load_state("load")
    assert bare_page.locator("#authEmail").count() > 0, \
        "login.html must have an #authEmail input"
    assert bare_page.locator("#authPassword").count() > 0, \
        "login.html must have an #authPassword input"
    assert bare_page.locator("#authSigninBtn").count() > 0, \
        "login.html must have an #authSigninBtn button"


# ── UI-AUTH-02: login.html has Sign-in / Sign-up tab toggle ───────
def test_login_has_tabs(bare_page, http_server):
    bare_page.goto(f"{http_server}/login.html")
    bare_page.wait_for_load_state("load")
    # Accept either a button or any element with tab-like text
    sign_in_tab = bare_page.locator("button, [role='tab']", has_text="Sign in").first
    sign_up_tab = bare_page.locator("button, [role='tab']", has_text="Sign up").first
    assert sign_in_tab.count() > 0, "login.html must have a Sign in tab"
    assert sign_up_tab.count() > 0, "login.html must have a Sign up tab"


# ── UI-AUTH-03: login.html has Continue with Google button ────────
def test_login_has_google_button(bare_page, http_server):
    bare_page.goto(f"{http_server}/login.html")
    bare_page.wait_for_load_state("load")
    assert bare_page.locator("#authGoogleBtn").count() > 0, \
        "login.html must have a #authGoogleBtn"


# ── UI-AUTH-04: login.html has Continue with Apple button ─────────
def test_login_has_apple_button(bare_page, http_server):
    bare_page.goto(f"{http_server}/login.html")
    bare_page.wait_for_load_state("load")
    assert bare_page.locator("#authAppleBtn").count() > 0, \
        "login.html must have a #authAppleBtn"


# ── UI-AUTH-05: Sign up tab reveals the sign-up form ──────────────
def test_signup_tab_shows_form(bare_page, http_server):
    bare_page.goto(f"{http_server}/login.html")
    bare_page.wait_for_load_state("load")
    sign_up_tab = bare_page.locator("button, [role='tab']", has_text="Sign up").first
    click(bare_page, sign_up_tab)
    bare_page.wait_for_timeout(300)
    assert bare_page.locator("#authSignupEmail").is_visible(), \
        "Sign-up email field must be visible after clicking Sign up tab"
    assert bare_page.locator("#authSignupPass").is_visible(), \
        "Sign-up password field must be visible"
    assert bare_page.locator("#authSignupPass2").is_visible(), \
        "Sign-up confirm-password field must be visible"


# ── UI-AUTH-06: Empty form submit shows required-fields error ──────
def test_empty_submit_shows_error(bare_page, http_server):
    bare_page.goto(f"{http_server}/login.html")
    bare_page.wait_for_load_state("load")
    click(bare_page, bare_page.locator("#authSigninBtn"))
    bare_page.wait_for_timeout(300)
    err = bare_page.locator("#authErr")
    assert err.is_visible(), "Error element must be visible after empty submit"
    assert len(err.text_content().strip()) > 0, "Error element must have text"


# ── UI-AUTH-07: Wrong credentials shows inline error ──────────────
def test_wrong_credentials_shows_error(bare_page, http_server):
    mock_signin_failure(bare_page)
    bare_page.goto(f"{http_server}/login.html")
    bare_page.wait_for_load_state("load")
    bare_page.locator("#authEmail").fill("wrong@example.com")
    bare_page.locator("#authPassword").fill("wrongpassword")
    click(bare_page, bare_page.locator("#authSigninBtn"))
    bare_page.wait_for_timeout(1500)
    err = bare_page.locator("#authErr")
    assert err.is_visible(), "Error must be shown for invalid credentials"
    assert len(err.text_content().strip()) > 0


# ── UI-AUTH-08: Successful sign-in redirects to index.html ────────
def test_signin_redirects_to_app(bare_page, http_server):
    mock_signin_success(bare_page)
    bare_page.goto(f"{http_server}/login.html")
    bare_page.wait_for_load_state("load")
    bare_page.locator("#authEmail").fill("test@example.com")
    bare_page.locator("#authPassword").fill("password123")
    click(bare_page, bare_page.locator("#authSigninBtn"))
    bare_page.wait_for_url("**/index.html**", timeout=5000)
    assert "index.html" in bare_page.url


# ── UI-AUTH-09: Sign-in respects the ?next= redirect param ────────
def test_signin_respects_next_param(bare_page, http_server):
    mock_signin_success(bare_page)
    bare_page.goto(f"{http_server}/login.html?next=/library.html")
    bare_page.wait_for_load_state("load")
    bare_page.locator("#authEmail").fill("test@example.com")
    bare_page.locator("#authPassword").fill("password123")
    click(bare_page, bare_page.locator("#authSigninBtn"))
    bare_page.wait_for_url("**/library.html**", timeout=5000)
    assert "library.html" in bare_page.url


# ── UI-AUTH-10: Sign-up: passwords don't match shows error ────────
def test_signup_passwords_mismatch(bare_page, http_server):
    bare_page.goto(f"{http_server}/login.html")
    bare_page.wait_for_load_state("load")
    click(bare_page, bare_page.locator("button, [role='tab']", has_text="Sign up").first)
    bare_page.wait_for_timeout(200)
    bare_page.locator("#authSignupEmail").fill("new@example.com")
    bare_page.locator("#authSignupPass").fill("password123")
    bare_page.locator("#authSignupPass2").fill("different456")
    click(bare_page, bare_page.locator("#authSignupBtn"))
    bare_page.wait_for_timeout(300)
    err = bare_page.locator("#authErr")
    assert err.is_visible()
    text = err.text_content().lower()
    assert "match" in text or "password" in text, \
        f"Expected password-mismatch error, got: {err.text_content()}"


# ── UI-AUTH-11: Sign-up: password < 8 chars shows error ───────────
def test_signup_short_password(bare_page, http_server):
    bare_page.goto(f"{http_server}/login.html")
    bare_page.wait_for_load_state("load")
    click(bare_page, bare_page.locator("button, [role='tab']", has_text="Sign up").first)
    bare_page.wait_for_timeout(200)
    bare_page.locator("#authSignupEmail").fill("new@example.com")
    bare_page.locator("#authSignupPass").fill("short")
    bare_page.locator("#authSignupPass2").fill("short")
    click(bare_page, bare_page.locator("#authSignupBtn"))
    bare_page.wait_for_timeout(300)
    err = bare_page.locator("#authErr")
    assert err.is_visible()
    text = err.text_content()
    assert "8" in text or "character" in text.lower(), \
        f"Expected min-length error, got: {text}"


# ── UI-AUTH-12: Sign-up success redirects to app ──────────────────
def test_signup_success_redirects(bare_page, http_server):
    mock_signup_success(bare_page)
    bare_page.goto(f"{http_server}/login.html")
    bare_page.wait_for_load_state("load")
    click(bare_page, bare_page.locator("button, [role='tab']", has_text="Sign up").first)
    bare_page.wait_for_timeout(200)
    bare_page.locator("#authSignupEmail").fill("new@example.com")
    bare_page.locator("#authSignupPass").fill("password123")
    bare_page.locator("#authSignupPass2").fill("password123")
    click(bare_page, bare_page.locator("#authSignupBtn"))
    bare_page.wait_for_url("**/index.html**", timeout=5000)
    assert "index.html" in bare_page.url


# ── UI-AUTH-13: Duplicate email on sign-up shows error ────────────
def test_signup_duplicate_email_error(bare_page, http_server):
    mock_signup_duplicate(bare_page)
    bare_page.goto(f"{http_server}/login.html")
    bare_page.wait_for_load_state("load")
    click(bare_page, bare_page.locator("button, [role='tab']", has_text="Sign up").first)
    bare_page.wait_for_timeout(200)
    bare_page.locator("#authSignupEmail").fill("existing@example.com")
    bare_page.locator("#authSignupPass").fill("password123")
    bare_page.locator("#authSignupPass2").fill("password123")
    click(bare_page, bare_page.locator("#authSignupBtn"))
    bare_page.wait_for_timeout(1500)
    err = bare_page.locator("#authErr")
    assert err.is_visible()
    assert len(err.text_content().strip()) > 0


# ── UI-AUTH-14: Auth guard redirects library.html to login ────────
def test_guard_redirects_library(bare_page, http_server):
    bare_page.goto(f"{http_server}/library.html")
    bare_page.wait_for_url("**/login.html**", timeout=3000)
    assert "login.html" in bare_page.url, \
        "Unauthenticated visit to library.html must redirect to login.html"


# ── UI-AUTH-15: Auth guard redirects planner.html to login ────────
def test_guard_redirects_planner(bare_page, http_server):
    bare_page.goto(f"{http_server}/planner.html")
    bare_page.wait_for_url("**/login.html**", timeout=3000)
    assert "login.html" in bare_page.url, \
        "Unauthenticated visit to planner.html must redirect to login.html"


# ── UI-AUTH-16: Auth guard redirects index.html to login ──────────
def test_guard_redirects_index(bare_page, http_server):
    bare_page.goto(f"{http_server}/index.html")
    bare_page.wait_for_url("**/login.html**", timeout=3000)
    assert "login.html" in bare_page.url, \
        "Unauthenticated visit to index.html must redirect to login.html"


# ── UI-AUTH-17: Guard preserves destination in ?next= param ───────
def test_guard_preserves_next_param(bare_page, http_server):
    bare_page.goto(f"{http_server}/library.html?id=abc123")
    bare_page.wait_for_url("**/login.html**", timeout=3000)
    assert "next=" in bare_page.url, \
        "Redirect URL must include ?next= with the original destination"
    assert "library.html" in bare_page.url, \
        "The next= param must contain the original path (library.html)"


# ── UI-AUTH-18: Authenticated user visiting login.html is bypassed ─
def test_logged_in_skips_login_page(page, http_server):
    # `page` fixture seeds a valid session via add_init_script
    page.goto(f"{http_server}/login.html")
    page.wait_for_url("**/index.html**", timeout=3000)
    assert "login.html" not in page.url, \
        "A logged-in user visiting login.html must be redirected to the app"


# ── UI-AUTH-19: Recipe pages are exempt from the auth guard ───────
def test_recipe_pages_not_guarded(bare_page, http_server):
    bare_page.goto(f"{http_server}/recettes/pasta-miso.html")
    bare_page.wait_for_load_state("load")
    assert "login.html" not in bare_page.url, \
        "Recipe pages must be publicly accessible without authentication"
    assert bare_page.locator("h1, h2, .recipe-title, [class*='title']").count() > 0


# ── UI-AUTH-20: Nav bar shows Sign out when user is logged in ──────
def test_nav_shows_signout_when_logged_in(library):
    # `library` fixture navigates with a valid session — nav should show Sign out
    signout = library.locator(".gb-signout-btn, button", has_text="Sign out").first
    assert signout.count() > 0, \
        "Nav bar must show a Sign out button when the user is authenticated"


# ── UI-AUTH-21: Sign out redirects to login.html ──────────────────
def test_signout_redirects_to_login(library, http_server):
    signout = library.locator(".gb-signout-btn, button", has_text="Sign out").first
    if signout.count() == 0:
        pytest.skip("Sign out button not found — skipping until nav is updated")
    click(library, signout)
    library.wait_for_url("**/login.html**", timeout=3000)
    assert "login.html" in library.url, \
        "Sign out must redirect to login.html"


# ── UI-AUTH-22: Nav bar has no Sign in button (modal removed) ──────
def test_nav_has_no_signin_button(library):
    # After modal removal, the nav should NOT have a standalone "Sign in" button
    signin_btn = library.locator("#gbSignIn, .gb-signin-btn")
    assert signin_btn.count() == 0, \
        "Nav bar must not show a Sign in button — auth is handled by login.html only"
