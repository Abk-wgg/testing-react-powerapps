import { createBrowserRouter } from "react-router-dom"
import Layout from "@/pages/_layout"
import ProdDataPage from "@/pages/prod-data"
import ProdOrdersPage from "@/pages/prod-orders"
import SchedulePage from "@/pages/schedule"
import NotFoundPage from "@/pages/not-found"

// IMPORTANT: Do not remove or modify the code below!
// Normalize basename when hosted in Power Apps
const BASENAME = new URL(".", location.href).pathname
if (location.pathname.endsWith("/index.html")) {
  history.replaceState(null, "", BASENAME + location.search + location.hash);
}

export const router = createBrowserRouter([
  {
    path: "/",
    element: <Layout showHeader />,
    errorElement: <NotFoundPage />,
    children: [
      { index: true, element: <ProdOrdersPage /> },
      { path: "schedule", element: <SchedulePage /> },
      { path: "prod-data", element: <ProdDataPage /> },
    ],
  },
], { 
  basename: BASENAME // IMPORTANT: Set basename for proper routing when hosted in Power Apps
})