"use client";

import { useState, useMemo, useEffect, useCallback } from "react";
import { ArrowRight, Info, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent } from "@/components/ui/card";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  clientsAPI,
  paysAPI,
  devisesAPI,
  tauxAPI,
  fraisAPI,
  transactionsAPI,
} from "@/lib/api";
import { FraisSettings } from "@/lib/types";
import type {
  Transaction,
  TransactionType,
  Client,
  Pays,
  Devise,
  TauxChange,
} from "@/lib/types";

interface NewTransactionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (
    transaction: Omit<Transaction, "id" | "numero" | "dateCreation" | "statut">,
  ) => void;
  transactionCount: number;
  // Pre-loaded data from parent
  clients?: Client[];
  pays?: Pays[];
  devises?: Devise[];
  tauxChange?: TauxChange[];
}

export function NewTransactionDialog({
  open,
  onOpenChange,
  onSubmit,
  transactionCount,
  clients: propClients,
  pays: propPays,
  devises: propDevises,
  tauxChange: propTauxChange,
}: NewTransactionDialogProps) {
  const [type, setType] = useState<TransactionType>("transfert");
  const [clientEmetteurId, setClientEmetteurId] = useState("");
  const [clientBeneficiaireId, setClientBeneficiaireId] = useState("");
  const [paysEnvoiId, setPaysEnvoiId] = useState("");
  const [paysReceptionId, setPaysReceptionId] = useState("");
  const [montantEnvoye, setMontantEnvoye] = useState("");
  const [applyFees, setApplyFees] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedTransferNumero, setSelectedTransferNumero] = useState("");

  // Data from API
  const [clients, setClients] = useState<Client[]>(propClients || []);
  const [pays, setPays] = useState<Pays[]>(propPays || []);
  const [devises, setDevises] = useState<Devise[]>(propDevises || []);
  const [tauxChange, setTauxChange] = useState<TauxChange[]>(
    propTauxChange || [],
  );
  const [pendingTransfers, setPendingTransfers] = useState<Transaction[]>([]);
  const [feeSettings, setFeeSettings] = useState<FraisSettings>({
    fraisActifs: true,
    fraisMinimum: 0,
    fraisMaximum: 50000,
    exonerePremierTransfert: false,
  });

  // Fetch data if not provided via props
  const fetchData = useCallback(async () => {
    if (propClients && propPays && propDevises && propTauxChange) return;

    setIsLoading(true);
    try {
      const [
        clientsData,
        paysData,
        devisesData,
        tauxData,
        fraisData,
        transfersData,
      ] = await Promise.all([
        propClients ? Promise.resolve(propClients) : clientsAPI.getAll(),
        propPays ? Promise.resolve(propPays) : paysAPI.getAll(),
        propDevises ? Promise.resolve(propDevises) : devisesAPI.getAll(),
        propTauxChange ? Promise.resolve(propTauxChange) : tauxAPI.getAll(),
        fraisAPI.getSettings().catch(() => feeSettings),
        transactionsAPI
          .getAll({ type: "transfert", status: "validee" })
          .catch(() => []),
      ]);
      setClients(clientsData);
      setPays(paysData);
      setDevises(devisesData);
      setTauxChange(tauxData);
      setFeeSettings(fraisData);
      setPendingTransfers(Array.isArray(transfersData) ? transfersData : []);
    } catch (error) {
      console.error("Error loading transaction form data:", error);
    } finally {
      setIsLoading(false);
    }
  }, [propClients, propPays, propDevises, propTauxChange, feeSettings]);

  useEffect(() => {
    if (open) {
      fetchData();
    }
  }, [open, fetchData]);

  // Update from props when they change
  useEffect(() => {
    if (propClients) setClients(propClients);
    if (propPays) setPays(propPays);
    if (propDevises) setDevises(propDevises);
    if (propTauxChange) setTauxChange(propTauxChange);
  }, [propClients, propPays, propDevises, propTauxChange]);

  // Auto-fill pays d'envoi when emetteur is selected (transfert)
  useEffect(() => {
    if (clientEmetteurId && type === "transfert") {
      const client = clients.find((c) => c.id === clientEmetteurId);
      if (client?.paysId) {
        setPaysEnvoiId(client.paysId);
      }
    }
  }, [clientEmetteurId, clients, type]);

  // Auto-fill pays de reception when beneficiaire is selected (transfert)
  useEffect(() => {
    if (clientBeneficiaireId && type === "transfert") {
      const client = clients.find((c) => c.id === clientBeneficiaireId);
      if (client?.paysId) {
        setPaysReceptionId(client.paysId);
      }
    }
  }, [clientBeneficiaireId, clients, type]);

  // Auto-fill fields when a transfer number is selected (retrait)
  useEffect(() => {
    if (selectedTransferNumero && type === "retrait") {
      const transfer = pendingTransfers.find(
        (t) => t.numero === selectedTransferNumero,
      );
      if (transfer) {
        // Set the beneficiary client as the one doing the withdrawal
        if (transfer.clientBeneficiaireId) {
          setClientEmetteurId(transfer.clientBeneficiaireId);
        }
        // Set the reception country
        if (transfer.paysReceptionId) {
          setPaysEnvoiId(transfer.paysReceptionId);
        }
        // Set the amount to receive
        if (transfer.montantRecu) {
          setMontantEnvoye(String(transfer.montantRecu));
        }
      }
    }
  }, [selectedTransferNumero, pendingTransfers, type]);

  const activeClients = clients.filter((c) => c.actif);
  const activePays = pays.filter((p) => p.actif);

  // Get devise by ID
  const getDevise = useCallback(
    (deviseId: string) => {
      return devises.find((d) => d.id === deviseId);
    },
    [devises],
  );

  // Get devises for selected countries
  const deviseEnvoi = useMemo(() => {
    const paysSelected = pays.find((p) => p.id === paysEnvoiId);
    return paysSelected ? getDevise(paysSelected.deviseId) : null;
  }, [paysEnvoiId, pays, getDevise]);

  const deviseReception = useMemo(() => {
    const paysSelected = pays.find((p) => p.id === paysReceptionId);
    return paysSelected ? getDevise(paysSelected.deviseId) : null;
  }, [paysReceptionId, pays, getDevise]);

  // Calculate fees
  const calculateFees = useCallback(
    (montant: number, shouldApply: boolean): number => {
      if (!shouldApply || !feeSettings.fraisActifs) return 0;
      // Default 2% fee with min/max bounds
      const fraisPourcentage = montant * 0.02;
      const frais = Math.max(
        feeSettings.fraisMinimum,
        Math.min(fraisPourcentage, feeSettings.fraisMaximum),
      );
      return frais;
    },
    [feeSettings],
  );

  // Calculate exchange rate and converted amount
  const { tauxChangeValue, montantRecu, montantRecuNet, frais } =
    useMemo(() => {
      if (!deviseEnvoi || !deviseReception || !montantEnvoye) {
        return {
          tauxChangeValue: 0,
          montantRecu: 0,
          montantRecuNet: 0,
          frais: 0,
        };
      }

      const montant = parseFloat(montantEnvoye) || 0;
      let taux = 1;

      // Find exchange rate
      if (deviseEnvoi.id !== deviseReception.id) {
        const tauxRecord = tauxChange.find(
          (t) =>
            t.actif &&
            ((t.deviseSourceId === deviseEnvoi.id &&
              t.deviseCibleId === deviseReception.id) ||
              (t.deviseSourceId === deviseReception.id &&
                t.deviseCibleId === deviseEnvoi.id)),
        );

        if (tauxRecord) {
          taux =
            tauxRecord.deviseSourceId === deviseEnvoi.id
              ? tauxRecord.taux
              : 1 / tauxRecord.taux;
        }
      }

      // Convert amount first
      const montantConverti = montant * taux;

      // Calculate fees on the converted/received amount
      const calculatedFrais = calculateFees(montantConverti, applyFees);

      // Net amount after fees deduction
      const montantNet = montantConverti - calculatedFrais;

      return {
        tauxChangeValue: taux,
        montantRecu: montantConverti,
        montantRecuNet: montantNet,
        frais: calculatedFrais,
      };
    }, [
      deviseEnvoi,
      deviseReception,
      montantEnvoye,
      applyFees,
      tauxChange,
      calculateFees,
    ]);

  const handleSubmit = async () => {
    // Validate devises before submitting
    const finalDeviseEnvoiId = deviseEnvoi?.id;
    const finalDeviseReceptionId =
      type === "retrait" ? deviseEnvoi?.id : deviseReception?.id;

    if (!finalDeviseEnvoiId || !finalDeviseReceptionId) {
      return;
    }

    setIsSubmitting(true);

    // Calculate net amount (after fees deduction)
    const montantNet =
      type === "retrait" ? parseFloat(montantEnvoye) - frais : montantRecuNet;

    const transactionData = {
      type,
      clientEmetteurId,
      clientBeneficiaireId:
        type === "transfert" ? clientBeneficiaireId : undefined,
      paysEnvoiId,
      paysReceptionId: type === "retrait" ? paysEnvoiId : paysReceptionId,
      deviseEnvoiId: finalDeviseEnvoiId,
      deviseReceptionId: finalDeviseReceptionId,
      montantEnvoye: parseFloat(montantEnvoye),
      tauxChange: type === "retrait" ? 1 : tauxChangeValue,
      montantRecu: montantNet,
      frais,
      agentId: "", // Will be set by server
    };

    try {
      await onSubmit(
        transactionData as Omit<
          Transaction,
          "id" | "numero" | "dateCreation" | "statut"
        >,
      );
      resetForm();
    } catch (error) {
      console.error("Error submitting transaction:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const resetForm = () => {
    setType("transfert");
    setClientEmetteurId("");
    setClientBeneficiaireId("");
    setPaysEnvoiId("");
    setPaysReceptionId("");
    setMontantEnvoye("");
    setApplyFees(true);
    setSelectedTransferNumero("");
  };

  const isValid = () => {
    if (!clientEmetteurId || !paysEnvoiId || !montantEnvoye) return false;
    if (!deviseEnvoi) return false; // Must have devise from selected pays
    if (type === "transfert") {
      if (!clientBeneficiaireId || !paysReceptionId) return false;
      if (!deviseReception) return false; // Must have devise for reception
    }
    return true;
  };

  if (isLoading) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-2xl">
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Nouvelle Transaction</DialogTitle>
          <DialogDescription>
            Creez un nouveau transfert ou retrait d'argent
          </DialogDescription>
        </DialogHeader>

        <Tabs
          value={type}
          onValueChange={(v) => setType(v as TransactionType)}
          className="w-full"
        >
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="transfert">Transfert</TabsTrigger>
            <TabsTrigger value="retrait">Retrait</TabsTrigger>
          </TabsList>

          <TabsContent value="transfert" className="space-y-4 mt-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Client Emetteur</Label>
                <Select
                  value={clientEmetteurId}
                  onValueChange={setClientEmetteurId}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selectionnez un client" />
                  </SelectTrigger>
                  <SelectContent>
                    {activeClients.map((client) => (
                      <SelectItem key={client.id} value={client.id}>
                        {client.prenom} {client.nom}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Client Beneficiaire</Label>
                <Select
                  value={clientBeneficiaireId}
                  onValueChange={setClientBeneficiaireId}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selectionnez un client" />
                  </SelectTrigger>
                  <SelectContent>
                    {activeClients
                      .filter((c) => c.id !== clientEmetteurId)
                      .map((client) => (
                        <SelectItem key={client.id} value={client.id}>
                          {client.prenom} {client.nom}
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Pays d'envoi</Label>
                <Select value={paysEnvoiId} onValueChange={setPaysEnvoiId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selectionnez un pays" />
                  </SelectTrigger>
                  <SelectContent>
                    {activePays.map((p) => (
                      <SelectItem key={p.id} value={p.id}>
                        {p.nom}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {deviseEnvoi && (
                  <p className="text-xs text-muted-foreground">
                    Devise: {deviseEnvoi.nom} ({deviseEnvoi.codeISO})
                  </p>
                )}
              </div>
              <div className="space-y-2">
                <Label>Pays de reception</Label>
                <Select
                  value={paysReceptionId}
                  onValueChange={setPaysReceptionId}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selectionnez un pays" />
                  </SelectTrigger>
                  <SelectContent>
                    {activePays.map((p) => (
                      <SelectItem key={p.id} value={p.id}>
                        {p.nom}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {deviseReception && (
                  <p className="text-xs text-muted-foreground">
                    Devise: {deviseReception.nom} ({deviseReception.codeISO})
                  </p>
                )}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Montant a envoyer</Label>
                <Input
                  type="number"
                  placeholder="0.00"
                  value={montantEnvoye}
                  onChange={(e) => setMontantEnvoye(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Label>Appliquer les frais</Label>
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Info className="h-4 w-4 text-muted-foreground cursor-help" />
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>
                          Desactivez pour exonerer cette transaction des frais
                        </p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </div>
                <div className="flex items-center gap-3 h-10">
                  <Switch
                    id="applyFees"
                    checked={applyFees}
                    onCheckedChange={setApplyFees}
                    disabled={!feeSettings.fraisActifs}
                  />
                  <Label
                    htmlFor="applyFees"
                    className="text-sm text-muted-foreground"
                  >
                    {applyFees ? "Frais appliques" : "Sans frais"}
                  </Label>
                </div>
              </div>
            </div>

            {/* Show calculation card when we have enough data */}
            {montantEnvoye && parseFloat(montantEnvoye) > 0 && (
              <Card className="bg-muted/50">
                <CardContent className="pt-4">
                  {!deviseEnvoi || !deviseReception ? (
                    <p className="text-sm text-muted-foreground text-center py-2">
                      Selectionnez les pays d'envoi et de reception pour voir le
                      calcul des frais
                    </p>
                  ) : (
                    <>
                      <div className="flex items-center justify-between gap-4">
                        <div className="text-center">
                          <p className="text-sm text-muted-foreground">
                            Montant envoye
                          </p>
                          <p className="text-lg font-semibold">
                            {parseFloat(montantEnvoye).toLocaleString("fr-FR")}{" "}
                            {deviseEnvoi.symbole}
                          </p>
                        </div>
                        <div className="flex flex-col items-center">
                          <ArrowRight className="h-5 w-5 text-muted-foreground" />
                          <span className="text-xs text-muted-foreground">
                            Taux: {tauxChangeValue.toFixed(4)}
                          </span>
                        </div>
                        <div className="text-center">
                          <p className="text-sm text-muted-foreground">
                            Montant converti
                          </p>
                          <p className="text-lg font-semibold">
                            {montantRecu.toLocaleString("fr-FR", {
                              maximumFractionDigits: 2,
                            })}{" "}
                            {deviseReception.symbole}
                          </p>
                        </div>
                      </div>
                      <div className="mt-3 pt-3 border-t flex items-center justify-between">
                        <div className="text-center flex-1">
                          <p className="text-sm text-muted-foreground">
                            Frais deduits
                          </p>
                          <p className="text-sm font-medium text-destructive">
                            -
                            {frais.toLocaleString("fr-FR", {
                              maximumFractionDigits: 2,
                            })}{" "}
                            {deviseReception.symbole}
                          </p>
                        </div>
                        <div className="text-center flex-1">
                          <p className="text-sm text-muted-foreground">
                            Montant net recu
                          </p>
                          <p className="text-lg font-bold text-primary">
                            {montantRecuNet.toLocaleString("fr-FR", {
                              maximumFractionDigits: 2,
                            })}{" "}
                            {deviseReception.symbole}
                          </p>
                        </div>
                      </div>
                    </>
                  )}
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="retrait" className="space-y-4 mt-4">
            <div className="space-y-2">
              <Label>Numero de transfert</Label>
              <Select
                value={selectedTransferNumero}
                onValueChange={setSelectedTransferNumero}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selectionnez un numero de transfert" />
                </SelectTrigger>
                <SelectContent>
                  {pendingTransfers.length === 0 ? (
                    <div className="px-2 py-4 text-sm text-muted-foreground text-center">
                      Aucun transfert disponible pour retrait
                    </div>
                  ) : (
                    pendingTransfers.map((t) => (
                      <SelectItem key={t.id} value={t.numero}>
                        {t.numero} - {t.clientBeneficiaireNom || "N/A"} (
                        {t.montantRecu?.toLocaleString("fr-FR")}{" "}
                        {t.paysReceptionNom || ""})
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
              {pendingTransfers.length > 0 && (
                <p className="text-xs text-muted-foreground">
                  {pendingTransfers.length} transfert(s) disponible(s) pour
                  retrait
                </p>
              )}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Client Beneficiaire</Label>
                <Select
                  value={clientEmetteurId}
                  onValueChange={setClientEmetteurId}
                  disabled={!!selectedTransferNumero}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Rempli automatiquement" />
                  </SelectTrigger>
                  <SelectContent>
                    {activeClients.map((client) => (
                      <SelectItem key={client.id} value={client.id}>
                        {client.prenom} {client.nom}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Pays</Label>
                <Select
                  value={paysEnvoiId}
                  onValueChange={setPaysEnvoiId}
                  disabled={!!selectedTransferNumero}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Rempli automatiquement" />
                  </SelectTrigger>
                  <SelectContent>
                    {activePays.map((p) => (
                      <SelectItem key={p.id} value={p.id}>
                        {p.nom}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {deviseEnvoi && (
                  <p className="text-xs text-muted-foreground">
                    Devise: {deviseEnvoi.nom} ({deviseEnvoi.codeISO})
                  </p>
                )}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Montant a retirer</Label>
                <Input
                  type="number"
                  placeholder="0.00"
                  value={montantEnvoye}
                  onChange={(e) => setMontantEnvoye(e.target.value)}
                  readOnly={!!selectedTransferNumero}
                  className={selectedTransferNumero ? "bg-muted" : ""}
                />
              </div>
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Label>Appliquer les frais</Label>
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Info className="h-4 w-4 text-muted-foreground cursor-help" />
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>
                          Desactivez pour exonerer cette transaction des frais
                        </p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </div>
                <div className="flex items-center gap-3 h-10">
                  <Switch
                    id="applyFeesRetrait"
                    checked={applyFees}
                    onCheckedChange={setApplyFees}
                    disabled={!feeSettings.fraisActifs}
                  />
                  <Label
                    htmlFor="applyFeesRetrait"
                    className="text-sm text-muted-foreground"
                  >
                    {applyFees ? "Frais appliques" : "Sans frais"}
                  </Label>
                </div>
              </div>
            </div>

            {/* Show calculation card for retrait */}
            {montantEnvoye && parseFloat(montantEnvoye) > 0 && (
              <Card className="bg-muted/50">
                <CardContent className="pt-4">
                  {!deviseEnvoi ? (
                    <p className="text-sm text-muted-foreground text-center py-2">
                      Selectionnez un pays pour voir le calcul des frais
                    </p>
                  ) : (
                    <div className="text-center space-y-2">
                      <div>
                        <p className="text-sm text-muted-foreground">
                          Montant demande
                        </p>
                        <p className="text-lg font-semibold">
                          {parseFloat(montantEnvoye).toLocaleString("fr-FR")}{" "}
                          {deviseEnvoi.symbole}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">
                          Frais deduits
                        </p>
                        <p className="text-sm font-medium text-destructive">
                          -
                          {frais.toLocaleString("fr-FR", {
                            maximumFractionDigits: 2,
                          })}{" "}
                          {deviseEnvoi.symbole}
                        </p>
                      </div>
                      <div className="pt-2 border-t">
                        <p className="text-sm text-muted-foreground">
                          Montant net a recevoir
                        </p>
                        <p className="text-2xl font-bold text-primary">
                          {(parseFloat(montantEnvoye) - frais).toLocaleString(
                            "fr-FR",
                            { maximumFractionDigits: 2 },
                          )}{" "}
                          {deviseEnvoi.symbole}
                        </p>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}
          </TabsContent>
        </Tabs>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            className="bg-transparent"
          >
            Annuler
          </Button>
          <Button onClick={handleSubmit} disabled={!isValid() || isSubmitting}>
            {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {isSubmitting ? "Creation..." : "Creer la Transaction"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
