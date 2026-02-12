'use client'

import { useState, useEffect, useCallback, useMemo } from 'react'
import { 
  ArrowUpRight, 
  ArrowDownRight, 
  TrendingUp, 
  Clock, 
  ArrowLeftRight,
  Banknote,
  Users,
  RefreshCw,
  AlertCircle
} from 'lucide-react'
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Skeleton } from '@/components/ui/skeleton'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { dashboardAPI, clientsAPI, transactionsAPI } from '@/lib/api'
import { formatMontant, getStatutLabel } from '@/lib/mock-data'
import type { Transaction, Client } from '@/lib/types'
import Link from 'next/link'

interface DashboardStats {
  totalTransactions: number
  montantTotalEnvoye: number
  montantTotalRecu: number
  transactionsEnAttente: number
  transactionsAujourdHui: number
  totalTransferts: number
  totalRetraits: number
  montantTotalTransfere: number
  montantTotalRetire: number
}

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

export function DashboardContent() {
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [recentTransactions, setRecentTransactions] = useState<Transaction[]>([])
  const [clients, setClients] = useState<Client[]>([])
  const [paysActivity, setPaysActivity] = useState<{ pays: string; pourcentage: number; montant: string }[]>([])
  const [topAgents, setTopAgents] = useState<{ nom: string; transactions: number; montant: string }[]>([])
  const [monthlyData, setMonthlyData] = useState<{ mois: string; transferts: number; retraits: number }[]>([])
  const [weeklyData, setWeeklyData] = useState<{ jour: string; montant: number }[]>([])

  const fetchDashboardData = useCallback(async () => {
    setIsLoading(true)
    setError(null)
    try {
      // Fetch all data in parallel - handle potential failures gracefully
      const [statsResult, transactionsResult, clientsResult] = await Promise.allSettled([
        dashboardAPI.getStatistics(),
        transactionsAPI.getAll(),
        clientsAPI.getAll()
      ])
      
      // Extract data or use defaults
      const statsData = statsResult.status === 'fulfilled' ? statsResult.value : null
      const transactionsData = transactionsResult.status === 'fulfilled' ? transactionsResult.value : []
      const clientsData = clientsResult.status === 'fulfilled' ? clientsResult.value : []

      // Process stats
      const currentDay = new Date().toISOString().split('T')[0]
      const transactionsAujourdHui = transactionsData.filter(t => 
        t.dateCreation.startsWith(currentDay)
      ).length
      const totalTransferts = transactionsData.filter(t => t.type === 'transfert').length
      const totalRetraits = transactionsData.filter(t => t.type === 'retrait').length
      const montantTotalTransfere = transactionsData
        .filter(t => t.type === 'transfert')
        .reduce((sum, t) => sum + t.montantEnvoye, 0)
      const montantTotalRetire = transactionsData
        .filter(t => t.type === 'retrait')
        .reduce((sum, t) => sum + t.montantEnvoye, 0)
      const transactionsEnAttente = transactionsData.filter(t => t.statut === 'en_attente').length

      setStats({
        totalTransactions: transactionsData.length,
        montantTotalEnvoye: statsData?.montantTotalEnvoye || montantTotalTransfere,
        montantTotalRecu: statsData?.montantTotalRecu || montantTotalRetire,
        transactionsEnAttente,
        transactionsAujourdHui,
        totalTransferts,
        totalRetraits,
        montantTotalTransfere,
        montantTotalRetire
      })

      setRecentTransactions(transactionsData.slice(0, 5))
      setClients(clientsData)

      // Process pays activity
      if (statsData?.transactionsParPays && statsData.transactionsParPays.length > 0) {
        const total = statsData.transactionsParPays.reduce((sum, p) => sum + p.count, 0)
        setPaysActivity(statsData.transactionsParPays.map(p => ({
          pays: p.pays,
          pourcentage: total > 0 ? Math.round((p.count / total) * 100) : 0,
          montant: `${p.count} transactions`
        })))
      } else {
        setPaysActivity([])
      }

      // Process top agents
      if (statsData?.topAgents && statsData.topAgents.length > 0) {
        setTopAgents(statsData.topAgents.map(a => ({
          nom: a.nom,
          transactions: a.transactions,
          montant: formatMontant(a.montant, '1')
        })))
      } else {
        setTopAgents([])
      }

      // Generate monthly data for line chart
      const months = ['Jan', 'Fev', 'Mar', 'Avr', 'Mai', 'Jun', 'Jul', 'Aou', 'Sep', 'Oct', 'Nov', 'Dec']
      const currentMonth = new Date().getMonth()
      const monthlyStats = months.slice(0, currentMonth + 1).map((mois, index) => {
        const monthTransactions = transactionsData.filter(t => {
          const date = new Date(t.dateCreation)
          return date.getMonth() === index && date.getFullYear() === new Date().getFullYear()
        })
        return {
          mois,
          transferts: monthTransactions.filter(t => t.type === 'transfert').reduce((sum, t) => sum + t.montantEnvoye, 0),
          retraits: monthTransactions.filter(t => t.type === 'retrait').reduce((sum, t) => sum + t.montantEnvoye, 0)
        }
      })
      setMonthlyData(monthlyStats.length > 0 ? monthlyStats : [
        { mois: 'Jan', transferts: 45000, retraits: 23000 },
        { mois: 'Fev', transferts: 52000, retraits: 28000 },
        { mois: 'Mar', transferts: 48000, retraits: 31000 },
        { mois: 'Avr', transferts: 61000, retraits: 35000 },
        { mois: 'Mai', transferts: 55000, retraits: 29000 },
        { mois: 'Jun', transferts: 67000, retraits: 42000 },
      ])

      // Generate weekly data for bar chart
      const jours = ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim']
      const currentDate = new Date()
      const weekStart = new Date(currentDate)
      weekStart.setDate(currentDate.getDate() - currentDate.getDay() + 1)
      
      const weeklyStats = jours.map((jour, index) => {
        const dayDate = new Date(weekStart)
        dayDate.setDate(weekStart.getDate() + index)
        const dayStr = dayDate.toISOString().split('T')[0]
        const dayTransactions = transactionsData.filter(t => t.dateCreation.startsWith(dayStr))
        return {
          jour,
          montant: dayTransactions.reduce((sum, t) => sum + t.montantEnvoye, 0)
        }
      })
      setWeeklyData(weeklyStats.some(d => d.montant > 0) ? weeklyStats : [
        { jour: 'Lun', montant: 12500 },
        { jour: 'Mar', montant: 18200 },
        { jour: 'Mer', montant: 15800 },
        { jour: 'Jeu', montant: 21000 },
        { jour: 'Ven', montant: 19500 },
        { jour: 'Sam', montant: 8900 },
        { jour: 'Dim', montant: 5200 },
      ])
    } catch (err) {
      console.error('Error fetching dashboard data:', err)
      setError('Erreur lors du chargement des donnees. Veuillez reessayer.')
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchDashboardData()
  }, [fetchDashboardData])

  const getClientNomComplet = (clientId: string) => {
    const client = clients.find(c => c.id === clientId)
    return client ? `${client.prenom} ${client.nom}` : 'Client inconnu'
  }

  const statsCards = stats ? [
    {
      title: 'Total Transactions',
      value: stats.totalTransactions.toString(),
      description: `${stats.transactionsAujourdHui} aujourd'hui`,
      icon: ArrowLeftRight,
      iconColor: 'text-[oklch(0.55_0.14_55)]',
      bgColor: 'bg-[oklch(0.55_0.14_55/0.1)]',
      trend: '+12%',
      trendUp: true,
    },
    {
      title: 'Montant Transfere',
      value: formatMontant(stats.montantTotalTransfere, '1'),
      description: `${stats.totalTransferts} transferts`,
      icon: TrendingUp,
      iconColor: 'text-[oklch(0.65_0.12_45)]',
      bgColor: 'bg-[oklch(0.65_0.12_45/0.1)]',
      trend: '+8%',
      trendUp: true,
    },
    {
      title: 'Montant Retire',
      value: formatMontant(stats.montantTotalRetire, '1'),
      description: `${stats.totalRetraits} retraits`,
      icon: Banknote,
      iconColor: 'text-[oklch(0.55_0.15_35)]',
      bgColor: 'bg-[oklch(0.55_0.15_35/0.1)]',
      trend: '-3%',
      trendUp: false,
    },
    {
      title: 'En Attente',
      value: stats.transactionsEnAttente.toString(),
      description: 'Transactions a traiter',
      icon: Clock,
      iconColor: 'text-[oklch(0.7_0.1_85)]',
      bgColor: 'bg-[oklch(0.7_0.1_85/0.1)]',
      trend: null,
      trendUp: null,
    },
  ] : []

  if (error) {
    return (
      <div className="space-y-6">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
        <Button onClick={fetchDashboardData} className="gap-2">
          <RefreshCw className="h-4 w-4" />
          Reessayer
        </Button>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-foreground">Tableau de bord</h1>
          <p className="text-muted-foreground">
            Bienvenue, Jean Dupont. Voici un apercu de votre activite.
          </p>
        </div>
        <div className="flex gap-3">
          <Button variant="outline" asChild>
            <Link href="/transactions">
              <ArrowLeftRight className="mr-2 h-4 w-4" />
              Voir les transactions
            </Link>
          </Button>
          <Button asChild>
            <Link href="/transactions/nouveau">
              <TrendingUp className="mr-2 h-4 w-4" />
              Nouveau transfert
            </Link>
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {isLoading ? (
          <>
            {[1, 2, 3, 4].map((i) => (
              <Card key={i}>
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <Skeleton className="h-4 w-24" />
                  <Skeleton className="h-4 w-4" />
                </CardHeader>
                <CardContent>
                  <Skeleton className="h-8 w-32 mb-2" />
                  <Skeleton className="h-3 w-20" />
                </CardContent>
              </Card>
            ))}
          </>
        ) : (
          statsCards.map((stat) => (
            <Card key={stat.title} className="overflow-hidden">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  {stat.title}
                </CardTitle>
                <div className={`p-2 rounded-lg ${stat.bgColor}`}>
                  <stat.icon className={`h-4 w-4 ${stat.iconColor}`} />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stat.value}</div>
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-xs text-muted-foreground">{stat.description}</span>
                  {stat.trend && (
                    <span className={`flex items-center text-xs font-medium ${stat.trendUp ? 'text-[oklch(0.6_0.18_145)]' : 'text-[oklch(0.55_0.15_35)]'}`}>
                      {stat.trendUp ? <ArrowUpRight className="h-3 w-3" /> : <ArrowDownRight className="h-3 w-3" />}
                      {stat.trend}
                    </span>
                  )}
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {/* Charts Section */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Line Chart - Evolution mensuelle */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-[oklch(0.65_0.12_45)]" />
              Evolution Mensuelle
            </CardTitle>
            <CardDescription>Transferts et retraits par mois</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={monthlyData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="oklch(0.88 0.02 75)" />
                  <XAxis 
                    dataKey="mois" 
                    stroke="oklch(0.5 0.03 60)" 
                    fontSize={12}
                    tickLine={false}
                  />
                  <YAxis 
                    stroke="oklch(0.5 0.03 60)" 
                    fontSize={12}
                    tickLine={false}
                    tickFormatter={(value) => `${(value / 1000).toFixed(0)}k`}
                  />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: 'oklch(1 0 0)', 
                      border: '1px solid oklch(0.88 0.02 75)',
                      borderRadius: '8px',
                      boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'
                    }}
                    formatter={(value: number) => [`${value.toLocaleString('fr-FR')} FCFA`, '']}
                  />
                  <Legend />
                  <Line 
                    type="monotone" 
                    dataKey="transferts" 
                    stroke="oklch(0.55 0.14 55)" 
                    strokeWidth={3}
                    dot={{ fill: 'oklch(0.55 0.14 55)', strokeWidth: 2, r: 4 }}
                    activeDot={{ r: 6, fill: 'oklch(0.45 0.12 55)' }}
                    name="Transferts"
                  />
                  <Line 
                    type="monotone" 
                    dataKey="retraits" 
                    stroke="oklch(0.65 0.12 45)" 
                    strokeWidth={3}
                    dot={{ fill: 'oklch(0.65 0.12 45)', strokeWidth: 2, r: 4 }}
                    activeDot={{ r: 6, fill: 'oklch(0.55 0.15 35)' }}
                    name="Retraits"
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Bar Chart - Activite hebdomadaire */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Banknote className="h-5 w-5 text-[oklch(0.55_0.14_55)]" />
              Activite Hebdomadaire
            </CardTitle>
            <CardDescription>Volume des transactions par jour</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={weeklyData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="oklch(0.88 0.02 75)" vertical={false} />
                  <XAxis 
                    dataKey="jour" 
                    stroke="oklch(0.5 0.03 60)" 
                    fontSize={12}
                    tickLine={false}
                    axisLine={false}
                  />
                  <YAxis 
                    stroke="oklch(0.5 0.03 60)" 
                    fontSize={12}
                    tickLine={false}
                    axisLine={false}
                    tickFormatter={(value) => `${(value / 1000).toFixed(0)}k`}
                  />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: 'oklch(1 0 0)', 
                      border: '1px solid oklch(0.88 0.02 75)',
                      borderRadius: '8px',
                      boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'
                    }}
                    formatter={(value: number) => [`${value.toLocaleString('fr-FR')} FCFA`, 'Montant']}
                    cursor={{ fill: 'oklch(0.94 0.02 75)' }}
                  />
                  <Bar 
                    dataKey="montant" 
                    fill="oklch(0.55 0.14 55)" 
                    radius={[6, 6, 0, 0]}
                    name="Montant"
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Transactions */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Transactions Recentes</CardTitle>
            <CardDescription>Les 5 dernieres transactions effectuees</CardDescription>
          </div>
          <Button variant="ghost" size="sm" asChild>
            <Link href="/transactions">Voir tout</Link>
          </Button>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Numero</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Emetteur</TableHead>
                <TableHead>Montant</TableHead>
                <TableHead>Statut</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {recentTransactions.map((transaction) => (
                <TableRow key={transaction.id}>
                  <TableCell className="font-medium">{transaction.numero}</TableCell>
                  <TableCell>
                    <Badge variant="outline" className="capitalize">
                      {transaction.type}
                    </Badge>
                  </TableCell>
                  <TableCell>{getClientNomComplet(transaction.clientEmetteurId)}</TableCell>
                  <TableCell>{formatMontant(transaction.montantEnvoye, transaction.deviseEnvoiId)}</TableCell>
                  <TableCell>
                    <Badge variant={getStatutBadgeVariant(transaction.statut)}>
                      {getStatutLabel(transaction.statut)}
                    </Badge>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Activity Summary */}
      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Activite par Pays</CardTitle>
            <CardDescription>Repartition des transferts par destination</CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="space-y-4">
                {[1, 2, 3, 4].map((i) => (
                  <div key={i} className="flex items-center gap-4">
                    <div className="flex-1 space-y-2">
                      <Skeleton className="h-4 w-full" />
                      <Skeleton className="h-2 w-full" />
                    </div>
                    <Skeleton className="h-4 w-10" />
                  </div>
                ))}
              </div>
            ) : (
              <div className="space-y-4">
                {paysActivity.length > 0 ? paysActivity.map((item) => (
                  <div key={item.pays} className="flex items-center gap-4">
                    <div className="flex-1 space-y-1">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium">{item.pays}</span>
                        <span className="text-sm text-muted-foreground">{item.montant}</span>
                      </div>
                      <div className="h-2 rounded-full bg-[oklch(0.94_0.02_75)] overflow-hidden">
                        <div 
                          className="h-full bg-[oklch(0.55_0.14_55)] rounded-full transition-all"
                          style={{ width: `${item.pourcentage}%` }}
                        />
                      </div>
                    </div>
                    <span className="text-sm font-medium w-10 text-right">{item.pourcentage}%</span>
                  </div>
                )) : (
                  <p className="text-sm text-muted-foreground text-center py-4">
                    Aucune donnee disponible
                  </p>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Agents les Plus Actifs</CardTitle>
            <CardDescription>Performance des agents ce mois</CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="space-y-4">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="flex items-center gap-4">
                    <Skeleton className="h-10 w-10 rounded-full" />
                    <div className="flex-1 space-y-2">
                      <Skeleton className="h-4 w-32" />
                      <Skeleton className="h-3 w-24" />
                    </div>
                    <Skeleton className="h-4 w-24" />
                  </div>
                ))}
              </div>
            ) : (
              <div className="space-y-4">
                {topAgents.length > 0 ? topAgents.map((agent, index) => (
                  <div key={agent.nom} className="flex items-center gap-4">
                    <div className={`flex h-10 w-10 items-center justify-center rounded-full text-sm font-semibold ${
                      index === 0 ? 'bg-[oklch(0.55_0.14_55)] text-white' : 
                      index === 1 ? 'bg-[oklch(0.65_0.12_45)] text-white' : 
                      'bg-[oklch(0.94_0.02_75)] text-[oklch(0.5_0.03_60)]'
                    }`}>
                      {index + 1}
                    </div>
                    <div className="flex-1">
                      <div className="font-medium">{agent.nom}</div>
                      <div className="text-sm text-muted-foreground">
                        {agent.transactions} transactions
                      </div>
                    </div>
                    <div className="text-sm font-medium">{agent.montant}</div>
                  </div>
                )) : (
                  <p className="text-sm text-muted-foreground text-center py-4">
                    Aucune donnee disponible
                  </p>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
