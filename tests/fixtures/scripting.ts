/**
 * Scripting fixtures
 */

import type { DeviceScriptingOptions } from '../../src/types/scripting.js';

export const options: DeviceScriptingOptions = {
  categories: [{ id: 1, name: 'Disk Cleanup', internal: false }],
  scripts: [
    {
      type: 'SCRIPT',
      id: 1234,
      name: 'Clear Temp Files',
      language: 'POWERSHELL',
      description: 'Clears the Windows temp directory',
      architecture: ['64-bit'],
      categoryId: 1,
    },
    {
      type: 'ACTION',
      uid: '9f2b6e2e-0000-4000-8000-000000000001',
      name: 'Flush DNS',
    },
  ],
  credentials: {
    roles: ['SYSTEM'],
    credentials: [{ id: 1, name: 'Default Windows Credential', type: 'BASIC' }],
  },
};
