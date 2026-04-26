/**
 * auth-guard.js — Synchronous auth check loaded first in <head>.
 * Redirects unauthenticated users to login.html before any page content renders.
 * Protected pages: index.html, library.html, planner.html
 * Exempt pages:    login.html, recettes/*.html, feedback.html, admin.html
 */
(function () {
  var session = null;
  try { session = JSON.parse(localStorage.getItem('sbSession')); } catch (e) {}

  var valid = session &&
              session.access_token &&
              session.expires_at > Math.floor(Date.now() / 1000);

  if (!valid) {
    var next = encodeURIComponent(location.pathname + location.search);
    location.replace('login.html?next=' + next);
  }
})();
