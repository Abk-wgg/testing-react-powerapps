import { useEffect, useMemo, useRef, useState } from "react"
import { Link } from "react-router-dom"
import { useQuery } from "@tanstack/react-query"
import { format, parseISO, startOfDay } from "date-fns"
import { CalendarIcon, Check, ChevronLeft, ChevronRight, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { Dyn365bc_productionorders_abk_prod_v1_0Service } from "@/generated/services/Dyn365bc_productionorders_abk_prod_v1_0Service"
import { Dyn365bc_productionorders_abk_prod_v1_0dyn365bc_status as STATUS_LABELS } from "@/generated/models/Dyn365bc_productionorders_abk_prod_v1_0Model"
import type { Dyn365bc_productionorders_abk_prod_v1_0 } from "@/generated/models/Dyn365bc_productionorders_abk_prod_v1_0Model"
import { Dyn365bc_prodordercomponents_abk_prod_v1_0Service } from "@/generated/services/Dyn365bc_prodordercomponents_abk_prod_v1_0Service"
import type { Dyn365bc_prodordercomponents_abk_prod_v1_0 } from "@/generated/models/Dyn365bc_prodordercomponents_abk_prod_v1_0Model"
import { buildWorkCenterMap, fetchRoutingLines } from "@/lib/work-center"

type ProductionOrder = Dyn365bc_productionorders_abk_prod_v1_0 & {
  dyn365bc_workcenter?: string
}

type Component = Dyn365bc_prodordercomponents_abk_prod_v1_0

const UNASSIGNED = "— No work center —"
const NO_DATE = "no-date"

// Distinct accent per location so order cards pop and are easy to tell apart.
const LOCATION_PALETTE = [
  { accent: "border-l-[#c9ada7] bg-[#c9ada7]/35", dot: "bg-[#c9ada7]" },
  { accent: "border-l-[#7fa6c9] bg-[#7fa6c9]/35", dot: "bg-[#7fa6c9]" },
  { accent: "border-l-[#8fcf9b] bg-[#8fcf9b]/35", dot: "bg-[#8fcf9b]" },
  { accent: "border-l-[#e0c074] bg-[#e0c074]/35", dot: "bg-[#e0c074]" },
  { accent: "border-l-[#c19ad8] bg-[#c19ad8]/35", dot: "bg-[#c19ad8]" },
  { accent: "border-l-[#6fc5c5] bg-[#6fc5c5]/35", dot: "bg-[#6fc5c5]" },
] as const

const NEUTRAL_STYLE = { accent: "border-l-border bg-secondary/40", dot: "bg-muted-foreground" } as const

// Orders with no work center are flagged red so they stand out as needing attention.
const NO_WORK_CENTER_STYLE = {
  accent: "border-l-[#e2615f] bg-[#e2615f]/30",
  dot: "bg-[#e2615f]",
} as const

type LocationStyle = { accent: string; dot: string }

async function fetchProductionOrders(): Promise<Dyn365bc_productionorders_abk_prod_v1_0[]> {
  const result = await Dyn365bc_productionorders_abk_prod_v1_0Service.getAll()
  if (!result.success) {
    throw result.error ?? new Error("Failed to load Production Orders")
  }
  return result.data ?? []
}

async function fetchComponents(): Promise<Component[]> {
  const result = await Dyn365bc_prodordercomponents_abk_prod_v1_0Service.getAll()
  if (!result.success) {
    throw result.error ?? new Error("Failed to load Prod. Order Components")
  }
  return result.data ?? []
}

function parseDate(v: unknown): Date | null {
  if (!v || typeof v !== "string") return null
  const d = parseISO(v)
  if (isNaN(d.getTime()) || d.getFullYear() <= 1) return null
  return d
}

function statusLabel(row: ProductionOrder): string {
  if (row.dyn365bc_statusname) return row.dyn365bc_statusname
  const code = row.dyn365bc_status
  return code == null ? "" : STATUS_LABELS[code] ?? String(code)
}

function splitWorkCenters(value: string | undefined): string[] {
  if (!value) return []
  return value
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean)
}

type DayGroup = {
  key: string
  date: Date | null
  orders: ProductionOrder[]
}

export default function SchedulePage() {
  const ordersQuery = useQuery({
    queryKey: ["production-orders"],
    queryFn: fetchProductionOrders,
  })
  const routingQuery = useQuery({
    queryKey: ["prod-order-routing"],
    queryFn: fetchRoutingLines,
  })
  const componentsQuery = useQuery({
    queryKey: ["prod-order-components"],
    queryFn: fetchComponents,
  })
  const [category, setCategory] = useState<"production" | "trade" | null>(null)
  const [fromDate, setFromDate] = useState<Date | undefined>(undefined)
  const [pickerOpen, setPickerOpen] = useState(false)
  const [dayIndex, setDayIndex] = useState(0)
  const [releasedOnly, setReleasedOnly] = useState(true)

  // Measure the fixed header (nav + this page's sticky bar) so the work-center
  // column headers can stick right below it instead of sliding under and hiding.
  const NAV_HEIGHT = 56
  const headerRef = useRef<HTMLDivElement>(null)
  const [stickyTop, setStickyTop] = useState(NAV_HEIGHT + 120)
  useEffect(() => {
    const el = headerRef.current
    if (!el) return
    const update = () => setStickyTop(NAV_HEIGHT + el.offsetHeight)
    update()
    const ro = new ResizeObserver(update)
    ro.observe(el)
    return () => ro.disconnect()
  }, [])

  const workCenterByOrder = useMemo(
    () => buildWorkCenterMap(routingQuery.data ?? []),
    [routingQuery.data],
  )

  // Components grouped by their production order, for display on each order card.
  const componentsByOrder = useMemo(() => {
    const map = new Map<string, Component[]>()
    for (const c of componentsQuery.data ?? []) {
      const order = c.dyn365bc_prodorderno?.trim()
      if (!order) continue
      if (!map.has(order)) map.set(order, [])
      map.get(order)!.push(c)
    }
    return map
  }, [componentsQuery.data])

  const orders = useMemo<ProductionOrder[]>(
    () =>
      (ordersQuery.data ?? []).map((row) => ({
        ...row,
        dyn365bc_workcenter: workCenterByOrder.get(row.dyn365bc_no ?? "") ?? "",
      })),
    [ordersQuery.data, workCenterByOrder],
  )

  const locations = useMemo(() => {
    const set = new Set<string>()
    for (const o of orders) {
      const loc = o.dyn365bc_locationcode?.trim()
      if (loc) set.add(loc)
    }
    return Array.from(set).sort()
  }, [orders])

  // Stable color per location (by its position in the sorted list).
  const styleForLocation = useMemo(() => {
    const map = new Map<string, LocationStyle>()
    locations.forEach((loc, i) => map.set(loc, LOCATION_PALETTE[i % LOCATION_PALETTE.length]))
    return (loc: string | undefined) => (loc && map.get(loc)) || NEUTRAL_STYLE
  }, [locations])

  const visibleOrders = useMemo(() => {
    const from = fromDate ? startOfDay(fromDate).getTime() : null
    return orders.filter((o) => {
      if (releasedOnly && statusLabel(o).toLowerCase() !== "released") return false
      if (category && !orderHasCategory(o.dyn365bc_workcenter, category)) return false
      if (from !== null) {
        const due = parseDate(o.dyn365bc_duedate)
        // Only show orders due on/after the selected date (undated are hidden).
        if (!due || due.getTime() < from) return false
      }
      return true
    })
  }, [orders, category, fromDate, releasedOnly])

  // Group orders by due-date day, sorted ascending (undated last).
  const days = useMemo<DayGroup[]>(() => {
    const byDay = new Map<string, DayGroup>()
    for (const o of visibleOrders) {
      const d = parseDate(o.dyn365bc_duedate)
      const key = d ? format(d, "yyyy-MM-dd") : NO_DATE
      if (!byDay.has(key)) byDay.set(key, { key, date: d, orders: [] })
      byDay.get(key)!.orders.push(o)
    }
    return Array.from(byDay.values()).sort((a, b) => {
      if (!a.date) return 1
      if (!b.date) return -1
      return a.date.getTime() - b.date.getTime()
    })
  }, [visibleOrders])

  const isLoading = ordersQuery.isLoading || routingQuery.isLoading

  // One day shown at a time; clamp the index in case filters shrank the list.
  const currentIndex = days.length ? Math.min(Math.max(dayIndex, 0), days.length - 1) : 0
  const currentDay = days[currentIndex]

  return (
    <div className="p-4 sm:p-6 space-y-4">
      <div
        ref={headerRef}
        className="sticky top-14 z-20 -mx-4 sm:-mx-6 -mt-4 sm:-mt-6 px-4 sm:px-6 pt-4 sm:pt-6 pb-4 space-y-3 bg-background/95 backdrop-blur-sm border-b"
      >
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between sm:gap-4">
        <div className="flex items-center gap-3 sm:gap-4 flex-wrap">
          <div>
            <h1 className="text-xl sm:text-2xl font-semibold">Schedule</h1>
            <p className="text-sm text-muted-foreground">
              Production orders by due date, grouped by work center
            </p>
          </div>
          {/* From-date selector: show orders due on/after this date. */}
          <Popover open={pickerOpen} onOpenChange={setPickerOpen}>
            <PopoverTrigger asChild>
              <Button variant="outline" size="sm">
                <CalendarIcon className="size-4" />
                {fromDate ? `From ${format(fromDate, "dd MMM yyyy")}` : "From date"}
                {fromDate && (
                  <X
                    className="size-3.5 opacity-70 hover:opacity-100"
                    onClick={(e) => {
                      e.preventDefault()
                      e.stopPropagation()
                      setFromDate(undefined)
                    }}
                  />
                )}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar
                mode="single"
                selected={fromDate}
                onSelect={(d) => {
                  setFromDate(d)
                  setPickerOpen(false)
                }}
                autoFocus
              />
            </PopoverContent>
          </Popover>

          {/* Work-center category filter (PROD* = production, else trade). */}
          <div className="flex items-center gap-2 flex-wrap">
            <Button
              size="sm"
              variant={category === null ? "default" : "outline"}
              onClick={() => setCategory(null)}
            >
              All
            </Button>
            <Button
              size="sm"
              variant={category === "production" ? "default" : "outline"}
              onClick={() => setCategory("production")}
            >
              <span
                className={`size-2.5 rounded-full bg-[#e0c074] ring-1 ${
                  category === "production" ? "ring-primary-foreground/80" : "ring-foreground/20"
                }`}
              />
              Production
            </Button>
            <Button
              size="sm"
              variant={category === "trade" ? "default" : "outline"}
              onClick={() => setCategory("trade")}
            >
              <span
                className={`size-2.5 rounded-full bg-[#8fcf9b] ring-1 ${
                  category === "trade" ? "ring-primary-foreground/80" : "ring-foreground/20"
                }`}
              />
              Trade
            </Button>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Button
            variant={releasedOnly ? "default" : "outline"}
            size="sm"
            onClick={() => setReleasedOnly((v) => !v)}
          >
            {releasedOnly ? "Released only" : "With finished"}
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              ordersQuery.refetch()
              routingQuery.refetch()
            }}
          >
            Refresh
          </Button>
        </div>
        </div>

        {currentDay && (
          <div className="flex items-center justify-center gap-3 sm:gap-6">
            <Button
              variant="outline"
              size="icon"
              disabled={currentIndex === 0}
              onClick={() => setDayIndex(currentIndex - 1)}
              aria-label="Previous day"
              className="size-10 sm:size-12 shrink-0 border-[#7fa6c9]/60 text-[#7fa6c9] hover:bg-[#7fa6c9]/15 hover:text-[#7fa6c9]"
            >
              <ChevronLeft className="size-6 sm:size-7" />
            </Button>

            <div className="flex flex-col items-center text-center">
              <span className="text-2xl sm:text-3xl font-bold tracking-tight">
                {currentDay.date ? format(currentDay.date, "dd MMM yyyy") : "No due date"}
              </span>
              <span className="text-base sm:text-lg font-bold text-muted-foreground mt-0.5">
                {currentDay.date ? format(currentDay.date, "EEEE") : "Unscheduled"}
              </span>
              <div className="mt-1 flex items-center gap-2">
                <Badge variant="secondary">{currentDay.orders.length} orders</Badge>
                <span className="text-xs text-muted-foreground">
                  Day {currentIndex + 1} of {days.length}
                </span>
              </div>
            </div>

            <Button
              variant="outline"
              size="icon"
              disabled={currentIndex === days.length - 1}
              onClick={() => setDayIndex(currentIndex + 1)}
              aria-label="Next day"
              className="size-10 sm:size-12 shrink-0 border-[#8fcf9b]/60 text-[#8fcf9b] hover:bg-[#8fcf9b]/15 hover:text-[#8fcf9b]"
            >
              <ChevronRight className="size-6 sm:size-7" />
            </Button>
          </div>
        )}
      </div>

      {isLoading && (
        <div className="space-y-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-48 w-full" />
          ))}
        </div>
      )}

      {ordersQuery.isError && (
        <p className="text-sm text-destructive">
          {(ordersQuery.error as Error).message}
        </p>
      )}

      {!isLoading && !ordersQuery.isError && days.length === 0 && (
        <p className="py-10 text-center text-sm text-muted-foreground">
          {category
            ? `No ${category} orders to show.`
            : "No production orders to show."}
        </p>
      )}

      {currentDay && (
        <DayCard
          key={currentDay.key}
          day={currentDay}
          styleForLocation={styleForLocation}
          componentsByOrder={componentsByOrder}
          category={category}
          stickyTop={stickyTop}
        />
      )}
    </div>
  )
}

type WcCategory = "production" | "trade" | "unassigned"

// Themed, bold header per work-center category.
const WC_HEADER_THEME: Record<WcCategory, string> = {
  production: "bg-[#e0c074]/15 text-[#ecd29a] border-[#e0c074]/40",
  trade: "bg-[#8fcf9b]/15 text-[#a8e0b3] border-[#8fcf9b]/40",
  unassigned: "bg-[#e2615f]/15 text-[#f08e8c] border-[#e2615f]/40",
}

// Classify a work center by its name: "PROD*" = production, else trade.
function categorize(wc: string): WcCategory {
  if (wc === UNASSIGNED) return "unassigned"
  return wc.toUpperCase().startsWith("PROD") ? "production" : "trade"
}

// An order belongs to a category if it has at least one work center of that type.
function orderHasCategory(
  workCenter: string | undefined,
  category: "production" | "trade",
): boolean {
  return splitWorkCenters(workCenter).some((wc) => categorize(wc) === category)
}

function DayCard({
  day,
  styleForLocation,
  componentsByOrder,
  category,
  stickyTop,
}: {
  day: DayGroup
  styleForLocation: (loc: string | undefined) => LocationStyle
  componentsByOrder: Map<string, Component[]>
  category: "production" | "trade" | null
  stickyTop: number
}) {
  // Build work-center columns, ordering production first, then trade, then
  // unassigned; alphabetical within each group. When a category is selected,
  // only that category's work-center columns are shown.
  const columns = useMemo(() => {
    const byWc = new Map<string, ProductionOrder[]>()
    for (const o of day.orders) {
      const wcs = splitWorkCenters(o.dyn365bc_workcenter)
      const keys = wcs.length ? wcs : [UNASSIGNED]
      for (const k of keys) {
        if (!byWc.has(k)) byWc.set(k, [])
        byWc.get(k)!.push(o)
      }
    }
    const rank: Record<WcCategory, number> = { production: 0, trade: 1, unassigned: 2 }
    return Array.from(byWc.entries())
      .map(([wc, orders]) => ({ wc, orders, category: categorize(wc) }))
      .filter((c) => !category || c.category === category)
      .sort((a, b) => rank[a.category] - rank[b.category] || a.wc.localeCompare(b.wc))
  }, [day.orders, category])

  return (
    <Card className="shadow-2xl shadow-black/60 animate-in fade-in slide-in-from-bottom-1 duration-300">
      <CardContent className="pt-6">
        {/* Scrolls inside the card (both axes), sized to the remaining viewport so
            the page itself doesn't scroll and the column headers stay pinned. */}
        <div
          className="flex items-start overflow-auto divide-x-4 divide-double divide-[#9a8c98]"
          style={{ maxHeight: `calc(100dvh - ${stickyTop + 40}px)` }}
        >
          {columns.map(({ wc, orders, category }) => (
            <div key={wc} className="w-[80vw] max-w-[284px] sm:w-[284px] shrink-0 px-3 sm:px-4 first:pl-0 last:pr-0">
              {/* Sticky header: opaque card backdrop so rows pass behind it. */}
              <div className="sticky top-0 z-10 bg-card pb-2">
                <div
                  className={`flex items-center justify-between gap-2 rounded-md border px-2.5 py-1.5 shadow-sm ${WC_HEADER_THEME[category]}`}
                >
                  <span className="font-bold text-sm uppercase tracking-wide truncate" title={wc}>
                    {wc}
                  </span>
                  <Badge variant="outline" className="shrink-0">
                    {orders.length}
                  </Badge>
                </div>
              </div>
              <div className="space-y-2 pb-2">
                {orders.map((o) => (
                  <OrderCard
                    key={o.dyn365bc_productionorder_abk_prod_v1_0id}
                    order={o}
                    components={componentsByOrder.get(o.dyn365bc_no ?? "") ?? []}
                    style={
                      category === "unassigned"
                        ? NO_WORK_CENTER_STYLE
                        : styleForLocation(o.dyn365bc_locationcode)
                    }
                  />
                ))}
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}

function isRtvComponent(c: Component): boolean {
  return (c.dyn365bc_itemno ?? "").toUpperCase().startsWith("RTV")
}

// The "Finished" tick badge, shown next to the order number.
function FinishedBadge() {
  return (
    <span
      className="flex size-5 shrink-0 items-center justify-center rounded-full bg-card text-[#e2615f] ring-2 ring-[#e2615f]"
      title="Finished"
    >
      <Check className="size-3.5" strokeWidth={3} />
    </span>
  )
}

// The list of components for an order. `clamp` keeps descriptions to two lines
// for the compact card; the full-screen view shows them in full.
function ComponentsList({
  components,
  clamp = true,
}: {
  components: Component[]
  clamp?: boolean
}) {
  // RTV components first, like the Component list.
  const sorted = [...components].sort(
    (a, b) => (isRtvComponent(a) ? 0 : 1) - (isRtvComponent(b) ? 0 : 1),
  )
  return (
    <div className="space-y-1.5">
      {sorted.map((c) => (
        <div
          key={c.dyn365bc_prodordercomponent_abk_prod_v1_0id}
          className={`rounded px-1.5 py-1 text-xs ${
            isRtvComponent(c)
              ? "bg-[#5ec8d0]/25 ring-1 ring-[#5ec8d0]/60"
              : "bg-background/40"
          }`}
        >
          <div className="font-medium break-words">{c.dyn365bc_itemno}</div>
          <div>
            <span className="text-sm font-bold">
              {(c.dyn365bc_remainingquantity ?? 0).toLocaleString("en-US")}
            </span>{" "}
            <span className="text-foreground/80">
              {c.dyn365bc_unitofmeasurecode ?? ""}
            </span>
          </div>
          {c.dyn365bc_description && (
            <p
              className={`${clamp ? "line-clamp-2" : "break-words"} ${
                isRtvComponent(c) ? "text-foreground/90" : "text-muted-foreground"
              }`}
            >
              {c.dyn365bc_description}
            </p>
          )}
        </div>
      ))}
    </div>
  )
}

function OrderCard({
  order,
  components,
  style,
}: {
  order: ProductionOrder
  components: Component[]
  style: LocationStyle
}) {
  const finished = statusLabel(order).toLowerCase() === "finished"
  const hasComponents = components.length > 0
  const [open, setOpen] = useState(false)

  return (
    <div
      className={`rounded-md border border-l-4 p-3 space-y-1.5 text-sm shadow-md shadow-black/30 transition-[filter] hover:brightness-110 ${style.accent}`}
    >
      <div className="flex items-center justify-between gap-2">
        <Link
          to={`/prod-data?prodOrder=${encodeURIComponent(order.dyn365bc_no ?? "")}`}
          className="text-foreground font-semibold underline-offset-4 hover:underline truncate"
        >
          {order.dyn365bc_no}
        </Link>
        {finished && <FinishedBadge />}
      </div>
      {order.dyn365bc_description && (
        <p className="text-muted-foreground line-clamp-2">{order.dyn365bc_description}</p>
      )}
      <div className="flex items-center justify-between gap-2 text-xs text-muted-foreground">
        <span className="text-sm font-bold text-foreground">
          Qty {(order.dyn365bc_quantity ?? 0).toLocaleString("en-US")}
        </span>
        {order.dyn365bc_locationcode && <span>{order.dyn365bc_locationcode}</span>}
      </div>

      {hasComponents && (
        <>
          {/* Mobile: a tappable summary that opens the order full-screen. */}
          <button
            type="button"
            onClick={() => setOpen(true)}
            className="lg:hidden mt-1 flex w-full items-center justify-between gap-2 border-t border-border/60 pt-1.5 text-[11px] font-medium uppercase tracking-wide text-muted-foreground hover:text-foreground"
          >
            <span>Components ({components.length})</span>
            <ChevronRight className="size-4 shrink-0" />
          </button>

          {/* Desktop: components inline on the card. */}
          <div className="hidden lg:block mt-1 border-t border-border/60 pt-1.5 space-y-1.5">
            <p className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
              Components ({components.length})
            </p>
            <ComponentsList components={components} />
          </div>
        </>
      )}

      {/* Full-screen order view (mobile only). */}
      {open && (
        <div className="fixed inset-0 z-50 flex flex-col bg-background lg:hidden">
          <div className="sticky top-0 z-10 flex items-start justify-between gap-2 border-b bg-card px-4 py-3">
            <div className="min-w-0 space-y-0.5">
              <div className="flex items-center gap-2">
                <span className="font-semibold truncate">{order.dyn365bc_no}</span>
                {finished && <FinishedBadge />}
              </div>
              {order.dyn365bc_locationcode && (
                <span className="text-xs text-muted-foreground">
                  {order.dyn365bc_locationcode}
                </span>
              )}
            </div>
            <button
              type="button"
              onClick={() => setOpen(false)}
              aria-label="Close"
              className="shrink-0 rounded-md p-1.5 text-muted-foreground hover:bg-secondary hover:text-foreground"
            >
              <X className="size-5" />
            </button>
          </div>
          <div className="flex-1 overflow-auto p-4 space-y-3">
            {order.dyn365bc_description && (
              <p className="text-sm text-muted-foreground">{order.dyn365bc_description}</p>
            )}
            <p className="text-base font-bold">
              Qty {(order.dyn365bc_quantity ?? 0).toLocaleString("en-US")}
            </p>
            <div>
              <p className="mb-2 text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
                Components ({components.length})
              </p>
              <ComponentsList components={components} clamp={false} />
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
