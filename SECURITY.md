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
