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

const MARKDOWN_CONTENT_TYPE = 'text/markdown';
const MARKDOWN_ACCEPT_VALUE = 'text/markdown';

function isHomepage(url) {
  return url.pathname === '/' || url.pathname === '/index.html';
}

function isCatalog(url) {
  return url.pathname === '/.well-known/api-catalog';
}

function acceptsMarkdown(request) {
  const accept = request.headers.get('Accept');
  if (typeof accept !== 'string' || !accept.trim()) return false;

  return accept.split(',').some((entry) => {
    const [mediaType, ...params] = entry.trim().toLowerCase().split(';').map((part) => part.trim());
    if (mediaType !== MARKDOWN_ACCEPT_VALUE) return false;

    const qParam = params.find((param) => param.startsWith('q='));
    if (!qParam) return true;

    const qValue = Number.parseFloat(qParam.slice(2));
    return Number.isFinite(qValue) ? qValue > 0 : true;
  });
}

function isHtmlResponse(response) {
  const contentType = response.headers.get('Content-Type') || '';
  return contentType.toLowerCase().includes('text/html');
}

function appendVary(headers, value) {
  const existing = headers.get('Vary');

  if (!existing) {
    headers.set('Vary', value);
    return;
  }

  const varies = existing
    .split(',')
    .map((entry) => entry.trim().toLowerCase())
    .filter(Boolean);

  if (!varies.includes(value.toLowerCase())) {
    headers.set('Vary', `${existing}, ${value}`);
  }
}

function decodeHtmlEntities(text) {
  const named = text
    .replaceAll('&nbsp;', ' ')
    .replaceAll('&amp;', '&')
    .replaceAll('&lt;', '<')
    .replaceAll('&gt;', '>')
    .replaceAll('&quot;', '"')
    .replaceAll('&#39;', "'");

  return named
    .replace(/&#(\d+);/g, (_, codePoint) => String.fromCodePoint(Number(codePoint)))
    .replace(/&#x([0-9a-f]+);/gi, (_, hex) => String.fromCodePoint(Number.parseInt(hex, 16)));
}

function normalizeWhitespace(text) {
  return text
    .replace(/\r\n/g, '\n')
    .replace(/[ \t]+\n/g, '\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

function normalizeInlineMarkdown(fragment, pageUrl) {
  const withLinks = fragment.replace(
    /<a\b[^>]*href=(["'])(.*?)\1[^>]*>([\s\S]*?)<\/a>/gi,
    (_, __, href, label) => {
      const anchorText = decodeHtmlEntities(label.replace(/<[^>]+>/g, '').trim());
      const resolved = href ? new URL(href, pageUrl).toString() : '';
      if (!anchorText && !resolved) return '';
      if (!anchorText) return resolved;
      if (!resolved) return anchorText;
      return `[${anchorText}](${resolved})`;
    }
  );

  const formatted = withLinks
    .replace(/<(strong|b)\b[^>]*>([\s\S]*?)<\/\1>/gi, '**$2**')
    .replace(/<(em|i)\b[^>]*>([\s\S]*?)<\/\1>/gi, '*$2*')
    .replace(/<code\b[^>]*>([\s\S]*?)<\/code>/gi, '`$1`')
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<[^>]+>/g, '');

  return decodeHtmlEntities(formatted).replace(/[ \t]{2,}/g, ' ').trim();
}

function htmlToMarkdownDocument(html, pageUrl) {
  const main = html.match(/<main\b[^>]*>([\s\S]*?)<\/main>/i);
  const body = html.match(/<body\b[^>]*>([\s\S]*?)<\/body>/i);
  const source = main?.[1] || body?.[1] || html;
  const title =
    normalizeInlineMarkdown((html.match(/<title\b[^>]*>([\s\S]*?)<\/title>/i)?.[1] || '').trim(), pageUrl) ||
    pageUrl.hostname;

  let markdown = source;

  markdown = markdown
    .replace(/<script\b[\s\S]*?<\/script>/gi, '')
    .replace(/<style\b[\s\S]*?<\/style>/gi, '')
    .replace(/<noscript\b[\s\S]*?<\/noscript>/gi, '')
    .replace(/<pre\b[^>]*><code\b[^>]*>([\s\S]*?)<\/code><\/pre>/gi, (_, code) => {
      const text = decodeHtmlEntities(code.replace(/<[^>]+>/g, '').trim());
      return `\n\n\`\`\`\n${text}\n\`\`\`\n\n`;
    })
    .replace(/<pre\b[^>]*>([\s\S]*?)<\/pre>/gi, (_, code) => {
      const text = decodeHtmlEntities(code.replace(/<[^>]+>/g, '').trim());
      return `\n\n\`\`\`\n${text}\n\`\`\`\n\n`;
    })
    .replace(/<h([1-6])\b[^>]*>([\s\S]*?)<\/h\1>/gi, (_, level, content) => {
      const depth = '#'.repeat(Number(level));
      return `\n\n${depth} ${normalizeInlineMarkdown(content, pageUrl)}\n\n`;
    })
    .replace(/<li\b[^>]*>([\s\S]*?)<\/li>/gi, (_, item) => `\n- ${normalizeInlineMarkdown(item, pageUrl)}`)
    .replace(/<(p|article|section|div|header|footer|blockquote)\b[^>]*>([\s\S]*?)<\/\1>/gi, (_, __, content) => {
      const line = normalizeInlineMarkdown(content, pageUrl);
      return line ? `\n\n${line}\n\n` : '\n';
    })
    .replace(/<[^>]+>/g, '\n');

  markdown = normalizeWhitespace(decodeHtmlEntities(markdown));

  return `---\ntitle: ${title}\nsource: ${pageUrl.toString()}\n---\n\n${markdown}\n`;
}

function estimateMarkdownTokens(markdown) {
  return Math.max(1, Math.ceil(markdown.length / 4));
}

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    const response = await fetch(request);
    const headers = new Headers(response.headers);
    const markdownRequested = acceptsMarkdown(request);
    const shouldServeMarkdown = markdownRequested && isHtmlResponse(response);

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

    if (shouldServeMarkdown) {
      const html = await response.text();
      const markdown = htmlToMarkdownDocument(html, url);
      const tokenEstimate = estimateMarkdownTokens(markdown);

      headers.set('Content-Type', MARKDOWN_CONTENT_TYPE);
      headers.set('x-markdown-tokens', String(tokenEstimate));
      appendVary(headers, 'Accept');
      headers.delete('Content-Encoding');
      headers.delete('Content-Length');
      headers.delete('ETag');

      return new Response(markdown, {
        status: response.status,
        statusText: response.statusText,
        headers,
      });
    }

    if (isHtmlResponse(response)) {
      appendVary(headers, 'Accept');
    }

    return new Response(response.body, {
      status: response.status,
      statusText: response.statusText,
      headers,
    });
  },
};
