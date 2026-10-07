# Chrome Side Panel Runtime Model — 2026-10-07

## Authority
Primary implementation authority:
- Chrome Side Panel API: https://developer.chrome.com/docs/extensions/reference/api/sidePanel
- Chrome Tabs API: https://developer.chrome.com/docs/extensions/reference/api/tabs
- Chrome Scripting API: https://developer.chrome.com/docs/extensions/reference/api/scripting
- Chrome Permissions API: https://developer.chrome.com/docs/extensions/reference/api/permissions
- Chrome privacy/permission guidance: https://developer.chrome.com/docs/extensions/develop/security-privacy/user-privacy
- Chrome Web Store policies and quality guidelines.

## Correct DropShredder interaction model
1. The side panel is persistent extension UI and can remain open while the user changes tabs.
2. The page beside the panel must be resolved as the active tab in the last-focused browser window.
3. Do not use currentWindow from the side panel to infer the browsing window.
4. Do not use activeTab as the permission architecture for a later button click inside a persistent side panel.
5. CHECK THIS PRODUCT is the explicit user gesture. Resolve the active tab, reject non-http(s) and sensitive surfaces, then check access to that exact origin.
6. If that origin is not authorized, request only that origin using optional_host_permissions from the button gesture.
7. If access is denied, do not scan and explain the reason.
8. Once authorized, execute the bounded scanner against that exact tabId.
9. Switching to another origin must target the newly active tab and independently check/request that origin.
10. Revoke means revoke optional origins; future scans must request access again.
11. No permanent blanket host access is necessary for normal scans.

## Why the original design failed
The original beta treated activeTab as if opening the extension side panel produced durable page access for later interactions. activeTab is temporary and invocation-scoped. The first attempted repair also incorrectly reasoned about currentWindow from a side-panel extension page. Both were architecture errors, not site-specific failures.

## UX contract
- Toolbar action: open DropShredder.
- CHECK THIS PRODUCT: scan the visible active page.
- First scan on a site: Chrome may ask for access to that site.
- Repeat scan on an authorized site: no unnecessary prompt.
- Different site: independently request only that site if needed.
- Denied access: clear non-technical explanation.
- Unsupported/sensitive page: refuse before extraction.
- No background passive browsing collection.

## Release blockers
Any of the following blocks beta/public release:
- button scans wrong tab
- button silently does nothing
- site access prompt cannot be completed from the button gesture
- scan succeeds without required host authority
- extension requests blanket host access for ordinary scanning
- switching tabs leaves scan pinned to stale tab
- denied access is treated as a scan failure without explanation
- login/payment/checkout pages are scanned
- page access persists after explicit revoke contrary to Chrome state
