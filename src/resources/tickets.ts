/**
 * Tickets resource operations
 *
 * NinjaOne's ticketing API uses a board-based query model:
 * - Listing tickets requires POST to /api/v2/ticketing/trigger/board/{boardId}/run
 * - Comments/activity are accessed via /log-entry (not /comment)
 */

import type { HttpClient } from '../http.js';
import type {
  Ticket,
  TicketListParams,
  TicketListResponse,
  TicketCreateData,
  TicketUpdateData,
  TicketComment,
  TicketCommentCreateData,
  TicketAttachment,
  TicketForm,
} from '../types/tickets.js';

/**
 * Tickets resource operations
 */
export class TicketsResource {
  private readonly httpClient: HttpClient;

  constructor(httpClient: HttpClient) {
    this.httpClient = httpClient;
  }

  /**
   * List tickets for a board.
   *
   * NinjaOne requires querying tickets via a board, and board IDs are
   * tenant-specific — board 1 is NOT guaranteed to be the "All Tickets"
   * board, so no default is applied. Discover board IDs via listBoards().
   */
  async list(params: TicketListParams): Promise<TicketListResponse> {
    const boardId = params?.boardId;
    if (typeof boardId !== 'number' || !Number.isFinite(boardId)) {
      throw new Error(
        'boardId is required: board IDs are tenant-specific and there is no safe default ' +
          '(board 1 is not always the "All Tickets" board). Discover board IDs via ' +
          'listBoards(); if that endpoint returns 404 on your tenant, read the ID from ' +
          "the board link's URL in the NinjaOne web UI."
      );
    }
    const body: Record<string, unknown> = {
      sortBy: [] as unknown[],
      filters: [] as unknown[],
      pageSize: params?.pageSize ?? 50,
      lastCursorId: params?.lastCursorId ?? 0,
    };

    // Build sort criteria
    if (params?.sortBy) {
      body.sortBy = [{ field: params.sortBy, direction: params.sortOrder ?? 'desc' }];
    }

    // Build filter criteria from params
    const filters: Array<{ field: string; operator: string; value: unknown }> = [];
    if (params?.status) {
      // NinjaOne's filter API expects the numeric parent statusId, not the enum string.
      // Custom tenant statuses inherit one of these via parentId.
      // 1000/2000/3000/6000 confirmed via live tenant; 4000/5000/7000 inferred from
      // NinjaOne docs and the 1000-stride pattern — verify against your tenant if you
      // depend on filtering by IN_PROGRESS / RESOLVED / ON_HOLD.
      const STATUS_PARENT_ID: Record<string, number> = {
        NEW: 1000,
        OPEN: 2000,
        WAITING: 3000,
        IN_PROGRESS: 4000,
        RESOLVED: 5000,
        CLOSED: 6000,
        ON_HOLD: 7000,
      };
      const id = STATUS_PARENT_ID[params.status];
      if (id !== undefined) {
        filters.push({ field: 'status', operator: 'is', value: id });
      }
    }
    if (params?.priority) {
      filters.push({ field: 'priority', operator: 'is', value: params.priority });
    }
    if (params?.organizationId) {
      // Ticket payloads carry `clientId`, not `organizationId` — the filter field
      // must match the ticket column name or the API returns 400.
      filters.push({ field: 'clientId', operator: 'is', value: params.organizationId });
    }
    if (params?.deviceId) {
      filters.push({ field: 'nodeId', operator: 'is', value: params.deviceId });
    }
    if (filters.length > 0) {
      body.filters = filters;
    }

    const response = await this.httpClient.request<Ticket[] | TicketListResponse>(
      `/api/v2/ticketing/trigger/board/${boardId}/run`,
      { method: 'POST', body }
    );

    // Normalize response — API may return a raw array or wrapped object
    if (Array.isArray(response)) {
      return { tickets: response };
    }
    return response;
  }

  /**
   * Get a single ticket by ID
   */
  async get(id: number): Promise<Ticket> {
    return this.httpClient.request<Ticket>(`/api/v2/ticketing/ticket/${id}`);
  }

  /**
   * Create a new ticket
   */
  async create(data: TicketCreateData): Promise<Ticket> {
    return this.httpClient.request<Ticket>('/api/v2/ticketing/ticket', {
      method: 'POST',
      body: data,
    });
  }

  /**
   * Update an existing ticket
   */
  async update(id: number, data: TicketUpdateData): Promise<Ticket> {
    return this.httpClient.request<Ticket>(`/api/v2/ticketing/ticket/${id}`, {
      method: 'PUT',
      body: data,
    });
  }

  /**
   * Delete a ticket
   */
  async delete(id: number): Promise<void> {
    await this.httpClient.request<void>(`/api/v2/ticketing/ticket/${id}`, {
      method: 'DELETE',
    });
  }

  /**
   * Get ticket log entries (comments and activity).
   *
   * The NinjaOne API uses /log-entry for ticket comments/activity.
   * Filter by type to get only comments: type=COMMENT
   */
  async getComments(ticketId: number, type?: string): Promise<TicketComment[]> {
    const params: Record<string, string | number | boolean | undefined> = {};
    if (type) {
      params.type = type;
    }
    return this.httpClient.request<TicketComment[]>(
      `/api/v2/ticketing/ticket/${ticketId}/log-entry`,
      { params }
    );
  }

  /**
   * Add a comment to a ticket
   */
  async addComment(ticketId: number, data: TicketCommentCreateData): Promise<TicketComment> {
    return this.httpClient.request<TicketComment>(`/api/v2/ticketing/ticket/${ticketId}/comment`, {
      method: 'POST',
      body: data,
    });
  }

  /**
   * Get ticket attachments
   */
  async getAttachments(ticketId: number): Promise<TicketAttachment[]> {
    return this.httpClient.request<TicketAttachment[]>(`/api/v2/ticketing/ticket/${ticketId}/attachment`);
  }

  /**
   * List available ticket boards.
   *
   * Note: some tenants return 404 from this endpoint
   * (GET /api/v2/ticketing/trigger/board), leaving no API path to discover
   * board IDs — in that case, read the ID from the board link's URL in the
   * NinjaOne web UI.
   */
  async listBoards(): Promise<unknown[]> {
    return this.httpClient.request<unknown[]>('/api/v2/ticketing/trigger/board');
  }

  /**
   * List available ticket forms
   */
  async listForms(): Promise<TicketForm[]> {
    return this.httpClient.request<TicketForm[]>('/api/v2/ticketing/ticket-form');
  }

  /**
   * Get a specific ticket form
   */
  async getForm(id: number): Promise<TicketForm> {
    return this.httpClient.request<TicketForm>(`/api/v2/ticketing/ticket-form/${id}`);
  }
}
