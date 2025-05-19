import { AdminStats } from "../components/bi/admin-stats"
import { CandidatesByDepartment } from "../components/bi/candidates-by-department"
import { CandidatesByLevel } from "../components/bi/candidates-by-level"
import { CandidatesByMonth } from "../components/bi/candidates-by-month"
import { InterviewsByStatus } from "../components/bi/interviews-by-status"
import { OffersByDepartment } from "../components/bi/offers-by-department"
import { DashboardHeader } from "../components/dashboard-header"
import { DashboardSidebar } from "../components/dashboard-sidebar"
import { WelcomeBanner } from "../components/welcome-banner"



export default function AdminDashboardPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800">
      <DashboardHeader />
      <div className="container mx-auto p-4 md:p-6 lg:p-8 pt-6">
        <div className="grid grid-cols-1 md:grid-cols-6 gap-6">
          {/* Sidebar - visible on desktop, hidden on mobile (handled by MobileSidebar) */}
          <div className="hidden md:block md:col-span-1 lg:col-span-1">
            <div className="sticky top-20">
              <DashboardSidebar />
            </div>
          </div>

          {/* Main Content */}
          <div className="md:col-span-5 lg:col-span-5 space-y-6">
            {/* Welcome Banner */}
            <WelcomeBanner />

            {/* Admin Stats */}
            <div className="grid gap-6">
              <AdminStats />
            </div>


            {/* Charts Section - First Row */}
            <div className="grid gap-6 lg:grid-cols-2">
              <CandidatesByDepartment />
              <OffersByDepartment />
            </div>

            {/* Charts Section - Second Row */}
            <div className="grid gap-6 lg:grid-cols-2">
              <CandidatesByMonth />
              <InterviewsByStatus />
            </div>

            {/* Charts Section - Third Row */}
            <div className="grid gap-6">
              <CandidatesByLevel />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}