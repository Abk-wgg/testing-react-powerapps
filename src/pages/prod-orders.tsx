import { useMemo, useState } from "react"
import { Link, useSearchParams } from "react-router-dom"
import { useQuery } from "@tanstack/react-query"
import { format, parseISO } from "date-fns"
import { ArrowDown, ArrowUp, ChevronsUpDown, Download } from "lucide-react"
import { exportRowsToExcel } from "@/lib/export-excel"
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
import { Dyn365bc_productionorders_abk_prod_v1_0dyn365bc_status as STATUS_LABELS } from "@/generated/models/Dyn365bc_productionorders_abk_prod_v1_0Model"
import type { Dyn365bc_productionorders_abk_prod_v1_0 } from "@/generated/models/Dyn365bc_productionorders_abk_prod_v1_0Model"
import { buildWorkCenterMap, fetchRoutingLines } from "@/lib/work-center"

// The order header plus the derived work center (from the routing lines).
type ProductionOrder = Dyn365bc_productionorders_abk_prod_v1_0 & {
  dyn365bc_workcenter?: string
}

// Resolve an option-set label. BC's Production Order virtual table doesn't always
// return the `_name` annotation for option sets, so prefer it when present but
// fall back to mapping the numeric enum value through the generated label map.
function optionLabel(
  name: string | undefined,
  code: number | undefined,
  labels: Record<number, string>,
): string {
  if (name) return name
  if (code == null) return ""
  return labels[code] ?? String(code)
}

type Column = {
  key: keyof ProductionOrder
  label: string
  numeric?: boolean
  date?: boolean
  wrap?: boolean
  width?: string
  render?: (row: ProductionOrder) => string
}

// Curated columns (the API page exposes the Production Order header fields).
const COLUMNS: Column[] = [
  { key: "dyn365bc_locationcode", label: "Location" },
  { key: "dyn365bc_workcenter", label: "Work Center" },
  { key: "dyn365bc_duedate", label: "Due Date", date: true },
  { key: "dyn365bc_no", label: "No." },
  { key: "dyn365bc_description", label: "Description", wrap: true, width: "w-[20%]" },
  {
    key: "dyn365bc_statusname",
    label: "Status",
    render: (row) => optionLabel(row.dyn365bc_statusname, row.dyn365bc_status, STATUS_LABELS),
  },
  { key: "dyn365bc_quantity", label: "Quantity", numeric: true },
  { key: "dyn365bc_routingno", label: "Routing No." },
  { key: "dyn365bc_startingdate", label: "Starting", date: true },
  { key: "dyn365bc_endingdate", label: "Ending", date: true },
  { key: "dyn365bc_finisheddate", label: "Finished", date: true },
  { key: "dyn365bc_assigneduserid", label: "Assigned User" },
]

type SortState = { key: keyof ProductionOrder; dir: "asc" | "desc" }

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
  // When navigated to from a component's order link, pre-filter to that order.
  const [searchParams] = useSearchParams()
  const [filter, setFilter] = useState(searchParams.get("order") ?? "")
  const [columnFilters, setColumnFilters] = useState<Record<string, string>>({})
  const [sort, setSort] = useState<SortState | null>(null)

  // Routing lines give us the work center per order (excluding "PRINTING").
  const routingQuery = useQuery({
    queryKey: ["prod-order-routing"],
    queryFn: fetchRoutingLines,
  })
  const workCenterByOrder = useMemo(
    () => buildWorkCenterMap(routingQuery.data ?? []),
    [routingQuery.data],
  )

  const rows = useMemo(
    () =>
      (query.data ?? []).map((row) => ({
        ...row,
        dyn365bc_workcenter: workCenterByOrder.get(row.dyn365bc_no ?? "") ?? "",
      })),
    [query.data, workCenterByOrder],
  )

  const filteredRows = useMemo(() => {
    const q = filter.trim().toLowerCase()
    const active = Object.entries(columnFilters).filter(([, v]) => v.trim() !== "")
    if (!q && active.length === 0) return rows
    return rows.filter((row) => {
      if (q && !COLUMNS.some((c) => cellText(c, row).toLowerCase().includes(q))) {
        return false
      }
      return active.every(([key, v]) => {
        const col = COLUMNS.find((c) => c.key === key)
        if (!col) return true
        return cellText(col, row).toLowerCase().includes(v.trim().toLowerCase())
      })
    })
  }, [rows, filter, columnFilters])

  const sortedRows = useMemo(() => {
    if (!sort) return filteredRows
    const col = COLUMNS.find((c) => c.key === sort.key)
    if (!col) return filteredRows
    const factor = sort.dir === "asc" ? 1 : -1
    return [...filteredRows].sort((a, b) => compareRows(col, a, b) * factor)
  }, [filteredRows, sort])

  const hasColumnFilters = Object.values(columnFilters).some((v) => v.trim() !== "")

  function toggleSort(key: keyof ProductionOrder) {
    setSort((prev) => {
      if (!prev || prev.key !== key) return { key, dir: "asc" }
      if (prev.dir === "asc") return { key, dir: "desc" }
      return null // third click clears the sort
    })
  }

  return (
    <div className="p-6 space-y-4">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold">Production orders</h1>
          
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            disabled={sortedRows.length === 0}
            onClick={() =>
              exportRowsToExcel(
                "production-orders",
                "Production orders",
                COLUMNS,
                sortedRows,
                cellText,
              )
            }
          >
            <Download className="size-4" />
            Export to Excel
          </Button>
          <Button variant="outline" size="sm" onClick={() => query.refetch()}>
            Refresh
          </Button>
        </div>
      </div>

      <Card className="h-[78vh] flex flex-col">
        <CardHeader className="pb-3 flex-row items-center justify-between gap-4 space-y-0">
          <CardTitle className="text-base flex items-center gap-2">
            Orders
            {query.data && (
              <Badge variant="secondary">
                {sortedRows.length}
                {filter || hasColumnFilters ? ` / ${rows.length}` : ""}
              </Badge>
            )}
          </CardTitle>
          <div className="flex items-center gap-2">
            {hasColumnFilters && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setColumnFilters({})}
              >
                Clear column filters
              </Button>
            )}
            <Input
              placeholder="Filter all columns…"
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              className="w-[260px]"
            />
          </div>
        </CardHeader>
        <CardContent className="flex-1 overflow-auto [&_[data-slot=table-container]]:overflow-visible">
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
              <Table className="w-full table-fixed">
                <TableHeader className="sticky top-0 z-10 bg-card">
                  <TableRow>
                    {COLUMNS.map((c) => {
                      const active = sort?.key === c.key
                      return (
                        <TableHead key={String(c.key)} className={`p-0 ${c.width ?? ""}`}>
                          <button
                            type="button"
                            onClick={() => toggleSort(c.key)}
                            className="flex w-full min-w-0 items-center gap-1 px-2 py-2 text-left font-medium hover:text-foreground"
                          >
                            <span className="break-words">{c.label}</span>
                            {active ? (
                              sort?.dir === "asc" ? (
                                <ArrowUp className="size-3.5 shrink-0" />
                              ) : (
                                <ArrowDown className="size-3.5 shrink-0" />
                              )
                            ) : (
                              <ChevronsUpDown className="size-3.5 shrink-0 opacity-40" />
                            )}
                          </button>
                        </TableHead>
                      )
                    })}
                  </TableRow>
                  <TableRow>
                    {COLUMNS.map((c) => (
                      <TableHead key={String(c.key)} className={`p-1 ${c.width ?? ""}`}>
                        <Input
                          value={columnFilters[c.key as string] ?? ""}
                          onChange={(e) =>
                            setColumnFilters((prev) => ({
                              ...prev,
                              [c.key as string]: e.target.value,
                            }))
                          }
                          placeholder="Filter…"
                          className="h-7 text-xs font-normal w-full min-w-0 px-2"
                        />
                      </TableHead>
                    ))}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {sortedRows.map((row, i) => (
                    <TableRow key={row.dyn365bc_productionorder_abk_prod_v1_0id ?? i}>
                      {COLUMNS.map((c) => (
                        <TableCell
                          key={String(c.key)}
                          className="whitespace-normal break-words align-top"
                        >
                          {c.key === "dyn365bc_no" ? (
                            <Link
                              to={`/prod-data?prodOrder=${encodeURIComponent(row.dyn365bc_no ?? "")}`}
                              className="text-primary underline-offset-4 hover:underline"
                            >
                              {cellText(c, row)}
                            </Link>
                          ) : (
                            cellText(c, row)
                          )}
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

function compareRows(column: Column, a: ProductionOrder, b: ProductionOrder): number {
  if (column.numeric) {
    const av = (a[column.key] as number | undefined) ?? Number.NEGATIVE_INFINITY
    const bv = (b[column.key] as number | undefined) ?? Number.NEGATIVE_INFINITY
    return av - bv
  }
  if (column.date) {
    return dateValue(a[column.key]) - dateValue(b[column.key])
  }
  return cellText(column, a).localeCompare(cellText(column, b), undefined, {
    numeric: true,
    sensitivity: "base",
  })
}

function cellText(column: Column, row: ProductionOrder): string {
  if (column.render) return column.render(row)
  if (column.date) return formatDate(row[column.key])
  return formatCell(row[column.key])
}

function formatCell(v: unknown): string {
  if (v === null || v === undefined) return ""
  if (typeof v === "object") return JSON.stringify(v)
  return String(v)
}

// BC sends dates as ISO strings ("2026-06-24T00:00:00"); empty dates come back
// as null or year 0001. Render only real dates, as "24 Jun 2026".
function parseDate(v: unknown): Date | null {
  if (!v || typeof v !== "string") return null
  const d = parseISO(v)
  if (isNaN(d.getTime()) || d.getFullYear() <= 1) return null
  return d
}

function formatDate(v: unknown): string {
  const d = parseDate(v)
  return d ? format(d, "dd MMM yyyy") : ""
}

function dateValue(v: unknown): number {
  const d = parseDate(v)
  return d ? d.getTime() : Number.NEGATIVE_INFINITY
}
