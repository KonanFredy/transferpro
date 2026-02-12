'use client'

import { useState, useEffect, useCallback } from 'react'
import { Plus, Search, MoreHorizontal, Pencil, Coins, RefreshCw, AlertCircle, Loader2 } from 'lucide-react'
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
import { devisesAPI } from '@/lib/api'
import type { Devise } from '@/lib/types'
import { useToast } from '@/hooks/use-toast'
import { TablePagination, usePagination } from '@/components/ui/table-pagination'

export function DevisesContent() {
  const { toast } = useToast()
  const [devises, setDevises] = useState<Devise[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [selectedDevise, setSelectedDevise] = useState<Devise | null>(null)
  const [formData, setFormData] = useState({
    nom: '',
    codeISO: '',
    symbole: '',
  })

  const fetchData = useCallback(async () => {
    setIsLoading(true)
    setError(null)
    try {
      const devisesData = await devisesAPI.getAll()
      setDevises(devisesData)
    } catch (err) {
      console.error('Error fetching devises:', err)
      setError('Erreur lors du chargement des devises. Veuillez reessayer.')
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  const filteredDevises = devises.filter(
    (d) =>
      d.nom.toLowerCase().includes(searchQuery.toLowerCase()) ||
      d.codeISO.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const {
    currentPage,
    totalPages,
    totalItems,
    itemsPerPage,
    paginatedItems: paginatedDevises,
    handlePageChange,
    handleItemsPerPageChange
  } = usePagination(filteredDevises, 10)

  const handleCreateDevise = async () => {
    setIsSaving(true)
    try {
      const newDevise = await devisesAPI.create(formData)
      setDevises([newDevise, ...devises])
      setIsCreateDialogOpen(false)
      resetForm()
      toast({ title: 'Succes', description: 'Devise creee avec succes' })
    } catch (err: unknown) {
      console.error('Error creating devise:', err)
      // Extract error message from axios response
      const axiosError = err as { response?: { data?: Record<string, string[]> } }
      let errorMessage = 'Erreur lors de la creation de la devise'
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

  const handleUpdateDevise = async () => {
    if (!selectedDevise) return
    setIsSaving(true)
    try {
      const updatedDevise = await devisesAPI.update(selectedDevise.id, formData)
      setDevises(devises.map((d) => d.id === selectedDevise.id ? updatedDevise : d))
      setIsEditDialogOpen(false)
      setSelectedDevise(null)
      resetForm()
      toast({ title: 'Succes', description: 'Devise mise a jour avec succes' })
    } catch (err) {
      console.error('Error updating devise:', err)
      toast({ title: 'Erreur', description: 'Erreur lors de la mise a jour de la devise', variant: 'destructive' })
    } finally {
      setIsSaving(false)
    }
  }

  const handleEditDevise = (devise: Devise) => {
    setSelectedDevise(devise)
    setFormData({
      nom: devise.nom,
      codeISO: devise.codeISO,
      symbole: devise.symbole,
    })
    setIsEditDialogOpen(true)
  }

  const resetForm = () => {
    setFormData({
      nom: '',
      codeISO: '',
      symbole: '',
    })
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
          <h1 className="text-2xl font-semibold text-foreground">Gestion des Devises</h1>
          <p className="text-muted-foreground">
            {devises.length} devises configurees
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={fetchData} disabled={isLoading} className="gap-2 bg-transparent">
            <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
            Actualiser
          </Button>
          <Button onClick={() => setIsCreateDialogOpen(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Nouvelle Devise
          </Button>
        </div>
      </div>

      {/* Search */}
      <Card>
        <CardContent className="pt-6">
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Rechercher par nom ou code..."
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
          <CardTitle>Liste des Devises</CardTitle>
          <CardDescription>
            Gerez les devises pour la conversion automatique
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Devise</TableHead>
                <TableHead>Code ISO</TableHead>
                <TableHead>Symbole</TableHead>
                <TableHead className="w-[80px]">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <TableRow key={i}>
                    <TableCell><Skeleton className="h-8 w-32" /></TableCell>
                    <TableCell><Skeleton className="h-6 w-12" /></TableCell>
                    <TableCell><Skeleton className="h-6 w-8" /></TableCell>
                    <TableCell><Skeleton className="h-8 w-8" /></TableCell>
                  </TableRow>
                ))
              ) : paginatedDevises.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={4} className="text-center text-muted-foreground py-8">
                    Aucune devise trouvee
                  </TableCell>
                </TableRow>
              ) : (
                paginatedDevises.map((devise) => (
                  <TableRow key={devise.id}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-muted">
                          <Coins className="h-4 w-4 text-muted-foreground" />
                        </div>
                        <span className="font-medium">{devise.nom}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">{devise.codeISO}</Badge>
                    </TableCell>
                    <TableCell>
                      <span className="text-lg font-semibold">{devise.symbole}</span>
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
                          <DropdownMenuItem onClick={() => handleEditDevise(devise)}>
                            <Pencil className="mr-2 h-4 w-4" />
                            Modifier
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
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

      {/* Create Dialog */}
      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Nouvelle Devise</DialogTitle>
            <DialogDescription>
              Ajoutez une nouvelle devise au systeme
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="nom">Nom de la devise</Label>
              <Input
                id="nom"
                value={formData.nom}
                onChange={(e) => setFormData({ ...formData, nom: e.target.value })}
                placeholder="Ex: Euro"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="codeISO">Code ISO</Label>
                <Input
                  id="codeISO"
                  value={formData.codeISO}
                  onChange={(e) => setFormData({ ...formData, codeISO: e.target.value.toUpperCase() })}
                  placeholder="Ex: EUR"
                  maxLength={3}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="symbole">Symbole</Label>
                <Input
                  id="symbole"
                  value={formData.symbole}
                  onChange={(e) => setFormData({ ...formData, symbole: e.target.value })}
                  placeholder="Ex: €"
                />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
              Annuler
            </Button>
            <Button onClick={handleCreateDevise} disabled={isSaving}>
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
            <DialogTitle>Modifier la Devise</DialogTitle>
            <DialogDescription>
              Modifiez les informations de la devise
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="edit-nom">Nom de la devise</Label>
              <Input
                id="edit-nom"
                value={formData.nom}
                onChange={(e) => setFormData({ ...formData, nom: e.target.value })}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="edit-codeISO">Code ISO</Label>
                <Input
                  id="edit-codeISO"
                  value={formData.codeISO}
                  onChange={(e) => setFormData({ ...formData, codeISO: e.target.value.toUpperCase() })}
                  maxLength={3}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-symbole">Symbole</Label>
                <Input
                  id="edit-symbole"
                  value={formData.symbole}
                  onChange={(e) => setFormData({ ...formData, symbole: e.target.value })}
                />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
              Annuler
            </Button>
            <Button onClick={handleUpdateDevise} disabled={isSaving}>
              {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {isSaving ? 'Enregistrement...' : 'Enregistrer'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
