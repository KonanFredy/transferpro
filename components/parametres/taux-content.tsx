'use client'

import { useState, useEffect, useCallback } from 'react'
import { Plus, Search, MoreHorizontal, Pencil, ArrowRight, TrendingUp, History, RefreshCw, AlertCircle, Loader2 } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { Alert, AlertDescription } from '@/components/ui/alert'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { tauxAPI, devisesAPI, exchangeRatesAPI } from '@/lib/api'
import type { TauxChange, Devise } from '@/lib/types'
import { useToast } from '@/hooks/use-toast'
import { TablePagination, usePagination } from '@/components/ui/table-pagination'

export function TauxContent() {
  const { toast } = useToast()
  const [taux, setTaux] = useState<TauxChange[]>([])
  const [devises, setDevises] = useState<Devise[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [selectedTaux, setSelectedTaux] = useState<TauxChange | null>(null)
  const [formData, setFormData] = useState({
    deviseSourceId: '',
    deviseCibleId: '',
    taux: '',
  })
  const [isSyncing, setIsSyncing] = useState(false)
  const [liveRates, setLiveRates] = useState<Record<string, number>>({})
  const [isFetchingLiveRate, setIsFetchingLiveRate] = useState(false)

  const fetchData = useCallback(async () => {
    setIsLoading(true)
    setError(null)
    try {
      const [tauxData, devisesData] = await Promise.all([
        tauxAPI.getAll(),
        devisesAPI.getAll()
      ])
      setTaux(tauxData)
      setDevises(devisesData)
    } catch (err) {
      console.error('Error fetching taux:', err)
      setError('Erreur lors du chargement des taux. Veuillez reessayer.')
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  const getDevise = (deviseId: string) => {
    return devises.find(d => d.id === deviseId)
  }

  const filteredTaux = taux.filter((t) => {
    const deviseSource = getDevise(t.deviseSourceId)
    const deviseCible = getDevise(t.deviseCibleId)
    return (
      deviseSource?.nom.toLowerCase().includes(searchQuery.toLowerCase()) ||
      deviseSource?.codeISO.toLowerCase().includes(searchQuery.toLowerCase()) ||
      deviseCible?.nom.toLowerCase().includes(searchQuery.toLowerCase()) ||
      deviseCible?.codeISO.toLowerCase().includes(searchQuery.toLowerCase())
    )
  })

  const {
    currentPage,
    totalPages,
    totalItems,
    itemsPerPage,
    paginatedItems: paginatedTaux,
    handlePageChange,
    handleItemsPerPageChange
  } = usePagination(filteredTaux, 10)

  const handleCreateTaux = async () => {
    // Validate required fields
    if (!formData.deviseSourceId || !formData.deviseCibleId || !formData.taux) {
      toast({ 
        title: 'Erreur de validation', 
        description: 'Veuillez selectionner les devises et saisir un taux', 
        variant: 'destructive' 
      })
      return
    }
    
    setIsSaving(true)
    try {
      const newTaux = await tauxAPI.create({
        deviseSourceId: formData.deviseSourceId,
        deviseCibleId: formData.deviseCibleId,
        taux: parseFloat(formData.taux),
      })
      setTaux([newTaux, ...taux])
      setIsCreateDialogOpen(false)
      resetForm()
      toast({ title: 'Succes', description: 'Taux de change cree avec succes' })
    } catch (err: unknown) {
      console.error('Error creating taux:', err)
      // Extract error message from axios response
      const axiosError = err as { response?: { data?: Record<string, string[]> } }
      let errorMessage = 'Erreur lors de la creation du taux'
      if (axiosError.response?.data) {
        const errors = Object.entries(axiosError.response.data)
          .map(([field, messages]) => `${field}: ${Array.isArray(messages) ? messages.join(', ') : messages}`)
          .join('; ')
        if (errors) errorMessage = errors
      }
      toast({ title: 'Erreur', description: errorMessage, variant: 'destructive' })
    } finally {
      setIsSaving(false)
    }
  }

  const handleUpdateTaux = async () => {
    if (!selectedTaux) return
    setIsSaving(true)
    try {
      const updatedTaux = await tauxAPI.update(selectedTaux.id, {
        deviseSourceId: formData.deviseSourceId,
        deviseCibleId: formData.deviseCibleId,
        taux: parseFloat(formData.taux),
      })
      setTaux(taux.map((t) => t.id === selectedTaux.id ? updatedTaux : t))
      setIsEditDialogOpen(false)
      setSelectedTaux(null)
      resetForm()
      toast({ title: 'Succes', description: 'Taux de change mis a jour avec succes' })
    } catch (err) {
      console.error('Error updating taux:', err)
      toast({ title: 'Erreur', description: 'Erreur lors de la mise a jour du taux', variant: 'destructive' })
    } finally {
      setIsSaving(false)
    }
  }

  const handleToggleStatus = async (tauxItem: TauxChange) => {
    try {
      await tauxAPI.toggleActive(tauxItem.id)
      setTaux(taux.map((t) => t.id === tauxItem.id ? { ...t, actif: !t.actif } : t))
      toast({ title: 'Succes', description: `Taux ${tauxItem.actif ? 'desactive' : 'active'} avec succes` })
    } catch (err) {
      console.error('Error toggling taux status:', err)
      toast({ title: 'Erreur', description: 'Erreur lors de la modification du statut', variant: 'destructive' })
    }
  }

  const handleEditTaux = (tauxItem: TauxChange) => {
    setSelectedTaux(tauxItem)
    setFormData({
      deviseSourceId: tauxItem.deviseSourceId,
      deviseCibleId: tauxItem.deviseCibleId,
      taux: tauxItem.taux.toString(),
    })
    setIsEditDialogOpen(true)
  }

  const resetForm = () => {
    setFormData({
      deviseSourceId: '',
      deviseCibleId: '',
      taux: '',
    })
  }

  const activeTaux = taux.filter((t) => t.actif).length

  // Fetch live exchange rate for selected currencies
  const fetchLiveRate = async () => {
    if (!formData.deviseSourceId || !formData.deviseCibleId) return
    
    const deviseSource = getDevise(formData.deviseSourceId)
    const deviseCible = getDevise(formData.deviseCibleId)
    
    if (!deviseSource || !deviseCible) return
    
    setIsFetchingLiveRate(true)
    try {
      const rate = await exchangeRatesAPI.getRate(deviseSource.codeISO, deviseCible.codeISO)
      if (rate > 0) {
        setFormData(prev => ({ ...prev, taux: rate.toFixed(6) }))
        toast({ title: 'Taux recupere', description: `Taux actuel: 1 ${deviseSource.codeISO} = ${rate.toFixed(4)} ${deviseCible.codeISO}` })
      }
    } catch (err) {
      console.error('Error fetching live rate:', err)
      toast({ title: 'Erreur', description: 'Impossible de recuperer le taux en direct', variant: 'destructive' })
    } finally {
      setIsFetchingLiveRate(false)
    }
  }

  // Sync all rates with live data
  const handleSyncAllRates = async () => {
    setIsSyncing(true)
    try {
      // Fetch EUR base rates first
      const rates = await exchangeRatesAPI.getLiveRates('EUR')
      setLiveRates(rates)
      
      // Update each existing taux with live rate
      let updated = 0
      for (const tauxItem of taux) {
        const deviseSource = getDevise(tauxItem.deviseSourceId)
        const deviseCible = getDevise(tauxItem.deviseCibleId)
        
        if (deviseSource && deviseCible && rates[deviseSource.codeISO] && rates[deviseCible.codeISO]) {
          // Calculate cross rate: target / source
          const newRate = rates[deviseCible.codeISO] / rates[deviseSource.codeISO]
          
          if (Math.abs(newRate - tauxItem.taux) > 0.0001) {
            try {
              await tauxAPI.update(tauxItem.id, { taux: newRate })
              updated++
            } catch (e) {
              console.error(`Failed to update rate for ${deviseSource.codeISO}/${deviseCible.codeISO}:`, e)
            }
          }
        }
      }
      
      // Refresh data
      await fetchData()
      
      toast({ 
        title: 'Synchronisation terminee', 
        description: `${updated} taux mis a jour avec les cours actuels du marche` 
      })
    } catch (err) {
      console.error('Error syncing rates:', err)
      toast({ 
        title: 'Erreur de synchronisation', 
        description: 'Impossible de synchroniser avec les taux en direct', 
        variant: 'destructive' 
      })
    } finally {
      setIsSyncing(false)
    }
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

      {/* Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-foreground">Taux de Change</h1>
          <p className="text-muted-foreground">
            {activeTaux} taux actifs sur {taux.length} configures
          </p>
        </div>
        <div className="flex gap-2">
          <Button 
            variant="outline" 
            onClick={handleSyncAllRates} 
            disabled={isSyncing || isLoading} 
            className="gap-2 bg-transparent"
          >
            <TrendingUp className={`h-4 w-4 ${isSyncing ? 'animate-pulse' : ''}`} />
            {isSyncing ? 'Synchronisation...' : 'Sync Taux Live'}
          </Button>
          <Button variant="outline" onClick={fetchData} disabled={isLoading} className="gap-2 bg-transparent">
            <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
            Actualiser
          </Button>
          <Button onClick={() => setIsCreateDialogOpen(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Nouveau Taux
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                <TrendingUp className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Taux Actifs</p>
                <p className="text-2xl font-bold">{activeTaux}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-chart-2/10">
                <History className="h-5 w-5 text-chart-2" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Derniere MAJ</p>
                <p className="text-2xl font-bold">Aujourd'hui</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-success/10">
                <ArrowRight className="h-5 w-5 text-success" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Paires de Devises</p>
                <p className="text-2xl font-bold">{taux.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Search */}
      <Card>
        <CardContent className="pt-6">
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Rechercher par devise..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
            />
          </div>
        </CardContent>
      </Card>

      {/* Table */}
      <Card>
        <CardHeader>
          <CardTitle>Liste des Taux de Change</CardTitle>
          <CardDescription>
            Gerez les taux de conversion entre devises
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Conversion</TableHead>
                <TableHead className="text-right">Taux</TableHead>
                <TableHead>Date d'effet</TableHead>
                <TableHead>Statut</TableHead>
                <TableHead className="w-[80px]">Actions</TableHead>
              </TableRow>
            </TableHeader>
<TableBody>
              {isLoading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <TableRow key={i}>
                    <TableCell><Skeleton className="h-8 w-32" /></TableCell>
                    <TableCell><Skeleton className="h-8 w-24" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-20" /></TableCell>
                    <TableCell><Skeleton className="h-6 w-16" /></TableCell>
                    <TableCell><Skeleton className="h-8 w-8" /></TableCell>
                  </TableRow>
                ))
              ) : paginatedTaux.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center text-muted-foreground py-8">
                    Aucun taux trouve
                  </TableCell>
                </TableRow>
              ) : (
                paginatedTaux.map((tauxItem) => {
                  const deviseSource = getDevise(tauxItem.deviseSourceId)
                  const deviseCible = getDevise(tauxItem.deviseCibleId)
                  return (
                    <TableRow key={tauxItem.id}>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Badge variant="outline">{deviseSource?.codeISO}</Badge>
                          <ArrowRight className="h-4 w-4 text-muted-foreground" />
                          <Badge variant="outline">{deviseCible?.codeISO}</Badge>
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">
                          {deviseSource?.nom} vers {deviseCible?.nom}
                        </p>
                      </TableCell>
                      <TableCell className="text-right">
                        <span className="text-lg font-semibold">{tauxItem.taux.toLocaleString('fr-FR', { maximumFractionDigits: 6 })}</span>
                        <p className="text-xs text-muted-foreground">
                          1 {deviseSource?.symbole} = {tauxItem.taux.toLocaleString('fr-FR', { maximumFractionDigits: 2 })} {deviseCible?.symbole}
                        </p>
                      </TableCell>
                      <TableCell>
                        {new Date(tauxItem.dateEffet).toLocaleDateString('fr-FR')}
                      </TableCell>
                      <TableCell>
                        <Badge variant={tauxItem.actif ? 'default' : 'secondary'}>
                          {tauxItem.actif ? 'Actif' : 'Inactif'}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon">
                              <MoreHorizontal className="h-4 w-4" />
                              <span className="sr-only">Actions</span>
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => handleEditTaux(tauxItem)}>
                              <Pencil className="mr-2 h-4 w-4" />
                              Modifier
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem onClick={() => handleToggleStatus(tauxItem)}>
                              {tauxItem.actif ? 'Desactiver' : 'Activer'}
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  )
                })
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

      {/* Create Dialog */}
      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Nouveau Taux de Change</DialogTitle>
            <DialogDescription>
              Definissez un nouveau taux de conversion entre deux devises
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Devise Source</Label>
                <Select
                  value={formData.deviseSourceId}
                  onValueChange={(value) => setFormData({ ...formData, deviseSourceId: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selectionnez" />
                  </SelectTrigger>
                  <SelectContent>
                    {devises.map((devise) => (
                      <SelectItem key={devise.id} value={devise.id}>
                        {devise.nom} ({devise.codeISO})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Devise Cible</Label>
                <Select
                  value={formData.deviseCibleId}
                  onValueChange={(value) => setFormData({ ...formData, deviseCibleId: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selectionnez" />
                  </SelectTrigger>
                  <SelectContent>
                    {devises
                      .filter((d) => d.id !== formData.deviseSourceId)
                      .map((devise) => (
                        <SelectItem key={devise.id} value={devise.id}>
                          {devise.nom} ({devise.codeISO})
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="taux">Taux de conversion</Label>
              <div className="flex gap-2">
                <Input
                  id="taux"
                  type="number"
                  step="0.0001"
                  value={formData.taux}
                  onChange={(e) => setFormData({ ...formData, taux: e.target.value })}
                  placeholder="Ex: 655.957"
                  className="flex-1"
                />
                <Button 
                  type="button"
                  variant="outline" 
                  onClick={fetchLiveRate}
                  disabled={isFetchingLiveRate || !formData.deviseSourceId || !formData.deviseCibleId}
                  className="bg-transparent whitespace-nowrap"
                >
                  {isFetchingLiveRate ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <TrendingUp className="h-4 w-4" />
                  )}
                  <span className="ml-2 hidden sm:inline">Taux Live</span>
                </Button>
              </div>
              {formData.deviseSourceId && formData.deviseCibleId && formData.taux && (
                <p className="text-xs text-muted-foreground">
                  1 {getDevise(formData.deviseSourceId)?.symbole} = {parseFloat(formData.taux).toLocaleString('fr-FR')} {getDevise(formData.deviseCibleId)?.symbole}
                </p>
              )}
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)} className="bg-transparent">
              Annuler
            </Button>
            <Button onClick={handleCreateTaux} disabled={isSaving}>
              {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {isSaving ? 'Creation...' : 'Creer'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Modifier le Taux de Change</DialogTitle>
            <DialogDescription>
              Mettez a jour le taux de conversion
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Devise Source</Label>
                <Select
                  value={formData.deviseSourceId}
                  onValueChange={(value) => setFormData({ ...formData, deviseSourceId: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {devises.map((devise) => (
                      <SelectItem key={devise.id} value={devise.id}>
                        {devise.nom} ({devise.codeISO})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Devise Cible</Label>
                <Select
                  value={formData.deviseCibleId}
                  onValueChange={(value) => setFormData({ ...formData, deviseCibleId: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {devises
                      .filter((d) => d.id !== formData.deviseSourceId)
                      .map((devise) => (
                        <SelectItem key={devise.id} value={devise.id}>
                          {devise.nom} ({devise.codeISO})
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-taux">Taux de conversion</Label>
              <div className="flex gap-2">
                <Input
                  id="edit-taux"
                  type="number"
                  step="0.0001"
                  value={formData.taux}
                  onChange={(e) => setFormData({ ...formData, taux: e.target.value })}
                  className="flex-1"
                />
                <Button 
                  type="button"
                  variant="outline" 
                  onClick={fetchLiveRate}
                  disabled={isFetchingLiveRate || !formData.deviseSourceId || !formData.deviseCibleId}
                  className="bg-transparent whitespace-nowrap"
                >
                  {isFetchingLiveRate ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <TrendingUp className="h-4 w-4" />
                  )}
                  <span className="ml-2 hidden sm:inline">Taux Live</span>
                </Button>
              </div>
              {formData.deviseSourceId && formData.deviseCibleId && formData.taux && (
                <p className="text-xs text-muted-foreground">
                  1 {getDevise(formData.deviseSourceId)?.symbole} = {parseFloat(formData.taux).toLocaleString('fr-FR')} {getDevise(formData.deviseCibleId)?.symbole}
                </p>
              )}
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditDialogOpen(false)} className="bg-transparent">
              Annuler
            </Button>
            <Button onClick={handleUpdateTaux} disabled={isSaving}>
              {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {isSaving ? 'Enregistrement...' : 'Enregistrer'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

export default TauxContent
