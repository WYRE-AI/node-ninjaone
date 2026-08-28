// src/config.ts
var REGION_URLS = {
  us: "https://app.ninjarmm.com",
  eu: "https://eu.ninjarmm.com",
  oc: "https://oc.ninjarmm.com",
  ca: "https://ca.ninjarmm.com",
  us2: "https://us2.ninjarmm.com",
  fed: "https://fed.ninjarmm.com"
};
var DEFAULT_RATE_LIMIT_CONFIG = {
  enabled: true,
  maxRequests: 100,
  windowMs: 6e4,
  // 1 minute
  throttleThreshold: 0.8,
  // 80%
  retryAfterMs: 5e3,
  maxRetries: 3
};
function resolveConfig(config) {
  let baseUrl;
  if (config.baseUrl) {
    baseUrl = config.baseUrl.replace(/\/$/, "");
  } else {
    const region = config.region ?? "us";
    const regionUrl = REGION_URLS[region];
    if (!regionUrl) {
      throw new Error(`Invalid region: ${region}. Valid regions are: us, eu, oc, ca, us2, fed`);
    }
    baseUrl = regionUrl;
  }
  return {
    clientId: config.clientId,
    clientSecret: config.clientSecret,
    baseUrl,
    scopes: config.scopes ?? ["monitoring", "management"],
    rateLimit: {
      ...DEFAULT_RATE_LIMIT_CONFIG,
      ...config.rateLimit
    }
  };
}

// src/errors.ts
var NinjaOneError = class _NinjaOneError extends Error {
  /** HTTP status code if applicable */
  statusCode;
  /** Raw response data if available */
  response;
  constructor(message, statusCode = 0, response) {
    super(message);
    this.name = "NinjaOneError";
    this.statusCode = statusCode;
    this.response = response;
    Object.setPrototypeOf(this, _NinjaOneError.prototype);
  }
};
var NinjaOneAuthenticationError = class _NinjaOneAuthenticationError extends NinjaOneError {
  constructor(message, statusCode = 401, response) {
    super(message, statusCode, response);
    this.name = "NinjaOneAuthenticationError";
    Object.setPrototypeOf(this, _NinjaOneAuthenticationError.prototype);
  }
};
var NinjaOneForbiddenError = class _NinjaOneForbiddenError extends NinjaOneError {
  constructor(message, response) {
    super(message, 403, response);
    this.name = "NinjaOneForbiddenError";
    Object.setPrototypeOf(this, _NinjaOneForbiddenError.prototype);
  }
};
var NinjaOneNotFoundError = class _NinjaOneNotFoundError extends NinjaOneError {
  constructor(message, response) {
    super(message, 404, response);
    this.name = "NinjaOneNotFoundError";
    Object.setPrototypeOf(this, _NinjaOneNotFoundError.prototype);
  }
};
var NinjaOneValidationError = class _NinjaOneValidationError extends NinjaOneError {
  /** Field-level validation errors */
  errors;
  constructor(message, errors = [], response) {
    super(message, 400, response);
    this.name = "NinjaOneValidationError";
    this.errors = errors;
    Object.setPrototypeOf(this, _NinjaOneValidationError.prototype);
  }
};
var NinjaOneBadRequestError = class _NinjaOneBadRequestError extends NinjaOneError {
  constructor(message, response) {
    super(message, 400, response);
    this.name = "NinjaOneBadRequestError";
    Object.setPrototypeOf(this, _NinjaOneBadRequestError.prototype);
  }
};
var NinjaOneRateLimitError = class _NinjaOneRateLimitError extends NinjaOneError {
  /** Suggested retry delay in milliseconds */
  retryAfter;
  constructor(message, retryAfter = 5e3, response) {
    super(message, 429, response);
    this.name = "NinjaOneRateLimitError";
    this.retryAfter = retryAfter;
    Object.setPrototypeOf(this, _NinjaOneRateLimitError.prototype);
  }
};
var NinjaOneServerError = class _NinjaOneServerError extends NinjaOneError {
  constructor(message, statusCode = 500, response) {
    super(message, statusCode, response);
    this.name = "NinjaOneServerError";
    Object.setPrototypeOf(this, _NinjaOneServerError.prototype);
  }
};

// src/auth.ts
var EXPIRY_BUFFER_MS = 2 * 60 * 1e3;
var AuthManager = class {
  config;
  token = null;
  refreshPromise = null;
  constructor(config) {
    this.config = config;
  }
  /**
   * Get a valid access token, acquiring or refreshing as needed
   */
  async getToken() {
    if (this.token && !this.isTokenNearExpiry(this.token)) {
      return this.token.accessToken;
    }
    if (this.refreshPromise) {
      const token2 = await this.refreshPromise;
      return token2.accessToken;
    }
    const token = await this.acquireToken();
    return token.accessToken;
  }
  /**
   * Force a token refresh (e.g., after a 401 response)
   */
  async refreshToken() {
    this.token = null;
    if (this.refreshPromise) {
      const token2 = await this.refreshPromise;
      return token2.accessToken;
    }
    const token = await this.acquireToken();
    return token.accessToken;
  }
  /**
   * Invalidate the current token
   */
  invalidateToken() {
    this.token = null;
  }
  /**
   * Check if the token is valid and not near expiry
   */
  hasValidToken() {
    return this.token !== null && !this.isTokenNearExpiry(this.token);
  }
  /**
   * Acquire a new token from the API
   */
  async acquireToken() {
    this.refreshPromise = this.doAcquireToken();
    try {
      const token = await this.refreshPromise;
      this.token = token;
      return token;
    } finally {
      this.refreshPromise = null;
    }
  }
  /**
   * Perform the actual token acquisition using Client Credentials flow
   */
  async doAcquireToken() {
    const tokenUrl = `${this.config.baseUrl}/oauth/token`;
    const bodyParams = new URLSearchParams({
      grant_type: "client_credentials",
      client_id: this.config.clientId,
      client_secret: this.config.clientSecret,
      scope: this.config.scopes.join(" ")
    });
    try {
      const response = await fetch(tokenUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded"
        },
        body: bodyParams.toString()
      });
      if (!response.ok) {
        const errorBody = await response.text();
        throw new NinjaOneAuthenticationError(
          `Failed to acquire token: ${response.status} ${response.statusText}`,
          response.status,
          errorBody
        );
      }
      const data = await response.json();
      const expiresAt = Date.now() + data.expires_in * 1e3;
      return {
        accessToken: data.access_token,
        tokenType: data.token_type,
        expiresAt,
        scope: data.scope ?? this.config.scopes.join(" ")
      };
    } catch (error) {
      if (error instanceof NinjaOneAuthenticationError) {
        throw error;
      }
      throw new NinjaOneAuthenticationError(
        `Failed to acquire token: ${error instanceof Error ? error.message : "Unknown error"}`,
        0,
        error
      );
    }
  }
  /**
   * Check if a token is within the expiry buffer
   */
  isTokenNearExpiry(token) {
    return Date.now() >= token.expiresAt - EXPIRY_BUFFER_MS;
  }
};

// src/http.ts
var HttpClient = class {
  config;
  authManager;
  rateLimiter;
  constructor(config, authManager, rateLimiter) {
    this.config = config;
    this.authManager = authManager;
    this.rateLimiter = rateLimiter;
  }
  /**
   * Make an authenticated request to the API
   */
  async request(path, options = {}) {
    const { method = "GET", body, params, skipAuth = false } = options;
    let url = `${this.config.baseUrl}${path}`;
    if (params) {
      const searchParams = new URLSearchParams();
      for (const [key, value] of Object.entries(params)) {
        if (value !== void 0) {
          searchParams.append(key, String(value));
        }
      }
      const queryString = searchParams.toString();
      if (queryString) {
        url += `?${queryString}`;
      }
    }
    return this.executeRequest(url, method, body, skipAuth);
  }
  /**
   * Make a request to a full URL (for pagination)
   */
  async requestUrl(url) {
    return this.executeRequest(url, "GET", void 0, false);
  }
  /**
   * Execute the request with retry logic
   */
  async executeRequest(url, method, body, skipAuth, retryCount = 0, isRetryAfter401 = false) {
    await this.rateLimiter.waitForSlot();
    const headers = {
      "Content-Type": "application/json",
      "Accept": "application/json"
    };
    if (!skipAuth) {
      const token = await this.authManager.getToken();
      headers["Authorization"] = `Bearer ${token}`;
    }
    this.rateLimiter.recordRequest();
    const response = await fetch(url, {
      method,
      headers,
      body: body ? JSON.stringify(body) : void 0
    });
    return this.handleResponse(response, url, method, body, skipAuth, retryCount, isRetryAfter401);
  }
  /**
   * Handle the response and errors
   */
  async handleResponse(response, url, method, body, skipAuth, retryCount, isRetryAfter401) {
    if (response.ok) {
      if (response.status === 204) {
        return {};
      }
      const text = await response.text();
      if (!text || text.trim().length === 0) {
        return {};
      }
      try {
        return JSON.parse(text);
      } catch {
        return {};
      }
    }
    let responseBody;
    const rawText = await response.text();
    try {
      responseBody = JSON.parse(rawText);
    } catch {
      responseBody = rawText;
    }
    switch (response.status) {
      case 400:
        if (this.isValidationError(responseBody)) {
          const errors = this.parseValidationErrors(responseBody);
          throw new NinjaOneValidationError("Validation error", errors, responseBody);
        }
        throw new NinjaOneBadRequestError(
          "Bad request - the API rejected the request parameters",
          responseBody
        );
      case 401:
        if (isRetryAfter401) {
          throw new NinjaOneAuthenticationError(
            "Authentication failed after token refresh",
            401,
            responseBody
          );
        }
        await this.authManager.refreshToken();
        return this.executeRequest(url, method, body, skipAuth, retryCount, true);
      case 403:
        throw new NinjaOneForbiddenError("Access forbidden - insufficient permissions", responseBody);
      case 404:
        throw new NinjaOneNotFoundError("Resource not found", responseBody);
      case 429:
        if (this.rateLimiter.shouldRetry(retryCount)) {
          const retryAfterHeader = response.headers.get("Retry-After");
          const delay = this.rateLimiter.parseRetryAfter(retryAfterHeader);
          this.rateLimiter.handleRateLimitError(retryCount);
          await this.sleep(delay);
          return this.executeRequest(url, method, body, skipAuth, retryCount + 1, isRetryAfter401);
        }
        throw new NinjaOneRateLimitError(
          "Rate limit exceeded and max retries reached",
          this.config.rateLimit.retryAfterMs,
          responseBody
        );
      default:
        if (response.status >= 500) {
          if (retryCount === 0) {
            await this.sleep(1e3);
            return this.executeRequest(url, method, body, skipAuth, 1, isRetryAfter401);
          }
          throw new NinjaOneServerError(
            `Server error: ${response.status} ${response.statusText}`,
            response.status,
            responseBody
          );
        }
        throw new NinjaOneError(
          `Request failed: ${response.status} ${response.statusText}`,
          response.status,
          responseBody
        );
    }
  }
  /**
   * Check if a response body indicates a validation error
   */
  isValidationError(responseBody) {
    if (typeof responseBody === "object" && responseBody !== null) {
      const body = responseBody;
      return Array.isArray(body["errors"]) || typeof body["error"] === "object";
    }
    return false;
  }
  /**
   * Parse validation errors from response body
   */
  parseValidationErrors(responseBody) {
    if (typeof responseBody === "object" && responseBody !== null) {
      const body = responseBody;
      const errors = body["errors"];
      if (Array.isArray(errors)) {
        return errors.map((err) => {
          if (typeof err === "object" && err !== null) {
            const e = err;
            return {
              field: String(e["field"] ?? e["property"] ?? "unknown"),
              message: String(e["message"] ?? e["error"] ?? "Unknown error")
            };
          }
          return { field: "unknown", message: String(err) };
        });
      }
    }
    return [];
  }
  /**
   * Sleep for a given duration
   */
  sleep(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
};

// src/rate-limiter.ts
var RateLimiter = class {
  config;
  requestTimestamps = [];
  constructor(config) {
    this.config = config;
  }
  /**
   * Wait until it's safe to make a request
   */
  async waitForSlot() {
    if (!this.config.enabled) {
      return;
    }
    this.pruneOldTimestamps();
    const currentRate = this.requestTimestamps.length / this.config.maxRequests;
    if (currentRate >= this.config.throttleThreshold) {
      const delayMs = Math.min(
        1e3 * (currentRate - this.config.throttleThreshold + 0.1) * 10,
        5e3
      );
      await this.sleep(delayMs);
    }
    if (this.requestTimestamps.length >= this.config.maxRequests) {
      const oldestTimestamp = this.requestTimestamps[0];
      if (oldestTimestamp !== void 0) {
        const waitUntil = oldestTimestamp + this.config.windowMs;
        const waitTime = waitUntil - Date.now();
        if (waitTime > 0) {
          await this.sleep(waitTime);
        }
      }
    }
  }
  /**
   * Record that a request was made
   */
  recordRequest() {
    if (!this.config.enabled) {
      return;
    }
    this.requestTimestamps.push(Date.now());
  }
  /**
   * Handle a rate limit error (429)
   */
  handleRateLimitError(_retryCount) {
  }
  /**
   * Get the current request rate as a fraction of the limit
   */
  getCurrentRate() {
    this.pruneOldTimestamps();
    return this.requestTimestamps.length / this.config.maxRequests;
  }
  /**
   * Get the number of requests remaining in the current window
   */
  getRemainingRequests() {
    this.pruneOldTimestamps();
    return Math.max(0, this.config.maxRequests - this.requestTimestamps.length);
  }
  /**
   * Calculate retry delay with exponential backoff
   */
  calculateRetryDelay(retryCount) {
    return Math.min(
      this.config.retryAfterMs * Math.pow(2, retryCount),
      3e4
      // Max 30 seconds
    );
  }
  /**
   * Check if we should retry after a rate limit error
   */
  shouldRetry(retryCount) {
    return retryCount < this.config.maxRetries;
  }
  /**
   * Parse Retry-After header value
   * Returns delay in milliseconds
   */
  parseRetryAfter(retryAfterHeader) {
    if (!retryAfterHeader) {
      return this.config.retryAfterMs;
    }
    const seconds = parseInt(retryAfterHeader, 10);
    if (!isNaN(seconds)) {
      return seconds * 1e3;
    }
    try {
      const date = new Date(retryAfterHeader);
      const delay = date.getTime() - Date.now();
      if (delay > 0) {
        return delay;
      }
    } catch {
    }
    return this.config.retryAfterMs;
  }
  /**
   * Remove timestamps older than the window
   */
  pruneOldTimestamps() {
    const cutoff = Date.now() - this.config.windowMs;
    this.requestTimestamps = this.requestTimestamps.filter((ts) => ts > cutoff);
  }
  /**
   * Sleep for a given duration
   */
  sleep(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
};

// src/resources/organizations.ts
var OrganizationsResource = class {
  httpClient;
  constructor(httpClient) {
    this.httpClient = httpClient;
  }
  /**
   * List all organizations
   */
  async list(params) {
    const response = await this.httpClient.request("/api/v2/organizations", {
      params: this.buildListParams(params)
    });
    return response;
  }
  /**
   * Get a single organization by ID
   */
  async get(id) {
    return this.httpClient.request(`/api/v2/organization/${id}`);
  }
  /**
   * Get detailed organization information including device counts
   */
  async getDetailed(id) {
    return this.httpClient.request(`/api/v2/organization/${id}/detailed`);
  }
  /**
   * Create a new organization
   */
  async create(data) {
    return this.httpClient.request("/api/v2/organizations", {
      method: "POST",
      body: data
    });
  }
  /**
   * Update an existing organization
   */
  async update(id, data) {
    return this.httpClient.request(`/api/v2/organization/${id}`, {
      method: "PATCH",
      body: data
    });
  }
  /**
   * Delete an organization
   */
  async delete(id) {
    await this.httpClient.request(`/api/v2/organization/${id}`, {
      method: "DELETE"
    });
  }
  /**
   * Get organization locations
   */
  async getLocations(id) {
    return this.httpClient.request(`/api/v2/organization/${id}/locations`);
  }
  /**
   * Get organization policies
   */
  async getPolicies(id) {
    return this.httpClient.request(`/api/v2/organization/${id}/policies`);
  }
  /**
   * Build query parameters from list params
   */
  buildListParams(params) {
    if (!params) return {};
    const result = {};
    for (const [key, value] of Object.entries(params)) {
      if (value !== void 0) {
        result[key] = value;
      }
    }
    return result;
  }
};

// src/resources/devices.ts
var DevicesResource = class {
  httpClient;
  constructor(httpClient) {
    this.httpClient = httpClient;
  }
  /**
   * List all devices.
   *
   * Filters are compiled into a `df` device-filter expression — GET
   * /v2/devices only understands `df`, `pageSize` and `after`; named query
   * params like `organizationId` are silently ignored by the API (returning
   * the full unfiltered fleet).
   */
  async list(params) {
    const response = await this.httpClient.request("/api/v2/devices", {
      params: this.buildDeviceQuery(params)
    });
    return response;
  }
  /**
   * Compile DeviceListParams into the query GET /v2/devices actually accepts.
   *
   * df grammar (Ninja RMM Public API v2.0.5 Device Filter Syntax):
   * `org=<id>`, `class=<NodeClass>`, bare `online` / `offline` predicates,
   * `status=PENDING|APPROVED` (approval status), combined with ` AND `.
   */
  buildDeviceQuery(params) {
    if (!params) return {};
    const query = {};
    if (params.pageSize !== void 0) query.pageSize = params.pageSize;
    const after = params.after ?? (params.cursor !== void 0 ? Number(params.cursor) : void 0);
    if (after !== void 0) {
      if (!Number.isFinite(after)) {
        throw new Error(
          `Device pagination cursor must be a numeric device id ("after"), got: ${String(
            params.after ?? params.cursor
          )}`
        );
      }
      query.after = after;
    }
    const df = [];
    if (params.organizationId !== void 0) df.push(`org=${params.organizationId}`);
    if (params.nodeClass) df.push(`class=${params.nodeClass}`);
    if (params.status) {
      switch (params.status) {
        case "ONLINE":
          df.push("online");
          break;
        case "OFFLINE":
          df.push("offline");
          break;
        case "APPROVAL_PENDING":
          df.push("status=PENDING");
          break;
        default:
          throw new Error(
            `Device status filter "${params.status}" has no server-side df equivalent; use ONLINE, OFFLINE, or APPROVAL_PENDING`
          );
      }
    }
    if (df.length > 0) query.df = df.join(" AND ");
    return query;
  }
  /**
   * List devices for a specific organization
   */
  async listByOrganization(organizationId, params) {
    const response = await this.httpClient.request(`/api/v2/organization/${organizationId}/devices`, {
      params: this.buildListParams(params)
    });
    return response;
  }
  /**
   * Get a single device by ID
   */
  async get(id) {
    return this.httpClient.request(`/api/v2/device/${id}`);
  }
  /**
   * Update a device
   */
  async update(id, data) {
    return this.httpClient.request(`/api/v2/device/${id}`, {
      method: "PATCH",
      body: data
    });
  }
  /**
   * Approve a pending device
   */
  async approve(id) {
    await this.httpClient.request(`/api/v2/device/${id}/approval/APPROVED`, {
      method: "POST"
    });
  }
  /**
   * Reject a pending device
   */
  async reject(id) {
    await this.httpClient.request(`/api/v2/device/${id}/approval/REJECTED`, {
      method: "POST"
    });
  }
  /**
   * Reboot a device
   */
  async reboot(id, reason) {
    await this.httpClient.request(`/api/v2/device/${id}/reboot`, {
      method: "POST",
      body: reason ? { reason } : void 0
    });
  }
  /**
   * Get device activities
   */
  async getActivities(id, params) {
    return this.httpClient.request(`/api/v2/device/${id}/activities`, {
      params: this.buildListParams(params)
    });
  }
  /**
   * Get all activities for all devices (optionally filtered by organization)
   */
  async listActivities(params) {
    return this.httpClient.request("/api/v2/activities", {
      params: this.buildListParams(params)
    });
  }
  /**
   * Get device services (Windows only)
   */
  async getServices(id) {
    return this.httpClient.request(`/api/v2/device/${id}/windows-services`);
  }
  /**
   * Start a Windows service
   */
  async startService(id, serviceName) {
    await this.httpClient.request(`/api/v2/device/${id}/windows-service/${encodeURIComponent(serviceName)}/start`, {
      method: "POST"
    });
  }
  /**
   * Stop a Windows service
   */
  async stopService(id, serviceName) {
    await this.httpClient.request(`/api/v2/device/${id}/windows-service/${encodeURIComponent(serviceName)}/stop`, {
      method: "POST"
    });
  }
  /**
   * Restart a Windows service
   */
  async restartService(id, serviceName) {
    await this.httpClient.request(`/api/v2/device/${id}/windows-service/${encodeURIComponent(serviceName)}/restart`, {
      method: "POST"
    });
  }
  /**
   * Get device software inventory
   */
  async getSoftware(id) {
    return this.httpClient.request(`/api/v2/device/${id}/software`);
  }
  /**
   * Get device hardware inventory
   */
  async getInventory(id) {
    return this.httpClient.request(`/api/v2/device/${id}/inventory`);
  }
  /**
   * Get device custom fields
   */
  async getCustomFields(id) {
    return this.httpClient.request(`/api/v2/device/${id}/custom-fields`);
  }
  /**
   * Update device custom fields
   */
  async updateCustomFields(id, fields) {
    await this.httpClient.request(`/api/v2/device/${id}/custom-fields`, {
      method: "PATCH",
      body: fields
    });
  }
  /**
   * Delete a device
   */
  async delete(id) {
    await this.httpClient.request(`/api/v2/device/${id}`, {
      method: "DELETE"
    });
  }
  /**
   * Build query parameters from list params
   */
  buildListParams(params) {
    if (!params) return {};
    const result = {};
    for (const [key, value] of Object.entries(params)) {
      if (value !== void 0) {
        result[key] = value;
      }
    }
    return result;
  }
};

// src/resources/alerts.ts
var AlertsResource = class {
  httpClient;
  constructor(httpClient) {
    this.httpClient = httpClient;
  }
  /**
   * List all alerts
   */
  async list(params) {
    const response = await this.httpClient.request("/api/v2/alerts", {
      params: this.buildListParams(params)
    });
    return response;
  }
  /**
   * List alerts for a specific device
   */
  async listByDevice(deviceId, params) {
    const response = await this.httpClient.request(`/api/v2/device/${deviceId}/alerts`, {
      params: this.buildListParams(params)
    });
    return response;
  }
  /**
   * List alerts for a specific organization
   */
  async listByOrganization(organizationId, params) {
    const response = await this.httpClient.request(`/api/v2/organization/${organizationId}/alerts`, {
      params: this.buildListParams(params)
    });
    return response;
  }
  /**
   * Get a single alert by UID
   */
  async get(uid) {
    return this.httpClient.request(`/api/v2/alert/${uid}`);
  }
  /**
   * Delete/reset an alert by UID
   */
  async delete(uid) {
    await this.httpClient.request(`/api/v2/alert/${uid}`, {
      method: "DELETE"
    });
  }
  /**
   * Reset an alert by UID
   */
  async reset(uid) {
    await this.httpClient.request(`/api/v2/alert/${uid}/reset`, {
      method: "POST"
    });
  }
  /**
   * Reset all alerts for a device
   */
  async resetByDevice(deviceId) {
    return this.httpClient.request(`/api/v2/device/${deviceId}/alerts/reset`, {
      method: "POST"
    });
  }
  /**
   * Reset all alerts for an organization
   */
  async resetByOrganization(organizationId) {
    return this.httpClient.request(`/api/v2/organization/${organizationId}/alerts/reset`, {
      method: "POST"
    });
  }
  /**
   * Build query parameters from list params
   */
  buildListParams(params) {
    if (!params) return {};
    const result = {};
    for (const [key, value] of Object.entries(params)) {
      if (value !== void 0) {
        result[key] = value;
      }
    }
    return result;
  }
};

// src/resources/tickets.ts
var TicketsResource = class {
  httpClient;
  constructor(httpClient) {
    this.httpClient = httpClient;
  }
  /**
   * List tickets for a board.
   *
   * NinjaOne requires querying tickets via a board, and board IDs are
   * tenant-specific — board 1 is NOT guaranteed to be the "All Tickets"
   * board, so no default is applied. Discover board IDs via listBoards().
   */
  async list(params) {
    const boardId = params?.boardId;
    if (typeof boardId !== "number" || !Number.isFinite(boardId)) {
      throw new Error(
        `boardId is required: board IDs are tenant-specific and there is no safe default (board 1 is not always the "All Tickets" board). Discover board IDs via listBoards(); if that endpoint returns 404 on your tenant, read the ID from the board link's URL in the NinjaOne web UI.`
      );
    }
    const body = {
      sortBy: [],
      filters: [],
      pageSize: params?.pageSize ?? 50,
      lastCursorId: params?.lastCursorId ?? 0
    };
    if (params?.sortBy) {
      body.sortBy = [{ field: params.sortBy, direction: params.sortOrder ?? "desc" }];
    }
    const filters = [];
    if (params?.status) {
      const STATUS_PARENT_ID = {
        NEW: 1e3,
        OPEN: 2e3,
        WAITING: 3e3,
        IN_PROGRESS: 4e3,
        RESOLVED: 5e3,
        CLOSED: 6e3,
        ON_HOLD: 7e3
      };
      const id = STATUS_PARENT_ID[params.status];
      if (id !== void 0) {
        filters.push({ field: "status", operator: "is", value: id });
      }
    }
    if (params?.priority) {
      filters.push({ field: "priority", operator: "is", value: params.priority });
    }
    if (params?.organizationId) {
      filters.push({ field: "clientId", operator: "is", value: params.organizationId });
    }
    if (params?.deviceId) {
      filters.push({ field: "nodeId", operator: "is", value: params.deviceId });
    }
    if (filters.length > 0) {
      body.filters = filters;
    }
    const response = await this.httpClient.request(
      `/api/v2/ticketing/trigger/board/${boardId}/run`,
      { method: "POST", body }
    );
    if (Array.isArray(response)) {
      return { tickets: response };
    }
    return response;
  }
  /**
   * Get a single ticket by ID
   */
  async get(id) {
    return this.httpClient.request(`/api/v2/ticketing/ticket/${id}`);
  }
  /**
   * Create a new ticket
   */
  async create(data) {
    return this.httpClient.request("/api/v2/ticketing/ticket", {
      method: "POST",
      body: data
    });
  }
  /**
   * Update an existing ticket
   */
  async update(id, data) {
    return this.httpClient.request(`/api/v2/ticketing/ticket/${id}`, {
      method: "PUT",
      body: data
    });
  }
  /**
   * Delete a ticket
   */
  async delete(id) {
    await this.httpClient.request(`/api/v2/ticketing/ticket/${id}`, {
      method: "DELETE"
    });
  }
  /**
   * Get ticket log entries (comments and activity).
   *
   * The NinjaOne API uses /log-entry for ticket comments/activity.
   * Filter by type to get only comments: type=COMMENT
   */
  async getComments(ticketId, type) {
    const params = {};
    if (type) {
      params.type = type;
    }
    return this.httpClient.request(
      `/api/v2/ticketing/ticket/${ticketId}/log-entry`,
      { params }
    );
  }
  /**
   * Add a comment to a ticket
   */
  async addComment(ticketId, data) {
    return this.httpClient.request(`/api/v2/ticketing/ticket/${ticketId}/comment`, {
      method: "POST",
      body: data
    });
  }
  /**
   * Get ticket attachments
   */
  async getAttachments(ticketId) {
    return this.httpClient.request(`/api/v2/ticketing/ticket/${ticketId}/attachment`);
  }
  /**
   * List available ticket boards.
   *
   * Note: some tenants return 404 from this endpoint
   * (GET /api/v2/ticketing/trigger/board), leaving no API path to discover
   * board IDs — in that case, read the ID from the board link's URL in the
   * NinjaOne web UI.
   */
  async listBoards() {
    return this.httpClient.request("/api/v2/ticketing/trigger/board");
  }
  /**
   * List available ticket forms
   */
  async listForms() {
    return this.httpClient.request("/api/v2/ticketing/ticket-form");
  }
  /**
   * Get a specific ticket form
   */
  async getForm(id) {
    return this.httpClient.request(`/api/v2/ticketing/ticket-form/${id}`);
  }
};

// src/resources/webhooks.ts
var WebhooksResource = class {
  httpClient;
  constructor(httpClient) {
    this.httpClient = httpClient;
  }
  /**
   * List all webhooks
   */
  async list() {
    return this.httpClient.request("/api/v2/webhook");
  }
  /**
   * Get a single webhook by ID
   */
  async get(id) {
    return this.httpClient.request(`/api/v2/webhook/${id}`);
  }
  /**
   * Create a new webhook
   */
  async create(data) {
    return this.httpClient.request("/api/v2/webhook", {
      method: "POST",
      body: data
    });
  }
  /**
   * Update an existing webhook
   */
  async update(id, data) {
    return this.httpClient.request(`/api/v2/webhook/${id}`, {
      method: "PUT",
      body: data
    });
  }
  /**
   * Delete a webhook
   */
  async delete(id) {
    await this.httpClient.request(`/api/v2/webhook/${id}`, {
      method: "DELETE"
    });
  }
  /**
   * Test a webhook by sending a test payload
   */
  async test(id) {
    return this.httpClient.request(`/api/v2/webhook/${id}/test`, {
      method: "POST"
    });
  }
};

// src/client.ts
var NinjaOneClient = class {
  config;
  authManager;
  rateLimiter;
  httpClient;
  /** Organization operations */
  organizations;
  /** Device operations */
  devices;
  /** Alert operations */
  alerts;
  /** Ticket operations */
  tickets;
  /** Webhook operations */
  webhooks;
  constructor(config) {
    this.config = resolveConfig(config);
    this.authManager = new AuthManager(this.config);
    this.rateLimiter = new RateLimiter(this.config.rateLimit);
    this.httpClient = new HttpClient(this.config, this.authManager, this.rateLimiter);
    this.organizations = new OrganizationsResource(this.httpClient);
    this.devices = new DevicesResource(this.httpClient);
    this.alerts = new AlertsResource(this.httpClient);
    this.tickets = new TicketsResource(this.httpClient);
    this.webhooks = new WebhooksResource(this.httpClient);
  }
  /**
   * Get the current configuration
   */
  getConfig() {
    return this.config;
  }
  /**
   * Invalidate the current auth token, forcing a new token to be acquired
   * on the next request
   */
  invalidateToken() {
    this.authManager.invalidateToken();
  }
  /**
   * Get the current rate limit status
   */
  getRateLimitStatus() {
    return {
      remaining: this.rateLimiter.getRemainingRequests(),
      rate: this.rateLimiter.getCurrentRate()
    };
  }
};

export { DEFAULT_RATE_LIMIT_CONFIG, NinjaOneAuthenticationError, NinjaOneBadRequestError, NinjaOneClient, NinjaOneError, NinjaOneForbiddenError, NinjaOneNotFoundError, NinjaOneRateLimitError, NinjaOneServerError, NinjaOneValidationError, REGION_URLS };
//# sourceMappingURL=index.js.map
//# sourceMappingURL=index.js.map