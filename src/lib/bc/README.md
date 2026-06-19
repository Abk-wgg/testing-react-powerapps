# Business Central — direct REST/OData integration

The Power Apps Business Central connector (`shared_dynamicssmbsaas`) does not expose a
production `CDPTabular1` interface in this environment, so `pac code add-data-source`
cannot list or bind BC tables. This module bypasses the connector and calls the
[Business Central API v2.0](https://learn.microsoft.com/dynamics365/business-central/dev-itpro/api-reference/v2.0/)
directly using a token from MSAL.

## Files

- `config.ts` — env/coordinates (tenant, environment, company, client id) + derived URLs.
- `auth.ts` — MSAL browser auth (popup, PKCE). Acquires a token for the BC API.
- `client.ts` — `getTables()`, `getCompanies()`, `getRecords()`.
- `../../hooks/use-bc.ts` — TanStack Query hooks.
- `../../pages/business-central.tsx` — explorer UI (route `/business-central`).

## One-time setup: Entra app registration

The browser needs its own app registration to get a delegated BC token.

1. **Entra admin center → App registrations → New registration.**
   - Supported account types: *Accounts in this organizational directory only*.
   - Platform: **Single-page application (SPA)**.
   - Redirect URIs (add both):
     - `http://localhost:3000` (local dev — matches `localAppUrl`)
     - your published Code App URL (the `*.powerappsportals`/`apps.powerapps.com` origin)
2. **API permissions → Add a permission → APIs my organization uses →** search
   **Dynamics 365 Business Central** → **Delegated** → add `Financials.ReadWrite.All`
   (and `user_impersonation` if listed) → **Grant admin consent**.
3. Copy the **Application (client) ID** into `.env.local` as `VITE_BC_CLIENT_ID`.
4. In Business Central itself, make sure the signed-in user has access to the
   `Sandbox_VAPS_TESTING` environment / `OLC UAT Company`.

Then:

```
npm run dev
```

Open the app → **Business Central** in the nav → **Sign in** → tables load.

## Notes / caveats

- **Auth uses popups.** When the app is embedded in the Power Apps player (an iframe),
  popups generally work but can be blocked by the browser; allow popups for the host.
- `getTables()` reads the OData service document at the API root — these are the entity
  sets (≈ the connector's table list). `getRecords()` reads company-scoped collections
  (`companies({id})/{table}`), capped at 50 rows for the preview.
- Scope used is `https://api.businesscentral.dynamics.com/.default`.
