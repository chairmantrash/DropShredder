import './style.css';

const scanButton = document.querySelector<HTMLButtonElement>('#scan');
const status = document.querySelector<HTMLElement>('#status');
const result = document.querySelector<HTMLElement>('#result');

async function scanActivePage(): Promise<void> {
  if (!scanButton || !status || !result) return;

  scanButton.disabled = true;
  status.textContent = 'Inspecting this page locally…';

  try {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    if (!tab?.id) throw new Error('No active tab is available.');

    const [execution] = await chrome.scripting.executeScript({
      target: { tabId: tab.id },
      func: () => {
        const readMeta = (selector: string): string | undefined =>
          document.querySelector<HTMLMetaElement>(selector)?.content?.trim() || undefined;

        const scripts = [...document.querySelectorAll<HTMLScriptElement>('script[type="application/ld+json"]')];
        let productCount = 0;
        for (const script of scripts) {
          try {
            const parsed = JSON.parse(script.textContent || 'null');
            const items = Array.isArray(parsed) ? parsed : [parsed];
            for (const item of items) {
              const type = item?.['@type'];
              if (type === 'Product' || (Array.isArray(type) && type.includes('Product'))) productCount += 1;
            }
          } catch {
            // Invalid JSON-LD is evidence for later extraction fallback, not a fatal scan error.
          }
        }

        const payload = {
          url: location.href,
          domain: location.hostname,
          title: readMeta('meta[property="og:title"]') || document.title?.trim() || undefined,
          description:
            readMeta('meta[property="og:description"]') ||
            readMeta('meta[name="description"]'),
          canonicalUrl:
            document.querySelector<HTMLLinkElement>('link[rel="canonical"]')?.href || undefined,
          imageCount: document.images.length,
          jsonLdProductCount: productCount,
          capturedAt: new Date().toISOString(),
        };

        const existing = document.querySelector('#dropshredder-stamp-host');
        if (!existing) {
          const host = document.createElement('div');
          host.id = 'dropshredder-stamp-host';
          host.style.cssText = 'all:initial;position:fixed;right:16px;top:96px;z-index:2147483647;';
          const shadow = host.attachShadow({ mode: 'open' });
          const panel = document.createElement('div');
          panel.textContent = productCount > 0 ? 'DROPSHREDDER • PRODUCT DETECTED' : 'DROPSHREDDER • PAGE SCANNED';
          panel.style.cssText = [
            'font:800 13px/1.2 system-ui,sans-serif',
            'letter-spacing:.06em',
            'background:#111',
            'color:#fff',
            'border:2px solid #ff3b30',
            'box-shadow:0 8px 30px rgba(0,0,0,.35)',
            'padding:12px 14px',
            'border-radius:8px',
            'max-width:280px',
          ].join(';');
          shadow.append(panel);
          document.documentElement.append(host);
        }

        return payload;
      },
    });

    if (!execution?.result) throw new Error('The page did not return a scan result.');

    result.textContent = JSON.stringify(execution.result, null, 2);
    result.hidden = false;
    status.textContent = execution.result.jsonLdProductCount > 0
      ? `Product metadata detected on ${execution.result.domain}.`
      : `Page scanned. No top-level Product JSON-LD detected yet.`;
  } catch (error) {
    status.textContent = error instanceof Error ? error.message : String(error);
    result.hidden = true;
  } finally {
    scanButton.disabled = false;
  }
}

scanButton?.addEventListener('click', () => void scanActivePage());
