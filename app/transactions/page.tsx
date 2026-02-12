'use client'

import { SidebarProvider, SidebarInset } from '@/components/ui/sidebar'
import { AppSidebar } from '@/components/app-sidebar'
import { AppHeader } from '@/components/app-header'
import { TransactionsContent } from '@/components/transactions/transactions-content'
import { AuthGuard } from '@/components/auth-guard'

export default function TransactionsPage() {
  return (
    <AuthGuard>
      <SidebarProvider>
        <AppSidebar />
        <SidebarInset>
          <AppHeader breadcrumbs={[{ label: 'Transactions' }]} />
          <main className="flex-1 overflow-auto p-6">
            <TransactionsContent />
          </main>
        </SidebarInset>
      </SidebarProvider>
    </AuthGuard>
  )
}
