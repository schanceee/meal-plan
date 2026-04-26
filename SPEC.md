# Specification

## Feature: Authentication — Login / Sign-up Page

### Functional Requirements

Each FR is traceable to one or more acceptance criteria from REQUIREMENTS.md.

---

#### FR-01 — Auth guard on protected pages  _(AC-01, AC-12)_

**Pages guarded:** `index.html`, `library.html`, `planner.html`  
**Pages exempt:** `login.html`, `recettes/*.html`, `feedback.html`, `admin.html`

**Behaviour:**
- On page load, before rendering any content, read `sbSession` from localStorage.
- If no session (or session is expired): redirect to `login.html?next=<current-relative-url>`.
- If session is valid: allow the page to render normally.
- Session validity: `access_token` must be present; `expires_at` (Unix timestamp) must be in the future.

**Edge cases:**
- `login.html` must never trigger the guard (no redirect loop).
- Deep links (e.g. `library.html?id=abc123`) are preserved via the `next` param.

---

#### FR-02 — login.html page layout  _(AC-02)_

`login.html` is a standalone page (no nav bar) with:

1. **App logo / wordmark** at the top ("Meal Plan")
2. **Tab row**: "Sign in" | "Sign up" — default is "Sign in"
3. **Sign-in form** (visible on "Sign in" tab):
   - Email input (`type="email"`, `id="authEmail"`, autofocused)
   - Password input (`type="password"`, `id="authPassword"`)
   - "Sign in" button (`id="authSigninBtn"`)
   - Inline error area (`id="authErr"`) — hidden until an error occurs
4. **Sign-up form** (visible on "Sign up" tab):
   - Email input (`id="authSignupEmail"`)
   - Password input (`id="authSignupPass"`, min-length hint "at least 8 characters")
   - Confirm password input (`id="authSignupPass2"`)
   - "Create account" button (`id="authSignupBtn"`)
   - Same inline error area (`#authErr`)
5. **Divider** ("or") between the form and social buttons
6. **"Continue with Google"** button (`id="authGoogleBtn"`)
7. **"Continue with Apple"** button (`id="authAppleBtn"`)

---

#### FR-03 — Email / password sign-in  _(AC-03, AC-04)_

**Happy path:**
1. User fills email + password, clicks "Sign in".
2. Button shows "Signing in…" and is disabled.
3. POST to `SUPABASE_URL/auth/v1/token?grant_type=password` with `{email, password}`.
4. On success: save session to localStorage key `sbSession`, redirect to `next` param or `index.html`.

**Error path:**
- Any non-2xx response: show `authErr` with "Invalid email or password." (do not expose raw Supabase messages to end users).
- Empty fields: show "Email and password are required." before making any network request.
- Button re-enabled after error.

---

#### FR-04 — Email / password sign-up  _(AC-07, AC-08)_

**Happy path:**
1. User fills email, password, confirm password, clicks "Create account".
2. Validate locally: password ≥ 8 chars; passwords match; email non-empty.
3. POST to `SUPABASE_URL/auth/v1/signup`.
4. If Supabase returns `access_token` immediately (email confirmation disabled): save session, redirect to `index.html`.
5. If Supabase returns no token (email confirmation required): show success message "Check your inbox to confirm your account, then sign in."

**Error path:**
- Duplicate email: show "An account with this email already exists."
- Passwords don't match: show "Passwords do not match." before any network call.
- Password too short: show "Password must be at least 8 characters."

---

#### FR-05 — Google OAuth sign-in  _(AC-05)_

1. User clicks "Continue with Google".
2. Button shows "Redirecting…" and is disabled.
3. POST to `SUPABASE_URL/auth/v1/authorize` (or use Supabase JS `signInWithOAuth`) with `provider: 'google'` and `redirectTo: window.location.origin + '/login.html'`.
4. Browser is redirected to Google's OAuth consent page.
5. After Google approval, browser is redirected back to `login.html#access_token=...&...` (Supabase implicit flow).
6. `login.html` init code detects the hash fragment, extracts and saves the session, then redirects to `next` param or `index.html`.

---

#### FR-06 — Apple OAuth sign-in  _(AC-06)_

Same flow as FR-05 but with `provider: 'apple'`.

---

#### FR-07 — OAuth callback handling  _(AC-05, AC-06, AC-10)_

On every load of `login.html`:
1. Check `window.location.hash` for `access_token` and `refresh_token`.
2. If found: parse the hash, build a session object `{access_token, refresh_token, expires_at, user: ...}`, save to `sbSession`, strip the hash from the URL (`history.replaceState`), redirect to `next` or `index.html`.
3. If not found: render the login form as normal.

---

#### FR-08 — Session persistence  _(AC-10)_

- Session is stored in `localStorage['sbSession']` as JSON: `{access_token, refresh_token, expires_at, user}`.
- `expires_at` is the Unix timestamp (seconds) from Supabase's `expires_in` field: `Math.floor(Date.now()/1000) + data.expires_in`.
- On every protected page load, the guard compares `expires_at` against `Date.now()/1000`.
- Token refresh is out of scope for this feature (handled separately).

---

#### FR-09 — Sign-out  _(AC-09)_

1. User clicks "Sign out" in the nav bar.
2. Existing `authSignOut()` in nav.js fires a POST to Supabase `/auth/v1/logout`, clears `sbSession`.
3. **New:** after clearing session, redirect to `login.html` (currently it only refreshes the auth bar).
4. The "Sign in" button in the nav bar is still kept for pages where session is optional.

---

#### FR-10 — login.html is exempt from the guard  _(AC-12)_

- `login.html` must not include the auth-guard script.
- If a user who is already logged in visits `login.html`, redirect them to `index.html` immediately (no flash of the login form).

---

### State Transitions

```
[Not authenticated]
      │
      │  visits protected page
      ▼
[Redirect → login.html?next=<url>]
      │
      ├─ email/password sign-in ──────────────────────┐
      ├─ Google OAuth ─────────────────────────────────┤
      ├─ Apple OAuth ──────────────────────────────────┤
      │                                                │
      ▼                                                ▼
[Session saved in localStorage]           [Error shown inline]
      │
      │  redirect to `next` or index.html
      ▼
[App content visible]
      │
      │  "Sign out"
      ▼
[Session cleared → redirect to login.html]
```

---

### Performance Expectations

- Auth guard check: < 1 ms (synchronous localStorage read + date comparison).
- Sign-in network round trip: < 2 s on average broadband.
- No page flicker for authenticated users (guard runs before DOM is painted using a `<script>` in `<head>`).

---

## Technical Design

### TR-01 — New file: `login.html`

Standalone HTML page (no nav bar, no `nav.js`). Loads:
- `style.css` for design tokens and base styles
- Inline `<style>` for login-specific layout (centred card)
- Inline `<script>` with all auth logic (no external JS dependency beyond Supabase CDN)
- `https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/dist/umd/supabase.min.js`

### TR-02 — New file: `auth-guard.js`

A tiny guard script (< 30 lines) that:
- Reads `sbSession` from localStorage
- Checks `expires_at > Date.now()/1000`
- If invalid: `window.location.href = 'login.html?next=' + encodeURIComponent(location.pathname + location.search)`
- If valid: does nothing (page renders normally)

Loaded as the **first `<script>` in `<head>`** on `index.html`, `library.html`, `planner.html`.

### TR-03 — Modify `nav.js`: authSignOut redirect

In `authSignOut()`: after clearing the session, add:
```javascript
window.location.href = (isRecipe ? '../' : '') + 'login.html';
```

### TR-04 — OAuth via Supabase JS SDK

Use `supabase.auth.signInWithOAuth({ provider: 'google', options: { redirectTo: window.location.origin + '/login.html' } })` rather than manual redirect construction. The SDK is loaded on `login.html` only.

### TR-05 — OAuth callback handling in `login.html`

On DOMContentLoaded: call `supabase.auth.getSession()`. If the SDK detects an OAuth callback in the URL hash, it auto-parses it and returns a session. Save it to `sbSession`, redirect.

### TR-06 — Remove auth modal from nav.js

`login.html` is the sole auth entry point. The following are **deleted** from nav.js:

| What                                          | Location in nav.js      |
| --------------------------------------------- | ----------------------- |
| `window.openAuthModal` function               | lines ~51–63            |
| `window.authSignIn` function                  | lines ~65–79            |
| `window.authSignUp` function                  | lines ~81–105           |
| `#authModal` HTML block in `injectModals()`   | lines ~335–367          |
| `<span id="gbSignIn">` in `renderGlobalBar()` | line ~284               |
| `gbSignIn` reference in `_updateAuthBar()`    | line ~123               |

**What is kept** in nav.js (used for Supabase data sync):

- `_session` / `_saveSession()` — Supabase recipe + plan sync reads the token
- `window._authUser` / `window._authToken` — used by planner.html and library.html
- `window.authSignOut` — triggered by "Sign out" button in nav
- `_updateAuthBar()` — simplified: always shows avatar + sign-out (no sign-in branch)
- `_pullFromSupabase()` / `_syncRecipe()` / `_syncPlan()` — cross-device sync unchanged

**Nav bar change:** `renderGlobalBar()` always renders the user avatar + "Sign out". The `gbSignIn` span is removed. The guard ensures unauthenticated users never reach the app.

### TR-07 — Modify protected pages: add `auth-guard.js`

Add to `<head>` of `index.html`, `library.html`, `planner.html` — before any other scripts:

```html
<script src="auth-guard.js"></script>
```

For `recettes/*.html` pages, use `../auth-guard.js` — but these pages are **exempt** from the guard per FR-01 (publicly accessible). Do not add the guard there.

### TR-08 — `login.html` handles already-authenticated users  _(FR-10)_

At the top of `login.html`'s inline `<script>` (before rendering the form):

```javascript
var _s = JSON.parse(localStorage.getItem('sbSession') || 'null');
if (_s && _s.expires_at > Math.floor(Date.now() / 1000)) {
  var _next = new URLSearchParams(location.search).get('next') || 'index.html';
  window.location.replace(_next);
}
```

This prevents a logged-in user from seeing the login form.

### Security Notes

- `SUPABASE_ANON` key is public (publishable) — it is safe to expose in client-side code.
- `sbSession.access_token` is a JWT — never logged, never sent to third-party services.
- OAuth `redirectTo` must be added to the **Allowed Redirect URLs** list in the Supabase dashboard.
- No XSS risk from the login form: all values are submitted to Supabase APIs, never inserted into the DOM as HTML.
