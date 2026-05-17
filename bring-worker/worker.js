/**
 * Cloudflare Worker — Bring! JSON-LD proxy
 *
 * Bring!'s recipe parser fetches the target page URL server-side and reads
 * JSON-LD (application/ld+json). Our recipe pages inject JSON-LD via JavaScript,
 * which Bring!'s server never executes. This worker accepts recipe data as query
 * params and returns a minimal HTML page with static JSON-LD that Bring! can read.
 *
 * Usage:
 *   GET /?name=Perche+du+Lac&i=200g+perch|1+lemon|olive+oil
 *
 * Deploy:
 *   1. Install Wrangler: npm install -g wrangler
 *   2. wrangler login
 *   3. wrangler deploy (from this directory)
 *   4. Update BRING_WORKER constant in recettes/recipe.html with your worker URL.
 */
export default {
  async fetch(request) {
    const url   = new URL(request.url);
    const name  = url.searchParams.get('name') || 'Recipe';
    const raw   = url.searchParams.get('i')    || '';
    const items = raw.split('|').map(s => s.trim()).filter(Boolean);

    const jsonLd = JSON.stringify({
      '@context':        'https://schema.org/',
      '@type':           'Recipe',
      'name':            name,
      'recipeIngredient': items
    });

    const html = `<!DOCTYPE html>
<html lang="fr">
<head>
<meta charset="UTF-8">
<title>${escapeHtml(name)}</title>
<script type="application/ld+json">${jsonLd}<\/script>
</head>
<body></body>
</html>`;

    return new Response(html, {
      headers: {
        'Content-Type':                'text/html; charset=UTF-8',
        'Access-Control-Allow-Origin': '*',
        'Cache-Control':               'public, max-age=300'
      }
    });
  }
};

function escapeHtml(str) {
  return String(str)
    .replace(/&/g,  '&amp;')
    .replace(/</g,  '&lt;')
    .replace(/>/g,  '&gt;')
    .replace(/"/g,  '&quot;');
}
