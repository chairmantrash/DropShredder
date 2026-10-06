import { defineConfig } from 'wxt';

export default defineConfig({
  manifest: {
    name: 'DropShredder Internal Diagnostics',
    version_name: '0.1.0-internal-diagnostics',
    description: 'Internal DropShredder diagnostic build for local commerce-forensics testing.',
    permissions: ['activeTab', 'scripting', 'storage', 'contextMenus', 'sidePanel'],
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
