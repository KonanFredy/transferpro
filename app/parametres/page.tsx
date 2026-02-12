'use client'

import { useSearchParams, useRouter } from 'next/navigation'
import { Globe, Coins, TrendingUp, UserCircle, Bell, Calculator } from 'lucide-react'
import { SidebarProvider, SidebarInset } from '@/components/ui/sidebar'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { AppSidebar } from '@/components/app-sidebar'
import { AppHeader } from '@/components/app-header'
import { PaysContent } from '@/components/parametres/pays-content'
import { DevisesContent } from '@/components/parametres/devises-content'
import { TauxContent } from '@/components/parametres/taux-content'
import { UtilisateursContent } from '@/components/parametres/utilisateurs-content'
import { NotificationsContent } from '@/components/parametres/notifications-content'
import { FraisContent } from '@/components/parametres/frais-content'
import { AuthGuard } from '@/components/auth-guard'
import { Suspense } from 'react'
import Loading from './loading'

export default function ParametresPage() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const defaultTab = searchParams.get('tab') || 'pays'

  const handleTabChange = (value: string) => {
    router.push(`/parametres?tab=${value}`, { scroll: false })
  }

  return (
    <AuthGuard>
      <SidebarProvider>
        <AppSidebar />
        <SidebarInset>
          <AppHeader />
          <main className="flex-1 p-6">
            <div className="space-y-6">
              {/* Header */}
              <div>
                <h1 className="text-2xl font-semibold text-foreground">Parametres</h1>
                <p className="text-muted-foreground">
                  Configurez les parametres de l'application
                </p>
              </div>

              {/* Tabs */}
              <Suspense fallback={<Loading />}>
                <Tabs value={defaultTab} onValueChange={handleTabChange} className="space-y-6">
                  <TabsList className="grid w-full grid-cols-6 lg:w-auto lg:inline-grid">
                    <TabsTrigger value="pays" className="gap-2">
                      <Globe className="h-4 w-4" />
                      <span className="hidden sm:inline">Pays</span>
                    </TabsTrigger>
                    <TabsTrigger value="devises" className="gap-2">
                      <Coins className="h-4 w-4" />
                      <span className="hidden sm:inline">Devises</span>
                    </TabsTrigger>
                    <TabsTrigger value="taux" className="gap-2">
                      <TrendingUp className="h-4 w-4" />
                      <span className="hidden sm:inline">Taux</span>
                    </TabsTrigger>
                    <TabsTrigger value="frais" className="gap-2">
                      <Calculator className="h-4 w-4" />
                      <span className="hidden sm:inline">Frais</span>
                    </TabsTrigger>
                    <TabsTrigger value="utilisateurs" className="gap-2">
                      <UserCircle className="h-4 w-4" />
                      <span className="hidden sm:inline">Utilisateurs</span>
                    </TabsTrigger>
                    <TabsTrigger value="notifications" className="gap-2">
                      <Bell className="h-4 w-4" />
                      <span className="hidden sm:inline">Notifs</span>
                    </TabsTrigger>
                  </TabsList>

                  <TabsContent value="pays" className="mt-6">
                    <PaysContent />
                  </TabsContent>

                  <TabsContent value="devises" className="mt-6">
                    <DevisesContent />
                  </TabsContent>

                  <TabsContent value="taux" className="mt-6">
                    <TauxContent />
                  </TabsContent>

                  <TabsContent value="frais" className="mt-6">
                    <FraisContent />
                  </TabsContent>

                  <TabsContent value="utilisateurs" className="mt-6">
                    <UtilisateursContent />
                  </TabsContent>

                  <TabsContent value="notifications" className="mt-6">
                    <NotificationsContent />
                  </TabsContent>
                </Tabs>
              </Suspense>
            </div>
          </main>
        </SidebarInset>
      </SidebarProvider>
    </AuthGuard>
  )
}
