# Product reference lists

Open **Your product reference lists** in the side panel. Choose a local JSON file or enter a public HTTPS feed URL and click **Fetch preview**. Review the source, publication/expiry dates, license and records before **Add reviewed list**. Records are unverified investigation leads with zero score weight. A listed manufacturer, importer or seller is a source-dated role claim; it is never automatically merged with a store.

Save a feed for **manual weekly refresh** to see when another check is due. Select that saved feed and fetch another preview. No automatic downloads occur. Expired lists stop matching. Each update requires a higher integer version, the same ID/source and a fresh expiry. **Restore previous version** is explicit and retains the highest-version floor. Remove the list before deliberately replacing its source or resetting its version. **Delete user lists & publisher keys** clears lists, rollback copies, bookmarks and keys.

Five lists maximum; each up to 800 KB and 500 records. The following is a fictional reference example; replace it with records you have permission to use and current dates:

```json
{
  "schemaVersion": 1,
  "id": "example-products",
  "title": "Fictional product reference",
  "sourceUrl": "https://publisher.example.com/products.json",
  "license": "CC0-1.0",
  "publishedAt": "2026-10-09T00:00:00Z",
  "expiresAt": "2026-11-09T00:00:00Z",
  "version": 1,
  "records": [{
    "id": "fixture-mug",
    "url": "https://manufacturer.example.com/products/mug",
    "title": "Fictional mug",
    "brand": "Fixture Maker",
    "mpn": "MUG-001",
    "attributes": {"color": "blue", "material": "ceramic"},
    "entities": [{
      "role": "manufacturer",
      "name": "Fixture Maker",
      "identifier": "fictional-company-1",
      "sourceUrl": "https://manufacturer.example.com/about",
      "observedAt": "2026-10-09T00:00:00Z"
    }]
  }]
}
```

Every product needs a check-digit-valid GTIN or both brand and model. Optional attributes: color/colour, size, capacity, material. Optional roles: manufacturer, importer, seller (six maximum). URLs are public HTTPS without credentials, query, fragment or custom port. Dates use ISO timestamps; the publication-to-expiry window is at most 90 days. Unsupported fields, duplicate IDs, invalid identities and malformed JSON are rejected. The license label is a declaration to review, not proof of rights.

Optional signed feed envelope:

```json
{"payload":"EXACT JSON STRING OF THE LIST","signature":{"keyId":"publisher-key-1","value":"BASE64URL_ED25519_SIGNATURE"}}
```

The signature covers the exact UTF-8 payload string, including whitespace. Obtain the public key independently from the publisher, then review/pin this key JSON in **Trust a publisher signing key**:

```json
{"sourceUrl":"https://publisher.example.com/products.json","keyId":"publisher-key-1","issuer":"Publisher name","publicKey":"BASE64URL_32_BYTE_ED25519_PUBLIC_KEY"}
```

No publisher is trusted automatically. Compare the displayed fingerprint with the publisher through an independent channel. Rotation requires your explicit review and a new preview; signing proves key possession, not factual allegations. This is a bounded user-pinned signature workflow, not a full TUF updater.
