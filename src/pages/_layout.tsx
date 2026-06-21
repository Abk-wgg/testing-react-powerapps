import type { CSSProperties } from "react"
import { Outlet, NavLink, useLocation } from "react-router-dom"
import { ShieldAlert } from "lucide-react"
import { useAccessControl } from "@/hooks/use-app-admin"

type LayoutProps = { showHeader?: boolean }

const NAV_BASE =
  "rounded-md px-2.5 sm:px-3 py-1.5 text-sm font-medium whitespace-nowrap transition-colors"

// Each nav button is tinted with its page's accent.
function navStyle(accent: string) {
  return ({ isActive }: { isActive: boolean }): CSSProperties =>
    isActive
      ? { color: accent, backgroundColor: `${accent}33`, boxShadow: "0 1px 2px rgba(0,0,0,0.35)" }
      : { color: `${accent}b0` }
}

// A distinct accent per page: re-colors primary buttons, links, rings and adds a
// faint page-tinted glow so each route feels like its own theme.
function pageAccent(pathname: string): string {
  if (pathname.startsWith("/schedule")) return "#7fa6c9" // blue
  if (pathname.startsWith("/prod-data")) return "#8fcf9b" // green
  return "#c9ada7" // rose (Production orders)
}

export default function Layout({ showHeader = true }: LayoutProps) {
  const location = useLocation()
  const { hasAccess, isLoading } = useAccessControl()

  // Gate the whole app on holding an access role (app_admin or app_viewer).
  if (isLoading) {
    return (
      <div className="min-h-dvh flex items-center justify-center">
        <p className="text-sm text-muted-foreground animate-pulse">Checking access…</p>
      </div>
    )
  }
  if (!hasAccess) {
    return (
      <div className="min-h-dvh flex items-center justify-center p-6">
        <div className="max-w-md text-center space-y-3">
          <ShieldAlert className="mx-auto size-12 text-destructive" />
          <h1 className="text-xl font-semibold">Access denied</h1>
          <p className="text-sm text-muted-foreground">
            You don't have permission to use this app. Please contact{" "}
            <span className="font-medium text-foreground">Abhishek Kohli</span> to
            request access.
          </p>
        </div>
      </div>
    )
  }

  const accent = pageAccent(location.pathname)
  // Tint the dark surfaces with the page accent so each page has its own theme.
  const tintedBg = `color-mix(in oklab, ${accent} 24%, #22223b)`
  const tintedCard = `color-mix(in oklab, ${accent} 18%, #2a2a45)`
  const tintedSecondary = `color-mix(in oklab, ${accent} 22%, #4a4e69)`
  const themeStyle = {
    "--primary": accent,
    "--ring": accent,
    "--background": tintedBg,
    "--card": tintedCard,
    "--popover": tintedCard,
    "--secondary": tintedSecondary,
    "--accent": tintedSecondary,
    // Brighter secondary text so it stays readable on the tinted cards.
    "--muted-foreground": "#ccc4ce",
    backgroundColor: tintedBg,
    backgroundImage: `radial-gradient(900px 420px at 50% -160px, ${accent}33, transparent)`,
  } as CSSProperties

  return (
    <div className="min-h-dvh flex flex-col">
      {showHeader && (
        <header className="sticky top-0 z-30 h-14 border-b bg-card/80 backdrop-blur-sm flex items-center">
          <div className="w-full px-4 sm:px-6 flex items-center justify-between">
            <nav className="flex items-center gap-1 overflow-x-auto">
              <NavLink to="/" end className={NAV_BASE} style={navStyle("#c9ada7")}>
                Production orders
              </NavLink>

              <NavLink to="/prod-data" className={NAV_BASE} style={navStyle("#8fcf9b")}>
                Component list
              </NavLink>
              <NavLink to="/schedule" className={NAV_BASE} style={navStyle("#7fa6c9")}>
                Schedule
              </NavLink>
            </nav>
          </div>
        </header>
      )}

      <main className="flex-1 flex">
        {/* Keyed by route so each page gently animates in on navigation. */}
        <div
          key={location.pathname}
          style={themeStyle}
          className="flex-1 w-full animate-in fade-in slide-in-from-bottom-1 duration-300"
        >
          <Outlet />
        </div>
      </main>
    </div>
  );
}
