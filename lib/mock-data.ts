import type {
  User,
  Client,
  Pays,
  Devise,
  TauxChange,
  Transaction,
  DashboardStats,
} from "./types";

// Utilisateurs
export const mockUsers: User[] = [
  {
    id: "1",
    nom: "Dupont",
    prenom: "Jean",
    email: "admin@transferpro.com",
    password: "admin123",
    role: "admin",
    actif: true,
    dateCreation: "2024-01-15",
    derniereConnexion: "2026-01-21",
  },
  {
    id: "2",
    nom: "Martin",
    prenom: "Sophie",
    email: "sophie.martin@transferpro.com",
    password: "agent123",
    role: "agent",
    actif: true,
    dateCreation: "2024-03-20",
    derniereConnexion: "2026-01-21",
  },
  {
    id: "3",
    nom: "Bernard",
    prenom: "Pierre",
    email: "pierre.bernard@transferpro.com",
    password: "agent123",
    role: "agent",
    actif: true,
    dateCreation: "2024-06-10",
    derniereConnexion: "2026-01-20",
  },
  {
    id: "4",
    nom: "Petit",
    prenom: "Marie",
    email: "marie.petit@transferpro.com",
    password: "agent123",
    role: "agent",
    actif: false,
    dateCreation: "2024-02-01",
    derniereConnexion: "2025-12-15",
  },
];

// Fonction d'authentification
export function authenticateUser(email: string, password: string): User | null {
  const user = mockUsers.find(
    (u) => u.email === email && u.password === password && u.actif,
  );
  return user || null;
}

// Fonction pour mettre a jour un utilisateur
export function updateUser(userId: string, data: Partial<User>): User | null {
  const userIndex = mockUsers.findIndex((u) => u.id === userId);
  if (userIndex === -1) return null;

  mockUsers[userIndex] = { ...mockUsers[userIndex], ...data };
  return mockUsers[userIndex];
}

// Fonction pour changer le mot de passe
export function changeUserPassword(
  userId: string,
  currentPassword: string,
  newPassword: string,
): { success: boolean; error?: string } {
  const user = mockUsers.find((u) => u.id === userId);
  if (!user) return { success: false, error: "Utilisateur non trouve" };
  if (user.password !== currentPassword)
    return { success: false, error: "Mot de passe actuel incorrect" };

  user.password = newPassword;
  return { success: true };
}

// Devises
export const mockDevises: Devise[] = [
  { id: "1", nom: "Franc CFA", codeISO: "XOF", symbole: "FCFA" },
  { id: "2", nom: "Euro", codeISO: "EUR", symbole: "€" },
  { id: "3", nom: "Dollar americain", codeISO: "USD", symbole: "$" },
  { id: "4", nom: "Livre sterling", codeISO: "GBP", symbole: "£" },
  { id: "5", nom: "Dirham marocain", codeISO: "MAD", symbole: "DH" },
  { id: "6", nom: "Franc suisse", codeISO: "CHF", symbole: "CHF" },
];

// Pays
export const mockPays: Pays[] = [
  { id: "1", nom: "Senegal", code: "SN", deviseId: "1", actif: true },
  { id: "2", nom: "France", code: "FR", deviseId: "2", actif: true },
  { id: "3", nom: "Cote d'Ivoire", code: "CI", deviseId: "1", actif: true },
  { id: "4", nom: "Mali", code: "ML", deviseId: "1", actif: true },
  { id: "5", nom: "Maroc", code: "MA", deviseId: "5", actif: true },
  { id: "6", nom: "Etats-Unis", code: "US", deviseId: "3", actif: true },
  { id: "7", nom: "Royaume-Uni", code: "GB", deviseId: "4", actif: true },
  { id: "8", nom: "Suisse", code: "CH", deviseId: "6", actif: true },
  { id: "9", nom: "Burkina Faso", code: "BF", deviseId: "1", actif: true },
  { id: "10", nom: "Guinee", code: "GN", deviseId: "1", actif: false },
];

// Taux de change
export const mockTauxChange: TauxChange[] = [
  {
    id: "1",
    deviseSourceId: "2",
    deviseCibleId: "1",
    taux: 655.957,
    dateEffet: "2026-01-01",
    actif: true,
  },
  {
    id: "2",
    deviseSourceId: "3",
    deviseCibleId: "1",
    taux: 615.5,
    dateEffet: "2026-01-01",
    actif: true,
  },
  {
    id: "3",
    deviseSourceId: "4",
    deviseCibleId: "1",
    taux: 780.25,
    dateEffet: "2026-01-01",
    actif: true,
  },
  {
    id: "4",
    deviseSourceId: "2",
    deviseCibleId: "5",
    taux: 10.85,
    dateEffet: "2026-01-01",
    actif: true,
  },
  {
    id: "5",
    deviseSourceId: "3",
    deviseCibleId: "2",
    taux: 0.92,
    dateEffet: "2026-01-01",
    actif: true,
  },
  {
    id: "6",
    deviseSourceId: "6",
    deviseCibleId: "2",
    taux: 1.08,
    dateEffet: "2026-01-01",
    actif: true,
  },
  {
    id: "7",
    deviseSourceId: "1",
    deviseCibleId: "2",
    taux: 0.00152,
    dateEffet: "2026-01-01",
    actif: true,
  },
  {
    id: "8",
    deviseSourceId: "1",
    deviseCibleId: "3",
    taux: 0.00162,
    dateEffet: "2026-01-01",
    actif: true,
  },
];

// Clients
// export const mockClients: Client[] = [
//   {
//     id: '1',
//     nom: 'Diallo',
//     prenom: 'Amadou',
//     telephone: '+221 77 123 45 67',
//     adresse: '123 Rue de Dakar, Senegal',
//     typeIdentite: 'cni',
//     numeroIdentite: 'SN123456789',
//     paysResidence: '1',
//     actif: true,
//     dateCreation: '2024-06-15'
//   },
//   {
//     id: '2',
//     nom: 'Kouyate',
//     prenom: 'Fatou',
//     telephone: '+33 6 12 34 56 78',
//     adresse: '45 Avenue des Champs, Paris, France',
//     typeIdentite: 'passeport',
//     numeroIdentite: 'FR987654321',
//     paysResidence: '2',
//     actif: true,
//     dateCreation: '2024-07-20'
//   },
//   {
//     id: '3',
//     nom: 'Traore',
//     prenom: 'Moussa',
//     telephone: '+225 07 89 12 34 56',
//     adresse: '78 Boulevard Abidjan, Cote d\'Ivoire',
//     typeIdentite: 'cni',
//     numeroIdentite: 'CI456789123',
//     paysResidence: '3',
//     actif: true,
//     dateCreation: '2024-08-10'
//   },
//   {
//     id: '4',
//     nom: 'Coulibaly',
//     prenom: 'Aissatou',
//     telephone: '+223 76 54 32 10',
//     adresse: '12 Rue Bamako, Mali',
//     typeIdentite: 'cni',
//     numeroIdentite: 'ML789123456',
//     paysResidence: '4',
//     actif: true,
//     dateCreation: '2024-09-05'
//   },
//   {
//     id: '5',
//     nom: 'Ndiaye',
//     prenom: 'Ibrahima',
//     telephone: '+221 78 456 78 90',
//     adresse: '56 Avenue Thiess, Senegal',
//     typeIdentite: 'permis',
//     numeroIdentite: 'SN321654987',
//     paysResidence: '1',
//     actif: true,
//     dateCreation: '2024-10-12'
//   },
//   {
//     id: '6',
//     nom: 'Ba',
//     prenom: 'Mariama',
//     telephone: '+33 7 98 76 54 32',
//     adresse: '89 Rue Lyon, France',
//     typeIdentite: 'passeport',
//     numeroIdentite: 'FR123789456',
//     paysResidence: '2',
//     actif: false,
//     dateCreation: '2024-05-01'
//   }
// ]

// Transactions
export const mockTransactions: Transaction[] = [
  {
    id: "1",
    numero: "TRF-2026-0001",
    type: "transfert",
    clientEmetteurId: "2",
    clientBeneficiaireId: "1",
    paysEnvoiId: "2",
    paysReceptionId: "1",
    deviseEnvoiId: "2",
    deviseReceptionId: "1",
    montantEnvoye: 500,
    tauxChange: 655.957,
    montantRecu: 327978.5,
    frais: 7.5,
    statut: "validee",
    dateCreation: "2026-01-21T10:30:00",
    dateValidation: "2026-01-21T10:35:00",
    agentId: "2",
  },
  {
    id: "2",
    numero: "TRF-2026-0002",
    type: "transfert",
    clientEmetteurId: "2",
    clientBeneficiaireId: "3",
    paysEnvoiId: "2",
    paysReceptionId: "3",
    deviseEnvoiId: "2",
    deviseReceptionId: "1",
    montantEnvoye: 1000,
    tauxChange: 655.957,
    montantRecu: 655957,
    frais: 12.0,
    statut: "en_attente",
    dateCreation: "2026-01-21T11:00:00",
    agentId: "2",
  },
  {
    id: "3",
    numero: "RET-2026-0001",
    type: "retrait",
    clientEmetteurId: "1",
    paysEnvoiId: "1",
    paysReceptionId: "1",
    deviseEnvoiId: "1",
    deviseReceptionId: "1",
    montantEnvoye: 100000,
    tauxChange: 1,
    montantRecu: 100000,
    frais: 500,
    statut: "retiree",
    dateCreation: "2026-01-20T14:00:00",
    dateValidation: "2026-01-20T14:10:00",
    agentId: "3",
  },
  {
    id: "4",
    numero: "TRF-2026-0003",
    type: "transfert",
    clientEmetteurId: "4",
    clientBeneficiaireId: "5",
    paysEnvoiId: "4",
    paysReceptionId: "1",
    deviseEnvoiId: "1",
    deviseReceptionId: "1",
    montantEnvoye: 250000,
    tauxChange: 1,
    montantRecu: 250000,
    frais: 2500,
    statut: "validee",
    dateCreation: "2026-01-19T09:30:00",
    dateValidation: "2026-01-19T09:45:00",
    agentId: "2",
  },
  {
    id: "5",
    numero: "TRF-2026-0004",
    type: "transfert",
    clientEmetteurId: "2",
    clientBeneficiaireId: "4",
    paysEnvoiId: "2",
    paysReceptionId: "4",
    deviseEnvoiId: "2",
    deviseReceptionId: "1",
    montantEnvoye: 750,
    tauxChange: 655.957,
    montantRecu: 491967.75,
    frais: 10.0,
    statut: "annulee",
    dateCreation: "2026-01-18T16:00:00",
    agentId: "3",
  },
  {
    id: "6",
    numero: "RET-2026-0002",
    type: "retrait",
    clientEmetteurId: "3",
    paysEnvoiId: "3",
    paysReceptionId: "3",
    deviseEnvoiId: "1",
    deviseReceptionId: "1",
    montantEnvoye: 75000,
    tauxChange: 1,
    montantRecu: 75000,
    frais: 375,
    statut: "en_attente",
    dateCreation: "2026-01-21T08:45:00",
    agentId: "2",
  },
  {
    id: "7",
    numero: "TRF-2026-0005",
    type: "transfert",
    clientEmetteurId: "5",
    clientBeneficiaireId: "2",
    paysEnvoiId: "1",
    paysReceptionId: "2",
    deviseEnvoiId: "1",
    deviseReceptionId: "2",
    montantEnvoye: 500000,
    tauxChange: 0.00152,
    montantRecu: 760,
    frais: 5000,
    statut: "validee",
    dateCreation: "2026-01-17T11:20:00",
    dateValidation: "2026-01-17T11:30:00",
    agentId: "2",
  },
];

// Statistiques du tableau de bord
export const mockDashboardStats: DashboardStats = {
  totalTransactions: 7,
  totalTransferts: 5,
  totalRetraits: 2,
  montantTotalTransfere: 1726703.25,
  montantTotalRetire: 175000,
  transactionsEnAttente: 2,
  transactionsAujourdHui: 3,
};

// Fonction utilitaire pour obtenir le nom complet d'un client
// export function getClientNomComplet(clientId: string): string {
//   const client = mockClients.find(c => c.id === clientId)
//   return client ? `${client.prenom} ${client.nom}` : 'Client inconnu'
// }

// Fonction utilitaire pour obtenir le nom d'un pays
export function getPaysNom(paysId: string): string {
  const pays = mockPays.find((p) => p.id === paysId);
  return pays ? pays.nom : "Pays inconnu";
}

// Fonction utilitaire pour obtenir une devise
export function getDevise(deviseId: string): Devise | undefined {
  return mockDevises.find((d) => d.id === deviseId);
}

// Fonction utilitaire pour formater un montant avec devise
export function formatMontant(montant: number, deviseId: string): string {
  const devise = getDevise(deviseId);
  if (!devise) return montant.toLocaleString("fr-FR");

  return `${montant.toLocaleString("fr-FR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ${devise.symbole}`;
}

// Fonction utilitaire pour obtenir le libelle du statut
export function getStatutLabel(statut: string): string {
  const labels: Record<string, string> = {
    en_attente: "En attente",
    validee: "Validee",
    annulee: "Annulee",
    retiree: "Retiree",
  };
  return labels[statut] || statut;
}

// Fonction utilitaire pour obtenir la couleur du statut
export function getStatutColor(
  statut: string,
): "default" | "secondary" | "destructive" | "outline" {
  const colors: Record<
    string,
    "default" | "secondary" | "destructive" | "outline"
  > = {
    en_attente: "secondary",
    validee: "default",
    annulee: "destructive",
    retiree: "outline",
  };
  return colors[statut] || "default";
}
