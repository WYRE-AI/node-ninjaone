/**
 * Scripting types for NinjaOne
 *
 * Shapes verified against the NinjaOne public OpenAPI spec (operationId
 * requestScriptingOptions / runScriptOnDevice) rather than assumed from
 * generic API docs.
 */

/**
 * Whether an entry is a user-authored script (SCRIPT, identified by
 * integer `id`) or a built-in action (ACTION, identified by uuid `uid`).
 */
export type ScriptEntryType = 'ACTION' | 'SCRIPT';

/**
 * A credential type usable as the `runAs` role for a script/action.
 */
export type ScriptCredentialType =
  | 'SNMPV12C'
  | 'SNMPV3'
  | 'TELNET_SSH'
  | 'NETWORK_LOCATION'
  | 'ENCRYPTION_KEY'
  | 'BASIC';

/**
 * A scripting category (grouping for scripts/actions in the library).
 */
export interface ScriptCategory {
  id: number;
  name: string;
  internal?: boolean;
}

/**
 * A single script or built-in action available on a device.
 */
export interface ScriptOption {
  type: ScriptEntryType;
  /** Custom script identifier -- present when type is SCRIPT */
  id?: number;
  /** Built-in action identifier -- present when type is ACTION */
  uid?: string;
  name?: string;
  language?: string;
  description?: string;
  architecture?: string[];
  categoryId?: number;
}

/**
 * A credential role/identifier eligible as `runAs` for a script/action.
 */
export interface ScriptCredential {
  id: number;
  name: string;
  type: ScriptCredentialType;
}

/**
 * Response of GET /api/v2/device/{id}/scripting/options.
 */
export interface DeviceScriptingOptions {
  categories: ScriptCategory[];
  scripts: ScriptOption[];
  credentials: {
    roles: string[];
    credentials: ScriptCredential[];
  };
}

/**
 * Params accepted by scripts.listOptions.
 */
export interface ScriptingOptionsParams {
  /** Language for localized script/action names and descriptions */
  lang?: string;
}

/**
 * Request body of POST /api/v2/device/{id}/script/run.
 *
 * Exactly one of `id` (SCRIPT) or `uid` (ACTION) is required, matching
 * `type`. Neither this type nor `run()` validates that pairing -- `data`
 * is forwarded to the API as-is, and a mismatch surfaces as a 400 from
 * NinjaOne's live endpoint rather than failing locally. Callers that need
 * to fail closed before reaching the API (e.g. ninjaone-mcp's
 * `scripts_run` tool) must validate the pairing themselves first.
 */
export interface RunScriptRequest {
  type: ScriptEntryType;
  /** Required when type is SCRIPT */
  id?: number;
  /** Required when type is ACTION */
  uid?: string;
  /** Parameters passed to the script/action, as a single string */
  parameters?: string;
  /** Credential role/identifier to run as */
  runAs?: string;
}
