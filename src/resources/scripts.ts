/**
 * Scripting resource operations
 *
 * Both endpoints are device-scoped in the NinjaOne API (there is no
 * org-wide script listing); see operationIds requestScriptingOptions /
 * runScriptOnDevice in the public OpenAPI spec.
 *
 * run() requires the "control" OAuth scope in addition to monitoring +
 * management -- that scope is not requested by default (see
 * ResolvedConfig.scopes in config.ts) and must be opted into by the
 * caller's NinjaOne OAuth application.
 */

import type { HttpClient } from '../http.js';
import type {
  DeviceScriptingOptions,
  ScriptingOptionsParams,
  RunScriptRequest,
} from '../types/scripting.js';

export class ScriptsResource {
  private readonly httpClient: HttpClient;

  constructor(httpClient: HttpClient) {
    this.httpClient = httpClient;
  }

  /**
   * List scripts and built-in actions available to run on a device,
   * plus the credential roles eligible as `runAs`. Requires only the
   * "monitoring" scope.
   */
  async listOptions(
    deviceId: number,
    params?: ScriptingOptionsParams
  ): Promise<DeviceScriptingOptions> {
    return this.httpClient.request<DeviceScriptingOptions>(
      `/api/v2/device/${deviceId}/scripting/options`,
      { params: params?.lang ? { lang: params.lang } : undefined }
    );
  }

  /**
   * Run a script or built-in action on a device. Requires "management"
   * + "control" scopes. The API returns 204 with no body -- poll
   * devices.getActivities(deviceId) for the run's result, there is no
   * separate run-status endpoint.
   */
  async run(deviceId: number, data: RunScriptRequest): Promise<void> {
    await this.httpClient.request<void>(`/api/v2/device/${deviceId}/script/run`, {
      method: 'POST',
      body: data,
    });
  }
}
