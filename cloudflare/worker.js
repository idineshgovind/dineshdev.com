/**
 * Cloudflare Worker: add RFC 8288 Link response headers for agent discovery.
 *
 * Deploy this worker in front of https://dineshdev.com to advertise the
 * api-catalog (RFC 9727), the Schema.org profile document, the sitemap,
 * and the author so that AI agents and other clients can discover
 * machine-readable resources without parsing HTML.
 *
 * Bind route: dineshdev.com/*
 */

const HOMEPAGE_LINKS = [
  '</.well-known/api-catalog>; rel="api-catalog"; type="application/linkset+json"',
  '</profile.jsonld>; rel="describedby"; type="application/ld+json"',
  '</sitemap.xml>; rel="sitemap"; type="application/xml"',
  '<https://github.com/idineshgovind>; rel="author"',
];

const CATALOG_LINKS = [
  '<https://www.rfc-editor.org/info/rfc9727>; rel="profile"',
];

function isHomepage(url) {
  return url.pathname === '/' || url.pathname === '/index.html';
}

function isCatalog(url) {
  return url.pathname === '/.well-known/api-catalog';
}

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    const response = await fetch(request);
    const headers = new Headers(response.headers);

    if (isHomepage(url)) {
      for (const link of HOMEPAGE_LINKS) headers.append('Link', link);
    }

    if (isCatalog(url)) {
      headers.set(
        'Content-Type',
        'application/linkset+json; profile="https://www.rfc-editor.org/info/rfc9727"'
      );
      for (const link of CATALOG_LINKS) headers.append('Link', link);
    }

    return new Response(response.body, {
      status: response.status,
      statusText: response.statusText,
      headers,
    });
  },
};
