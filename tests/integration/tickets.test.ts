/**
 * Tickets integration tests
 */

import { describe, it, expect } from 'vitest';
import { http, HttpResponse } from 'msw';
import { NinjaOneClient } from '../../src/client.js';
import { NinjaOneBadRequestError, NinjaOneNotFoundError } from '../../src/errors.js';
import { server } from '../mocks/server.js';
import * as ticketFixtures from '../fixtures/tickets.js';

describe('TicketsResource', () => {
  const client = new NinjaOneClient({
    clientId: 'test-client-id',
    clientSecret: 'test-client-secret',
    region: 'us',
  });

  describe('list', () => {
    it('should list tickets for an explicit board', async () => {
      const result = await client.tickets.list({ boardId: 2 });

      expect(result.tickets).toHaveLength(2);
      expect(result.totalCount).toBe(2);
    });

    it('should reject when boardId is omitted', async () => {
      // Board IDs are tenant-specific, so list() must not guess a default.
      // Cast simulates a JS caller bypassing the (now required) type.
      await expect(
        client.tickets.list({} as { boardId: number })
      ).rejects.toThrow(/boardId/);
    });

    it('should map status enum to parent statusId in filter body', async () => {
      let capturedBody: Record<string, unknown> | undefined;
      server.use(
        http.post(
          'https://app.ninjarmm.com/api/v2/ticketing/trigger/board/:boardId/run',
          async ({ request }) => {
            capturedBody = (await request.json()) as Record<string, unknown>;
            return HttpResponse.json(ticketFixtures.list);
          }
        )
      );

      await client.tickets.list({ boardId: 2, status: 'OPEN' });

      expect(capturedBody?.filters).toEqual([
        { field: 'status', operator: 'is', value: 2000 },
      ]);
    });

    it('should map organizationId filter to clientId field', async () => {
      let capturedBody: Record<string, unknown> | undefined;
      server.use(
        http.post(
          'https://app.ninjarmm.com/api/v2/ticketing/trigger/board/:boardId/run',
          async ({ request }) => {
            capturedBody = (await request.json()) as Record<string, unknown>;
            return HttpResponse.json(ticketFixtures.list);
          }
        )
      );

      await client.tickets.list({ boardId: 2, organizationId: 42 });

      expect(capturedBody?.filters).toEqual([
        { field: 'clientId', operator: 'is', value: 42 },
      ]);
    });

    it('should throw NinjaOneBadRequestError (not an auth error) when the API rejects a filter with a plain 400', async () => {
      // A rejected filter/parameter is a bad request, not a credential
      // failure — a generic 400 must not surface as NinjaOneAuthenticationError.
      server.use(
        http.post(
          'https://app.ninjarmm.com/api/v2/ticketing/trigger/board/:boardId/run',
          () => HttpResponse.json({ error: 'invalid_filter' }, { status: 400 })
        )
      );

      await expect(client.tickets.list({ boardId: 2, organizationId: 42 })).rejects.toThrow(
        NinjaOneBadRequestError
      );
    });

    it('should forward lastCursorId for pagination', async () => {
      let capturedBody: Record<string, unknown> | undefined;
      server.use(
        http.post(
          'https://app.ninjarmm.com/api/v2/ticketing/trigger/board/:boardId/run',
          async ({ request }) => {
            capturedBody = (await request.json()) as Record<string, unknown>;
            return HttpResponse.json(ticketFixtures.list);
          }
        )
      );

      await client.tickets.list({ boardId: 2, lastCursorId: 50 });

      expect(capturedBody?.lastCursorId).toBe(50);
    });
  });

  describe('get', () => {
    it('should get a single ticket', async () => {
      const ticket = await client.tickets.get(3001);

      expect(ticket.id).toBe(3001);
      expect(ticket.subject).toBe('Server maintenance request');
    });

    it('should throw NotFoundError for non-existent ticket', async () => {
      await expect(client.tickets.get(999)).rejects.toThrow(NinjaOneNotFoundError);
    });
  });

  describe('create', () => {
    it('should create a ticket', async () => {
      const ticket = await client.tickets.create({
        subject: 'New ticket',
        priority: 'LOW',
        organizationId: 1,
      });

      expect(ticket.id).toBe(3003);
      expect(ticket.subject).toBe('New ticket');
    });
  });

  describe('update', () => {
    it('should update a ticket', async () => {
      const ticket = await client.tickets.update(3001, {
        subject: 'Updated ticket subject',
        status: 'IN_PROGRESS',
      });

      expect(ticket.subject).toBe('Updated ticket subject');
      expect(ticket.status).toBe('IN_PROGRESS');
    });
  });

  describe('delete', () => {
    it('should delete a ticket', async () => {
      await expect(client.tickets.delete(3001)).resolves.toBeUndefined();
    });
  });

  describe('getComments', () => {
    it('should get ticket comments', async () => {
      const comments = await client.tickets.getComments(3001);

      expect(comments).toHaveLength(1);
      expect(comments[0]?.body).toBe('Working on this issue.');
    });
  });

  describe('addComment', () => {
    it('should add a comment to a ticket', async () => {
      const comment = await client.tickets.addComment(3001, {
        body: 'New comment added.',
      });

      expect(comment.id).toBe(4002);
      expect(comment.body).toBe('New comment added.');
    });
  });

  describe('listForms', () => {
    it('should list ticket forms', async () => {
      const forms = await client.tickets.listForms();

      expect(forms).toHaveLength(1);
      expect(forms[0]?.name).toBe('Default Form');
    });
  });
});
