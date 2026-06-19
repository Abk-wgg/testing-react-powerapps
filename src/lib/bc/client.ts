// Thin client over the Business Central REST/OData v2.0 API.
//
// This is the "option 1" path: instead of binding tables through the Power
// Apps connector (which doesn't expose a tabular interface here), we call the
// BC API directly with a bearer token from MSAL.

import { BC_API_BASE, BC_ODATA_BASE, bcConfig, bcCustomApiBase } from "./config"
import { getAccessToken } from "./auth"

export interface BcEntitySet {
  name: string
  kind: string
  url: string
}

export interface BcCompany {
  id: string
  name: string
  displayName?: string
  systemVersion?: string
}

interface ODataList<T> {
  value: T[]
  "@odata.nextLink"?: string
}

async function bcFetch<T>(
  path: string,
  params?: Record<string, string>,
  base: string = BC_API_BASE,
): Promise<T> {
  const token = await getAccessToken()
  const url = new URL(`${base}/${path.replace(/^\//, "")}`)
  if (params) {
    for (const [k, v] of Object.entries(params)) url.searchParams.set(k, v)
  }

  const res = await fetch(url.toString(), {
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: "application/json",
    },
  })

  if (!res.ok) {
    const body = await res.text().catch(() => "")
    throw new Error(`BC API ${res.status} ${res.statusText} on ${path}: ${body.slice(0, 500)}`)
  }
  return (await res.json()) as T
}

/**
 * Lists the available "tables" (OData entity sets) exposed by the BC API for
 * this environment — the direct equivalent of the connector's table list.
 */
export async function getTables(): Promise<BcEntitySet[]> {
  const doc = await bcFetch<ODataList<BcEntitySet>>("")
  return (doc.value ?? [])
    .filter((e) => e.kind === "EntitySet")
    .sort((a, b) => a.name.localeCompare(b.name))
}

/** Lists companies in the environment. */
export async function getCompanies(): Promise<BcCompany[]> {
  const doc = await bcFetch<ODataList<BcCompany>>("companies")
  return doc.value ?? []
}

/**
 * Reads records from a company-scoped entity set, e.g. items / customers /
 * salesOrders. Returns up to `top` rows.
 */
export async function getRecords<T = Record<string, unknown>>(
  companyId: string,
  entitySet: string,
  top = 50,
): Promise<T[]> {
  const doc = await bcFetch<ODataList<T>>(`companies(${companyId})/${entitySet}`, {
    $top: String(top),
  })
  return doc.value ?? []
}

/**
 * Reads records from a published BC OData V4 *web service* (the "Web Services"
 * page in BC), e.g. `abk_prod_data_out`. These live under the `/ODataV4` base
 * and are addressed by company *name* (not the GUID used by the API v2.0
 * entities): `Company('OLC UAT Company')/{serviceName}`.
 */
export async function getWebServiceRecords<T = Record<string, unknown>>(
  serviceName: string,
  options?: { company?: string; top?: number; params?: Record<string, string> },
): Promise<T[]> {
  const company = options?.company ?? bcConfig.companyName
  // company name goes inside single quotes; encode it for the URL path.
  const path = `Company('${encodeURIComponent(company)}')/${serviceName}`
  const params: Record<string, string> = { ...(options?.params ?? {}) }
  if (options?.top != null) params.$top = String(options.top)
  const doc = await bcFetch<ODataList<T>>(path, params, BC_ODATA_BASE)
  return doc.value ?? []
}

/**
 * Reads records from a *custom API page* (publisher/group/version) — the
 * CORS-safe alternative to an OData V4 web service. Entities are company-scoped
 * by GUID, like the standard API v2.0.
 */
export async function getCustomApiRecords<T = Record<string, unknown>>(
  api: { publisher: string; group: string; version?: string },
  companyId: string,
  entitySet: string,
  top = 100,
): Promise<T[]> {
  const base = bcCustomApiBase(api.publisher, api.group, api.version)
  const doc = await bcFetch<ODataList<T>>(
    `companies(${companyId})/${entitySet}`,
    { $top: String(top) },
    base,
  )
  return doc.value ?? []
}
