// Business Central direct REST/OData integration config.
//
// Values come from Vite env vars (see .env.local), falling back to the known
// coordinates for the Sandbox_VAPS_TESTING environment. The ONLY value you must
// supply yourself is VITE_BC_CLIENT_ID — the Entra app registration client id
// (see src/lib/bc/README.md for setup steps).

const env = import.meta.env

export const bcConfig = {
  /** Entra (Azure AD) tenant id — used as the MSAL authority and in the BC API path. */
  tenantId: (env.VITE_BC_TENANT_ID as string) ?? "8616734f-e2d9-4f2c-ad38-2c7635809074",

  /** Business Central environment name (from the web URL). */
  environment: (env.VITE_BC_ENVIRONMENT as string) ?? "Sandbox_VAPS_TESTING",

  /** Default company display name to select. */
  companyName: (env.VITE_BC_COMPANY as string) ?? "OLC UAT Company",

  /** Entra app registration (SPA) client id. REQUIRED — no safe default. */
  clientId: (env.VITE_BC_CLIENT_ID as string) ?? "",
} as const

/** OAuth scope for the Business Central API (delegated). */
export const BC_SCOPE = "https://api.businesscentral.dynamics.com/.default"

/** MSAL authority for the tenant. */
export const BC_AUTHORITY = `https://login.microsoftonline.com/${bcConfig.tenantId}`

/** Base URL for the standard BC API v2.0, scoped to tenant + environment. */
export const BC_API_BASE = `https://api.businesscentral.dynamics.com/v2.0/${bcConfig.tenantId}/${bcConfig.environment}/api/v2.0`

/**
 * Base URL for custom OData V4 web services (BC "Web Services" page), scoped to
 * tenant + environment. Unlike the API v2.0 entities, these are addressed by
 * company *name*: `${BC_ODATA_BASE}/Company('OLC UAT Company')/{serviceName}`.
 */
export const BC_ODATA_BASE = `https://api.businesscentral.dynamics.com/v2.0/${bcConfig.tenantId}/${bcConfig.environment}/ODataV4`

/**
 * Builds the base URL for a *custom API page* (publisher/group/version). Unlike
 * OData V4 web services, custom API pages send CORS headers, so they're callable
 * from a browser SPA. Entities under it are company-scoped by GUID, like the
 * standard API v2.0: `${base}/companies({guid})/{entitySet}`.
 */
export const bcCustomApiBase = (publisher: string, group: string, version = "v1.0") =>
  `https://api.businesscentral.dynamics.com/v2.0/${bcConfig.tenantId}/${bcConfig.environment}/api/${publisher}/${group}/${version}`

export const isBcConfigured = () => bcConfig.clientId.length > 0
