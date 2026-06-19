import { useEffect, useMemo, useState } from "react"
import { toast } from "sonner"
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { useBcCompanies, useBcRecords, useBcTables } from "@/hooks/use-bc"
import { getAccount, signIn, signOut } from "@/lib/bc/auth"
import { bcConfig, isBcConfigured } from "@/lib/bc/config"

export default function BusinessCentralPage() {
  const configured = isBcConfigured()
  const [account, setAccount] = useState<string | null>(null)
  const [signedIn, setSignedIn] = useState(false)

  useEffect(() => {
    if (!configured) return
    getAccount().then((a) => {
      setAccount(a?.username ?? null)
      setSignedIn(!!a)
    })
  }, [configured])

  if (!configured) return <SetupNotice />

  if (!signedIn) {
    return (
      <div className="h-full grid place-items-center p-8">
        <Card className="max-w-md">
          <CardHeader>
            <CardTitle>Connect to Business Central</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Environment <code>{bcConfig.environment}</code>. Sign in with your work account to
              load tables directly from the BC API.
            </p>
            <Button
              onClick={async () => {
                try {
                  const a = await signIn()
                  setAccount(a.username)
                  setSignedIn(true)
                } catch (e) {
                  toast.error(`Sign-in failed: ${(e as Error).message}`)
                }
              }}
            >
              Sign in
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return <Explorer account={account} onSignOut={async () => {
    await signOut()
    setSignedIn(false)
    setAccount(null)
  }} />
}

function Explorer({ account, onSignOut }: { account: string | null; onSignOut: () => void }) {
  const tables = useBcTables()
  const companies = useBcCompanies()
  const [filter, setFilter] = useState("")
  const [companyId, setCompanyId] = useState<string>()
  const [selectedTable, setSelectedTable] = useState<string>()

  // Default to the configured company once companies load.
  useEffect(() => {
    if (!companyId && companies.data?.length) {
      const match = companies.data.find(
        (c) => c.name === bcConfig.companyName || c.displayName === bcConfig.companyName,
      )
      setCompanyId((match ?? companies.data[0]).id)
    }
  }, [companies.data, companyId])

  const records = useBcRecords(companyId, selectedTable)

  const filtered = useMemo(() => {
    const list = tables.data ?? []
    if (!filter) return list
    const q = filter.toLowerCase()
    return list.filter((t) => t.name.toLowerCase().includes(q))
  }, [tables.data, filter])

  const columns = useMemo(() => {
    const rows = records.data ?? []
    if (!rows.length) return [] as string[]
    return Object.keys(rows[0]).filter((k) => !k.startsWith("@")).slice(0, 8)
  }, [records.data])

  return (
    <div className="p-6 space-y-4">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold">Business Central</h1>
          <p className="text-sm text-muted-foreground">
            {bcConfig.environment} · {tables.data?.length ?? 0} tables
          </p>
        </div>
        <div className="flex items-center gap-3">
          {account && <span className="text-sm text-muted-foreground">{account}</span>}
          <Button variant="outline" size="sm" onClick={onSignOut}>Sign out</Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[320px_1fr] gap-4">
        {/* Tables list */}
        <Card className="h-[70vh] flex flex-col">
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Tables</CardTitle>
            <Input
              placeholder="Filter tables…"
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
            />
          </CardHeader>
          <CardContent className="flex-1 overflow-auto space-y-1">
            {tables.isLoading && Array.from({ length: 12 }).map((_, i) => (
              <Skeleton key={i} className="h-8 w-full" />
            ))}
            {tables.isError && (
              <p className="text-sm text-destructive">{(tables.error as Error).message}</p>
            )}
            {filtered.map((t) => (
              <button
                key={t.name}
                onClick={() => setSelectedTable(t.name)}
                className={`w-full text-left text-sm rounded px-2 py-1.5 hover:bg-accent ${
                  selectedTable === t.name ? "bg-accent font-medium" : ""
                }`}
              >
                {t.name}
              </button>
            ))}
          </CardContent>
        </Card>

        {/* Records preview */}
        <Card className="h-[70vh] flex flex-col">
          <CardHeader className="pb-3 flex-row items-center justify-between gap-4 space-y-0">
            <CardTitle className="text-base">
              {selectedTable ?? "Select a table"}
            </CardTitle>
            <Select value={companyId} onValueChange={setCompanyId}>
              <SelectTrigger className="w-[220px]">
                <SelectValue placeholder="Company" />
              </SelectTrigger>
              <SelectContent>
                {(companies.data ?? []).map((c) => (
                  <SelectItem key={c.id} value={c.id}>
                    {c.displayName || c.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </CardHeader>
          <CardContent className="flex-1 overflow-auto">
            {!selectedTable && (
              <p className="text-sm text-muted-foreground">Pick a table on the left to preview rows.</p>
            )}
            {selectedTable && records.isLoading && (
              <div className="space-y-2">
                {Array.from({ length: 8 }).map((_, i) => <Skeleton key={i} className="h-8 w-full" />)}
              </div>
            )}
            {selectedTable && records.isError && (
              <p className="text-sm text-destructive">{(records.error as Error).message}</p>
            )}
            {selectedTable && records.data && (
              <>
                <Badge variant="secondary" className="mb-3">{records.data.length} rows (top 50)</Badge>
                {columns.length === 0 ? (
                  <p className="text-sm text-muted-foreground">No rows.</p>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        {columns.map((c) => <TableHead key={c}>{c}</TableHead>)}
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {records.data.map((row, i) => (
                        <TableRow key={i}>
                          {columns.map((c) => (
                            <TableCell key={c} className="max-w-[200px] truncate">
                              {formatCell((row as Record<string, unknown>)[c])}
                            </TableCell>
                          ))}
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

function formatCell(v: unknown): string {
  if (v === null || v === undefined) return ""
  if (typeof v === "object") return JSON.stringify(v)
  return String(v)
}

function SetupNotice() {
  return (
    <div className="h-full grid place-items-center p-8">
      <Card className="max-w-xl">
        <CardHeader>
          <CardTitle>Business Central setup required</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm text-muted-foreground">
          <p>
            Set <code>VITE_BC_CLIENT_ID</code> in <code>.env.local</code> to your Entra app
            registration client id, then restart the dev server. See{" "}
            <code>src/lib/bc/README.md</code> for the full setup steps.
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
