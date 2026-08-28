/**
 * Configuration types and defaults for the NinjaOne client
 */
/**
 * NinjaOne regional endpoints
 */
type NinjaOneRegion = 'us' | 'eu' | 'oc' | 'ca' | 'us2' | 'fed';
/**
 * Regional base URLs
 */
declare const REGION_URLS: Record<NinjaOneRegion, string>;
/**
 * Rate limiting configuration
 */
interface RateLimitConfig {
    /** Whether rate limiting is enabled (default: true) */
    enabled: boolean;
    /** Maximum requests per window (default: 100) */
    maxRequests: number;
    /** Window duration in milliseconds (default: 60000 = 1 minute) */
    windowMs: number;
    /** Threshold percentage to start throttling (default: 0.8 = 80%) */
    throttleThreshold: number;
    /** Delay between retries on 429 (default: 5000ms) */
    retryAfterMs: number;
    /** Maximum retry attempts on rate limit errors (default: 3) */
    maxRetries: number;
}
/**
 * Default rate limit configuration for NinjaOne
 * Conservative defaults to avoid hitting API limits
 */
declare const DEFAULT_RATE_LIMIT_CONFIG: RateLimitConfig;
/**
 * OAuth scopes available for NinjaOne
 */
type NinjaOneScope = 'monitoring' | 'management' | 'control';
/**
 * Configuration for the NinjaOne client
 */
interface NinjaOneConfig {
    /** OAuth 2.0 Client ID */
    clientId: string;
    /** OAuth 2.0 Client Secret */
    clientSecret: string;
    /** Region for the API endpoint (default: 'us') */
    region?: NinjaOneRegion;
    /** Explicit base URL (alternative to region) */
    baseUrl?: string;
    /** OAuth scopes (default: ['monitoring', 'management']) */
    scopes?: NinjaOneScope[];
    /** Rate limiting configuration */
    rateLimit?: Partial<RateLimitConfig>;
}
/**
 * Resolved configuration with all defaults applied
 */
interface ResolvedConfig {
    clientId: string;
    clientSecret: string;
    baseUrl: string;
    scopes: NinjaOneScope[];
    rateLimit: RateLimitConfig;
}

/**
 * OAuth 2.0 Client Credentials token management for NinjaOne API
 */

/**
 * Manages OAuth 2.0 Client Credentials token lifecycle for the NinjaOne API
 */
declare class AuthManager {
    private readonly config;
    private token;
    private refreshPromise;
    constructor(config: ResolvedConfig);
    /**
     * Get a valid access token, acquiring or refreshing as needed
     */
    getToken(): Promise<string>;
    /**
     * Force a token refresh (e.g., after a 401 response)
     */
    refreshToken(): Promise<string>;
    /**
     * Invalidate the current token
     */
    invalidateToken(): void;
    /**
     * Check if the token is valid and not near expiry
     */
    hasValidToken(): boolean;
    /**
     * Acquire a new token from the API
     */
    private acquireToken;
    /**
     * Perform the actual token acquisition using Client Credentials flow
     */
    private doAcquireToken;
    /**
     * Check if a token is within the expiry buffer
     */
    private isTokenNearExpiry;
}

/**
 * Rate limiting logic for the NinjaOne API
 *
 * NinjaOne enforces rate limits that vary by endpoint.
 * This implementation uses conservative defaults to avoid hitting limits.
 */

/**
 * Manages rate limiting for API requests
 */
declare class RateLimiter {
    private readonly config;
    private requestTimestamps;
    constructor(config: RateLimitConfig);
    /**
     * Wait until it's safe to make a request
     */
    waitForSlot(): Promise<void>;
    /**
     * Record that a request was made
     */
    recordRequest(): void;
    /**
     * Handle a rate limit error (429)
     */
    handleRateLimitError(_retryCount: number): void;
    /**
     * Get the current request rate as a fraction of the limit
     */
    getCurrentRate(): number;
    /**
     * Get the number of requests remaining in the current window
     */
    getRemainingRequests(): number;
    /**
     * Calculate retry delay with exponential backoff
     */
    calculateRetryDelay(retryCount: number): number;
    /**
     * Check if we should retry after a rate limit error
     */
    shouldRetry(retryCount: number): boolean;
    /**
     * Parse Retry-After header value
     * Returns delay in milliseconds
     */
    parseRetryAfter(retryAfterHeader: string | null): number;
    /**
     * Remove timestamps older than the window
     */
    private pruneOldTimestamps;
    /**
     * Sleep for a given duration
     */
    private sleep;
}

/**
 * HTTP layer for the NinjaOne API
 */

/**
 * HTTP request options
 */
interface RequestOptions {
    /** HTTP method */
    method?: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
    /** Request body (will be JSON stringified) */
    body?: unknown;
    /** URL query parameters */
    params?: Record<string, string | number | boolean | undefined>;
    /** Skip authentication (for token endpoint) */
    skipAuth?: boolean;
}
/**
 * HTTP client for making authenticated requests to the NinjaOne API
 */
declare class HttpClient {
    private readonly config;
    private readonly authManager;
    private readonly rateLimiter;
    constructor(config: ResolvedConfig, authManager: AuthManager, rateLimiter: RateLimiter);
    /**
     * Make an authenticated request to the API
     */
    request<T>(path: string, options?: RequestOptions): Promise<T>;
    /**
     * Make a request to a full URL (for pagination)
     */
    requestUrl<T>(url: string): Promise<T>;
    /**
     * Execute the request with retry logic
     */
    private executeRequest;
    /**
     * Handle the response and errors
     */
    private handleResponse;
    /**
     * Check if a response body indicates a validation error
     */
    private isValidationError;
    /**
     * Parse validation errors from response body
     */
    private parseValidationErrors;
    /**
     * Sleep for a given duration
     */
    private sleep;
}

/**
 * Common types shared across resources
 */
/**
 * Base list parameters for paginated endpoints
 */
interface BaseListParams {
    /** Number of records per page (default: 50) */
    pageSize?: number;
    /** Cursor for pagination */
    cursor?: string;
    /** Sort field */
    sortBy?: string;
    /** Sort descending */
    sortOrder?: 'asc' | 'desc';
}
/**
 * Base entity with common fields
 */
interface BaseEntity {
    id: number;
}
/**
 * Paginated response wrapper
 */
interface PaginatedResponse<T> {
    /** Array of results */
    results?: T[];
    /** Cursor for next page */
    cursor?: string;
    /** Total count (if available) */
    totalCount?: number;
}
/**
 * Custom field definition
 */
interface CustomField {
    /** Field name */
    name: string;
    /** Field value */
    value: string | number | boolean | null;
}
/**
 * Location information
 */
interface Location {
    name?: string;
    address?: string;
    city?: string;
    state?: string;
    zip?: string;
    country?: string;
}
/**
 * Timestamp fields common to many entities
 */
interface TimestampFields {
    /** Creation timestamp */
    createTime?: number;
    /** Last update timestamp */
    updateTime?: number;
}

/**
 * Organization types for NinjaOne
 */

/**
 * Organization entity
 */
interface Organization extends BaseEntity, TimestampFields {
    /** Organization name */
    name: string;
    /** Organization description */
    description?: string;
    /** Node approval mode */
    nodeApprovalMode?: 'AUTOMATIC' | 'MANUAL' | 'REJECT';
    /** Policy ID */
    policyId?: number;
    /** Location information */
    locations?: Location[];
    /** Custom fields */
    fields?: Record<string, unknown>;
    /** Tags */
    tags?: string[];
    /** User data */
    userData?: Record<string, unknown>;
}
/**
 * Organization list parameters
 */
interface OrganizationListParams extends BaseListParams {
    /** Filter by name (partial match) */
    name?: string;
    /** Include custom fields */
    fields?: boolean;
}
/**
 * Organization list response
 */
interface OrganizationListResponse {
    organizations: Organization[];
    cursor?: string;
}
/**
 * Organization creation data
 */
interface OrganizationCreateData {
    /** Organization name (required) */
    name: string;
    /** Organization description */
    description?: string;
    /** Node approval mode */
    nodeApprovalMode?: 'AUTOMATIC' | 'MANUAL' | 'REJECT';
    /** Policy ID */
    policyId?: number;
    /** Location information */
    locations?: Location[];
    /** Custom fields */
    fields?: Record<string, unknown>;
    /** Tags */
    tags?: string[];
    /** User data */
    userData?: Record<string, unknown>;
}
/**
 * Organization update data
 */
interface OrganizationUpdateData {
    /** Organization name */
    name?: string;
    /** Organization description */
    description?: string;
    /** Node approval mode */
    nodeApprovalMode?: 'AUTOMATIC' | 'MANUAL' | 'REJECT';
    /** Policy ID */
    policyId?: number;
    /** Location information */
    locations?: Location[];
    /** Custom fields */
    fields?: Record<string, unknown>;
    /** Tags */
    tags?: string[];
    /** User data */
    userData?: Record<string, unknown>;
}
/**
 * Organization detailed view with device counts
 */
interface OrganizationDetailed extends Organization {
    /** Number of devices */
    deviceCount?: number;
    /** Number of policies */
    policyCount?: number;
    /** Backup usage in bytes */
    backupUsage?: number;
}

/**
 * Organizations resource operations
 */

/**
 * Organizations resource operations
 */
declare class OrganizationsResource {
    private readonly httpClient;
    constructor(httpClient: HttpClient);
    /**
     * List all organizations
     */
    list(params?: OrganizationListParams): Promise<Organization[]>;
    /**
     * Get a single organization by ID
     */
    get(id: number): Promise<Organization>;
    /**
     * Get detailed organization information including device counts
     */
    getDetailed(id: number): Promise<OrganizationDetailed>;
    /**
     * Create a new organization
     */
    create(data: OrganizationCreateData): Promise<Organization>;
    /**
     * Update an existing organization
     */
    update(id: number, data: OrganizationUpdateData): Promise<Organization>;
    /**
     * Delete an organization
     */
    delete(id: number): Promise<void>;
    /**
     * Get organization locations
     */
    getLocations(id: number): Promise<{
        locations: Array<{
            id: number;
            name: string;
        }>;
    }>;
    /**
     * Get organization policies
     */
    getPolicies(id: number): Promise<{
        policies: Array<{
            id: number;
            name: string;
        }>;
    }>;
    /**
     * Build query parameters from list params
     */
    private buildListParams;
}

/**
 * Device types for NinjaOne
 */

/**
 * Device system information
 */
interface DeviceSystem {
    /** Computer name */
    name?: string;
    /** DNS name */
    dnsName?: string;
    /** NetBIOS name */
    netbiosName?: string;
    /** Manufacturer */
    manufacturer?: string;
    /** Model */
    model?: string;
    /** BIOS serial number */
    biosSerialNumber?: string;
    /** Serial number */
    serialNumber?: string;
}
/**
 * Device operating system information
 */
interface DeviceOS {
    /** OS name */
    name?: string;
    /** OS version */
    version?: string;
    /** OS architecture */
    architecture?: string;
    /** Build number */
    buildNumber?: string;
    /** Service pack */
    servicePack?: string;
}
/**
 * Device network interface
 */
interface DeviceNetworkInterface {
    /** Interface name */
    name?: string;
    /** MAC address */
    macAddress?: string;
    /** IP addresses */
    ipAddresses?: string[];
    /** Interface type */
    type?: string;
}
/**
 * Device last logged on user
 */
interface DeviceLastUser {
    /** Username */
    userName?: string;
    /** Domain */
    domain?: string;
    /** Last logon time */
    lastLogonTime?: number;
}
/**
 * Device status
 */
type DeviceStatus = 'ONLINE' | 'OFFLINE' | 'APPROVAL_PENDING' | 'UNKNOWN';
/**
 * Device node class
 */
type DeviceNodeClass = 'WINDOWS_WORKSTATION' | 'WINDOWS_SERVER' | 'MAC' | 'LINUX_WORKSTATION' | 'LINUX_SERVER' | 'VMWARE_VM_HOST' | 'VMWARE_VM_GUEST' | 'NMS';
/**
 * Device entity
 */
interface Device extends BaseEntity, TimestampFields {
    /** Parent organization ID */
    organizationId: number;
    /** Location ID */
    locationId?: number;
    /** Device node class */
    nodeClass?: DeviceNodeClass;
    /** Node role ID */
    nodeRoleId?: number;
    /** Policy ID */
    policyId?: number;
    /** Approval status */
    approvalStatus?: 'APPROVED' | 'PENDING' | 'REJECTED';
    /** Device status */
    status?: DeviceStatus;
    /** Display name */
    displayName?: string;
    /** System information */
    system?: DeviceSystem;
    /** OS information */
    os?: DeviceOS;
    /** Network interfaces */
    networkInterfaces?: DeviceNetworkInterface[];
    /** Last logged on user */
    lastLoggedOnUser?: DeviceLastUser;
    /** Last contact time */
    lastContact?: number;
    /** Agent version */
    agentVersion?: string;
    /** Custom fields */
    customFields?: CustomField[];
    /** Tags */
    tags?: string[];
    /** User data */
    userData?: Record<string, unknown>;
}
/**
 * Device list parameters
 */
interface DeviceListParams extends BaseListParams {
    /** Filter by organization ID (compiled into the `df` expression as `org=<id>`) */
    organizationId?: number;
    /**
     * Filter by device status. ONLINE/OFFLINE map to the df `online`/`offline`
     * predicates; APPROVAL_PENDING maps to `status=PENDING`. UNKNOWN has no
     * server-side equivalent and is rejected.
     */
    status?: DeviceStatus;
    /** Filter by node class (compiled into the `df` expression as `class=<NodeClass>`) */
    nodeClass?: DeviceNodeClass;
    /**
     * Start results after this device id (GET /v2/devices pagination).
     * Takes precedence over `cursor`, which is accepted as a string alias.
     */
    after?: number;
    /**
     * @deprecated Not supported by GET /v2/devices (the API has no displayName
     * filter in its df grammar); never sent. Use devices/search instead.
     */
    displayName?: string;
    /** @deprecated Not supported by GET /v2/devices; never sent. */
    includeSystem?: boolean;
    /** @deprecated Not supported by GET /v2/devices; never sent. */
    includeOS?: boolean;
    /** @deprecated Not supported by GET /v2/devices; never sent. */
    includeNetworkInterfaces?: boolean;
}
/**
 * Device list response
 */
interface DeviceListResponse {
    devices: Device[];
    cursor?: string;
}
/**
 * Device update data
 */
interface DeviceUpdateData {
    /** Display name */
    displayName?: string;
    /** Node role ID */
    nodeRoleId?: number;
    /** Tags */
    tags?: string[];
    /** User data */
    userData?: Record<string, unknown>;
}
/**
 * Device activity types
 */
type DeviceActivityType = 'AGENT' | 'CLOUDBERRY' | 'PATCH_MANAGEMENT' | 'REMOTE_TOOLS' | 'SPLASHTOP' | 'SYSTEM' | 'TEAMVIEWER';
/**
 * Device activity
 */
interface DeviceActivity {
    /** Activity ID */
    id: number;
    /** Device ID */
    deviceId: number;
    /** Activity type */
    type: DeviceActivityType;
    /** Activity status */
    status?: string;
    /** Activity message */
    message?: string;
    /** Source */
    source?: string;
    /** Timestamp */
    time: number;
    /** Severity */
    severity?: 'NONE' | 'MINOR' | 'MODERATE' | 'MAJOR' | 'CRITICAL';
}
/**
 * Device activity list response
 */
interface DeviceActivityListResponse {
    activities: DeviceActivity[];
    cursor?: string;
}
/**
 * Device service
 */
interface DeviceService {
    /** Service name */
    name: string;
    /** Display name */
    displayName?: string;
    /** Service state */
    state: 'RUNNING' | 'STOPPED' | 'PAUSED' | 'START_PENDING' | 'STOP_PENDING' | 'UNKNOWN';
    /** Start type */
    startType?: 'AUTO' | 'MANUAL' | 'DISABLED' | 'BOOT' | 'SYSTEM';
    /** Service account */
    serviceAccount?: string;
}
/**
 * Device software inventory item
 */
interface DeviceSoftware {
    /** Software name */
    name: string;
    /** Publisher */
    publisher?: string;
    /** Version */
    version?: string;
    /** Install date */
    installDate?: number;
    /** Install location */
    installLocation?: string;
    /** Size in bytes */
    size?: number;
}
/**
 * Device processor information
 */
interface DeviceProcessor {
    /** Name */
    name: string;
    /** Manufacturer */
    manufacturer?: string;
    /** Architecture */
    architecture?: string;
    /** Clock speed in MHz */
    clockSpeed?: number;
    /** Number of cores */
    cores?: number;
    /** Number of logical processors */
    logicalProcessors?: number;
}
/**
 * Device memory information
 */
interface DeviceMemory {
    /** Total RAM in bytes */
    totalRam?: number;
    /** Available RAM in bytes */
    availableRam?: number;
    /** RAM usage percentage */
    usagePercent?: number;
}
/**
 * Device disk information
 */
interface DeviceDisk {
    /** Disk name */
    name: string;
    /** Drive letter (Windows) */
    driveLetter?: string;
    /** Mount point (Linux/Mac) */
    mountPoint?: string;
    /** Total size in bytes */
    totalSize?: number;
    /** Free space in bytes */
    freeSpace?: number;
    /** File system type */
    fileSystem?: string;
}
/**
 * Device detailed hardware inventory
 */
interface DeviceInventory {
    /** Processors */
    processors?: DeviceProcessor[];
    /** Memory */
    memory?: DeviceMemory;
    /** Disks */
    disks?: DeviceDisk[];
    /** Network adapters */
    networkAdapters?: DeviceNetworkInterface[];
}

/**
 * Devices resource operations
 */

/**
 * Devices resource operations
 */
declare class DevicesResource {
    private readonly httpClient;
    constructor(httpClient: HttpClient);
    /**
     * List all devices.
     *
     * Filters are compiled into a `df` device-filter expression — GET
     * /v2/devices only understands `df`, `pageSize` and `after`; named query
     * params like `organizationId` are silently ignored by the API (returning
     * the full unfiltered fleet).
     */
    list(params?: DeviceListParams): Promise<Device[]>;
    /**
     * Compile DeviceListParams into the query GET /v2/devices actually accepts.
     *
     * df grammar (Ninja RMM Public API v2.0.5 Device Filter Syntax):
     * `org=<id>`, `class=<NodeClass>`, bare `online` / `offline` predicates,
     * `status=PENDING|APPROVED` (approval status), combined with ` AND `.
     */
    private buildDeviceQuery;
    /**
     * List devices for a specific organization
     */
    listByOrganization(organizationId: number, params?: Omit<DeviceListParams, 'organizationId'>): Promise<Device[]>;
    /**
     * Get a single device by ID
     */
    get(id: number): Promise<Device>;
    /**
     * Update a device
     */
    update(id: number, data: DeviceUpdateData): Promise<Device>;
    /**
     * Approve a pending device
     */
    approve(id: number): Promise<void>;
    /**
     * Reject a pending device
     */
    reject(id: number): Promise<void>;
    /**
     * Reboot a device
     */
    reboot(id: number, reason?: string): Promise<void>;
    /**
     * Get device activities
     */
    getActivities(id: number, params?: {
        after?: number;
        before?: number;
        pageSize?: number;
    }): Promise<DeviceActivityListResponse>;
    /**
     * Get all activities for all devices (optionally filtered by organization)
     */
    listActivities(params?: {
        organizationId?: number;
        after?: number;
        before?: number;
        pageSize?: number;
    }): Promise<DeviceActivity[]>;
    /**
     * Get device services (Windows only)
     */
    getServices(id: number): Promise<DeviceService[]>;
    /**
     * Start a Windows service
     */
    startService(id: number, serviceName: string): Promise<void>;
    /**
     * Stop a Windows service
     */
    stopService(id: number, serviceName: string): Promise<void>;
    /**
     * Restart a Windows service
     */
    restartService(id: number, serviceName: string): Promise<void>;
    /**
     * Get device software inventory
     */
    getSoftware(id: number): Promise<DeviceSoftware[]>;
    /**
     * Get device hardware inventory
     */
    getInventory(id: number): Promise<DeviceInventory>;
    /**
     * Get device custom fields
     */
    getCustomFields(id: number): Promise<Record<string, unknown>>;
    /**
     * Update device custom fields
     */
    updateCustomFields(id: number, fields: Record<string, unknown>): Promise<void>;
    /**
     * Delete a device
     */
    delete(id: number): Promise<void>;
    /**
     * Build query parameters from list params
     */
    private buildListParams;
}

/**
 * Alert types for NinjaOne
 */

/**
 * Alert severity levels
 */
type AlertSeverity = 'NONE' | 'MINOR' | 'MODERATE' | 'MAJOR' | 'CRITICAL';
/**
 * Alert source types
 */
type AlertSourceType = 'CONDITION' | 'CONDITION_ACTIONSET' | 'CONDITION_ACTION' | 'PATCH_ACTION' | 'PATCH_ACTIONSET' | 'AGENT_OFFLINE' | 'ANTIVIRUS' | 'CLOUD_BACKUP' | 'DISK_SPACE' | 'MEMORY' | 'CPU' | 'SCRIPT' | 'CUSTOM_SCRIPT';
/**
 * Alert status
 */
type AlertStatus = 'OPEN' | 'ACKNOWLEDGED' | 'RESET' | 'CLOSED';
/**
 * Alert entity
 */
interface Alert {
    /** Alert unique identifier */
    uid: string;
    /** Alert ID */
    id?: number;
    /** Device ID */
    deviceId: number;
    /** Organization ID */
    organizationId: number;
    /** Alert message */
    message: string;
    /** Alert severity */
    severity: AlertSeverity;
    /** Alert source type */
    sourceType: AlertSourceType;
    /** Alert status */
    status: AlertStatus;
    /** Creation timestamp */
    createTime: number;
    /** Last update timestamp */
    updateTime?: number;
    /** Reset timestamp */
    resetTime?: number;
    /** Source name */
    sourceName?: string;
    /** Source configuration UID */
    sourceConfigUid?: string;
    /** Subject */
    subject?: string;
    /** Priority */
    priority?: number;
    /** Ticket status */
    ticketStatus?: string;
    /** PSA ticket ID */
    psaTicketId?: string;
}
/**
 * Alert list parameters
 */
interface AlertListParams extends BaseListParams {
    /** Filter by organization ID */
    organizationId?: number;
    /** Filter by device ID */
    deviceId?: number;
    /** Filter by severity */
    severity?: AlertSeverity;
    /** Filter by status */
    status?: AlertStatus;
    /** Filter by source type */
    sourceType?: AlertSourceType;
    /** Filter by language tag (for messages) */
    lang?: string;
    /** Created after timestamp */
    after?: number;
    /** Created before timestamp */
    before?: number;
}
/**
 * Alert list response
 */
interface AlertListResponse {
    alerts: Alert[];
    cursor?: string;
}
/**
 * Alert reset/delete result
 */
interface AlertActionResult {
    /** Number of alerts affected */
    count: number;
    /** Success status */
    success: boolean;
}

/**
 * Alerts resource operations
 */

/**
 * Alerts resource operations
 */
declare class AlertsResource {
    private readonly httpClient;
    constructor(httpClient: HttpClient);
    /**
     * List all alerts
     */
    list(params?: AlertListParams): Promise<Alert[]>;
    /**
     * List alerts for a specific device
     */
    listByDevice(deviceId: number, params?: Omit<AlertListParams, 'deviceId'>): Promise<Alert[]>;
    /**
     * List alerts for a specific organization
     */
    listByOrganization(organizationId: number, params?: Omit<AlertListParams, 'organizationId'>): Promise<Alert[]>;
    /**
     * Get a single alert by UID
     */
    get(uid: string): Promise<Alert>;
    /**
     * Delete/reset an alert by UID
     */
    delete(uid: string): Promise<void>;
    /**
     * Reset an alert by UID
     */
    reset(uid: string): Promise<void>;
    /**
     * Reset all alerts for a device
     */
    resetByDevice(deviceId: number): Promise<AlertActionResult>;
    /**
     * Reset all alerts for an organization
     */
    resetByOrganization(organizationId: number): Promise<AlertActionResult>;
    /**
     * Build query parameters from list params
     */
    private buildListParams;
}

/**
 * Ticket types for NinjaOne
 */

/**
 * Ticket status
 */
type TicketStatus = 'OPEN' | 'CLOSED' | 'IN_PROGRESS' | 'ON_HOLD' | 'RESOLVED' | 'WAITING';
/**
 * Ticket priority
 */
type TicketPriority = 'NONE' | 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
/**
 * Ticket type
 */
type TicketType = 'ALERT' | 'PROBLEM' | 'QUESTION' | 'TASK';
/**
 * Ticket entity
 */
interface Ticket extends TimestampFields {
    /** Ticket ID */
    id: number;
    /** Ticket number (display) */
    ticketNumber?: string;
    /** Subject */
    subject: string;
    /** Description */
    description?: string;
    /** Status */
    status: TicketStatus;
    /** Priority */
    priority: TicketPriority;
    /** Type */
    type?: TicketType;
    /** Organization ID */
    organizationId?: number;
    /** Device ID */
    deviceId?: number;
    /** Requester user ID */
    requesterUid?: string;
    /** Requester name */
    requesterName?: string;
    /** Requester email */
    requesterEmail?: string;
    /** Assignee user ID */
    assigneeUid?: string;
    /** Assignee name */
    assigneeName?: string;
    /** Ticket form ID */
    ticketFormId?: number;
    /** Due date timestamp */
    dueDate?: number;
    /** Resolution date timestamp */
    resolutionDate?: number;
    /** Closed date timestamp */
    closedDate?: number;
    /** Source */
    source?: string;
    /** Tags */
    tags?: string[];
    /** Custom attributes */
    attributes?: Record<string, unknown>;
    /** Node ID (linked device) */
    nodeId?: number;
    /** Client ID */
    clientId?: number;
    /** Location ID */
    locationId?: number;
}
/**
 * Ticket list parameters.
 *
 * NinjaOne uses a board-based query model for listing tickets.
 * Tickets are queried via POST /api/v2/ticketing/trigger/board/{boardId}/run
 * with filters and pagination in the request body.
 */
interface TicketListParams {
    /**
     * Board ID to query (required). Board IDs are tenant-specific — board 1 is
     * NOT guaranteed to be the "All Tickets" board, and querying the wrong board
     * silently returns the wrong tickets. Call `listBoards()` to discover the
     * board IDs for the current tenant; on tenants where that endpoint returns
     * 404, read the ID from the board link's URL in the NinjaOne web UI.
     */
    boardId: number;
    /** Number of results per page (default: 50) */
    pageSize?: number;
    /** Cursor ID for pagination (0 for first page) */
    lastCursorId?: number;
    /** Sort field */
    sortBy?: string;
    /** Sort direction */
    sortOrder?: 'asc' | 'desc';
    /** Filter by organization ID */
    organizationId?: number;
    /** Filter by device ID */
    deviceId?: number;
    /** Filter by status */
    status?: TicketStatus;
    /** Filter by priority */
    priority?: TicketPriority;
}
/**
 * Ticket list response
 */
interface TicketListResponse {
    tickets: Ticket[];
    cursor?: string;
    totalCount?: number;
}
/**
 * Ticket creation data
 */
interface TicketCreateData {
    /** Subject (required) */
    subject: string;
    /** Description */
    description?: string;
    /** Status */
    status?: TicketStatus;
    /** Priority */
    priority?: TicketPriority;
    /** Type */
    type?: TicketType;
    /** Organization ID */
    organizationId?: number;
    /** Device ID */
    deviceId?: number;
    /** Requester email */
    requesterEmail?: string;
    /** Requester name */
    requesterName?: string;
    /** Assignee UID */
    assigneeUid?: string;
    /** Ticket form ID */
    ticketFormId?: number;
    /** Due date timestamp */
    dueDate?: number;
    /** Tags */
    tags?: string[];
    /** Custom attributes */
    attributes?: Record<string, unknown>;
    /** Node ID */
    nodeId?: number;
    /** Client ID */
    clientId?: number;
    /** Location ID */
    locationId?: number;
}
/**
 * Ticket update data
 */
interface TicketUpdateData {
    /** Subject */
    subject?: string;
    /** Description */
    description?: string;
    /** Status */
    status?: TicketStatus;
    /** Priority */
    priority?: TicketPriority;
    /** Type */
    type?: TicketType;
    /** Assignee UID */
    assigneeUid?: string;
    /** Due date timestamp */
    dueDate?: number;
    /** Tags */
    tags?: string[];
    /** Custom attributes */
    attributes?: Record<string, unknown>;
}
/**
 * Ticket comment
 */
interface TicketComment extends TimestampFields {
    /** Comment ID */
    id: number;
    /** Ticket ID */
    ticketId: number;
    /** Author UID */
    authorUid?: string;
    /** Author name */
    authorName?: string;
    /** Comment body */
    body: string;
    /** Is internal (not visible to requester) */
    internal?: boolean;
}
/**
 * Ticket comment creation data
 */
interface TicketCommentCreateData {
    /** Comment body */
    body: string;
    /** Is internal */
    internal?: boolean;
}
/**
 * Ticket attachment
 */
interface TicketAttachment {
    /** Attachment ID */
    id: number;
    /** Ticket ID */
    ticketId: number;
    /** File name */
    fileName: string;
    /** Content type */
    contentType?: string;
    /** File size in bytes */
    size?: number;
    /** Upload timestamp */
    uploadTime?: number;
}
/**
 * Ticket form definition
 */
interface TicketForm {
    /** Form ID */
    id: number;
    /** Form name */
    name: string;
    /** Form description */
    description?: string;
    /** Is default form */
    isDefault?: boolean;
    /** Is active */
    isActive?: boolean;
    /** Field definitions */
    fields?: TicketFormField[];
}
/**
 * Ticket form field
 */
interface TicketFormField {
    /** Field ID */
    id: number;
    /** Field name */
    name: string;
    /** Field label */
    label?: string;
    /** Field type */
    type: 'TEXT' | 'TEXTAREA' | 'NUMBER' | 'DATE' | 'DATETIME' | 'CHECKBOX' | 'SELECT' | 'MULTISELECT';
    /** Is required */
    required?: boolean;
    /** Options (for SELECT types) */
    options?: string[];
}

/**
 * Tickets resource operations
 *
 * NinjaOne's ticketing API uses a board-based query model:
 * - Listing tickets requires POST to /api/v2/ticketing/trigger/board/{boardId}/run
 * - Comments/activity are accessed via /log-entry (not /comment)
 */

/**
 * Tickets resource operations
 */
declare class TicketsResource {
    private readonly httpClient;
    constructor(httpClient: HttpClient);
    /**
     * List tickets for a board.
     *
     * NinjaOne requires querying tickets via a board, and board IDs are
     * tenant-specific — board 1 is NOT guaranteed to be the "All Tickets"
     * board, so no default is applied. Discover board IDs via listBoards().
     */
    list(params: TicketListParams): Promise<TicketListResponse>;
    /**
     * Get a single ticket by ID
     */
    get(id: number): Promise<Ticket>;
    /**
     * Create a new ticket
     */
    create(data: TicketCreateData): Promise<Ticket>;
    /**
     * Update an existing ticket
     */
    update(id: number, data: TicketUpdateData): Promise<Ticket>;
    /**
     * Delete a ticket
     */
    delete(id: number): Promise<void>;
    /**
     * Get ticket log entries (comments and activity).
     *
     * The NinjaOne API uses /log-entry for ticket comments/activity.
     * Filter by type to get only comments: type=COMMENT
     */
    getComments(ticketId: number, type?: string): Promise<TicketComment[]>;
    /**
     * Add a comment to a ticket
     */
    addComment(ticketId: number, data: TicketCommentCreateData): Promise<TicketComment>;
    /**
     * Get ticket attachments
     */
    getAttachments(ticketId: number): Promise<TicketAttachment[]>;
    /**
     * List available ticket boards.
     *
     * Note: some tenants return 404 from this endpoint
     * (GET /api/v2/ticketing/trigger/board), leaving no API path to discover
     * board IDs — in that case, read the ID from the board link's URL in the
     * NinjaOne web UI.
     */
    listBoards(): Promise<unknown[]>;
    /**
     * List available ticket forms
     */
    listForms(): Promise<TicketForm[]>;
    /**
     * Get a specific ticket form
     */
    getForm(id: number): Promise<TicketForm>;
}

/**
 * Webhook types for NinjaOne
 */
/**
 * Webhook activity types
 */
type WebhookActivityType = 'ALERT_TRIGGERED' | 'ALERT_RESET' | 'DEVICE_ADDED' | 'DEVICE_DELETED' | 'DEVICE_APPROVAL_PENDING' | 'ORGANIZATION_ADDED' | 'ORGANIZATION_DELETED' | 'POLICY_CHANGED';
/**
 * Webhook entity
 */
interface Webhook {
    /** Webhook ID */
    id: number;
    /** Webhook URL */
    url: string;
    /** Activity types to trigger webhook */
    activityTypes: WebhookActivityType[];
    /** Is active */
    isActive: boolean;
    /** Secret for signing */
    secret?: string;
    /** Creation timestamp */
    createTime?: number;
    /** Last update timestamp */
    updateTime?: number;
}
/**
 * Webhook list response
 */
interface WebhookListResponse {
    webhooks: Webhook[];
}
/**
 * Webhook creation data
 */
interface WebhookCreateData {
    /** Webhook URL (required) */
    url: string;
    /** Activity types to trigger webhook (required) */
    activityTypes: WebhookActivityType[];
    /** Is active (default: true) */
    isActive?: boolean;
}
/**
 * Webhook update data
 */
interface WebhookUpdateData {
    /** Webhook URL */
    url?: string;
    /** Activity types to trigger webhook */
    activityTypes?: WebhookActivityType[];
    /** Is active */
    isActive?: boolean;
}
/**
 * Webhook payload (received when webhook is triggered)
 */
interface WebhookPayload {
    /** Event ID */
    id: string;
    /** Activity type */
    activityType: WebhookActivityType;
    /** Timestamp */
    timestamp: number;
    /** Organization ID */
    organizationId?: number;
    /** Device ID */
    deviceId?: number;
    /** Alert UID */
    alertUid?: string;
    /** Event data */
    data?: Record<string, unknown>;
}

/**
 * Webhooks resource operations
 */

/**
 * Webhooks resource operations
 */
declare class WebhooksResource {
    private readonly httpClient;
    constructor(httpClient: HttpClient);
    /**
     * List all webhooks
     */
    list(): Promise<Webhook[]>;
    /**
     * Get a single webhook by ID
     */
    get(id: number): Promise<Webhook>;
    /**
     * Create a new webhook
     */
    create(data: WebhookCreateData): Promise<Webhook>;
    /**
     * Update an existing webhook
     */
    update(id: number, data: WebhookUpdateData): Promise<Webhook>;
    /**
     * Delete a webhook
     */
    delete(id: number): Promise<void>;
    /**
     * Test a webhook by sending a test payload
     */
    test(id: number): Promise<{
        success: boolean;
        statusCode?: number;
        message?: string;
    }>;
}

/**
 * Main NinjaOne Client
 */

/**
 * NinjaOne API Client
 *
 * @example
 * ```typescript
 * const client = new NinjaOneClient({
 *   clientId: process.env.NINJAONE_CLIENT_ID!,
 *   clientSecret: process.env.NINJAONE_CLIENT_SECRET!,
 *   region: 'us', // or 'eu', 'oc', 'ca', 'us2', 'fed'
 * });
 *
 * // List organizations
 * const organizations = await client.organizations.list();
 *
 * // Get devices for an organization
 * const devices = await client.devices.listByOrganization(123);
 *
 * // Get active alerts
 * const alerts = await client.alerts.list({ status: 'OPEN' });
 *
 * // Create a ticket
 * const ticket = await client.tickets.create({
 *   subject: 'Server down',
 *   priority: 'HIGH',
 *   organizationId: 123,
 * });
 * ```
 */
declare class NinjaOneClient {
    private readonly config;
    private readonly authManager;
    private readonly rateLimiter;
    private readonly httpClient;
    /** Organization operations */
    readonly organizations: OrganizationsResource;
    /** Device operations */
    readonly devices: DevicesResource;
    /** Alert operations */
    readonly alerts: AlertsResource;
    /** Ticket operations */
    readonly tickets: TicketsResource;
    /** Webhook operations */
    readonly webhooks: WebhooksResource;
    constructor(config: NinjaOneConfig);
    /**
     * Get the current configuration
     */
    getConfig(): Readonly<ResolvedConfig>;
    /**
     * Invalidate the current auth token, forcing a new token to be acquired
     * on the next request
     */
    invalidateToken(): void;
    /**
     * Get the current rate limit status
     */
    getRateLimitStatus(): {
        remaining: number;
        rate: number;
    };
}

/**
 * Custom error classes for the NinjaOne client
 */
/**
 * Base error class for all NinjaOne errors
 */
declare class NinjaOneError extends Error {
    /** HTTP status code if applicable */
    readonly statusCode: number;
    /** Raw response data if available */
    readonly response: unknown;
    constructor(message: string, statusCode?: number, response?: unknown);
}
/**
 * Authentication error (400 bad credentials, 401 unauthorized)
 */
declare class NinjaOneAuthenticationError extends NinjaOneError {
    constructor(message: string, statusCode?: number, response?: unknown);
}
/**
 * Forbidden error (403 permission denied)
 */
declare class NinjaOneForbiddenError extends NinjaOneError {
    constructor(message: string, response?: unknown);
}
/**
 * Resource not found error (404)
 */
declare class NinjaOneNotFoundError extends NinjaOneError {
    constructor(message: string, response?: unknown);
}
/**
 * Validation error (400 with field-level errors)
 */
declare class NinjaOneValidationError extends NinjaOneError {
    /** Field-level validation errors */
    readonly errors: Array<{
        field: string;
        message: string;
    }>;
    constructor(message: string, errors?: Array<{
        field: string;
        message: string;
    }>, response?: unknown);
}
/**
 * Bad request error (400, not a recognized validation-error shape)
 *
 * A generic 400 — e.g. a filter or parameter the endpoint rejects — is not
 * an authentication failure. Reserve NinjaOneAuthenticationError for actual
 * credential problems (401, or the OAuth token exchange rejecting bad
 * client credentials) so callers can distinguish a bad parameter from a
 * bad credential instead of both surfacing identically.
 */
declare class NinjaOneBadRequestError extends NinjaOneError {
    constructor(message: string, response?: unknown);
}
/**
 * Rate limit exceeded error (429)
 */
declare class NinjaOneRateLimitError extends NinjaOneError {
    /** Suggested retry delay in milliseconds */
    readonly retryAfter: number;
    constructor(message: string, retryAfter?: number, response?: unknown);
}
/**
 * Server error (500+)
 */
declare class NinjaOneServerError extends NinjaOneError {
    constructor(message: string, statusCode?: number, response?: unknown);
}

export { type Alert, type AlertActionResult, type AlertListParams, type AlertListResponse, type AlertSeverity, type AlertSourceType, type AlertStatus, type BaseEntity, type BaseListParams, type CustomField, DEFAULT_RATE_LIMIT_CONFIG, type Device, type DeviceActivity, type DeviceActivityListResponse, type DeviceActivityType, type DeviceDisk, type DeviceInventory, type DeviceLastUser, type DeviceListParams, type DeviceListResponse, type DeviceMemory, type DeviceNetworkInterface, type DeviceNodeClass, type DeviceOS, type DeviceProcessor, type DeviceService, type DeviceSoftware, type DeviceStatus, type DeviceSystem, type DeviceUpdateData, type Location, NinjaOneAuthenticationError, NinjaOneBadRequestError, NinjaOneClient, type NinjaOneConfig, NinjaOneError, NinjaOneForbiddenError, NinjaOneNotFoundError, NinjaOneRateLimitError, type NinjaOneRegion, type NinjaOneScope, NinjaOneServerError, NinjaOneValidationError, type Organization, type OrganizationCreateData, type OrganizationDetailed, type OrganizationListParams, type OrganizationListResponse, type OrganizationUpdateData, type PaginatedResponse, REGION_URLS, type RateLimitConfig, type Ticket, type TicketAttachment, type TicketComment, type TicketCommentCreateData, type TicketCreateData, type TicketForm, type TicketFormField, type TicketListParams, type TicketListResponse, type TicketPriority, type TicketStatus, type TicketType, type TicketUpdateData, type TimestampFields, type Webhook, type WebhookActivityType, type WebhookCreateData, type WebhookListResponse, type WebhookPayload, type WebhookUpdateData };
