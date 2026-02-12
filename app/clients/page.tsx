'use client'

import { SidebarProvider, SidebarInset } from '@/components/ui/sidebar'
import { AppSidebar } from '@/components/app-sidebar'
import { AppHeader } from '@/components/app-header'
import { ClientsContent } from '@/components/clients/clients-content'
import { AuthGuard } from '@/components/auth-guard'

export default function ClientsPage() {
  return (
    <AuthGuard>
      <SidebarProvider>
        <AppSidebar />
        <SidebarInset>
          <AppHeader breadcrumbs={[{ label: 'Clients' }]} />
          <main className="flex-1 overflow-auto p-6">
            <ClientsContent />
          </main>
        </SidebarInset>
      </SidebarProvider>
    </AuthGuard>
  )
}
