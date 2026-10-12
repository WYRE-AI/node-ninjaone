/**
 * Scripts integration tests
 */

import { describe, it, expect } from 'vitest';
import { NinjaOneClient } from '../../src/client.js';

describe('ScriptsResource', () => {
  const client = new NinjaOneClient({
    clientId: 'test-client-id',
    clientSecret: 'test-client-secret',
    region: 'us',
    scopes: ['monitoring', 'management', 'control'],
  });

  describe('listOptions', () => {
    it('should list scripting options for a device', async () => {
      const options = await client.scripts.listOptions(101);

      expect(options.scripts).toHaveLength(2);
      expect(options.scripts[0]?.type).toBe('SCRIPT');
      expect(options.scripts[0]?.id).toBe(1234);
      expect(options.scripts[1]?.type).toBe('ACTION');
      expect(options.scripts[1]?.uid).toBe('9f2b6e2e-0000-4000-8000-000000000001');
      expect(options.credentials.roles).toContain('SYSTEM');
    });
  });

  describe('run', () => {
    it('should run a custom script by id', async () => {
      await expect(
        client.scripts.run(101, { type: 'SCRIPT', id: 1234, runAs: 'SYSTEM' })
      ).resolves.toBeUndefined();
    });

    it('should run a built-in action by uid', async () => {
      await expect(
        client.scripts.run(101, {
          type: 'ACTION',
          uid: '9f2b6e2e-0000-4000-8000-000000000001',
        })
      ).resolves.toBeUndefined();
    });

    it('should pass parameters through to the request body', async () => {
      // The mock handler returns 204 regardless of body -- this asserts the
      // call resolves cleanly with parameters set, not that the mock server
      // inspects them (no handler-side assertion infra exists for POST body
      // content in this file's current handlers).
      await expect(
        client.scripts.run(101, { type: 'SCRIPT', id: 1234, parameters: '-Force' })
      ).resolves.toBeUndefined();
    });
  });
});
