import { defineConfig } from 'wxt';

export default defineConfig({
  manifest: {
    name: 'DropShredder',
    default_locale: 'en',
    description: '__MSG_extension_description__',
    minimum_chrome_version: '133',
    content_security_policy: {
      extension_pages: "script-src 'self' 'wasm-unsafe-eval'; object-src 'self';",
    },
    permissions: ['scripting', 'storage', 'contextMenus', 'sidePanel', 'alarms'],
    optional_host_permissions: ['https://*/*'],
    icons: {
      16: 'icon/16.png',
      32: 'icon/32.png',
      48: 'icon/48.png',
      128: 'icon/128.png',
    },
    action: {
      default_title: '__MSG_open_extension__',
      default_icon: {
        16: 'icon/16.png',
        32: 'icon/32.png',
      },
    },
  },
});
