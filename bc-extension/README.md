# ABK Prod Data API — Business Central extension

Exposes the standard **Prod. Order Component** table (5407) as an **API page** so its
data can be surfaced as a Business Central → Dataverse **virtual table** and consumed by
the Power Apps code app — **without any Entra app registration**.

This is "Path A": production/manufacturing data isn't in BC's standard API v2.0, so the
only way to get it as a virtual table is a custom API page like this one.

## Files
- `app.json` — extension manifest (id, publisher `ABK`, object range 51100–51149).
- `src/ProdOrderComponentApi.Page.al` — API page (page 51100) over table 5407 "Prod. Order Component".
- `src/ProductionOrderApi.Page.al` — API page (page 51101) over table 5405 "Production Order" (header).
- `src/ProdOrderRoutingLineApi.Page.al` — API page (page 51103) over table 5410 "Prod. Order Routing Line" (operations / work centers).

## Before you publish
1. **Match the fields to your data.** The `field(...)` list mirrors the columns the
   standard "Prod. Order Comp. Lines" page exposes. Compare it to what your
   `abk_prod_data_out` web service returns and add/remove fields so they line up.
2. **Check the version.** `app.json` sets `application`/`platform` to `24.0.0.0`. If
   publishing complains about the version, set these to your environment's BC version
   (BC → Help → About / the admin center shows it). Lower-or-equal is fine.

## Publish (VS Code + AL)
1. Install the **AL Language** extension in VS Code (and **AL Object Designer** if you like).
2. Open the `bc-extension/` folder in VS Code.
3. `Ctrl+Shift+P` → **AL: Download Symbols** (sign in to the `Sandbox_VAPS_TESTING`
   environment when prompted — this uses your BC login, no Entra admin needed).
4. `Ctrl+Shift+P` → **AL: Publish** (or press `F5`) to deploy the extension to the
   sandbox.

> No `launch.json` is included. On first publish AL will prompt you to pick the
> environment; choose the BC cloud sandbox `Sandbox_VAPS_TESTING`.

## After publishing — surface it as a virtual table
1. In BC, open the **Business Central → Dataverse virtual tables** screen (the same one
   you screenshotted, with the **Visible** / **Refresh** columns).
2. **Refresh** the available-tables list. The new entity appears as roughly
   `prodOrderComponents` under publisher `abk` / group `prod` / version `v1.0`.
3. Set it **Visible** (enable it) and let the integration sync.

## Then tell me
Once it's enabled, tell me — I'll confirm its Dataverse logical name and add it to the
code app with:

```powershell
pac code add-data-source -a dataverse -t dyn365bc_prodordercomponents_abk_prod_v1_0
```

(the exact `-t` name comes from the catalog after Refresh), then point the **Production
data** page at the generated service instead of the direct-API web service — fully
connector-based, no Entra.
