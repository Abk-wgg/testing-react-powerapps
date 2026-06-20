import { Outlet, NavLink } from "react-router-dom"

type LayoutProps = { showHeader?: boolean }

export default function Layout({ showHeader = true }: LayoutProps) {
  return (
    <div className="min-h-dvh flex flex-col">
      {showHeader && (
        <header className="h-14 border-b flex items-center">
          <div className="w-full px-6 flex items-center justify-between">
            <nav className="flex items-center gap-4">
              <NavLink to="/" end
                className={({ isActive }) =>
                  `text-sm text-muted-foreground hover:text-foreground ${isActive ? "text-foreground font-medium" : ""}`
                }
              >
                Production orders
              </NavLink>
              <NavLink to="/prod-data"
                className={({ isActive }) =>
                  `text-sm text-muted-foreground hover:text-foreground ${isActive ? "text-foreground font-medium" : ""}`
                }
              >
                Component list
              </NavLink>
            </nav>
          </div>
        </header>
      )}

      <main className="flex-1 flex">
        <div className="flex-1 w-full">
          <Outlet />
        </div>
      </main>
    </div>
  )
}