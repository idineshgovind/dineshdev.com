# Cloudflare Transform Rules: add `Link` response headers

GitHub Pages cannot set custom HTTP response headers, so the real `Link`
headers for agent discovery must be injected at the CDN edge. This site is
already fronted by Cloudflare (see `server: cloudflare` on the live response),
so a **Modify Response Header** Transform Rule is the lowest-friction option.

Alternative: deploy `cloudflare/worker.js` as a Worker bound to
`dineshdev.com/*`. The Worker supports multi-value `Link` and is the option
to prefer when you also need to override `Content-Type` for
`/.well-known/api-catalog`.

## Rule 1 — Homepage `Link` headers

**Dashboard path:** Rules → Transform Rules → Modify Response Header → Create rule

- **Rule name:** `Agent discovery Link headers (homepage)`
- **When incoming requests match:**
  `(http.host eq "dineshdev.com" and (http.request.uri.path eq "/" or http.request.uri.path eq "/index.html"))`
- **Then:**
  - Set static → Header name `Link` → Value:
    `</.well-known/api-catalog>; rel="api-catalog"; type="application/linkset+json", </.well-known/service-desc.json>; rel="service-desc"; type="application/json", </docs/api/>; rel="service-doc"; type="text/html", </profile.jsonld>; rel="describedby"; type="application/ld+json", </sitemap.xml>; rel="sitemap"; type="application/xml", <https://github.com/idineshgovind>; rel="author"`

RFC 8288 §3 explicitly permits combining multiple links in a single `Link`
header by separating them with commas, so a single Transform Rule is
sufficient even though the examples show multiple header lines.

To satisfy agent discovery checks, include at least these registered
relations on the homepage response:

- `api-catalog`
- `service-desc`
- `service-doc`
- `describedby`

## Rule 2 — `/.well-known/api-catalog` content type and profile link

- **Rule name:** `api-catalog content-type and profile`
- **When incoming requests match:**
  `(http.host eq "dineshdev.com" and http.request.uri.path eq "/.well-known/api-catalog")`
- **Then (two "Set static" actions):**
  - Header `Content-Type` → `application/linkset+json; profile="https://www.rfc-editor.org/info/rfc9727"`
  - Header `Link` → `<https://www.rfc-editor.org/info/rfc9727>; rel="profile"`

## Validate

After deployment, verify with:

```
curl -sI https://dineshdev.com/ | rg -i '^link:'
curl -sI https://dineshdev.com/.well-known/api-catalog
```

Expected homepage headers should include all of:

- `rel="api-catalog"`
- `rel="service-desc"`
- `rel="service-doc"`
- `rel="describedby"`

Then run the Is It Agent Ready scanner:

```
curl -s -X POST https://isitagentready.com/api/scan \
  -H 'Content-Type: application/json' \
  -d '{"url":"https://dineshdev.com"}'
```

`checks.discoverability.linkHeaders.status` should be `"pass"`.
