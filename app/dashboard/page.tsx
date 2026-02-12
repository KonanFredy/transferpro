'use client'

import { SidebarProvider, SidebarInset } from '@/components/ui/sidebar'
import { AppSidebar } from '@/components/app-sidebar'
import { AppHeader } from '@/components/app-header'
import { DashboardContent } from '@/components/dashboard/dashboard-content'
import { AuthGuard } from '@/components/auth-guard'

export default function DashboardPage() {
  return (
    <AuthGuard>
      <SidebarProvider>
        <AppSidebar />
        <SidebarInset>
          <AppHeader />
          <main className="flex-1 overflow-auto p-6">
            <DashboardContent />
          </main>
        </SidebarInset>
      </SidebarProvider>
    </AuthGuard>
  )
}
