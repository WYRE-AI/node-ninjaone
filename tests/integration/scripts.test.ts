/**
 * Scripts integration tests
 */

import { describe, it, expect } from 'vitest';
import { http, HttpResponse } from 'msw';
import { NinjaOneClient } from '../../src/client.js';
import { NinjaOneServerError } from '../../src/errors.js';
import { server } from '../mocks/server.js';

const RUN_URL = 'https://app.ninjarmm.com/api/v2/device/:id/script/run';

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
      let capturedBody: Record<string, unknown> | undefined;
      server.use(
        http.post(RUN_URL, async ({ request }) => {
          capturedBody = (await request.json()) as Record<string, unknown>;
          return new HttpResponse(null, { status: 204 });
        })
      );

      await expect(
        client.scripts.run(101, { type: 'SCRIPT', id: 1234, runAs: 'SYSTEM' })
      ).resolves.toBeUndefined();
      expect(capturedBody).toEqual({ type: 'SCRIPT', id: 1234, runAs: 'SYSTEM' });
    });

    it('should run a built-in action by uid', async () => {
      let capturedBody: Record<string, unknown> | undefined;
      server.use(
        http.post(RUN_URL, async ({ request }) => {
          capturedBody = (await request.json()) as Record<string, unknown>;
          return new HttpResponse(null, { status: 204 });
        })
      );

      await expect(
        client.scripts.run(101, {
          type: 'ACTION',
          uid: '9f2b6e2e-0000-4000-8000-000000000001',
        })
      ).resolves.toBeUndefined();
      expect(capturedBody).toEqual({
        type: 'ACTION',
        uid: '9f2b6e2e-0000-4000-8000-000000000001',
      });
    });

    it('should pass parameters through to the request body', async () => {
      let capturedBody: Record<string, unknown> | undefined;
      server.use(
        http.post(RUN_URL, async ({ request }) => {
          capturedBody = (await request.json()) as Record<string, unknown>;
          return new HttpResponse(null, { status: 204 });
        })
      );

      await expect(
        client.scripts.run(101, { type: 'SCRIPT', id: 1234, parameters: '-Force' })
      ).resolves.toBeUndefined();
      expect(capturedBody).toEqual({ type: 'SCRIPT', id: 1234, parameters: '-Force' });
    });

    it('should NOT retry on a 5xx response -- a retried run() could execute the script/action twice', async () => {
      let callCount = 0;
      server.use(
        http.post(RUN_URL, () => {
          callCount++;
          return HttpResponse.json({ error: 'internal' }, { status: 503 });
        })
      );

      await expect(
        client.scripts.run(101, { type: 'SCRIPT', id: 1234 })
      ).rejects.toThrow(NinjaOneServerError);
      expect(callCount).toBe(1);
    });
  });
});
