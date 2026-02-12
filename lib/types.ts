// Types pour l'application de gestion de transactions financieres

export type UserRole = "admin" | "agent";

export interface User {
  id: string;
  nom: string;
  prenom: string;
  email: string;
  password: string;
  role: UserRole;
  actif: boolean;
  dateCreation: string;
  derniereConnexion?: string;
}

export interface AuthUser {
  id: string;
  nom: string;
  prenom: string;
  email: string;
  role: UserRole;
}

export interface Client {
  id: string;
  nom: string;
  prenom: string;
  telephone: string;
  email?: string;
  adresse?: string;
  pieceIdentite?: string;
  numeroPiece?: string;
  paysId: string;
  paysNom?: string;
  actif: boolean;
  dateCreation: string;
}

export interface Pays {
  id: string;
  nom: string;
  code: string;
  deviseId: string;
  actif: boolean;
}

export interface Devise {
  id: string;
  nom: string;
  codeISO: string;
  symbole: string;
}

export interface TauxChange {
  id: string;
  deviseSourceId: string;
  deviseCibleId: string;
  taux: number;
  dateEffet: string;
  actif: boolean;
}

export type TransactionType = "transfert" | "retrait";
export type TransactionStatus =
  | "en_attente"
  | "validee"
  | "annulee"
  | "retiree";

export interface Transaction {
  id: string;
  numero: string;
  type: TransactionType;
  statut: TransactionStatus;
  clientEmetteurId: string;
  clientEmetteurNom?: string;
  clientBeneficiaireId?: string;
  clientBeneficiaireNom?: string;
  paysEnvoiId: string;
  paysEnvoiNom?: string;
  paysReceptionId: string;
  paysReceptionNom?: string;
  deviseEnvoiId: string;
  deviseReceptionId: string;
  montantEnvoye: number;
  tauxChange: number;
  montantRecu: number;
  frais: number;
  dateCreation: string;
  dateValidation?: string;
  dateRetrait?: string;
  codeRetrait?: string;
  agentId: string;
  notes?: string;
}

export interface DashboardStats {
  totalTransactions: number;
  totalTransferts: number;
  totalRetraits: number;
  montantTotalTransfere: number;
  montantTotalRetire: number;
  transactionsEnAttente: number;
  transactionsAujourdHui: number;
}

export interface Notification {
  id: string;
  type: "success" | "error" | "warning" | "info";
  titre: string;
  message: string;
  lu: boolean;
  dateCreation: string;
}

export interface FraisPalier {
  id: string;
  montantMin: number;
  montantMax: number;
  frais: number;
  type: "pourcentage" | "fixe";
}

export interface FraisRule {
  id: string;
  nom: string;
  type: "pourcentage" | "fixe" | "palier";
  valeur: number;
  montantMin?: number;
  montantMax?: number;
  paliers?: FraisPalier[];
  actif: boolean;
}

export interface FraisSettings {
  fraisActifs: boolean;
  fraisMinimum: number;
  fraisMaximum: number;
  exonerePremierTransfert: boolean;
  reglesActives?: string;
}
