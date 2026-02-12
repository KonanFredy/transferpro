'use client'

import { useState, useEffect, useCallback } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Switch } from '@/components/ui/switch'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Separator } from '@/components/ui/separator'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { useToast } from '@/hooks/use-toast'
import { TablePagination, usePagination } from '@/components/ui/table-pagination'
import { useAuth } from '@/lib/auth-context'
import { 
  notificationsAPI,
  type Notification,
  type NotificationSettings
} from '@/lib/api'
import { 
  Mail, 
  Smartphone, 
  Settings, 
  History, 
  CheckCircle, 
  XCircle, 
  Clock,
  Send,
  Bell,
  Save,
  Trash2,
  AlertTriangle,
  RefreshCw,
  AlertCircle,
  Loader2
} from 'lucide-react'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'

const defaultSettings: NotificationSettings = {
  emailEnabled: false,
  smsEnabled: false,
  transactionCreated: { email: false, sms: false },
  transactionValidated: { email: false, sms: false },
  transactionCancelled: { email: false, sms: false },
  transactionWithdrawn: { email: false, sms: false },
  clientCreated: { email: false, sms: false },
  userCreated: { email: false, sms: false },
  smtpHost: '',
  smtpPort: '',
  smtpUser: '',
  smtpPassword: '',
  smsProvider: 'twilio',
  smsApiKey: '',
  smsApiSecret: '',
}

export function NotificationsContent() {
  const { toast } = useToast()
  const { user } = useAuth()
  const isAdmin = user?.role === 'admin'
  const [settings, setSettings] = useState<NotificationSettings>(defaultSettings)
  const [history, setHistory] = useState<Notification[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState('parametres')
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [isDeleteAllDialogOpen, setIsDeleteAllDialogOpen] = useState(false)
  const [selectedNotificationId, setSelectedNotificationId] = useState<string | null>(null)

  const fetchData = useCallback(async () => {
    setIsLoading(true)
    setError(null)
    try {
      const [settingsData, historyData] = await Promise.all([
        notificationsAPI.getSettings(),
        notificationsAPI.getAll()
      ])
      setSettings(settingsData)
      setHistory(historyData)
    } catch (err) {
      console.error('Error fetching notifications data:', err)
      setError('Erreur lors du chargement des notifications. Veuillez reessayer.')
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  const {
    currentPage,
    totalPages,
    totalItems,
    itemsPerPage,
    paginatedItems: paginatedHistory,
    handlePageChange,
    handleItemsPerPageChange
  } = usePagination(history, 10)

  const handleSettingChange = (key: keyof NotificationSettings, value: boolean | string) => {
    setSettings(prev => ({ ...prev, [key]: value }))
  }

  const handleEventSettingChange = (
    event: 'transactionCreated' | 'transactionValidated' | 'transactionCancelled' | 'transactionWithdrawn' | 'clientCreated' | 'userCreated',
    channel: 'email' | 'sms',
    value: boolean
  ) => {
    setSettings(prev => ({
      ...prev,
      [event]: { ...prev[event], [channel]: value }
    }))
  }

  const handleSaveSettings = async () => {
    setIsSaving(true)
    try {
      const updatedSettings = await notificationsAPI.updateSettings(settings)
      setSettings(updatedSettings)
      toast({ title: 'Succes', description: 'Parametres de notification sauvegardes' })
    } catch (err) {
      console.error('Error saving settings:', err)
      toast({ title: 'Erreur', description: 'Erreur lors de la sauvegarde des parametres', variant: 'destructive' })
    } finally {
      setIsSaving(false)
    }
  }

  const handleTestEmail = async () => {
    try {
      await notificationsAPI.send({
        type: 'email',
        recipient: settings.smtpUser,
        subject: 'Test Email TransferPro',
        message: 'Ceci est un email de test depuis TransferPro.'
      })
      toast({ title: 'Test Email', description: 'Email de test envoye a ' + settings.smtpUser })
    } catch (err) {
      console.error('Error sending test email:', err)
      toast({ title: 'Erreur', description: 'Erreur lors de l\'envoi de l\'email de test', variant: 'destructive' })
    }
  }

  const handleTestSMS = async () => {
    try {
      await notificationsAPI.send({
        type: 'sms',
        recipient: '+221770000000',
        subject: 'Test SMS',
        message: 'Ceci est un SMS de test depuis TransferPro.'
      })
      toast({ title: 'Test SMS', description: 'SMS de test envoye' })
    } catch (err) {
      console.error('Error sending test SMS:', err)
      toast({ title: 'Erreur', description: 'Erreur lors de l\'envoi du SMS de test', variant: 'destructive' })
    }
  }

  const handleDeleteNotification = async () => {
    if (!selectedNotificationId) return
    try {
      await notificationsAPI.delete(selectedNotificationId)
      setHistory(history.filter(n => n.id !== selectedNotificationId))
      setIsDeleteDialogOpen(false)
      setSelectedNotificationId(null)
      toast({ title: 'Succes', description: 'Notification supprimee' })
    } catch (err) {
      console.error('Error deleting notification:', err)
      toast({ title: 'Erreur', description: 'Erreur lors de la suppression', variant: 'destructive' })
    }
  }

  const handleDeleteAllNotifications = async () => {
    try {
      await notificationsAPI.deleteAll()
      setHistory([])
      setIsDeleteAllDialogOpen(false)
      toast({ title: 'Succes', description: 'Toutes les notifications ont ete supprimees' })
    } catch (err) {
      console.error('Error deleting all notifications:', err)
      toast({ title: 'Erreur', description: 'Erreur lors de la suppression', variant: 'destructive' })
    }
  }

  const openDeleteDialog = (id: string) => {
    setSelectedNotificationId(id)
    setIsDeleteDialogOpen(true)
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return new Intl.DateTimeFormat('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(date)
  }

  const getStatusBadge = (status: any) => {
    switch (status) {
      case 'sent':
        return (
          <Badge variant="outline" className="bg-success/10 text-success border-success/30">
            <CheckCircle className="mr-1 h-3 w-3" />
            Envoye
          </Badge>
        )
      case 'failed':
        return (
          <Badge variant="outline" className="bg-destructive/10 text-destructive border-destructive/30">
            <XCircle className="mr-1 h-3 w-3" />
            Echoue
          </Badge>
        )
      case 'pending':
        return (
          <Badge variant="outline" className="bg-warning/10 text-warning border-warning/30">
            <Clock className="mr-1 h-3 w-3" />
            En attente
          </Badge>
        )
    }
  }

  const getTypeBadge = (type: any) => {
    return type === 'email' ? (
      <Badge variant="secondary" className="gap-1">
        <Mail className="h-3 w-3" />
        Email
      </Badge>
    ) : (
      <Badge variant="secondary" className="gap-1">
        <Smartphone className="h-3 w-3" />
        SMS
      </Badge>
    )
  }

  const eventLabels: Record<string, string> = {
    transactionCreated: 'Transaction creee',
    transactionValidated: 'Transaction validee',
    transactionCancelled: 'Transaction annulee',
    transactionWithdrawn: 'Transaction retiree',
    clientCreated: 'Client cree',
    userCreated: 'Utilisateur cree'
  }

  return (
    <div className="space-y-6">
      {/* Error State */}
      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription className="flex items-center justify-between">
            {error}
            <Button variant="outline" size="sm" onClick={fetchData} className="ml-4 gap-2 bg-transparent">
              <RefreshCw className="h-4 w-4" />
              Reessayer
            </Button>
          </AlertDescription>
        </Alert>
      )}

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-3 lg:w-auto lg:inline-grid">
          <TabsTrigger value="parametres" className="gap-2">
            <Settings className="h-4 w-4" />
            <span className="hidden sm:inline">Parametres</span>
          </TabsTrigger>
          <TabsTrigger value="evenements" className="gap-2">
            <Bell className="h-4 w-4" />
            <span className="hidden sm:inline">Evenements</span>
          </TabsTrigger>
          <TabsTrigger value="historique" className="gap-2">
            <History className="h-4 w-4" />
            <span className="hidden sm:inline">Historique</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="parametres" className="space-y-6 mt-6">
          {/* Email Settings */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                    <Mail className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <CardTitle className="text-lg">Configuration Email</CardTitle>
                    <CardDescription>Parametres du serveur SMTP pour l&apos;envoi d&apos;emails</CardDescription>
                  </div>
                </div>
                <Switch
                  checked={settings.emailEnabled}
                  onCheckedChange={(checked) => handleSettingChange('emailEnabled', checked)}
                />
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="smtpHost">Serveur SMTP</Label>
                  <Input
                    id="smtpHost"
                    value={settings.smtpHost}
                    onChange={(e) => handleSettingChange('smtpHost', e.target.value)}
                    placeholder="smtp.example.com"
                    disabled={!settings.emailEnabled}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="smtpPort">Port</Label>
                  <Input
                    id="smtpPort"
                    value={settings.smtpPort}
                    onChange={(e) => handleSettingChange('smtpPort', e.target.value)}
                    placeholder="587"
                    disabled={!settings.emailEnabled}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="smtpUser">Utilisateur / Email expediteur</Label>
                  <Input
                    id="smtpUser"
                    value={settings.smtpUser}
                    onChange={(e) => handleSettingChange('smtpUser', e.target.value)}
                    placeholder="noreply@example.com"
                    disabled={!settings.emailEnabled}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="smtpPassword">Mot de passe</Label>
                  <Input
                    id="smtpPassword"
                    type="password"
                    value={settings.smtpPassword}
                    onChange={(e) => handleSettingChange('smtpPassword', e.target.value)}
                    placeholder="********"
                    disabled={!settings.emailEnabled}
                  />
                </div>
              </div>
              <div className="flex justify-end">
                <Button 
                  variant="outline" 
                  onClick={handleTestEmail}
                  disabled={!settings.emailEnabled}
                  className="gap-2 bg-transparent"
                >
                  <Send className="h-4 w-4" />
                  Envoyer un email de test
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* SMS Settings */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-accent/10">
                    <Smartphone className="h-5 w-5 text-accent" />
                  </div>
                  <div>
                    <CardTitle className="text-lg">Configuration SMS</CardTitle>
                    <CardDescription>Parametres du fournisseur SMS</CardDescription>
                  </div>
                </div>
                <Switch
                  checked={settings.smsEnabled}
                  onCheckedChange={(checked) => handleSettingChange('smsEnabled', checked)}
                />
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2 md:col-span-2">
                  <Label htmlFor="smsProvider">Fournisseur SMS</Label>
                  <Select
                    value={settings.smsProvider}
                    onValueChange={(value) => handleSettingChange('smsProvider', value)}
                    disabled={!settings.smsEnabled}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selectionnez un fournisseur" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="twilio">Twilio</SelectItem>
                      <SelectItem value="orange">Orange SMS API</SelectItem>
                      <SelectItem value="custom">Personnalise</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="smsApiKey">Cle API</Label>
                  <Input
                    id="smsApiKey"
                    value={settings.smsApiKey}
                    onChange={(e) => handleSettingChange('smsApiKey', e.target.value)}
                    placeholder="Votre cle API"
                    disabled={!settings.smsEnabled}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="smsApiSecret">Secret API</Label>
                  <Input
                    id="smsApiSecret"
                    type="password"
                    value={settings.smsApiSecret}
                    onChange={(e) => handleSettingChange('smsApiSecret', e.target.value)}
                    placeholder="********"
                    disabled={!settings.smsEnabled}
                  />
                </div>
              </div>
              <div className="flex justify-end">
                <Button 
                  variant="outline" 
                  onClick={handleTestSMS}
                  disabled={!settings.smsEnabled}
                  className="gap-2 bg-transparent"
                >
                  <Send className="h-4 w-4" />
                  Envoyer un SMS de test
                </Button>
              </div>
            </CardContent>
          </Card>

          <div className="flex justify-end">
            <Button onClick={handleSaveSettings} disabled={isSaving} className="gap-2">
              {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
              {isSaving ? 'Sauvegarde...' : 'Sauvegarder les parametres'}
            </Button>
          </div>
        </TabsContent>

        <TabsContent value="evenements" className="space-y-6 mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Notifications par evenement</CardTitle>
              <CardDescription>
                Configurez les canaux de notification pour chaque type d&apos;evenement
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {Object.entries(eventLabels).map(([key, label]) => {
                  const eventKey = key as keyof Pick<NotificationSettings, 'transactionCreated' | 'transactionValidated' | 'transactionCancelled' | 'transactionWithdrawn' | 'clientCreated' | 'userCreated'>
                  return (
                    <div key={key}>
                      <div className="flex items-center justify-between py-3">
                        <div className="space-y-0.5">
                          <Label className="text-base">{label}</Label>
                          <p className="text-sm text-muted-foreground">
                            Notifier quand un(e) {label.toLowerCase()}
                          </p>
                        </div>
                        <div className="flex items-center gap-6">
                          <div className="flex items-center gap-2">
                            <Mail className="h-4 w-4 text-muted-foreground" />
                            <Switch
                              checked={settings[eventKey].email}
                              onCheckedChange={(checked) => handleEventSettingChange(eventKey, 'email', checked)}
                              disabled={!settings.emailEnabled}
                            />
                          </div>
                          <div className="flex items-center gap-2">
                            <Smartphone className="h-4 w-4 text-muted-foreground" />
                            <Switch
                              checked={settings[eventKey].sms}
                              onCheckedChange={(checked) => handleEventSettingChange(eventKey, 'sms', checked)}
                              disabled={!settings.smsEnabled}
                            />
                          </div>
                        </div>
                      </div>
                      <Separator />
                    </div>
                  )
                })}
              </div>
              <div className="flex justify-end mt-6">
                <Button onClick={handleSaveSettings} disabled={isSaving} className="gap-2">
                  {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                  {isSaving ? 'Sauvegarde...' : 'Sauvegarder'}
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="historique" className="space-y-6 mt-6">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Historique des notifications</CardTitle>
                  <CardDescription>
                    Liste des notifications envoyees recemment
                  </CardDescription>
                </div>
                {isAdmin && history.length > 0 && (
                  <Button 
                    variant="outline" 
                    className="gap-2 text-destructive hover:text-destructive bg-transparent" 
                    onClick={() => setIsDeleteAllDialogOpen(true)}
                  >
                    <Trash2 className="h-4 w-4" />
                    Tout supprimer
                  </Button>
                )}
              </div>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Type</TableHead>
                    <TableHead>Destinataire</TableHead>
                    <TableHead>Sujet</TableHead>
                    <TableHead>Statut</TableHead>
                    <TableHead>Date</TableHead>
                    {isAdmin && <TableHead className="text-right">Actions</TableHead>}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {paginatedHistory.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={isAdmin ? 6 : 5} className="text-center text-muted-foreground py-8">
                        Aucune notification dans l&apos;historique
                      </TableCell>
                    </TableRow>
                  ) : (
                    paginatedHistory.map((notification: any) => (
                      <TableRow key={notification.id}>
                        <TableCell>{getTypeBadge(notification.type)}</TableCell>
                        <TableCell className="font-medium max-w-[150px] truncate">
                          {notification.recipient}
                        </TableCell>
                        <TableCell className="max-w-[200px] truncate">
                          {notification.subject}
                        </TableCell>
                        <TableCell>{getStatusBadge(notification.status)}</TableCell>
                        <TableCell className="text-muted-foreground text-sm">
                          {formatDate(notification.timestamp)}
                        </TableCell>
                        {isAdmin && (
                          <TableCell className="text-right">
                            <Button
                              variant="ghost"
                              size="icon"
                              className="text-destructive hover:text-destructive"
                              onClick={() => openDeleteDialog(notification.id)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </TableCell>
                        )}
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
              <TablePagination
                currentPage={currentPage}
                totalPages={totalPages}
                totalItems={totalItems}
                itemsPerPage={itemsPerPage}
                onPageChange={handlePageChange}
                onItemsPerPageChange={handleItemsPerPageChange}
              />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Delete Single Notification Dialog */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-destructive" />
              Confirmer la suppression
            </DialogTitle>
            <DialogDescription>
              Etes-vous sur de vouloir supprimer cette notification ? Cette action est irreversible.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDeleteDialogOpen(false)}>
              Annuler
            </Button>
            <Button variant="destructive" onClick={handleDeleteNotification}>
              Supprimer
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete All Notifications Dialog */}
      <Dialog open={isDeleteAllDialogOpen} onOpenChange={setIsDeleteAllDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-destructive" />
              Supprimer toutes les notifications
            </DialogTitle>
            <DialogDescription>
              Etes-vous sur de vouloir supprimer toutes les notifications ({history.length}) ? Cette action est irreversible.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDeleteAllDialogOpen(false)}>
              Annuler
            </Button>
            <Button variant="destructive" onClick={handleDeleteAllNotifications}>
              Tout supprimer
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
