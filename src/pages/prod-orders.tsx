import { useMemo, useState } from "react"
import { useQuery } from "@tanstack/react-query"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Skeleton } from "@/components/ui/skeleton"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Dyn365bc_productionorders_abk_prod_v1_0Service } from "@/generated/services/Dyn365bc_productionorders_abk_prod_v1_0Service"
import type { Dyn365bc_productionorders_abk_prod_v1_0 } from "@/generated/models/Dyn365bc_productionorders_abk_prod_v1_0Model"

type ProductionOrder = Dyn365bc_productionorders_abk_prod_v1_0

// Curated columns (the API page exposes the Production Order header fields). The
// `_statusname` / `_sourcetypename` fields are the human-readable option-set labels.
const COLUMNS: { key: keyof ProductionOrder; label: string }[] = [
  { key: "dyn365bc_no", label: "No." },
  { key: "dyn365bc_description", label: "Description" },
  { key: "dyn365bc_statusname", label: "Status" },
  { key: "dyn365bc_sourcetypename", label: "Source Type" },
  { key: "dyn365bc_sourceno", label: "Source No." },
  { key: "dyn365bc_quantity", label: "Quantity" },
  { key: "dyn365bc_routingno", label: "Routing No." },
  { key: "dyn365bc_duedate", label: "Due Date" },
  { key: "dyn365bc_startingdate", label: "Starting" },
  { key: "dyn365bc_endingdate", label: "Ending" },
  { key: "dyn365bc_finisheddate", label: "Finished" },
  { key: "dyn365bc_locationcode", label: "Location" },
  { key: "dyn365bc_bincode", label: "Bin" },
  { key: "dyn365bc_inventorypostinggroup", label: "Inv. Posting Group" },
  { key: "dyn365bc_assigneduserid", label: "Assigned User" },
]

async function fetchProductionOrders(): Promise<ProductionOrder[]> {
  const result = await Dyn365bc_productionorders_abk_prod_v1_0Service.getAll()
  if (!result.success) {
    throw result.error ?? new Error("Failed to load Production Orders")
  }
  return result.data ?? []
}

export default function ProdOrdersPage() {
  const query = useQuery({
    queryKey: ["production-orders"],
    queryFn: fetchProductionOrders,
  })
  const [filter, setFilter] = useState("")

  const rows = useMemo(() => query.data ?? [], [query.data])

  const filteredRows = useMemo(() => {
    if (!filter) return rows
    const q = filter.toLowerCase()
    return rows.filter((row) =>
      COLUMNS.some((c) => formatCell(row[c.key]).toLowerCase().includes(q)),
    )
  }, [rows, filter])

  return (
    <div className="p-6 space-y-4">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold">Production orders</h1>
          <p className="text-sm text-muted-foreground">
            Production Order (5405) · Dataverse virtual table <code>abk/prod/v1.0</code>
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={() => query.refetch()}>
          Refresh
        </Button>
      </div>

      <Card className="h-[78vh] flex flex-col">
        <CardHeader className="pb-3 flex-row items-center justify-between gap-4 space-y-0">
          <CardTitle className="text-base flex items-center gap-2">
            Orders
            {query.data && (
              <Badge variant="secondary">
                {filteredRows.length}
                {filter ? ` / ${rows.length}` : ""}
              </Badge>
            )}
          </CardTitle>
          <Input
            placeholder="Filter orders…"
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            className="w-[260px]"
          />
        </CardHeader>
        <CardContent className="flex-1 overflow-auto">
          {query.isLoading && (
            <div className="space-y-2">
              {Array.from({ length: 12 }).map((_, i) => (
                <Skeleton key={i} className="h-8 w-full" />
              ))}
            </div>
          )}

          {query.isError && (
            <div className="space-y-2">
              <p className="text-sm text-destructive">{(query.error as Error).message}</p>
              <p className="text-xs text-muted-foreground">
                Data loads through the Power Apps host. If you're running at a plain{" "}
                <code>localhost</code> URL, open the app via the Power Apps “Local Play”
                URL (printed by <code>npm run dev</code>) so the Dataverse connection is
                available.
              </p>
            </div>
          )}

          {query.data &&
            (rows.length === 0 ? (
              <p className="text-sm text-muted-foreground">No rows returned.</p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    {COLUMNS.map((c) => (
                      <TableHead key={String(c.key)} className="whitespace-nowrap">
                        {c.label}
                      </TableHead>
                    ))}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredRows.map((row, i) => (
                    <TableRow key={row.dyn365bc_productionorder_abk_prod_v1_0id ?? i}>
                      {COLUMNS.map((c) => (
                        <TableCell key={String(c.key)} className="max-w-[280px] truncate">
                          {formatCell(row[c.key])}
                        </TableCell>
                      ))}
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            ))}
        </CardContent>
      </Card>
    </div>
  )
}

function formatCell(v: unknown): string {
  if (v === null || v === undefined) return ""
  if (typeof v === "object") return JSON.stringify(v)
  return String(v)
}
