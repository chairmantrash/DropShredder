# Security

DropShredder is designed to inspect commerce pages, not users.

## Report vulnerabilities
Use a private GitHub security advisory when available. Do not publish exploit details before a fix.

## Core security constraints
- No shared API secrets in extension source.
- No remote executable code.
- Community intelligence packs are data only and may never execute JavaScript.
- Sanitize any untrusted HTML before rendering.
- Do not transmit browsing history or investigation history by default.
- Host permissions should be optional/minimal where practical.

## Credential and browsing-data protections
- Never inspect password inputs, cookies, authentication headers, payment-card fields, or browser credential stores.
- Never persist query strings or URL fragments from product/image URLs.
- Chrome extension storage is restricted to trusted extension contexts where supported.
- Local observation history is bounded and read through indexed cursors rather than unbounded database loads.
- No user data is sent to DropShredder servers because there is no required hosted user-data backend.

## Release security gates
CI rejects:
- `eval` and `new Function`;
- Chrome/page cookie access;
- `localStorage` / `sessionStorage` in runtime code;
- dynamic `innerHTML` writes;
- credentialed cross-origin fetches;
- insecure HTTP fetch literals;
- unreviewed high-risk Chrome permissions;
- broad permanent host permissions.

