import { useQuery } from "@tanstack/react-query"
import {
  getCompanies,
  getCustomApiRecords,
  getRecords,
  getTables,
  getWebServiceRecords,
} from "@/lib/bc/client"
import { isBcConfigured } from "@/lib/bc/config"

/** Available tables (entity sets) in the BC environment. */
export function useBcTables() {
  return useQuery({
    queryKey: ["bc", "tables"],
    queryFn: getTables,
    enabled: isBcConfigured(),
  })
}

/** Companies in the BC environment. */
export function useBcCompanies() {
  return useQuery({
    queryKey: ["bc", "companies"],
    queryFn: getCompanies,
    enabled: isBcConfigured(),
  })
}

/** Records from a company-scoped entity set. */
export function useBcRecords(companyId: string | undefined, entitySet: string | undefined) {
  return useQuery({
    queryKey: ["bc", "records", companyId, entitySet],
    queryFn: () => getRecords(companyId!, entitySet!),
    enabled: isBcConfigured() && !!companyId && !!entitySet,
  })
}

/**
 * Records from a published BC OData V4 web service (e.g. `abk_prod_data_out`).
 * Defaults to the company in config; pass `company` to override.
 */
export function useBcWebService<T = Record<string, unknown>>(
  serviceName: string | undefined,
  options?: { company?: string; top?: number },
) {
  return useQuery({
    queryKey: ["bc", "web-service", serviceName, options?.company, options?.top],
    queryFn: () => getWebServiceRecords<T>(serviceName!, options),
    enabled: isBcConfigured() && !!serviceName,
  })
}

/**
 * Records from a custom API page (CORS-safe alternative to a web service).
 * Company-scoped by GUID, like {@link useBcRecords}.
 */
export function useBcCustomApi<T = Record<string, unknown>>(
  api: { publisher: string; group: string; version?: string } | undefined,
  companyId: string | undefined,
  entitySet: string | undefined,
  top?: number,
) {
  return useQuery({
    queryKey: ["bc", "custom-api", api, companyId, entitySet, top],
    queryFn: () => getCustomApiRecords<T>(api!, companyId!, entitySet!, top),
    enabled: isBcConfigured() && !!api && !!companyId && !!entitySet,
  })
}
