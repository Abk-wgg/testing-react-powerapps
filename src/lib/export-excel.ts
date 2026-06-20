import * as XLSX from "xlsx"

// Export a set of rows to a real .xlsx file using the table's visible columns
// and the same cell text the table renders (so dates, option-set labels and
// derived values match exactly what's on screen).
export function exportRowsToExcel<TColumn extends { label: string }, TRow>(
  fileBaseName: string,
  sheetName: string,
  columns: TColumn[],
  rows: TRow[],
  getCell: (column: TColumn, row: TRow) => string,
): void {
  const header = columns.map((c) => c.label)
  const data = rows.map((row) => {
    const record: Record<string, string> = {}
    for (const col of columns) {
      record[col.label] = getCell(col, row)
    }
    return record
  })

  const worksheet = XLSX.utils.json_to_sheet(data, { header })
  const workbook = XLSX.utils.book_new()
  // Sheet names are capped at 31 chars by the Excel format.
  XLSX.utils.book_append_sheet(workbook, worksheet, sheetName.slice(0, 31))

  const stamp = new Date().toISOString().slice(0, 10)
  XLSX.writeFile(workbook, `${fileBaseName}-${stamp}.xlsx`)
}
