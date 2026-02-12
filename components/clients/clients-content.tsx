"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Plus,
  Search,
  Filter,
  MoreHorizontal,
  Pencil,
  Eye,
  Trash2,
  Phone,
  MapPin,
  CreditCard,
  RefreshCw,
  AlertCircle,
  Loader2,
} from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { clientsAPI, paysAPI } from "@/lib/api";
import { getPaysNom } from "@/lib/mock-data";
import type { Client, Pays } from "@/lib/types";
import { useToast } from "@/hooks/use-toast";
import {
  TablePagination,
  usePagination,
} from "@/components/ui/table-pagination";
import { notifyClientCreated } from "@/lib/notification-service";
import { useNotifications } from "@/lib/notification-context";

export function ClientsContent() {
  const { toast } = useToast();
  const { refreshNotifications } = useNotifications();
  const [clients, setClients] = useState<Client[]>([]);
  const [pays, setPays] = useState<Pays[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const [formData, setFormData] = useState({
    nom: "",
    prenom: "",
    telephone: "",
    email: "",
    adresse: "",
    pieceIdentite: "cni" as "cni" | "passeport" | "permis",
    numeroPiece: "",
    paysId: "",
  });

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const [clientsData, paysData] = await Promise.all([
        clientsAPI.getAll(),
        paysAPI.getAll(),
      ]);
      setClients(clientsData);
      setPays(paysData);
    } catch (err) {
      console.error("Error fetching clients:", err);
      setError("Erreur lors du chargement des clients. Veuillez rééssayer.");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const getPaysNomLocal = (paysId: string) => {
    const p = pays.find((p) => p.id === paysId);
    return p ? p.nom : getPaysNom(paysId);
  };

  const filteredClients = clients.filter(
    (client) =>
      (client.nom || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
      (client.prenom || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
      (client.telephone || "").includes(searchQuery) ||
      (client.numeroPiece || "")
        .toLowerCase()
        .includes(searchQuery.toLowerCase()),
  );

  const {
    currentPage,
    totalPages,
    totalItems,
    itemsPerPage,
    paginatedItems: paginatedClients,
    handlePageChange,
    handleItemsPerPageChange,
  } = usePagination(filteredClients, 10);

  const handleCreateClient = async () => {
    setIsSaving(true);
    try {
      const newClient = await clientsAPI.create(formData);
      setClients([newClient, ...clients]);
      setIsCreateDialogOpen(false);
      resetForm();
      toast({ title: "Succes", description: "Client cree avec succes" });

      // Envoyer notification par email et SMS
      await notifyClientCreated({
        nom: newClient.nom,
        prenom: newClient.prenom,
        telephone: newClient.telephone,
      });

      // Rafraichir les notifications pour mettre a jour le dropdown
      refreshNotifications();
      toast({
        title: "Notification",
        description: "Notification envoyée au client par email et SMS",
      });
    } catch (err) {
      console.error("Error creating client:", err);
      toast({
        title: "Erreur",
        description: "Erreur lors de la création du client",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleUpdateClient = async () => {
    if (!selectedClient) return;
    setIsSaving(true);
    try {
      const updatedClient = await clientsAPI.update(
        selectedClient.id,
        formData,
      );
      setClients(
        clients.map((c) => (c.id === selectedClient.id ? updatedClient : c)),
      );
      setIsEditDialogOpen(false);
      setSelectedClient(null);
      resetForm();
      toast({ title: "Succes", description: "Client mis à jour avec succès" });
    } catch (err) {
      console.error("Error updating client:", err);
      toast({
        title: "Erreur",
        description: "Erreur lors de la mise à jour du client",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteClient = async (client: Client) => {
    try {
      await clientsAPI.toggleActive(client.id);
      setClients(
        clients.map((c) =>
          c.id === client.id ? { ...c, actif: !c.actif } : c,
        ),
      );
      toast({
        title: "Succes",
        description: client.actif
          ? "Client desactivé avec succès"
          : "Client activé avec succès",
      });
    } catch (err) {
      console.error("Error toggling client status:", err);
      toast({
        title: "Erreur",
        description: "Erreur lors de la modification du statut",
        variant: "destructive",
      });
    }
  };

  const handleViewClient = (client: Client) => {
    setSelectedClient(client);
    setIsViewDialogOpen(true);
  };

  const handleEditClient = (client: Client) => {
    setSelectedClient(client);
    setFormData({
      nom: client.nom,
      prenom: client.prenom,
      telephone: client.telephone,
      email: client.email || "",
      adresse: client.adresse || "",
      pieceIdentite: (client.pieceIdentite?.toLowerCase() || "cni") as
        | "cni"
        | "passeport"
        | "permis",
      numeroPiece: client.numeroPiece || "",
      paysId: client.paysId,
    });
    setIsEditDialogOpen(true);
  };

  const resetForm = () => {
    setFormData({
      nom: "",
      prenom: "",
      telephone: "",
      email: "",
      adresse: "",
      pieceIdentite: "cni",
      numeroPiece: "",
      paysId: "",
    });
  };

  const activeClients = clients.filter((c) => c.actif).length;

  return (
    <div className="space-y-6">
      {/* Error State */}
      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription className="flex items-center justify-between">
            {error}
            <Button
              variant="outline"
              size="sm"
              onClick={fetchData}
              className="ml-4 gap-2 bg-transparent"
            >
              <RefreshCw className="h-4 w-4" />
              Reessayer
            </Button>
          </AlertDescription>
        </Alert>
      )}

      {/* Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-foreground">
            Gestion des Clients
          </h1>
          <p className="text-muted-foreground">
            {activeClients} clients actifs sur {clients.length} au total
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={fetchData}
            disabled={isLoading}
            className="gap-2 bg-transparent"
          >
            <RefreshCw
              className={`h-4 w-4 ${isLoading ? "animate-spin" : ""}`}
            />
            Actualiser
          </Button>
          <Button onClick={() => setIsCreateDialogOpen(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Nouveau Client
          </Button>
        </div>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col gap-4 md:flex-row md:items-center">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Rechercher par nom, téléphone ou numéro d'identité..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>
            <Button variant="outline">
              <Filter className="mr-2 h-4 w-4" />
              Filtres
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Clients Table */}
      <Card>
        <CardHeader>
          <CardTitle>Liste des Clients</CardTitle>
          <CardDescription>
            Gerez les informations de vos clients
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nom Complet</TableHead>
                <TableHead>Telephone</TableHead>
                <TableHead>Pays</TableHead>
                <TableHead>Piece d'identite</TableHead>
                <TableHead>Statut</TableHead>
                <TableHead>Date Creation</TableHead>
                <TableHead className="w-[80px]">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <TableRow key={i}>
                    <TableCell>
                      <Skeleton className="h-4 w-32" />
                    </TableCell>
                    <TableCell>
                      <Skeleton className="h-4 w-28" />
                    </TableCell>
                    <TableCell>
                      <Skeleton className="h-4 w-20" />
                    </TableCell>
                    <TableCell>
                      <Skeleton className="h-4 w-36" />
                    </TableCell>
                    <TableCell>
                      <Skeleton className="h-6 w-16" />
                    </TableCell>
                    <TableCell>
                      <Skeleton className="h-4 w-24" />
                    </TableCell>
                    <TableCell>
                      <Skeleton className="h-8 w-8" />
                    </TableCell>
                  </TableRow>
                ))
              ) : paginatedClients.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={7}
                    className="text-center text-muted-foreground py-8"
                  >
                    Aucun client trouve
                  </TableCell>
                </TableRow>
              ) : (
                paginatedClients.map((client) => (
                  <TableRow key={client.id}>
                    <TableCell className="font-medium">
                      {client.prenom} {client.nom}
                    </TableCell>
                    <TableCell>{client.telephone}</TableCell>
                    <TableCell>
                      {client.paysNom || getPaysNomLocal(client.paysId)}
                    </TableCell>
                    <TableCell>
                      <span className="text-muted-foreground">
                        {client.pieceIdentite || "N/A"}:
                      </span>{" "}
                      {client.numeroPiece || "N/A"}
                    </TableCell>
                    <TableCell>
                      <Badge variant={client.actif ? "default" : "secondary"}>
                        {client.actif ? "Actif" : "Inactif"}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {client.dateCreation
                        ? new Date(client.dateCreation).toLocaleDateString(
                            "fr-FR",
                          )
                        : "N/A"}
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
                          <DropdownMenuItem
                            onClick={() => handleViewClient(client)}
                          >
                            <Eye className="mr-2 h-4 w-4" />
                            Voir details
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => handleEditClient(client)}
                          >
                            <Pencil className="mr-2 h-4 w-4" />
                            Modifier
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            onClick={() => handleDeleteClient(client)}
                            className={
                              client.actif ? "text-destructive" : "text-success"
                            }
                          >
                            <Trash2 className="mr-2 h-4 w-4" />
                            {client.actif ? "Desactiver" : "Activer"}
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
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Nouveau Client</DialogTitle>
            <DialogDescription>
              Remplissez les informations pour creer un nouveau client
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="prenom">Prénom</Label>
                <Input
                  id="prenom"
                  value={formData.prenom}
                  onChange={(e) =>
                    setFormData({ ...formData, prenom: e.target.value })
                  }
                  placeholder="Entrez le prenom"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="nom">Nom</Label>
                <Input
                  id="nom"
                  value={formData.nom}
                  onChange={(e) =>
                    setFormData({ ...formData, nom: e.target.value })
                  }
                  placeholder="Entrez le nom"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="telephone">Téléphone</Label>
                <Input
                  id="telephone"
                  value={formData.telephone}
                  onChange={(e) =>
                    setFormData({ ...formData, telephone: e.target.value })
                  }
                  placeholder="+221 77 123 45 67"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="paysId">Pays de Résidence</Label>
                <Select
                  value={formData.paysId}
                  onValueChange={(value) =>
                    setFormData({ ...formData, paysId: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selectionnez un pays" />
                  </SelectTrigger>
                  <SelectContent>
                    {pays
                      .filter((p) => p.actif)
                      .map((p) => (
                        <SelectItem key={p.id} value={p.id}>
                          {p.nom}
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) =>
                    setFormData({ ...formData, email: e.target.value })
                  }
                  placeholder="email@exemple.com"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="adresse">Adresse</Label>
                <Input
                  id="adresse"
                  value={formData.adresse}
                  onChange={(e) =>
                    setFormData({ ...formData, adresse: e.target.value })
                  }
                  placeholder="Entrez l'adresse complète"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="pieceIdentite">Type de Piece</Label>
                <Select
                  value={formData.pieceIdentite}
                  onValueChange={(value: "cni" | "passeport" | "permis") =>
                    setFormData({ ...formData, pieceIdentite: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="cni">
                      Carte Nationale d'Identite
                    </SelectItem>
                    <SelectItem value="passeport">Passeport</SelectItem>
                    <SelectItem value="permis">Permis de Conduire</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="numeroPiece">Numero de Piece</Label>
                <Input
                  id="numeroPiece"
                  value={formData.numeroPiece}
                  onChange={(e) =>
                    setFormData({ ...formData, numeroPiece: e.target.value })
                  }
                  placeholder="Entrez le numéro"
                />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsCreateDialogOpen(false)}
            >
              Annuler
            </Button>
            <Button onClick={handleCreateClient} disabled={isSaving}>
              {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {isSaving ? "Création..." : "Créer le Client"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Modifier le Client</DialogTitle>
            <DialogDescription>
              Modifiez les informations du client
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="edit-prenom">Prenom</Label>
                <Input
                  id="edit-prenom"
                  value={formData.prenom}
                  onChange={(e) =>
                    setFormData({ ...formData, prenom: e.target.value })
                  }
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-nom">Nom</Label>
                <Input
                  id="edit-nom"
                  value={formData.nom}
                  onChange={(e) =>
                    setFormData({ ...formData, nom: e.target.value })
                  }
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="edit-telephone">Telephone</Label>
                <Input
                  id="edit-telephone"
                  value={formData.telephone}
                  onChange={(e) =>
                    setFormData({ ...formData, telephone: e.target.value })
                  }
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-paysResidence">Pays de Résidence</Label>
                <Select
                  value={formData.paysId}
                  onValueChange={(value) =>
                    setFormData({ ...formData, paysId: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {pays
                      .filter((p) => p.actif)
                      .map((p) => (
                        <SelectItem key={p.id} value={p.id}>
                          {p.nom}
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-adresse">Adresse</Label>
              <Input
                id="edit-adresse"
                value={formData.adresse}
                onChange={(e) =>
                  setFormData({ ...formData, adresse: e.target.value })
                }
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="edit-typeIdentite">Type de Piece</Label>
                <Select
                  value={formData.pieceIdentite}
                  onValueChange={(value: "cni" | "passeport" | "permis") =>
                    setFormData({ ...formData, pieceIdentite: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="cni">
                      Carte Nationale d'Identite
                    </SelectItem>
                    <SelectItem value="passeport">Passeport</SelectItem>
                    <SelectItem value="permis">Permis de Conduire</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-numeroIdentite">Numero de Piece</Label>
                <Input
                  id="edit-numeroIdentite"
                  value={formData.numeroPiece}
                  onChange={(e) =>
                    setFormData({ ...formData, numeroPiece: e.target.value })
                  }
                />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsEditDialogOpen(false)}
            >
              Annuler
            </Button>
            <Button onClick={handleUpdateClient} disabled={isSaving}>
              {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {isSaving ? "Enregistrement..." : "Enregistrer"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* View Dialog */}
      <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Details du Client</DialogTitle>
            <DialogDescription>
              Informations complètes du client
            </DialogDescription>
          </DialogHeader>
          {selectedClient && (
            <div className="space-y-6 py-4">
              <div className="flex items-center gap-4">
                <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary text-primary-foreground text-xl font-semibold">
                  {selectedClient.prenom[0]}
                  {selectedClient.nom[0]}
                </div>
                <div>
                  <h3 className="text-lg font-semibold">
                    {selectedClient.prenom} {selectedClient.nom}
                  </h3>
                  <Badge
                    variant={selectedClient.actif ? "default" : "secondary"}
                  >
                    {selectedClient.actif ? "Actif" : "Inactif"}
                  </Badge>
                </div>
              </div>

              <div className="grid gap-4">
                <div className="flex items-center gap-3 text-sm">
                  <Phone className="h-4 w-4 text-muted-foreground" />
                  <span>{selectedClient.telephone}</span>
                </div>
                <div className="flex items-center gap-3 text-sm">
                  <MapPin className="h-4 w-4 text-muted-foreground" />
                  <span>{selectedClient.adresse}</span>
                </div>
                <div className="flex items-center gap-3 text-sm">
                  <CreditCard className="h-4 w-4 text-muted-foreground" />
                  <span>
                    {selectedClient.pieceIdentite}: {selectedClient.numeroPiece}
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 pt-4 border-t">
                <div>
                  <span className="text-sm text-muted-foreground">
                    Pays de residence
                  </span>
                  <p className="font-medium">
                    {getPaysNom(selectedClient.paysId)}
                  </p>
                </div>
                <div>
                  <span className="text-sm text-muted-foreground">
                    Date de creation
                  </span>
                  <p className="font-medium">
                    {new Date(selectedClient.dateCreation).toLocaleDateString(
                      "fr-FR",
                    )}
                  </p>
                </div>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsViewDialogOpen(false)}
            >
              Fermer
            </Button>
            <Button
              onClick={() => {
                setIsViewDialogOpen(false);
                if (selectedClient) handleEditClient(selectedClient);
              }}
            >
              Modifier
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
