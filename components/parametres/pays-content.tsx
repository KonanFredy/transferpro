"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Plus,
  Search,
  MoreHorizontal,
  Pencil,
  Trash2,
  Globe,
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
import { paysAPI, devisesAPI } from "@/lib/api";
import type { Pays, Devise } from "@/lib/types";
import { useToast } from "@/hooks/use-toast";
import {
  TablePagination,
  usePagination,
} from "@/components/ui/table-pagination";

const mockDevises = [
  { id: "1", nom: "Euro", codeISO: "EUR" },
  { id: "2", nom: "Dollar Américain", codeISO: "USD" },
  { id: "3", nom: "Yen Japonais", codeISO: "JPY" },
];

// const getDevise = (deviseId: string): Devise | undefined => {
//   return mockDevises.find((devise) => devise.id === deviseId);
// };

export function PaysContent() {
  const { toast } = useToast();
  const [pays, setPays] = useState<Pays[]>([]);
  const [devises, setDevises] = useState<Devise[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [selectedPays, setSelectedPays] = useState<Pays | null>(null);
  const [formData, setFormData] = useState({
    nom: "",
    code: "",
    deviseId: "",
  });

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const [paysData, devisesData] = await Promise.all([
        paysAPI.getAll(),
        devisesAPI.getAll(),
      ]);
      setPays(paysData);
      setDevises(devisesData);
    } catch (err) {
      console.error("Error fetching pays:", err);
      setError("Erreur lors du chargement des pays. Veuillez reessayer.");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const getDevise = (deviseId: string) => {
    return devises.find((d) => d.id === deviseId);
  };

  const filteredPays = pays.filter(
    (p) =>
      p.nom.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.code.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  const {
    currentPage,
    totalPages,
    totalItems,
    itemsPerPage,
    paginatedItems: paginatedPays,
    handlePageChange,
    handleItemsPerPageChange,
  } = usePagination(filteredPays, 10);

  const handleCreatePays = async () => {
    setIsSaving(true);
    try {
      const newPays = await paysAPI.create(formData);
      setPays([newPays, ...pays]);
      setIsCreateDialogOpen(false);
      resetForm();
      toast({ title: "Succes", description: "Pays cree avec succes" });
    } catch (err) {
      console.error("Error creating pays:", err);
      toast({
        title: "Erreur",
        description: "Erreur lors de la creation du pays",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleUpdatePays = async () => {
    if (!selectedPays) return;
    setIsSaving(true);
    try {
      const updatedPays = await paysAPI.update(selectedPays.id, formData);
      setPays(pays.map((p) => (p.id === selectedPays.id ? updatedPays : p)));
      setIsEditDialogOpen(false);
      setSelectedPays(null);
      resetForm();
      toast({ title: "Succes", description: "Pays mis a jour avec succes" });
    } catch (err) {
      console.error("Error updating pays:", err);
      toast({
        title: "Erreur",
        description: "Erreur lors de la mise a jour du pays",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleToggleStatus = async (paysItem: Pays) => {
    try {
      await paysAPI.toggleActive(paysItem.id);
      setPays(
        pays.map((p) => (p.id === paysItem.id ? { ...p, actif: !p.actif } : p)),
      );
      toast({
        title: "Succes",
        description: `Pays ${paysItem.actif ? "desactive" : "active"} avec succes`,
      });
    } catch (err) {
      console.error("Error toggling pays status:", err);
      toast({
        title: "Erreur",
        description: "Erreur lors de la modification du statut",
        variant: "destructive",
      });
    }
  };

  const handleEditPays = (paysItem: Pays) => {
    setSelectedPays(paysItem);
    setFormData({
      nom: paysItem.nom,
      code: paysItem.code,
      deviseId: paysItem.deviseId,
    });
    setIsEditDialogOpen(true);
  };

  const resetForm = () => {
    setFormData({
      nom: "",
      code: "",
      deviseId: "",
    });
  };

  const activePays = pays.filter((p) => p.actif).length;

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
            Gestion des Pays
          </h1>
          <p className="text-muted-foreground">
            {activePays} pays actifs sur {pays.length} au total
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
            Nouveau Pays
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
          <CardTitle>Liste des Pays</CardTitle>
          <CardDescription>
            Gerez les pays disponibles pour les transactions
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Pays</TableHead>
                <TableHead>Code</TableHead>
                <TableHead>Devise</TableHead>
                <TableHead>Statut</TableHead>
                <TableHead className="w-[80px]">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <TableRow key={i}>
                    <TableCell>
                      <Skeleton className="h-8 w-32" />
                    </TableCell>
                    <TableCell>
                      <Skeleton className="h-6 w-12" />
                    </TableCell>
                    <TableCell>
                      <Skeleton className="h-4 w-24" />
                    </TableCell>
                    <TableCell>
                      <Skeleton className="h-6 w-16" />
                    </TableCell>
                    <TableCell>
                      <Skeleton className="h-8 w-8" />
                    </TableCell>
                  </TableRow>
                ))
              ) : paginatedPays.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={5}
                    className="text-center text-muted-foreground py-8"
                  >
                    Aucun pays trouve
                  </TableCell>
                </TableRow>
              ) : (
                paginatedPays.map((paysItem) => {
                  const devise = getDevise(paysItem.deviseId);
                  return (
                    <TableRow key={paysItem.id}>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-muted">
                            <Globe className="h-4 w-4 text-muted-foreground" />
                          </div>
                          <span className="font-medium">{paysItem.nom}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">{paysItem.code}</Badge>
                      </TableCell>
                      <TableCell>
                        {devise ? `${devise.nom} (${devise.codeISO})` : "-"}
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant={paysItem.actif ? "default" : "secondary"}
                        >
                          {paysItem.actif ? "Actif" : "Inactif"}
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
                            <DropdownMenuItem
                              onClick={() => handleEditPays(paysItem)}
                            >
                              <Pencil className="mr-2 h-4 w-4" />
                              Modifier
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              onClick={() => handleToggleStatus(paysItem)}
                            >
                              <Trash2 className="mr-2 h-4 w-4" />
                              {paysItem.actif ? "Desactiver" : "Activer"}
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  );
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
            <DialogTitle>Nouveau Pays</DialogTitle>
            <DialogDescription>
              Ajoutez un nouveau pays pour les transactions
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="nom">Nom du pays</Label>
              <Input
                id="nom"
                value={formData.nom}
                onChange={(e) =>
                  setFormData({ ...formData, nom: e.target.value })
                }
                placeholder="Ex: France"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="code">Code ISO</Label>
              <Input
                id="code"
                value={formData.code}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    code: e.target.value.toUpperCase(),
                  })
                }
                placeholder="Ex: FR"
                maxLength={2}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="devise">Devise</Label>
              <Select
                value={formData.deviseId}
                onValueChange={(value) =>
                  setFormData({ ...formData, deviseId: value })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selectionnez une devise" />
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
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsCreateDialogOpen(false)}
            >
              Annuler
            </Button>
            <Button onClick={handleCreatePays} disabled={isSaving}>
              {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {isSaving ? "Creation..." : "Creer"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Modifier le Pays</DialogTitle>
            <DialogDescription>
              Modifiez les informations du pays
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="edit-nom">Nom du pays</Label>
              <Input
                id="edit-nom"
                value={formData.nom}
                onChange={(e) =>
                  setFormData({ ...formData, nom: e.target.value })
                }
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-code">Code ISO</Label>
              <Input
                id="edit-code"
                value={formData.code}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    code: e.target.value.toUpperCase(),
                  })
                }
                maxLength={2}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-devise">Devise</Label>
              <Select
                value={formData.deviseId}
                onValueChange={(value) =>
                  setFormData({ ...formData, deviseId: value })
                }
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
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsEditDialogOpen(false)}
            >
              Annuler
            </Button>
            <Button onClick={handleUpdatePays} disabled={isSaving}>
              {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {isSaving ? "Enregistrement..." : "Enregistrer"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
