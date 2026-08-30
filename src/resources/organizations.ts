/**
 * Organizations resource operations
 */

import type { HttpClient } from '../http.js';
import type {
  Organization,
  OrganizationListParams,
  OrganizationCreateData,
  OrganizationUpdateData,
  OrganizationDetailed,
} from '../types/organizations.js';

/**
 * Organizations resource operations
 */
export class OrganizationsResource {
  private readonly httpClient: HttpClient;

  constructor(httpClient: HttpClient) {
    this.httpClient = httpClient;
  }

  /**
   * List all organizations
   */
  async list(params?: OrganizationListParams): Promise<Organization[]> {
    const response = await this.httpClient.request<Organization[]>('/api/v2/organizations', {
      params: this.buildListParams(params),
    });
    return response;
  }

  /**
   * Get a single organization by ID
   */
  async get(id: number): Promise<Organization> {
    return this.httpClient.request<Organization>(`/api/v2/organization/${id}`);
  }

  /**
   * Get detailed organization information including device counts
   */
  async getDetailed(id: number): Promise<OrganizationDetailed> {
    return this.httpClient.request<OrganizationDetailed>(`/api/v2/organization/${id}/detailed`);
  }

  /**
   * Create a new organization
   */
  async create(data: OrganizationCreateData): Promise<Organization> {
    return this.httpClient.request<Organization>('/api/v2/organizations', {
      method: 'POST',
      body: data,
    });
  }

  /**
   * Update an existing organization
   */
  async update(id: number, data: OrganizationUpdateData): Promise<Organization> {
    return this.httpClient.request<Organization>(`/api/v2/organization/${id}`, {
      method: 'PATCH',
      body: data,
    });
  }

  /**
   * Delete an organization
   */
  async delete(id: number): Promise<void> {
    await this.httpClient.request<void>(`/api/v2/organization/${id}`, {
      method: 'DELETE',
    });
  }

  /**
   * Get organization custom fields
   */
  async getCustomFields(id: number): Promise<Record<string, unknown>> {
    return this.httpClient.request<Record<string, unknown>>(`/api/v2/organization/${id}/custom-fields`);
  }

  /**
   * Update organization custom fields
   */
  async updateCustomFields(id: number, fields: Record<string, unknown>): Promise<void> {
    await this.httpClient.request<void>(`/api/v2/organization/${id}/custom-fields`, {
      method: 'PATCH',
      body: fields,
    });
  }

  /**
   * Get organization locations
   */
  async getLocations(id: number): Promise<{ locations: Array<{ id: number; name: string }> }> {
    return this.httpClient.request(`/api/v2/organization/${id}/locations`);
  }

  /**
   * Get organization policies
   */
  async getPolicies(id: number): Promise<{ policies: Array<{ id: number; name: string }> }> {
    return this.httpClient.request(`/api/v2/organization/${id}/policies`);
  }

  /**
   * Build query parameters from list params
   */
  private buildListParams<T extends object>(params?: T): Record<string, string | number | boolean | undefined> {
    if (!params) return {};

    const result: Record<string, string | number | boolean | undefined> = {};
    for (const [key, value] of Object.entries(params)) {
      if (value !== undefined) {
        result[key] = value as string | number | boolean;
      }
    }
    return result;
  }
}
