# Test Plan — Meal Plan App

All UI tests are in `tests/` and run via Playwright + pytest.
Run headless: `./run_tests.sh`
Run headed (visible browser): `./run_ui_tests.sh`

---

## Feature: Authentication — Login Page

| ID          | File              | Description                                               | AC ref |
| ----------- | ----------------- | --------------------------------------------------------- | ------ |
| UI-AUTH-01  | test_auth.py      | login.html loads with email/password form                 | AC-02  |
| UI-AUTH-02  | test_auth.py      | login.html has Sign in / Sign up tab toggle               | AC-02  |
| UI-AUTH-03  | test_auth.py      | login.html has Continue with Google button                | AC-02  |
| UI-AUTH-04  | test_auth.py      | login.html has Continue with Apple button                 | AC-02  |
| UI-AUTH-05  | test_auth.py      | Sign up tab reveals sign-up form fields                   | AC-07  |
| UI-AUTH-06  | test_auth.py      | Empty form submit shows required-fields error             | AC-04  |
| UI-AUTH-07  | test_auth.py      | Wrong credentials shows inline error (mocked)             | AC-04  |
| UI-AUTH-08  | test_auth.py      | Successful sign-in redirects to index.html (mocked)       | AC-03  |
| UI-AUTH-09  | test_auth.py      | Sign-in respects ?next= redirect param (mocked)           | AC-03  |
| UI-AUTH-10  | test_auth.py      | Sign-up: passwords don't match shows error                | AC-07  |
| UI-AUTH-11  | test_auth.py      | Sign-up: password < 8 chars shows error                   | AC-07  |
| UI-AUTH-12  | test_auth.py      | Sign-up success redirects to app (mocked)                 | AC-07  |
| UI-AUTH-13  | test_auth.py      | Duplicate email on sign-up shows error (mocked)           | AC-08  |
| UI-AUTH-14  | test_auth.py      | Auth guard redirects unauthenticated library.html         | AC-01  |
| UI-AUTH-15  | test_auth.py      | Auth guard redirects unauthenticated planner.html         | AC-01  |
| UI-AUTH-16  | test_auth.py      | Auth guard redirects unauthenticated index.html           | AC-01  |
| UI-AUTH-17  | test_auth.py      | Guard preserves destination in ?next= param               | AC-01  |
| UI-AUTH-18  | test_auth.py      | Authenticated user visiting login.html is redirected away | AC-12  |
| UI-AUTH-19  | test_auth.py      | Recipe pages (recettes/*.html) are NOT guarded            | AC-11  |
| UI-AUTH-20  | test_auth.py      | Nav bar shows Sign out when user is logged in             | AC-09  |
| UI-AUTH-21  | test_auth.py      | Sign out redirects to login.html                          | AC-09  |
| UI-AUTH-22  | test_auth.py      | Nav bar has no Sign in button (modal removed)             | AC-02  |

---

## Existing Tests

### Navigation — test_navigation.py (11 tests: UI-NAV-01 to UI-NAV-11)
### Library — test_library.py (24 tests: UI-LIB-01 to UI-LIB-24)
### Add Recipe — test_add_recipe.py (11 tests: UI-ADD-01 to UI-ADD-11)
### Planner — test_planner.py (25 tests: UI-PLAN-01 to UI-PLAN-25)
### Feedback — test_feedback.py (6 tests: UI-FB-01 to UI-FB-06)
### Recipe Pages — test_recipe_pages.py (24 tests: UI-RP-01 to UI-RP-24)

---

## Regression Notes

- All existing tests use the `library` / `planner` / `page` fixtures which seed a fake
  valid session via `add_init_script`. Once `auth-guard.js` is wired to the protected
  pages, these fixtures ensure no existing test regresses due to the auth gate.
- `bare_page` fixture (no session) is used exclusively in `test_auth.py`.
