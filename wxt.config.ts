import { defineConfig } from 'wxt';

export default defineConfig({
  manifest: {
    name: 'DropShredder',
    description: 'Local-first commerce forensics and product provenance analysis.',
    minimum_chrome_version: '133',
    content_security_policy: {
      extension_pages: "script-src 'self'; object-src 'self';",
    },
    permissions: ['scripting', 'storage', 'contextMenus', 'sidePanel'],
    optional_host_permissions: ['https://*/*'],
    icons: {
      16: 'icon/16.png',
      32: 'icon/32.png',
      48: 'icon/48.png',
      128: 'icon/128.png',
    },
    action: {
      default_title: 'Open DropShredder',
      default_icon: {
        16: 'icon/16.png',
        32: 'icon/32.png',
      },
    },
  },
});
