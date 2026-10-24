import { createRootRoute, Outlet } from '@tanstack/react-router'
import { Header } from '@/shared/components/layout/Header'
import { Footer } from '@/shared/components/layout/Footer'
import { MobileBottomNav } from '@/shared/components/layout/MobileBottomNav'
import { MockScenarioBar } from '@/mocks/components/MockScenarioBar'

export const Route = createRootRoute({
  component: RootComponent,
})

function RootComponent() {
  return (
    <div className="min-h-screen flex flex-col bg-[#140D0A] text-[#F5F1EB] selection:bg-[#E89B55] selection:text-[#140D0A]">
      <Header />
      <main className="flex-1 pb-16 md:pb-0">
        <Outlet />
      </main>
      <Footer />
      {/* Mobile Bottom Navigation matching Figma */}
      <MobileBottomNav />
      {/* MSW Evaluation Bar */}
      <MockScenarioBar />
    </div>
  )
}
