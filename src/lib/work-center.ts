import { Dyn365bc_prodorderroutinglines_abk_prod_v1_0Service } from "@/generated/services/Dyn365bc_prodorderroutinglines_abk_prod_v1_0Service"
import type { Dyn365bc_prodorderroutinglines_abk_prod_v1_0 } from "@/generated/models/Dyn365bc_prodorderroutinglines_abk_prod_v1_0Model"

type RoutingLine = Dyn365bc_prodorderroutinglines_abk_prod_v1_0

// The work center we want to ignore when deriving the order's work center.
const EXCLUDED_WORK_CENTER = "PRINTING"

export async function fetchRoutingLines(): Promise<RoutingLine[]> {
  const result = await Dyn365bc_prodorderroutinglines_abk_prod_v1_0Service.getAll()
  if (!result.success) {
    throw result.error ?? new Error("Failed to load Prod. Order Routing Lines")
  }
  return result.data ?? []
}

// Build a map of Prod. Order No. -> work center code(s), skipping any operation
// whose work/machine center is "PRINTING". If an order has more than one
// non-printing center the distinct codes are joined with ", ".
export function buildWorkCenterMap(lines: RoutingLine[]): Map<string, string> {
  const byOrder = new Map<string, Set<string>>()

  for (const line of lines) {
    const order = line.dyn365bc_prodorderno?.trim()
    const center = line.dyn365bc_no?.trim()
    const workCenter = line.dyn365bc_workcenterno?.trim()
    if (!order || !center) continue
    const isPrinting =
      center.toUpperCase() === EXCLUDED_WORK_CENTER ||
      workCenter?.toUpperCase() === EXCLUDED_WORK_CENTER
    if (isPrinting) continue

    if (!byOrder.has(order)) byOrder.set(order, new Set())
    byOrder.get(order)!.add(center)
  }

  const map = new Map<string, string>()
  for (const [order, centers] of byOrder) {
    map.set(order, Array.from(centers).join(", "))
  }
  return map
}
