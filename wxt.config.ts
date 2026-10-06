import { defineConfig } from 'wxt';

export default defineConfig({
  manifest: {
    name: 'DropShredder',
    description: 'Local-first commerce forensics and product provenance analysis.',
    permissions: ['activeTab', 'scripting', 'storage', 'contextMenus', 'sidePanel'],
    optional_host_permissions: ['https://*/*', 'http://*/*'],
    action: {
      default_title: 'Open DropShredder',
    },
  },
});
