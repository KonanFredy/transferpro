'use client'

import { useState, useEffect, useCallback } from 'react'
import { 
  Plus, 
  Search, 
  Filter, 
  MoreHorizontal, 
  Eye, 
  CheckCircle, 
  XCircle, 
  Download,
  ArrowUpRight,
  ArrowDownLeft,
  Calendar,
  RefreshCw,
  AlertCircle,
  Loader2
} from 'lucide-react'
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { transactionsAPI, clientsAPI, paysAPI, devisesAPI, tauxAPI } from '@/lib/api'
import { formatMontant, getStatutLabel } from '@/lib/mock-data'
import type { Transaction, TransactionStatus, Client, Pays, Devise, TauxChange } from '@/lib/types'
import { useToast } from '@/hooks/use-toast'
import { NewTransactionDialog } from './new-transaction-dialog'
import { TablePagination, usePagination } from '@/components/ui/table-pagination'
import { 
  notifyTransactionValidated, 
  notifyTransactionCancelled,
  notifyTransactionCreated
} from '@/lib/notification-service'
import { useNotifications } from '@/lib/notification-context'

function getStatutBadgeVariant(statut: string): 'default' | 'secondary' | 'destructive' | 'outline' {
  switch (statut) {
    case 'validee':
      return 'default'
    case 'en_attente':
      return 'secondary'
    case 'annulee':
      return 'destructive'
    case 'retiree':
      return 'outline'
    default:
      return 'default'
  }
}

export function TransactionsContent() {
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [clients, setClients] = useState<Client[]>([])
  const [pays, setPays] = useState<Pays[]>([])
  const [devises, setDevises] = useState<Devise[]>([])
  const [tauxChange, setTauxChange] = useState<TauxChange[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isProcessing, setIsProcessing] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [typeFilter, setTypeFilter] = useState<string>('all')
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false)
  const [isNewDialogOpen, setIsNewDialogOpen] = useState(false)
  const [selectedTransaction, setSelectedTransaction] = useState<Transaction | null>(null)
  const { toast } = useToast()
  const { refreshNotifications } = useNotifications()

  const fetchData = useCallback(async () => {
    setIsLoading(true)
    setError(null)
    try {
      const [transactionsData, clientsData, paysData, devisesData, tauxData] = await Promise.all([
        transactionsAPI.getAll(),
        clientsAPI.getAll(),
        paysAPI.getAll(),
        devisesAPI.getAll(),
        tauxAPI.getAll()
      ])
      setTransactions(transactionsData)
      setClients(clientsData)
      setPays(paysData)
      setDevises(devisesData)
      setTauxChange(tauxData)
    } catch (err) {
      console.error('Error fetching transactions:', err)
      setError('Erreur lors du chargement des transactions. Veuillez reessayer.')
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  const getClientNomComplet = (clientId: string) => {
    const client = clients.find(c => c.id === clientId)
    return client ? `${client.prenom} ${client.nom}` : 'Client inconnu'
  }

  const getPaysNom = (paysId: string) => {
    const p = pays.find(p => p.id === paysId)
    return p ? p.nom : 'Pays inconnu'
  }

  const filteredTransactions = transactions.filter((transaction) => {
    const matchesSearch =
      transaction.numero.toLowerCase().includes(searchQuery.toLowerCase()) ||
      getClientNomComplet(transaction.clientEmetteurId).toLowerCase().includes(searchQuery.toLowerCase())
    
    const matchesStatus = statusFilter === 'all' || transaction.statut === statusFilter
    const matchesType = typeFilter === 'all' || transaction.type === typeFilter

    return matchesSearch && matchesStatus && matchesType
  })

  const {
    currentPage,
    totalPages,
    totalItems,
    itemsPerPage,
    paginatedItems: paginatedTransactions,
    handlePageChange,
    handleItemsPerPageChange
  } = usePagination(filteredTransactions, 10)

  const handleValidateTransaction = async (transaction: Transaction) => {
    setIsProcessing(true)
    try {
      const updatedTransaction = await transactionsAPI.validate(transaction.id)
      setTransactions(transactions.map((t) => t.id === transaction.id ? updatedTransaction : t))
      toast({ title: 'Succes', description: `Transaction ${transaction.numero} validee` })
      
      // Envoyer notification au client
      const clientName = getClientNomComplet(transaction.clientEmetteurId).split(' ')
      const client = clients.find(c => c.id === transaction.clientEmetteurId)
      await notifyTransactionValidated(
        { nom: clientName[1] || '', prenom: clientName[0] || '', telephone: client?.telephone || '+221771234567' },
        { numero: transaction.numero, montantRecu: formatMontant(transaction.montantRecu, transaction.deviseReceptionId), codeRetrait: `RET${Date.now().toString().slice(-6)}` }
      )
      refreshNotifications()
      toast({ title: 'Notification', description: 'Client notifie par email et SMS' })
    } catch (err) {
      console.error('Error validating transaction:', err)
      toast({ title: 'Erreur', description: 'Erreur lors de la validation', variant: 'destructive' })
    } finally {
      setIsProcessing(false)
    }
  }

  const handleCancelTransaction = async (transaction: Transaction) => {
    setIsProcessing(true)
    try {
      const updatedTransaction = await transactionsAPI.cancel(transaction.id)
      setTransactions(transactions.map((t) => t.id === transaction.id ? updatedTransaction : t))
      toast({ title: 'Succes', description: `Transaction ${transaction.numero} annulee` })
      
      // Envoyer notification au client
      const clientName = getClientNomComplet(transaction.clientEmetteurId).split(' ')
      const client = clients.find(c => c.id === transaction.clientEmetteurId)
      await notifyTransactionCancelled(
        { nom: clientName[1] || '', prenom: clientName[0] || '', telephone: client?.telephone || '+221771234567' },
        transaction.numero
      )
      refreshNotifications()
      toast({ title: 'Notification', description: 'Client notifie de l\'annulation' })
    } catch (err) {
      console.error('Error cancelling transaction:', err)
      toast({ title: 'Erreur', description: 'Erreur lors de l\'annulation', variant: 'destructive' })
    } finally {
      setIsProcessing(false)
    }
  }

  const handleMarkAsWithdrawn = async (transaction: Transaction) => {
    setIsProcessing(true)
    try {
      const updatedTransaction = await transactionsAPI.markWithdrawn(transaction.id)
      setTransactions(transactions.map((t) => t.id === transaction.id ? updatedTransaction : t))
      toast({ title: 'Succes', description: `Transaction ${transaction.numero} marquee comme retiree` })
      refreshNotifications()
    } catch (err) {
      console.error('Error marking as withdrawn:', err)
      toast({ title: 'Erreur', description: 'Erreur lors de la mise a jour', variant: 'destructive' })
    } finally {
      setIsProcessing(false)
    }
  }

  const handleViewTransaction = (transaction: Transaction) => {
    setSelectedTransaction(transaction)
    setIsViewDialogOpen(true)
  }

  const handleNewTransaction = async (transactionData: Omit<Transaction, 'id' | 'numero' | 'dateCreation' | 'statut'>) => {
    setIsProcessing(true)
    try {
      const createdTransaction = await transactionsAPI.create(transactionData as Transaction)
      setTransactions([createdTransaction, ...transactions])
      setIsNewDialogOpen(false)
      toast({ title: 'Succes', description: `Transaction ${createdTransaction.numero} creee avec succes` })
      
      // Envoyer notification au client
      const clientNom = getClientNomComplet(createdTransaction.clientEmetteurId)
      const client = clients.find(c => c.id === createdTransaction.clientEmetteurId)
      const nameParts = clientNom.split(' ')
      await notifyTransactionCreated(
        { nom: nameParts.slice(1).join(' ') || '', prenom: nameParts[0] || '', telephone: client?.telephone || '+221771234567' },
        { 
          numero: createdTransaction.numero, 
          type: createdTransaction.type === 'transfert' ? 'Transfert' : 'Retrait',
          montantEnvoye: formatMontant(createdTransaction.montantEnvoye, createdTransaction.deviseEnvoiId),
          montantRecu: formatMontant(createdTransaction.montantRecu, createdTransaction.deviseReceptionId)
        }
      )
      refreshNotifications()
      toast({ title: 'Notification', description: 'Client notifie par email et SMS' })
    } catch (err) {
      console.error('Error creating transaction:', err)
      toast({ title: 'Erreur', description: 'Erreur lors de la creation de la transaction', variant: 'destructive' })
    } finally {
      setIsProcessing(false)
    }
  }

  const pendingCount = transactions.filter((t) => t.statut === 'en_attente').length
  const transferCount = transactions.filter((t) => t.type === 'transfert').length
  const withdrawalCount = transactions.filter((t) => t.type === 'retrait').length

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
          <h1 className="text-2xl font-semibold text-foreground">Transactions</h1>
          <p className="text-muted-foreground">
            {transferCount} transferts, {withdrawalCount} retraits - {pendingCount} en attente
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={fetchData} disabled={isLoading} className="gap-2 bg-transparent">
            <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
            Actualiser
          </Button>
          <Button onClick={() => setIsNewDialogOpen(true)} disabled={isProcessing}>
            {isProcessing && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            <Plus className="mr-2 h-4 w-4" />
            Nouvelle Transaction
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                <ArrowUpRight className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Transferts</p>
                <p className="text-2xl font-bold">{transferCount}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-chart-2/10">
                <ArrowDownLeft className="h-5 w-5 text-chart-2" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Retraits</p>
                <p className="text-2xl font-bold">{withdrawalCount}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-warning/10">
                <Calendar className="h-5 w-5 text-warning" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">En attente</p>
                <p className="text-2xl font-bold">{pendingCount}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-success/10">
                <CheckCircle className="h-5 w-5 text-success" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Validees</p>
                <p className="text-2xl font-bold">
                  {transactions.filter((t) => t.statut === 'validee').length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col gap-4 md:flex-row md:items-center">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Rechercher par numero ou client..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>
            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tous les types</SelectItem>
                <SelectItem value="transfert">Transfert</SelectItem>
                <SelectItem value="retrait">Retrait</SelectItem>
              </SelectContent>
            </Select>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Statut" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tous les statuts</SelectItem>
                <SelectItem value="en_attente">En attente</SelectItem>
                <SelectItem value="validee">Validee</SelectItem>
                <SelectItem value="retiree">Retiree</SelectItem>
                <SelectItem value="annulee">Annulee</SelectItem>
              </SelectContent>
            </Select>
            <Button variant="outline">
              <Download className="mr-2 h-4 w-4" />
              Exporter
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Transactions Table */}
      <Card>
        <CardHeader>
          <CardTitle>Liste des Transactions</CardTitle>
          <CardDescription>
            Gerez et suivez toutes les transactions
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Numero</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Emetteur</TableHead>
                <TableHead>Beneficiaire</TableHead>
                <TableHead>Route</TableHead>
                <TableHead className="text-right">Montant Envoye</TableHead>
                <TableHead className="text-right">Montant Recu</TableHead>
                <TableHead>Statut</TableHead>
                <TableHead>Date</TableHead>
                <TableHead className="w-[80px]">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {paginatedTransactions.map((transaction) => (
                <TableRow key={transaction.id}>
                  <TableCell className="font-medium">{transaction.numero}</TableCell>
                  <TableCell>
                    <Badge variant="outline" className="capitalize">
                      {transaction.type === 'transfert' ? (
                        <ArrowUpRight className="mr-1 h-3 w-3" />
                      ) : (
                        <ArrowDownLeft className="mr-1 h-3 w-3" />
                      )}
                      {transaction.type}
                    </Badge>
                  </TableCell>
                  <TableCell>{transaction.clientEmetteurNom || getClientNomComplet(transaction.clientEmetteurId)}</TableCell>
                  <TableCell>
                    {transaction.clientBeneficiaireNom || (transaction.clientBeneficiaireId
                      ? getClientNomComplet(transaction.clientBeneficiaireId)
                      : '-')}
                  </TableCell>
                  <TableCell className="text-sm">
                    {transaction.paysEnvoiNom || getPaysNom(transaction.paysEnvoiId)} → {transaction.paysReceptionNom || getPaysNom(transaction.paysReceptionId)}
                  </TableCell>
                  <TableCell className="text-right font-medium">
                    {transaction.montantEnvoye > 0 ? formatMontant(transaction.montantEnvoye, transaction.deviseEnvoiId) : '0'}
                  </TableCell>
                  <TableCell className="text-right font-medium">
                    {transaction.montantRecu > 0 ? formatMontant(transaction.montantRecu, transaction.deviseReceptionId) : '0'}
                  </TableCell>
                  <TableCell>
                    <Badge variant={getStatutBadgeVariant(transaction.statut)}>
                      {getStatutLabel(transaction.statut)}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {transaction.dateCreation ? new Date(transaction.dateCreation).toLocaleDateString('fr-FR') : 'N/A'}
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
                        <DropdownMenuItem onClick={() => handleViewTransaction(transaction)}>
                          <Eye className="mr-2 h-4 w-4" />
                          Voir details
                        </DropdownMenuItem>
                        {transaction.statut === 'en_attente' && (
                          <>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem onClick={() => handleValidateTransaction(transaction)}>
                              <CheckCircle className="mr-2 h-4 w-4" />
                              Valider
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => handleCancelTransaction(transaction)}
                              className="text-destructive"
                            >
                              <XCircle className="mr-2 h-4 w-4" />
                              Annuler
                            </DropdownMenuItem>
                          </>
                        )}
                        {transaction.statut === 'validee' && transaction.type === 'transfert' && (
                          <>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem onClick={() => handleMarkAsWithdrawn(transaction)}>
                              <ArrowDownLeft className="mr-2 h-4 w-4" />
                              Marquer comme retire
                            </DropdownMenuItem>
                          </>
                        )}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
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

      {/* View Dialog */}
      <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Details de la Transaction</DialogTitle>
            <DialogDescription>
              Informations completes de la transaction
            </DialogDescription>
          </DialogHeader>
          {selectedTransaction && (
            <div className="space-y-6 py-4">
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-sm text-muted-foreground">Numero</span>
                  <p className="text-lg font-semibold">{selectedTransaction.numero}</p>
                </div>
                <Badge variant={getStatutBadgeVariant(selectedTransaction.statut)} className="h-7">
                  {getStatutLabel(selectedTransaction.statut)}
                </Badge>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <span className="text-sm text-muted-foreground">Type</span>
                  <p className="font-medium capitalize">{selectedTransaction.type}</p>
                </div>
                <div className="space-y-1">
                  <span className="text-sm text-muted-foreground">Date de creation</span>
                  <p className="font-medium">
                    {new Date(selectedTransaction.dateCreation).toLocaleString('fr-FR')}
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 border-t pt-4">
                <div className="space-y-1">
                  <span className="text-sm text-muted-foreground">Emetteur</span>
                  <p className="font-medium">
                    {getClientNomComplet(selectedTransaction.clientEmetteurId)}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {getPaysNom(selectedTransaction.paysEnvoiId)}
                  </p>
                </div>
                {selectedTransaction.clientBeneficiaireId && (
                  <div className="space-y-1">
                    <span className="text-sm text-muted-foreground">Beneficiaire</span>
                    <p className="font-medium">
                      {getClientNomComplet(selectedTransaction.clientBeneficiaireId)}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {getPaysNom(selectedTransaction.paysReceptionId)}
                    </p>
                  </div>
                )}
              </div>

              <div className="grid grid-cols-3 gap-4 border-t pt-4">
                <div className="space-y-1">
                  <span className="text-sm text-muted-foreground">Montant envoye</span>
                  <p className="text-lg font-semibold">
                    {formatMontant(selectedTransaction.montantEnvoye, selectedTransaction.deviseEnvoiId)}
                  </p>
                </div>
                <div className="space-y-1">
                  <span className="text-sm text-muted-foreground">Taux de change</span>
                  <p className="text-lg font-semibold">{selectedTransaction.tauxChange}</p>
                </div>
                <div className="space-y-1">
                  <span className="text-sm text-muted-foreground">Montant recu</span>
                  <p className="text-lg font-semibold text-primary">
                    {formatMontant(selectedTransaction.montantRecu, selectedTransaction.deviseReceptionId)}
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 border-t pt-4">
                <div className="space-y-1">
                  <span className="text-sm text-muted-foreground">Frais</span>
                  <p className="font-medium">
                    {formatMontant(selectedTransaction.frais, selectedTransaction.deviseEnvoiId)}
                  </p>
                </div>
                {selectedTransaction.dateValidation && (
                  <div className="space-y-1">
                    <span className="text-sm text-muted-foreground">Date de validation</span>
                    <p className="font-medium">
                      {new Date(selectedTransaction.dateValidation).toLocaleString('fr-FR')}
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsViewDialogOpen(false)}>
              Fermer
            </Button>
            {selectedTransaction?.statut === 'en_attente' && (
              <Button onClick={() => {
                if (selectedTransaction) {
                  handleValidateTransaction(selectedTransaction)
                  setIsViewDialogOpen(false)
                }
              }}>
                Valider la transaction
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* New Transaction Dialog */}
      <NewTransactionDialog
        open={isNewDialogOpen}
        onOpenChange={setIsNewDialogOpen}
        onSubmit={handleNewTransaction}
        transactionCount={transactions.length}
        clients={clients}
        pays={pays}
        devises={devises}
        tauxChange={tauxChange}
      />
    </div>
  )
}
