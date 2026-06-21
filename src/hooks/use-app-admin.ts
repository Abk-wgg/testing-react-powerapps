import { useQuery } from "@tanstack/react-query"
import { getContext } from "@microsoft/power-apps/app"
import { SystemusersService } from "@/generated/services/SystemusersService"

// Security roles: holding either grants app access; app_admin also grants
// download (Excel export) rights.
const ADMIN_ROLE = "app_admin"
const VIEWER_ROLE = "app_viewer"

type Access = { hasAccess: boolean; isAdmin: boolean }

// OData lambda over the User table's security-roles association matching any of
// the given role names, e.g. systemuserroles_association/any(r:r/name eq 'x' or r/name eq 'y').
function rolesPredicate(roleNames: string[]): string {
  const conditions = roleNames.map((n) => `r/name eq '${n}'`).join(" or ")
  return `systemuserroles_association/any(r:${conditions})`
}

// Resolve the signed-in user (by Entra object id) and inspect their security
// roles: whether they hold an access role (app access) and whether they hold the
// app_admin role (download rights).
async function fetchAccess(): Promise<Access> {
  const ctx = await getContext()
  const objectId = ctx.user?.objectId
  if (!objectId) return { hasAccess: false, isAdmin: false }

  // Does the user hold an access role (app_admin or app_viewer)?
  const access = await SystemusersService.getAll({
    select: ["systemuserid"],
    filter: `azureactivedirectoryobjectid eq ${objectId} and ${rolesPredicate([ADMIN_ROLE, VIEWER_ROLE])}`,
    top: 1,
  })
  if (!access.success) {
    throw access.error ?? new Error("Failed to check security roles")
  }
  if ((access.data?.length ?? 0) === 0) {
    return { hasAccess: false, isAdmin: false }
  }

  // Does the user hold the app_admin role specifically?
  const admin = await SystemusersService.getAll({
    select: ["systemuserid"],
    filter: `azureactivedirectoryobjectid eq ${objectId} and ${rolesPredicate([ADMIN_ROLE])}`,
    top: 1,
  })
  if (!admin.success) {
    throw admin.error ?? new Error("Failed to check security roles")
  }
  return { hasAccess: true, isAdmin: (admin.data?.length ?? 0) > 0 }
}

/**
 * Role-based access for the current user. Defaults to no access while loading or
 * on error, so the app fails closed: download stays disabled and the app gates
 * itself unless a role is positively confirmed.
 */
export function useAccessControl() {
  const query = useQuery({
    queryKey: ["access-control"],
    queryFn: fetchAccess,
  })
  return {
    hasAccess: query.data?.hasAccess ?? false,
    isAdmin: query.data?.isAdmin ?? false,
    isLoading: query.isLoading,
    isError: query.isError,
  }
}

/** Whether the current user may download (holds the `app_admin` role). */
export function useIsAppAdmin() {
  const { isAdmin, isLoading, isError } = useAccessControl()
  return { isAdmin, isLoading, isError }
}
