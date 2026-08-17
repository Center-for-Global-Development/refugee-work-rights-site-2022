// Shared helpers for extraction scripts.
export const LIVE = 'https://refugeeworkrights.org';

// Every absolute-URL form of this site seen in live markup, normalized to root-relative.
const ORIGIN_RE =
  /https?:\/\/(?:www\.)?(?:refugeeworkrights\.org|(?:live|dev)-refugee-work-rights-action-platform\.pantheonsite\.io)/g;

// Cloudflare's email obfuscation (first hex byte is the XOR key).
function decodeCfEmail(hex) {
  const bytes = hex.match(/.{2}/g).map((h) => parseInt(h, 16));
  return bytes
    .slice(1)
    .map((b) => String.fromCharCode(b ^ bytes[0]))
    .join('');
}

export function rewriteUrls(html) {
  return (
    html
      // Footer partner logos are hardcoded to the *dev* Pantheon domain; those
      // files exist in the uploads dump at the same path, so the generic rewrite covers them.
      .replace(ORIGIN_RE, '')
      // Theme dist assets move into /assets/theme/
      .replaceAll('/wp-content/themes/rwrap/dist/', '/assets/theme/')
      // Undo Cloudflare email obfuscation — its decoder script doesn't exist on
      // a static site, so restore the original text and mailto: links.
      .replace(/<span class="__cf_email__" data-cfemail="([0-9a-f]+)"[^>]*>.*?<\/span>/g, (_, hex) =>
        decodeCfEmail(hex),
      )
      // Variant where the <a> itself is the obfuscated element
      .replace(
        /<a\s[^>]*\/cdn-cgi\/l\/email-protection[^>]*data-cfemail="([0-9a-f]+)"[^>]*>.*?<\/a>/g,
        (_, hex) => {
          const email = decodeCfEmail(hex);
          return `<a href="mailto:${email}">${email}</a>`;
        },
      )
      .replace(/\/cdn-cgi\/l\/email-protection#([0-9a-f]+)/g, (_, hex) => 'mailto:' + decodeCfEmail(hex))
      // Internal extensionless links get the canonical trailing slash (WP
      // redirected bare paths; the static build serves directory URLs).
      .replace(/href="(\/[^"?#.]*[^"/?#.])"/g, 'href="$1/"')
  );
}

export function collectUploadPaths(html, into) {
  for (const m of html.matchAll(/\/wp-content\/uploads\/[^\s"'()<>,\\]+/g)) {
    into.add(decodeURI(m[0].split('?')[0]));
  }
}
