'use client'

import { useState } from 'react'
import { SidebarProvider, SidebarInset } from '@/components/ui/sidebar'
import { AppSidebar } from '@/components/app-sidebar'
import { AppHeader } from '@/components/app-header'
import { AuthGuard } from '@/components/auth-guard'
import { useAuth } from '@/lib/auth-context'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Separator } from '@/components/ui/separator'
import { Switch } from '@/components/ui/switch'
import { Badge } from '@/components/ui/badge'
import { useToast } from '@/hooks/use-toast'
import { 
  User, 
  Mail, 
  Lock, 
  Bell, 
  Shield, 
  Save,
  Eye,
  EyeOff,
  Calendar,
  Clock
} from 'lucide-react'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'

export default function ProfilPage() {
  const { user, updateProfile, changePassword } = useAuth()
  const { toast } = useToast()
  const [isSaving, setIsSaving] = useState(false)
  const [isChangingPassword, setIsChangingPassword] = useState(false)
  
  const [profileData, setProfileData] = useState({
    nom: user?.nom || '',
    prenom: user?.prenom || '',
    email: user?.email || '',
  })
  
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  })
  
  const [showPasswords, setShowPasswords] = useState({
    current: false,
    new: false,
    confirm: false,
  })
  
  const [preferences, setPreferences] = useState({
    emailNotifications: true,
    smsNotifications: true,
    soundEnabled: true,
    darkMode: false,
    language: 'fr',
  })

  const userInitials = user ? `${user.prenom[0]}${user.nom[0]}` : 'U'
  const userRole = user?.role === 'admin' ? 'Administrateur' : 'Agent'

  const handleSaveProfile = async () => {
    setIsSaving(true)
    try {
      const result = await updateProfile({
        nom: profileData.nom,
        prenom: profileData.prenom,
        email: profileData.email,
      })
      if (result.success) {
        toast({ title: 'Succes', description: 'Profil mis a jour avec succes' })
      } else {
        toast({ title: 'Erreur', description: result.error || 'Erreur lors de la mise a jour', variant: 'destructive' })
      }
    } catch {
      toast({ title: 'Erreur', description: 'Une erreur est survenue', variant: 'destructive' })
    } finally {
      setIsSaving(false)
    }
  }

  const handleChangePassword = async () => {
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      toast({ title: 'Erreur', description: 'Les mots de passe ne correspondent pas', variant: 'destructive' })
      return
    }
    if (passwordData.newPassword.length < 6) {
      toast({ title: 'Erreur', description: 'Le mot de passe doit contenir au moins 6 caracteres', variant: 'destructive' })
      return
    }
    if (!passwordData.currentPassword) {
      toast({ title: 'Erreur', description: 'Veuillez entrer votre mot de passe actuel', variant: 'destructive' })
      return
    }
    
    setIsChangingPassword(true)
    try {
      const result = await changePassword(passwordData.currentPassword, passwordData.newPassword)
      if (result.success) {
        setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' })
        toast({ title: 'Succes', description: 'Mot de passe modifie avec succes' })
      } else {
        toast({ title: 'Erreur', description: result.error || 'Erreur lors du changement de mot de passe', variant: 'destructive' })
      }
    } catch {
      toast({ title: 'Erreur', description: 'Une erreur est survenue', variant: 'destructive' })
    } finally {
      setIsChangingPassword(false)
    }
  }

  const handleSavePreferences = () => {
    toast({ title: 'Succes', description: 'Preferences sauvegardees' })
  }

  return (
    <AuthGuard>
      <SidebarProvider>
        <AppSidebar />
        <SidebarInset>
          <AppHeader breadcrumbs={[{ label: 'Mon Profil' }]} />
          <main className="flex-1 overflow-auto p-6">
            <div className="max-w-4xl mx-auto space-y-6">
              {/* Header Card */}
              <Card>
                <CardContent className="pt-6">
                  <div className="flex flex-col sm:flex-row items-center gap-6">
                    <Avatar className="h-24 w-24">
                      <AvatarFallback className="bg-primary text-primary-foreground text-2xl">
                        {userInitials}
                      </AvatarFallback>
                    </Avatar>
                    <div className="text-center sm:text-left flex-1">
                      <h1 className="text-2xl font-semibold">{user?.prenom} {user?.nom}</h1>
                      <p className="text-muted-foreground">{user?.email}</p>
                      <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2 mt-2">
                        <Badge variant={user?.role === 'admin' ? 'default' : 'secondary'}>
                          <Shield className="mr-1 h-3 w-3" />
                          {userRole}
                        </Badge>
                        <Badge variant="outline" className="gap-1">
                          <Calendar className="h-3 w-3" />
                          Membre depuis 2024
                        </Badge>
                      </div>
                    </div>
                    <div className="text-center sm:text-right text-sm text-muted-foreground">
                      <div className="flex items-center gap-1 justify-center sm:justify-end">
                        <Clock className="h-4 w-4" />
                        <span>Derniere connexion</span>
                      </div>
                      <p className="font-medium text-foreground">Aujourd&apos;hui a 10:30</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Tabs */}
              <Tabs defaultValue="profil" className="space-y-6">
                <TabsList className="grid w-full grid-cols-3 lg:w-auto lg:inline-grid">
                  <TabsTrigger value="profil" className="gap-2">
                    <User className="h-4 w-4" />
                    <span className="hidden sm:inline">Profil</span>
                  </TabsTrigger>
                  <TabsTrigger value="securite" className="gap-2">
                    <Lock className="h-4 w-4" />
                    <span className="hidden sm:inline">Securite</span>
                  </TabsTrigger>
                  <TabsTrigger value="preferences" className="gap-2">
                    <Bell className="h-4 w-4" />
                    <span className="hidden sm:inline">Preferences</span>
                  </TabsTrigger>
                </TabsList>

                {/* Profile Tab */}
                <TabsContent value="profil">
                  <Card>
                    <CardHeader>
                      <CardTitle>Informations personnelles</CardTitle>
                      <CardDescription>
                        Modifiez vos informations de profil
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="grid gap-4 md:grid-cols-2">
                        <div className="space-y-2">
                          <Label htmlFor="prenom">Prenom</Label>
                          <Input
                            id="prenom"
                            value={profileData.prenom}
                            onChange={(e) => setProfileData(prev => ({ ...prev, prenom: e.target.value }))}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="nom">Nom</Label>
                          <Input
                            id="nom"
                            value={profileData.nom}
                            onChange={(e) => setProfileData(prev => ({ ...prev, nom: e.target.value }))}
                          />
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="email">Adresse email</Label>
                        <div className="relative">
                          <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                          <Input
                            id="email"
                            type="email"
                            className="pl-10"
                            value={profileData.email}
                            onChange={(e) => setProfileData(prev => ({ ...prev, email: e.target.value }))}
                          />
                        </div>
                      </div>
                      <Separator />
                      <div className="flex justify-end">
                        <Button onClick={handleSaveProfile} disabled={isSaving} className="gap-2">
                          <Save className="h-4 w-4" />
                          {isSaving ? 'Sauvegarde...' : 'Sauvegarder'}
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>

                {/* Security Tab */}
                <TabsContent value="securite">
                  <Card>
                    <CardHeader>
                      <CardTitle>Changer le mot de passe</CardTitle>
                      <CardDescription>
                        Assurez-vous d&apos;utiliser un mot de passe fort et unique
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="currentPassword">Mot de passe actuel</Label>
                        <div className="relative">
                          <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                          <Input
                            id="currentPassword"
                            type={showPasswords.current ? 'text' : 'password'}
                            className="pl-10 pr-10"
                            value={passwordData.currentPassword}
                            onChange={(e) => setPasswordData(prev => ({ ...prev, currentPassword: e.target.value }))}
                          />
                          <button
                            type="button"
                            onClick={() => setShowPasswords(prev => ({ ...prev, current: !prev.current }))}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                          >
                            {showPasswords.current ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                          </button>
                        </div>
                      </div>
                      <div className="grid gap-4 md:grid-cols-2">
                        <div className="space-y-2">
                          <Label htmlFor="newPassword">Nouveau mot de passe</Label>
                          <div className="relative">
                            <Input
                              id="newPassword"
                              type={showPasswords.new ? 'text' : 'password'}
                              className="pr-10"
                              value={passwordData.newPassword}
                              onChange={(e) => setPasswordData(prev => ({ ...prev, newPassword: e.target.value }))}
                            />
                            <button
                              type="button"
                              onClick={() => setShowPasswords(prev => ({ ...prev, new: !prev.new }))}
                              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                            >
                              {showPasswords.new ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                            </button>
                          </div>
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="confirmPassword">Confirmer le mot de passe</Label>
                          <div className="relative">
                            <Input
                              id="confirmPassword"
                              type={showPasswords.confirm ? 'text' : 'password'}
                              className="pr-10"
                              value={passwordData.confirmPassword}
                              onChange={(e) => setPasswordData(prev => ({ ...prev, confirmPassword: e.target.value }))}
                            />
                            <button
                              type="button"
                              onClick={() => setShowPasswords(prev => ({ ...prev, confirm: !prev.confirm }))}
                              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                            >
                              {showPasswords.confirm ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                            </button>
                          </div>
                        </div>
                      </div>
                      <Separator />
                      <div className="flex justify-end">
                        <Button onClick={handleChangePassword} disabled={isChangingPassword} className="gap-2">
                          <Lock className="h-4 w-4" />
                          {isChangingPassword ? 'Modification...' : 'Changer le mot de passe'}
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>

                {/* Preferences Tab */}
                <TabsContent value="preferences">
                  <Card>
                    <CardHeader>
                      <CardTitle>Preferences de notification</CardTitle>
                      <CardDescription>
                        Configurez comment vous souhaitez recevoir les notifications
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                      <div className="flex items-center justify-between">
                        <div className="space-y-0.5">
                          <Label>Notifications par email</Label>
                          <p className="text-sm text-muted-foreground">
                            Recevoir les alertes par email
                          </p>
                        </div>
                        <Switch
                          checked={preferences.emailNotifications}
                          onCheckedChange={(checked) => setPreferences(prev => ({ ...prev, emailNotifications: checked }))}
                        />
                      </div>
                      <Separator />
                      <div className="flex items-center justify-between">
                        <div className="space-y-0.5">
                          <Label>Notifications SMS</Label>
                          <p className="text-sm text-muted-foreground">
                            Recevoir les alertes par SMS
                          </p>
                        </div>
                        <Switch
                          checked={preferences.smsNotifications}
                          onCheckedChange={(checked) => setPreferences(prev => ({ ...prev, smsNotifications: checked }))}
                        />
                      </div>
                      <Separator />
                      <div className="flex items-center justify-between">
                        <div className="space-y-0.5">
                          <Label>Sons de notification</Label>
                          <p className="text-sm text-muted-foreground">
                            Jouer un son lors des nouvelles notifications
                          </p>
                        </div>
                        <Switch
                          checked={preferences.soundEnabled}
                          onCheckedChange={(checked) => setPreferences(prev => ({ ...prev, soundEnabled: checked }))}
                        />
                      </div>
                      <Separator />
                      <div className="flex justify-end">
                        <Button onClick={handleSavePreferences} className="gap-2">
                          <Save className="h-4 w-4" />
                          Sauvegarder les preferences
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>
              </Tabs>
            </div>
          </main>
        </SidebarInset>
      </SidebarProvider>
    </AuthGuard>
  )
}
