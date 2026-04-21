# Cloudflare edge setup for agent-ready responses

This directory contains the Cloudflare Worker used to provide:

- Agent discovery `Link` headers
- Correct `Content-Type` for `/.well-known/api-catalog`
- Markdown content negotiation for agents (`Accept: text/markdown`)

## Why this is needed

The site content is static, but markdown negotiation requires edge logic.
`cloudflare/worker.js` implements this behavior. If the Worker is not deployed
and routed, scanners will still observe `text/html` for markdown requests.

## Prerequisites

- Cloudflare account with `dineshdev.com` zone
- `wrangler` CLI authenticated (`wrangler login`)

## Deploy

Run from the `cloudflare/` directory:

```bash
wrangler deploy
```

This uses `wrangler.toml`:

- Worker name: `dineshdev-agent-edge`
- Route: `dineshdev.com/*`
- Zone: `dineshdev.com`

## Validate

After deploy, verify markdown negotiation:

```bash
curl -sD - https://dineshdev.com/ \
  -H 'Accept: text/markdown' \
  -o /dev/null | rg -i '^content-type:|^x-markdown-tokens:|^vary:'
```

Expected headers include:

- `Content-Type: text/markdown`
- `x-markdown-tokens: <number>`
- `Vary: Accept`

Then run:

```bash
curl -s -X POST https://isitagentready.com/api/scan \
  -H 'Content-Type: application/json' \
  -d '{"url":"https://dineshdev.com"}'
```

Check:

- `checks.contentAccessibility.markdownNegotiation.status == "pass"`
