import { Outlet, NavLink, useLocation } from "react-router-dom"

type LayoutProps = { showHeader?: boolean }

function navLinkClass({ isActive }: { isActive: boolean }): string {
  return [
    "rounded-md px-3 py-1.5 text-sm transition-colors",
    isActive
      ? "bg-secondary text-primary font-medium shadow-sm"
      : "text-muted-foreground hover:text-foreground hover:bg-secondary/50",
  ].join(" ")
}

export default function Layout({ showHeader = true }: LayoutProps) {
  const location = useLocation()

  return (
    <div className="min-h-dvh flex flex-col">
      {showHeader && (
        <header className="sticky top-0 z-30 h-14 border-b bg-card/80 backdrop-blur-sm flex items-center">
          <div className="w-full px-6 flex items-center justify-between">
            <nav className="flex items-center gap-1">
              <NavLink to="/" end className={navLinkClass}>
                Production orders
              </NavLink>

              <NavLink to="/prod-data" className={navLinkClass}>
                Component list
              </NavLink>
              <NavLink to="/schedule" className={navLinkClass}>
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
          className="flex-1 w-full animate-in fade-in slide-in-from-bottom-1 duration-300"
        >
          <Outlet />
        </div>
      </main>
    </div>
  );
}
