# Product contract

## Mission
DropShredder helps consumers identify likely mass-resold/dropshipped products, deceptive provenance, generic rebrands, suspicious merchant networks, review anomalies, fake scarcity, and inconsistent fulfillment claims while showing the evidence behind every warning.

## Non-negotiables
- Core extension must operate at $0/month.
- No mandatory hosted backend, paid API, subscription, account, or cloud database.
- Chrome Manifest V3 / Chromium-first architecture.
- Local-first persistence; no telemetry by default.
- Passive scan must remain lightweight.
- Deep Hunt may use heavier local computation and user-triggered public-web searches.
- Country of manufacture or seller nationality is never, by itself, a negative signal.
- A legitimate retailer reselling a manufactured item is distinct from deceptive provenance/dropshipping.
- Security/phishing risk remains a separate score from resale/deception risk.

## Primary outputs
- Mass-resell likelihood
- Dropship likelihood
- Provenance confidence
- Claim-consistency / deception risk
- Merchant transparency
- Review confidence
- Fulfillment consistency
- Security risk (separate)

## UX tone
User-selectable: Professional / Aggressive / Nuclear. Tone may be profane; factual thresholds may not change by tone.
