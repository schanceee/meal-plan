# Requirements

## Feature: Authentication — Login / Sign-up Page

### Context

Static HTML app (GitHub Pages). Supabase is already integrated for feedback
(`uqdyllxyvstgeaeycsxx.supabase.co`). Supabase Auth will be used as the auth
backend — it supports email/password, Google OAuth, and Apple OAuth with no
server-side code required.

---

### User Stories

| ID    | Story                                                                                            |
|-------|--------------------------------------------------------------------------------------------------|
| US-01 | As a user, I want to sign up with email + password so I can create a personal account            |
| US-02 | As a user, I want to log in with Google so I don't have to remember a separate password          |
| US-03 | As a user, I want to log in with Apple so I can use my Apple ID                                  |
| US-04 | As a user, I want the app to redirect me to login when I'm not authenticated                     |
| US-05 | As a user, I want my session to persist across browser refreshes                                 |
| US-06 | As a user, I want a log-out button in the nav bar so I can sign out from shared devices          |

---

### Acceptance Criteria

| ID    | Criterion                                                                                                           |
|-------|---------------------------------------------------------------------------------------------------------------------|
| AC-01 | Unauthenticated visits to index.html, library.html, planner.html redirect to login.html                            |
| AC-02 | login.html shows email/password form, "Continue with Google" button, "Continue with Apple" button, and Sign-up tab  |
| AC-03 | Successful email/password login redirects to the originally requested page (or index.html)                          |
| AC-04 | Wrong credentials show an inline error without a page reload                                                        |
| AC-05 | "Continue with Google" completes OAuth and lands the user in the app                                                |
| AC-06 | "Continue with Apple" completes OAuth and lands the user in the app                                                 |
| AC-07 | Sign-up tab accepts email + password (min 8 chars), creates account, and logs the user in                           |
| AC-08 | Duplicate email on sign-up shows a clear inline error                                                               |
| AC-09 | "Log out" in the nav bar signs the user out and redirects to login.html                                             |
| AC-10 | Auth session persists across page refreshes and new tabs (same origin)                                              |
| AC-11 | recettes/*.html pages are publicly accessible — no auth gate                                                        |
| AC-12 | login.html itself is publicly accessible (no redirect loop)                                                         |

---

### Out of Scope

- Password reset / forgot-password flow
- Profile management (name, avatar, preferences)
- Per-user data isolation in Supabase (recipes stay in localStorage — separate migration)
- Admin roles or access control

---

### Dependencies

| Dependency                          | Status      | Notes                                              |
|-------------------------------------|-------------|----------------------------------------------------|
| Supabase project                    | Exists      | uqdyllxyvstgeaeycsxx.supabase.co                  |
| Supabase Auth (email provider)      | Must enable | Toggle in Supabase dashboard → Auth → Providers    |
| Supabase Auth (Google provider)     | Must enable | Requires Google Cloud OAuth credentials            |
| Supabase Auth (Apple provider)      | Must enable | Requires Apple Developer credentials               |
| supabase-js v2                      | CDN         | Loaded via <script> tag — no build step needed     |
