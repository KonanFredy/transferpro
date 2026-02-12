"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
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
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import {
  TablePagination,
  usePagination,
} from "@/components/ui/table-pagination";
import { useAuth } from "@/lib/auth-context";
import { fraisAPI } from "@/lib/api";
import { FraisSettings, FraisRule } from "@/lib/types";
import {
  Percent,
  Plus,
  Pencil,
  Trash2,
  Save,
  DollarSign,
  Calculator,
  AlertTriangle,
  RefreshCw,
  AlertCircle,
  Loader2,
} from "lucide-react";

interface FeeTier {
  id: string;
  montantMin: number;
  montantMax: number;
  frais: number;
  type: "pourcentage" | "fixe";
}

// Export helper for other components
export async function calculateFees(
  montant: number,
  applyFees: boolean = true,
): Promise<number> {
  try {
    return await fraisAPI.calculate(montant, applyFees);
  } catch (error) {
    console.error("Error calculating fees:", error);
    return 0;
  }
}

const defaultSettings: FraisSettings = {
  fraisActifs: true,
  fraisMinimum: 500,
  fraisMaximum: 50000,
  exonerePremierTransfert: false,
  reglesActives: undefined,
};

const initialFeeTiers: FeeTier[] = [
  { id: "1", montantMin: 0, montantMax: 1000, frais: 2, type: "pourcentage" },
  { id: "2", montantMin: 1001, montantMax: 5000, frais: 5, type: "fixe" },
  {
    id: "3",
    montantMin: 5001,
    montantMax: 999999999,
    frais: 10,
    type: "pourcentage",
  },
];

// Declare the updateFeeSettings function
const updateFeeSettings = (settings: FraisSettings) => {
  // Implementation of updateFeeSettings goes here
};

export function FraisContent() {
  const { toast } = useToast();
  const { user } = useAuth();
  const isAdmin = user?.role === "admin";

  const [settings, setSettings] = useState<FraisSettings>(defaultSettings);
  const [feeRules, setFeeRules] = useState<FraisRule[]>([]);
  const [feeTiers, setFeeTiers] = useState<FeeTier[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeRuleId, setActiveRuleId] = useState<string>("");
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedRule, setSelectedRule] = useState<FraisRule | null>(null);
  const [formData, setFormData] = useState({
    nom: "",
    type: "pourcentage" as "pourcentage" | "fixe" | "palier",
    valeur: "",
    montantMin: "",
    montantMax: "",
  });

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const [rulesData, settingsData] = await Promise.all([
        fraisAPI.getRules(),
        fraisAPI.getSettings(),
      ]);
      setFeeRules(rulesData);
      setSettings(settingsData);

      // Extract all paliers from rules of type 'palier'
      const allPaliers: FeeTier[] = [];
      rulesData.forEach((rule) => {
        if (rule.type === "palier" && rule.paliers) {
          rule.paliers.forEach((p) => {
            allPaliers.push({
              id: p.id,
              montantMin: p.montantMin,
              montantMax: p.montantMax,
              frais: p.frais,
              type: p.type,
            });
          });
        }
      });
      setFeeTiers(allPaliers);
    } catch (err) {
      console.error("Error fetching frais data:", err);
      setError("Erreur lors du chargement des frais. Veuillez reessayer.");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const {
    currentPage,
    totalPages,
    totalItems,
    itemsPerPage,
    paginatedItems: paginatedRules,
    handlePageChange,
    handleItemsPerPageChange,
  } = usePagination(feeRules, 5);

  const resetForm = () => {
    setFormData({
      nom: "",
      type: "pourcentage",
      valeur: "",
      montantMin: "",
      montantMax: "",
    });
  };

  const handleCreateRule = async () => {
    setIsSaving(true);
    try {
      const newRule = await fraisAPI.createRule({
        nom: formData.nom,
        type: formData.type,
        valeur: parseFloat(formData.valeur) || 0,
        montantMin: formData.montantMin
          ? parseFloat(formData.montantMin)
          : undefined,
        montantMax: formData.montantMax
          ? parseFloat(formData.montantMax)
          : undefined,
        actif: true,
      });
      setFeeRules([newRule, ...feeRules]);
      setIsCreateDialogOpen(false);
      resetForm();
      toast({
        title: "Succes",
        description: "Regle de frais creee avec succes",
      });
    } catch (err) {
      console.error("Error creating rule:", err);
      toast({
        title: "Erreur",
        description: "Erreur lors de la creation de la regle",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleEditRule = async () => {
    if (!selectedRule) return;
    setIsSaving(true);
    try {
      const updatedRule = await fraisAPI.updateRule(selectedRule.id, {
        nom: formData.nom,
        type: formData.type,
        valeur: parseFloat(formData.valeur) || 0,
        montantMin: formData.montantMin
          ? parseFloat(formData.montantMin)
          : undefined,
        montantMax: formData.montantMax
          ? parseFloat(formData.montantMax)
          : undefined,
      });
      setFeeRules(
        feeRules.map((r) => (r.id === selectedRule.id ? updatedRule : r)),
      );
      setIsEditDialogOpen(false);
      resetForm();
      toast({ title: "Succes", description: "Regle de frais mise a jour" });
    } catch (err) {
      console.error("Error updating rule:", err);
      toast({
        title: "Erreur",
        description: "Erreur lors de la mise a jour de la regle",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteRule = async () => {
    if (!selectedRule) return;
    setIsSaving(true);
    try {
      await fraisAPI.deleteRule(selectedRule.id);
      setFeeRules(feeRules.filter((r) => r.id !== selectedRule.id));
      setIsDeleteDialogOpen(false);
      setSelectedRule(null);
      toast({ title: "Succes", description: "Regle de frais supprimee" });
    } catch (err) {
      console.error("Error deleting rule:", err);
      toast({
        title: "Erreur",
        description: "Erreur lors de la suppression de la regle",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleToggleRule = async (rule: FraisRule) => {
    try {
      const updatedRule = await fraisAPI.updateRule(rule.id, {
        actif: !rule.actif,
      });
      setFeeRules(feeRules.map((r) => (r.id === rule.id ? updatedRule : r)));
      toast({
        title: "Succes",
        description: `Regle ${rule.actif ? "desactivee" : "activee"}`,
      });
    } catch (err) {
      console.error("Error toggling rule:", err);
      toast({
        title: "Erreur",
        description: "Erreur lors de la modification du statut",
        variant: "destructive",
      });
    }
  };

  const openEditDialog = (rule: FraisRule) => {
    setSelectedRule(rule);
    setFormData({
      nom: rule.nom,
      type: rule.type,
      valeur: rule.valeur.toString(),
      montantMin: rule.montantMin?.toString() || "",
      montantMax: rule.montantMax?.toString() || "",
    });
    setIsEditDialogOpen(true);
  };

  const openDeleteDialog = (rule: FraisRule) => {
    setSelectedRule(rule);
    setIsDeleteDialogOpen(true);
  };

  const handleSaveSettings = async () => {
    setIsSaving(true);
    try {
      const updatedSettings = await fraisAPI.updateSettings(settings);
      setSettings(updatedSettings);
      toast({
        title: "Succes",
        description: "Parametres de frais sauvegardes",
      });
    } catch (err) {
      console.error("Error saving settings:", err);
      toast({
        title: "Erreur",
        description: "Erreur lors de la sauvegarde des parametres",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const getTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      pourcentage: "Pourcentage",
      fixe: "Montant fixe",
      palier: "Par paliers",
    };
    return labels[type] || type;
  };

  const formatValue = (rule: FraisRule) => {
    if (rule.type === "pourcentage") {
      return `${rule.valeur}%`;
    } else if (rule.type === "fixe") {
      return `${rule.valeur.toLocaleString("fr-FR")} FCFA`;
    }
    return "Voir paliers";
  };

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

      {/* Global Settings */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                <Calculator className="h-5 w-5 text-primary" />
              </div>
              <div>
                <CardTitle className="text-lg">
                  Parametres generaux des frais
                </CardTitle>
                <CardDescription>
                  Configuration globale des frais de transaction
                </CardDescription>
              </div>
            </div>
            <Switch
              checked={settings.fraisActifs}
              onCheckedChange={(checked) =>
                setSettings((prev) => ({ ...prev, fraisActifs: checked }))
              }
            />
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-3">
            <div className="space-y-2">
              <Label>Regle de frais active</Label>
              <Select
                value={settings.reglesActives}
                onValueChange={(value) =>
                  setSettings((prev) => ({ ...prev, reglesActives: value }))
                }
                disabled={!settings.fraisActifs}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selectionnez une regle" />
                </SelectTrigger>
                <SelectContent>
                  {feeRules
                    .filter((r) => r.actif)
                    .map((rule) => (
                      <SelectItem key={rule.id} value={rule.id}>
                        {rule.nom}
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="fraisMin">Frais minimum (FCFA)</Label>
              <Input
                id="fraisMin"
                type="number"
                value={settings.fraisMinimum}
                onChange={(e) =>
                  setSettings((prev) => ({
                    ...prev,
                    fraisMinimum: parseFloat(e.target.value) || 0,
                  }))
                }
                disabled={!settings.fraisActifs}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="fraisMax">Frais maximum (FCFA)</Label>
              <Input
                id="fraisMax"
                type="number"
                value={settings.fraisMaximum}
                onChange={(e) =>
                  setSettings((prev) => ({
                    ...prev,
                    fraisMaximum: parseFloat(e.target.value) || 0,
                  }))
                }
                disabled={!settings.fraisActifs}
              />
            </div>
          </div>
          <Separator />
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Exonerer le premier transfert</Label>
              <p className="text-sm text-muted-foreground">
                Les nouveaux clients ne paient pas de frais sur leur premier
                transfert
              </p>
            </div>
            <Switch
              checked={settings.exonerePremierTransfert}
              onCheckedChange={(checked) =>
                setSettings((prev) => ({
                  ...prev,
                  exonerePremierTransfert: checked,
                }))
              }
              disabled={!settings.fraisActifs}
            />
          </div>
          <div className="flex justify-end">
            <Button
              onClick={handleSaveSettings}
              disabled={isSaving}
              className="gap-2"
            >
              {isSaving ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Save className="h-4 w-4" />
              )}
              {isSaving ? "Sauvegarde..." : "Sauvegarder"}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Fee Rules */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Regles de frais</CardTitle>
              <CardDescription>
                Definissez les differentes methodes de calcul des frais
              </CardDescription>
            </div>
            {isAdmin && (
              <Button
                onClick={() => setIsCreateDialogOpen(true)}
                className="gap-2"
              >
                <Plus className="h-4 w-4" />
                Nouvelle regle
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nom</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Valeur</TableHead>
                <TableHead>Statut</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {paginatedRules.map((rule) => (
                <TableRow key={rule.id}>
                  <TableCell className="font-medium">{rule.nom}</TableCell>
                  <TableCell>
                    <Badge variant="outline" className="gap-1">
                      {rule.type === "pourcentage" && (
                        <Percent className="h-3 w-3" />
                      )}
                      {rule.type === "fixe" && (
                        <DollarSign className="h-3 w-3" />
                      )}
                      {getTypeLabel(rule.type)}
                    </Badge>
                  </TableCell>
                  <TableCell>{formatValue(rule)}</TableCell>
                  <TableCell>
                    <Badge variant={rule.actif ? "default" : "secondary"}>
                      {rule.actif ? "Active" : "Inactive"}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Switch
                        checked={rule.actif}
                        onCheckedChange={() => handleToggleRule(rule)}
                      />
                      {isAdmin && (
                        <>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => openEditDialog(rule)}
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="text-destructive hover:text-destructive"
                            onClick={() => openDeleteDialog(rule)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </>
                      )}
                    </div>
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

      {/* Fee Tiers for "palier" type */}
      <Card>
        <CardHeader>
          <CardTitle>Paliers de frais</CardTitle>
          <CardDescription>
            Configuration des frais par tranches de montant (pour la regle "Par
            paliers")
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Montant minimum</TableHead>
                <TableHead>Montant maximum</TableHead>
                <TableHead>Frais</TableHead>
                <TableHead>Type</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {feeTiers.map((tier) => (
                <TableRow key={tier.id}>
                  <TableCell>
                    {tier.montantMin.toLocaleString("fr-FR")} FCFA
                  </TableCell>
                  <TableCell>
                    {tier.montantMax > 999999998
                      ? "Illimite"
                      : `${tier.montantMax.toLocaleString("fr-FR")} FCFA`}
                  </TableCell>
                  <TableCell>
                    {tier.type === "pourcentage"
                      ? `${tier.frais}%`
                      : `${tier.frais.toLocaleString("fr-FR")} FCFA`}
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline">
                      {tier.type === "pourcentage" ? "Pourcentage" : "Fixe"}
                    </Badge>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Create Dialog */}
      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Nouvelle regle de frais</DialogTitle>
            <DialogDescription>
              Creez une nouvelle methode de calcul des frais de transaction
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="nom">Nom de la regle</Label>
              <Input
                id="nom"
                value={formData.nom}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, nom: e.target.value }))
                }
                placeholder="Ex: Frais standard"
              />
            </div>
            <div className="space-y-2">
              <Label>Type de calcul</Label>
              <Select
                value={formData.type}
                onValueChange={(value: "pourcentage" | "fixe" | "palier") =>
                  setFormData((prev) => ({ ...prev, type: value }))
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="pourcentage">Pourcentage</SelectItem>
                  <SelectItem value="fixe">Montant fixe</SelectItem>
                  <SelectItem value="palier">Par paliers</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {formData.type !== "palier" && (
              <div className="space-y-2">
                <Label htmlFor="valeur">
                  {formData.type === "pourcentage"
                    ? "Pourcentage (%)"
                    : "Montant (FCFA)"}
                </Label>
                <Input
                  id="valeur"
                  type="number"
                  value={formData.valeur}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, valeur: e.target.value }))
                  }
                  placeholder={
                    formData.type === "pourcentage" ? "Ex: 1.5" : "Ex: 500"
                  }
                />
              </div>
            )}
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsCreateDialogOpen(false)}
            >
              Annuler
            </Button>
            <Button onClick={handleCreateRule} disabled={isSaving}>
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
            <DialogTitle>Modifier la regle de frais</DialogTitle>
            <DialogDescription>
              Modifiez les parametres de la regle
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="editNom">Nom de la regle</Label>
              <Input
                id="editNom"
                value={formData.nom}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, nom: e.target.value }))
                }
              />
            </div>
            <div className="space-y-2">
              <Label>Type de calcul</Label>
              <Select
                value={formData.type}
                onValueChange={(value: "pourcentage" | "fixe" | "palier") =>
                  setFormData((prev) => ({ ...prev, type: value }))
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="pourcentage">Pourcentage</SelectItem>
                  <SelectItem value="fixe">Montant fixe</SelectItem>
                  <SelectItem value="palier">Par paliers</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {formData.type !== "palier" && (
              <div className="space-y-2">
                <Label htmlFor="editValeur">
                  {formData.type === "pourcentage"
                    ? "Pourcentage (%)"
                    : "Montant (FCFA)"}
                </Label>
                <Input
                  id="editValeur"
                  type="number"
                  value={formData.valeur}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, valeur: e.target.value }))
                  }
                />
              </div>
            )}
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsEditDialogOpen(false)}
            >
              Annuler
            </Button>
            <Button onClick={handleEditRule} disabled={isSaving}>
              {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {isSaving ? "Enregistrement..." : "Enregistrer"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Dialog */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-destructive" />
              Confirmer la suppression
            </DialogTitle>
            <DialogDescription>
              Etes-vous sur de vouloir supprimer la regle &quot;
              {selectedRule?.nom}&quot; ? Cette action est irreversible.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsDeleteDialogOpen(false)}
            >
              Annuler
            </Button>
            <Button variant="destructive" onClick={handleDeleteRule}>
              Supprimer
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
