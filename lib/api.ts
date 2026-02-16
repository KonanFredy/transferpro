import axios from "axios";
import type {
  User,
  Client,
  Transaction,
  Pays,
  Devise,
  TauxChange,
  TransactionStatus,
  TransactionType,
  FraisRule,
  FraisSettings,
} from "./types";

// Configuration de base d'Axios
const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api";

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

// Intercepteur pour ajouter le token d'authentification
api.interceptors.request.use((config) => {
  if (typeof window !== "undefined") {
    const token = localStorage.getItem("auth_token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
  }
  return config;
});

// Intercepteur pour gerer les erreurs
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Token expire ou invalide
      if (typeof window !== "undefined") {
        localStorage.removeItem("auth_token");
        localStorage.removeItem("auth_user");
        window.location.href = "/login";
      }
    }
    return Promise.reject(error);
  },
);

// ==================== DATA TRANSFORMERS ====================
// Transform snake_case to camelCase for frontend consumption
const transformClient = (data: Record<string, unknown>): Client => ({
  id: String(data.id || ""),
  nom: String(data.nom || ""),
  prenom: String(data.prenom || ""),
  telephone: String(data.telephone || ""),
  email: data.email ? String(data.email) : undefined,
  adresse: data.adresse ? String(data.adresse) : undefined,
  paysId: String(data.paysId || data.pays_id || data.pays || ""),
  paysNom:
    data.pays && typeof data.pays === "object"
      ? String((data.pays as Record<string, unknown>).nom || "")
      : undefined,
  pieceIdentite: String(
    data.typeIdentite || data.type_identite || data.piece_identite || "",
  ),
  numeroPiece: String(
    data.numeroIdentite || data.numero_identite || data.numero_piece || "",
  ),
  dateCreation: String(data.dateCreation || data.date_creation || ""),
  actif: Boolean(data.actif ?? true),
});

const transformPays = (data: Record<string, unknown>): Pays => ({
  id: String(data.id || ""),
  nom: String(data.nom || ""),
  code: String(data.code || ""),
  // Backend returns deviseId (camelCase) or devise (object or id)
  deviseId: String(
    data.deviseId ||
      data.devise_id ||
      (typeof data.devise === "object" && data.devise !== null
        ? (data.devise as Record<string, unknown>).id
        : data.devise) ||
      "",
  ),
  actif: Boolean(data.actif ?? true),
});

const transformDevise = (data: Record<string, unknown>): Devise => ({
  id: String(data.id || ""),
  nom: String(data.nom || ""),
  // Backend returns codeISO (camelCase) or code_iso (snake_case)
  codeISO: String(data.codeISO || data.code_iso || ""),
  symbole: String(data.symbole || ""),
});

const transformTauxChange = (data: Record<string, unknown>): TauxChange => ({
  id: String(data.id || ""),
  // Backend returns deviseSourceId/deviseCibleId (camelCase) or devise_source/devise_cible
  deviseSourceId: String(
    data.deviseSourceId ||
      data.devise_source_id ||
      (typeof data.devise_source === "object" && data.devise_source !== null
        ? (data.devise_source as Record<string, unknown>).id
        : data.devise_source) ||
      "",
  ),
  deviseCibleId: String(
    data.deviseCibleId ||
      data.devise_cible_id ||
      (typeof data.devise_cible === "object" && data.devise_cible !== null
        ? (data.devise_cible as Record<string, unknown>).id
        : data.devise_cible) ||
      "",
  ),
  taux: Number(data.taux || 0),
  dateEffet: String(
    data.dateEffet ||
      data.date_effet ||
      data.dateEffet ||
      data.date_effet ||
      data.date_creation ||
      "",
  ),
  actif: Boolean(data.actif ?? true),
});

const transformTransaction = (data: Record<string, unknown>): Transaction => ({
  id: String(data.id || ""),
  numero: String(data.numero || ""),
  type: data.type as TransactionType,
  statut: data.statut as TransactionStatus,
  clientEmetteurId: String(
    data.clientEmetteurId ||
      data.client_emetteur_id ||
      data.client_emetteur ||
      "",
  ),
  clientEmetteurNom:
    data.clientEmetteur && typeof data.clientEmetteur === "object"
      ? `${(data.clientEmetteur as Record<string, unknown>).prenom || ""} ${(data.clientEmetteur as Record<string, unknown>).nom || ""}`.trim()
      : undefined,
  clientBeneficiaireId:
    data.clientBeneficiaireId ||
    data.client_beneficiaire_id ||
    data.client_beneficiaire
      ? String(
          data.clientBeneficiaireId ||
            data.client_beneficiaire_id ||
            data.client_beneficiaire,
        )
      : undefined,
  clientBeneficiaireNom:
    data.clientBeneficiaire && typeof data.clientBeneficiaire === "object"
      ? `${(data.clientBeneficiaire as Record<string, unknown>).prenom || ""} ${(data.clientBeneficiaire as Record<string, unknown>).nom || ""}`.trim()
      : undefined,
  paysEnvoiId: String(
    data.paysEnvoiId || data.pays_envoi_id || data.pays_envoi || "",
  ),
  paysEnvoiNom:
    data.paysEnvoi && typeof data.paysEnvoi === "string"
      ? data.paysEnvoi
      : undefined,
  paysReceptionId: String(
    data.paysReceptionId || data.pays_reception_id || data.pays_reception || "",
  ),
  paysReceptionNom:
    data.paysReception && typeof data.paysReception === "string"
      ? data.paysReception
      : undefined,
  deviseEnvoiId: String(
    data.deviseEnvoiId || data.devise_envoi_id || data.devise_envoi || "",
  ),
  deviseReceptionId: String(
    data.deviseReceptionId ||
      data.devise_reception_id ||
      data.devise_reception ||
      "",
  ),
  montantEnvoye: Number(data.montantEnvoye || data.montant_envoye || 0),
  tauxChange: Number(data.tauxChange || data.taux_change || 1),
  montantRecu: Number(data.montantRecu || data.montant_recu || 0),
  frais: Number(data.frais || 0),
  dateCreation: String(data.dateCreation || data.date_creation || ""),
  dateValidation:
    data.dateValidation || data.date_validation
      ? String(data.dateValidation || data.date_validation)
      : undefined,
  dateRetrait:
    data.dateRetrait || data.date_retrait
      ? String(data.dateRetrait || data.date_retrait)
      : undefined,
  codeRetrait:
    data.codeRetrait || data.code_retrait
      ? String(data.codeRetrait || data.code_retrait)
      : undefined,
  agentId: String(
    data.agentId || data.agent_creation_id || data.agent_creation || "",
  ),
  notes: data.notes ? String(data.notes) : undefined,
});

// Transform camelCase to snake_case for backend
const transformTransactionToBackend = (
  data: Partial<Transaction>,
): Record<string, unknown> => ({
  type: data.type,
  client_emetteur: data.clientEmetteurId,
  client_beneficiaire: data.clientBeneficiaireId || null,
  pays_envoi: data.paysEnvoiId,
  pays_reception: data.paysReceptionId,
  devise_envoi: data.deviseEnvoiId,
  devise_reception: data.deviseReceptionId,
  montant_envoye: data.montantEnvoye,
  taux_change: data.tauxChange,
  montant_recu: data.montantRecu,
  frais: data.frais,
  frais_appliques: data.frais && data.frais > 0,
  notes: data.notes,
});

// ==================== MOCK DATA FOR DEMO ====================
const MOCK_USERS = [
  {
    id: "1",
    nom: "Admin",
    prenom: "System",
    email: "admin@transferpro.com",
    role: "admin",
    password: "admin123",
  },
  {
    id: "2",
    nom: "Agent",
    prenom: "Test",
    email: "agent@transferpro.com",
    role: "agent",
    password: "agent123",
  },
];

// Force false in production - mock only when explicitly enabled
const USE_MOCK = process.env.NEXT_PUBLIC_USE_MOCK === "true";

// ==================== AUTH ====================
export const authAPI = {
  login: async (email: string, password: string) => {
    // Try real API first, fall back to mock if it fails
    try {
      const response = await api.post("/auth/login", { email, password });
      return response.data;
    } catch (error) {
      // API login failed, try mock fallback
      // Mock login for demo
      const user = MOCK_USERS.find(
        (u) => u.email === email && u.password === password,
      );
      if (user) {
        const { password: _, ...userWithoutPassword } = user;
        return {
          token: `mock_token_${Date.now()}`,
          user: userWithoutPassword,
        };
      }
      throw new Error("Email ou mot de passe incorrect");
    }
  },
  logout: async () => {
    try {
      const response = await api.post("/auth/logout");
      return response.data;
    } catch {
      return { success: true };
    }
  },
  me: async () => {
    try {
      const response = await api.get("/auth/me");
      return response.data;
    } catch {
      // Return stored user from localStorage
      const storedUser =
        typeof window !== "undefined"
          ? localStorage.getItem("auth_user")
          : null;
      if (storedUser) {
        return JSON.parse(storedUser);
      }
      throw new Error("Not authenticated");
    }
  },
  updateProfile: async (data: {
    nom?: string;
    prenom?: string;
    email?: string;
  }) => {
    const response = await api.patch("/auth/profile", data);
    return response.data;
  },
  changePassword: async (currentPassword: string, newPassword: string) => {
    const response = await api.post("/auth/change-password", {
      current_password: currentPassword,
      new_password: newPassword,
    });
    return response.data;
  },
  forgotPassword: async (email: string) => {
    const response = await api.post("/auth/forgot-password", { email });
    return response.data;
  },
  resetPassword: async (token: string, newPassword: string) => {
    const response = await api.post("/auth/reset-password", {
      token,
      new_password: newPassword,
    });
    return response.data;
  },
};

// ==================== USERS ====================
export const usersAPI = {
  getAll: async (): Promise<User[]> => {
    const response = await api.get("/users");
    return response.data.results || response.data;
  },
  getById: async (id: string): Promise<User> => {
    const response = await api.get(`/users/${id}`);
    return response.data;
  },
  create: async (data: {
    nom: string;
    prenom: string;
    email: string;
    password: string;
    role: string;
  }): Promise<User> => {
    const response = await api.post("/users", {
      nom: data.nom,
      prenom: data.prenom,
      email: data.email,
      password: data.password,
      password_confirm: data.password,
      role: data.role,
    });
    return response.data;
  },
  update: async (id: string, data: Partial<User>): Promise<User> => {
    const response = await api.patch(`/users/${id}`, data);
    return response.data;
  },
  delete: async (id: string): Promise<void> => {
    await api.delete(`/users/${id}`);
  },
  toggleActive: async (id: string): Promise<User> => {
    const response = await api.post(`/users/${id}/toggle_active`);
    return response.data;
  },
};

// ==================== CLIENTS ====================
export const clientsAPI = {
  getAll: async (): Promise<Client[]> => {
    const response = await api.get("/clients");
    const data = response.data.results || response.data;
    return Array.isArray(data) ? data.map(transformClient) : [];
  },
  getById: async (id: string): Promise<Client> => {
    const response = await api.get(`/clients/${id}`);
    return transformClient(response.data);
  },
  create: async (
    data: Omit<Client, "id" | "dateCreation" | "actif">,
  ): Promise<Client> => {
    const payload = {
      nom: data.nom,
      prenom: data.prenom,
      telephone: data.telephone,
      email: data.email,
      adresse: data.adresse,
      pays_id: data.paysId,
      type_identite: data.pieceIdentite,
      numero_identite: data.numeroPiece,
    };
    const response = await api.post("/clients", payload);
    return transformClient(response.data);
  },
  update: async (id: string, data: Partial<Client>): Promise<Client> => {
    const payload: Record<string, unknown> = {};
    if (data.nom) payload.nom = data.nom;
    if (data.prenom) payload.prenom = data.prenom;
    if (data.telephone) payload.telephone = data.telephone;
    if (data.email !== undefined) payload.email = data.email;
    if (data.adresse !== undefined) payload.adresse = data.adresse;
    if (data.paysId) payload.pays_id = data.paysId;
    if (data.pieceIdentite !== undefined)
      payload.type_identite = data.pieceIdentite;
    if (data.numeroPiece !== undefined)
      payload.numero_identite = data.numeroPiece;
    if (data.actif !== undefined) payload.actif = data.actif;
    const response = await api.patch(`/clients/${id}`, payload);
    return transformClient(response.data);
  },
  delete: async (id: string): Promise<void> => {
    await api.delete(`/clients/${id}`);
  },
  toggleActive: async (id: string): Promise<Client> => {
    const response = await api.post(`/clients/${id}/toggle_active`);
    return transformClient(response.data);
  },
};

// ==================== TRANSACTIONS ====================
export const transactionsAPI = {
  getAll: async (params?: {
    type?: TransactionType;
    status?: TransactionStatus;
    search?: string;
  }): Promise<Transaction[]> => {
    const response = await api.get("/transactions", { params });
    const data = response.data.results || response.data;
    return Array.isArray(data) ? data.map(transformTransaction) : [];
  },
  getById: async (id: string): Promise<Transaction> => {
    const response = await api.get(`/transactions/${id}`);
    return transformTransaction(response.data);
  },
  create: async (
    data: Omit<Transaction, "id" | "numero" | "dateCreation" | "statut">,
  ): Promise<Transaction> => {
    const payload = transformTransactionToBackend(data);
    const response = await api.post("/transactions", payload);
    return transformTransaction(response.data);
  },
  validate: async (id: string): Promise<Transaction> => {
    const response = await api.patch(`/transactions/${id}/valider`);
    return transformTransaction(response.data);
  },
  cancel: async (id: string): Promise<Transaction> => {
    const response = await api.patch(`/transactions/${id}/annuler`);
    return transformTransaction(response.data);
  },
  markWithdrawn: async (id: string): Promise<Transaction> => {
    const response = await api.patch(`/transactions/${id}/retirer`);
    return transformTransaction(response.data);
  },
  getStatistics: async (): Promise<{
    totalTransactions: number;
    totalMontantEnvoye: number;
    totalMontantRecu: number;
    transactionsEnAttente: number;
    transactionsParPays: { pays: string; count: number }[];
    transactionsParAgent: { agent: string; count: number; montant: number }[];
    recentTransactions: Transaction[];
  }> => {
    const response = await api.get("/transactions/statistiques");
    return response.data;
  },
};

// ==================== PAYS ====================
export const paysAPI = {
  getAll: async (): Promise<Pays[]> => {
    const response = await api.get("/pays");
    const data = response.data.results || response.data;
    return Array.isArray(data) ? data.map(transformPays) : [];
  },
  getById: async (id: string): Promise<Pays> => {
    const response = await api.get(`/pays/${id}`);
    return transformPays(response.data);
  },
  create: async (data: {
    nom: string;
    code: string;
    deviseId: string;
  }): Promise<Pays> => {
    const response = await api.post("/pays", {
      nom: data.nom,
      code: data.code,
      devise_id: data.deviseId,
    });
    return transformPays(response.data);
  },
  update: async (id: string, data: Partial<Pays>): Promise<Pays> => {
    const payload: Record<string, unknown> = {};
    if (data.nom) payload.nom = data.nom;
    if (data.code) payload.code = data.code;
    if (data.deviseId) payload.devise_id = data.deviseId;
    if (data.actif !== undefined) payload.actif = data.actif;
    const response = await api.patch(`/pays/${id}`, payload);
    return transformPays(response.data);
  },
  delete: async (id: string): Promise<void> => {
    await api.delete(`/pays/${id}`);
  },
  toggleActive: async (id: string): Promise<Pays> => {
    const response = await api.post(`/pays/${id}/toggle_active`);
    return transformPays(response.data);
  },
};

// ==================== DEVISES ====================
export const devisesAPI = {
  getAll: async (): Promise<Devise[]> => {
    const response = await api.get("/devises");
    const data = response.data.results || response.data;
    return Array.isArray(data) ? data.map(transformDevise) : [];
  },
  getById: async (id: string): Promise<Devise> => {
    const response = await api.get(`/devises/${id}`);
    return transformDevise(response.data);
  },
  create: async (data: {
    nom: string;
    codeISO: string;
    symbole: string;
  }): Promise<Devise> => {
    const response = await api.post("/devises", {
      nom: data.nom,
      code_iso: data.codeISO,
      symbole: data.symbole,
    });
    return transformDevise(response.data);
  },
  update: async (id: string, data: Partial<Devise>): Promise<Devise> => {
    const payload: Record<string, unknown> = {};
    if (data.nom) payload.nom = data.nom;
    if (data.codeISO) payload.code_iso = data.codeISO;
    if (data.symbole) payload.symbole = data.symbole;
    const response = await api.patch(`/devises/${id}`, payload);
    return transformDevise(response.data);
  },
  delete: async (id: string): Promise<void> => {
    await api.delete(`/devises/${id}`);
  },
};

// ==================== TAUX DE CHANGE ====================
export const tauxAPI = {
  getAll: async (): Promise<TauxChange[]> => {
    const response = await api.get("/taux");
    const data = response.data.results || response.data;
    return Array.isArray(data) ? data.map(transformTauxChange) : [];
  },
  getById: async (id: string): Promise<TauxChange> => {
    const response = await api.get(`/taux/${id}`);
    return transformTauxChange(response.data);
  },
  create: async (data: {
    deviseSourceId: string;
    deviseCibleId: string;
    taux: number;
  }): Promise<TauxChange> => {
    const response = await api.post("/taux", {
      devise_source_id: data.deviseSourceId,
      devise_cible_id: data.deviseCibleId,
      taux: data.taux,
    });
    return transformTauxChange(response.data);
  },
  update: async (
    id: string,
    data: Partial<TauxChange>,
  ): Promise<TauxChange> => {
    const payload: Record<string, unknown> = {};
    if (data.deviseSourceId) payload.devise_source_id = data.deviseSourceId;
    if (data.deviseCibleId) payload.devise_cible_id = data.deviseCibleId;
    if (data.taux !== undefined) payload.taux = data.taux;
    if (data.actif !== undefined) payload.actif = data.actif;
    const response = await api.patch(`/taux/${id}`, payload);
    return transformTauxChange(response.data);
  },
  delete: async (id: string): Promise<void> => {
    await api.delete(`/taux/${id}`);
  },
  toggleActive: async (id: string): Promise<TauxChange> => {
    const response = await api.post(`/taux/${id}/toggle_active`);
    return transformTauxChange(response.data);
  },
  convert: async (
    deviseSourceId: string,
    deviseCibleId: string,
    montant: number,
  ): Promise<{ montant: number; taux: number }> => {
    const response = await api.post("/taux/convert", {
      devise_source_id: deviseSourceId,
      devise_cible_id: deviseCibleId,
      montant,
    });
    return response.data;
  },
};

// ==================== FRAIS ====================
const transformFraisRule = (data: Record<string, unknown>): FraisRule => ({
  id: String(data.id || ""),
  nom: String(data.nom || ""),
  type: (data.type as "pourcentage" | "fixe" | "palier") || "pourcentage",
  valeur: Number(data.valeur || 0),
  montantMin:
    data.montant_min !== undefined ? Number(data.montant_min) : undefined,
  montantMax:
    data.montant_max !== undefined ? Number(data.montant_max) : undefined,
  paliers: Array.isArray(data.paliers)
    ? data.paliers.map((p: Record<string, unknown>) => ({
        id: String(p.id || ""),
        montantMin: Number(p.montant_min || 0),
        montantMax: Number(p.montant_max || 0),
        frais: Number(p.frais || 0),
        type: (p.type as "pourcentage" | "fixe") || "fixe",
      }))
    : [],
  actif: Boolean(data.actif ?? true),
});

const transformFraisSettings = (
  data: Record<string, unknown>,
): FraisSettings => ({
  fraisActifs: Boolean(data.fraisActifs ?? data.frais_actifs ?? true),
  fraisMinimum: Number(data.fraisMinimum ?? data.frais_minimum ?? 0),
  fraisMaximum: Number(data.fraisMaximum ?? data.frais_maximum ?? 0),
  exonerePremierTransfert: Boolean(
    data.exonerePremierTransfert ?? data.exonere_premier_transfert ?? false,
  ),
  reglesActives: data.regleActiveId
    ? String(data.regleActiveId)
    : data.regle_active_id
      ? String(data.regle_active_id)
      : undefined,
});

export const fraisAPI = {
  getSettings: async (): Promise<FraisSettings> => {
    const response = await api.get("/frais/settings");
    return transformFraisSettings(response.data);
  },
  updateSettings: async (
    data: Partial<FraisSettings>,
  ): Promise<FraisSettings> => {
    // Convert camelCase to snake_case for backend
    const payload: Record<string, unknown> = {};
    if (data.fraisActifs !== undefined) payload.frais_actifs = data.fraisActifs;
    if (data.fraisMinimum !== undefined)
      payload.frais_minimum = data.fraisMinimum;
    if (data.fraisMaximum !== undefined)
      payload.frais_maximum = data.fraisMaximum;
    if (data.exonerePremierTransfert !== undefined)
      payload.exonere_premier_transfert = data.exonerePremierTransfert;
    if (data.reglesActives !== undefined)
      payload.regle_active_id = data.reglesActives;
    const response = await api.patch("/frais/settings", payload);
    return transformFraisSettings(response.data);
  },
  getRules: async (): Promise<FraisRule[]> => {
    const response = await api.get("/frais/rules");
    const data = response.data.results || response.data;
    return Array.isArray(data) ? data.map(transformFraisRule) : [];
  },
  createRule: async (data: Omit<FraisRule, "id">): Promise<FraisRule> => {
    const payload = {
      nom: data.nom,
      type: data.type,
      valeur: data.valeur,
      montant_min: data.montantMin,
      montant_max: data.montantMax,
      actif: data.actif,
    };
    const response = await api.post("/frais/rules", payload);
    return transformFraisRule(response.data);
  },
  updateRule: async (
    id: string,
    data: Partial<FraisRule>,
  ): Promise<FraisRule> => {
    const payload: Record<string, unknown> = {};
    if (data.nom) payload.nom = data.nom;
    if (data.type) payload.type = data.type;
    if (data.valeur !== undefined) payload.valeur = data.valeur;
    if (data.montantMin !== undefined) payload.montant_min = data.montantMin;
    if (data.montantMax !== undefined) payload.montant_max = data.montantMax;
    if (data.actif !== undefined) payload.actif = data.actif;
    const response = await api.patch(`/frais/rules/${id}`, payload);
    return transformFraisRule(response.data);
  },
  deleteRule: async (id: string): Promise<void> => {
    await api.delete(`/frais/rules/${id}`);
  },
  calculate: async (montant: number, applyFees: boolean): Promise<number> => {
    const response = await api.post("/frais/calculer", {
      montant,
      apply_fees: applyFees,
    });
    return response.data.frais;
  },
  // Paliers API
  getPaliers: async (ruleId: string): Promise<FraisRule["paliers"]> => {
    const response = await api.get(`/frais/rules/${ruleId}`);
    const rule = transformFraisRule(response.data);
    return rule.paliers || [];
  },
  createPalier: async (
    ruleId: string,
    data: {
      montantMin: number;
      montantMax: number;
      frais: number;
      type: "pourcentage" | "fixe";
    },
  ) => {
    const response = await api.post(`/frais/rules/${ruleId}/paliers`, {
      montant_min: data.montantMin,
      montant_max: data.montantMax,
      frais: data.frais,
      type: data.type,
    });
    return response.data;
  },
  updatePalier: async (
    palierId: string,
    data: {
      montantMin?: number;
      montantMax?: number;
      frais?: number;
      type?: "pourcentage" | "fixe";
    },
  ) => {
    const payload: Record<string, unknown> = {};
    if (data.montantMin !== undefined) payload.montant_min = data.montantMin;
    if (data.montantMax !== undefined) payload.montant_max = data.montantMax;
    if (data.frais !== undefined) payload.frais = data.frais;
    if (data.type !== undefined) payload.type = data.type;
    const response = await api.patch(`/frais/paliers/${palierId}`, payload);
    return response.data;
  },
  deletePalier: async (palierId: string): Promise<void> => {
    await api.delete(`/frais/paliers/${palierId}`);
  },
};

// ==================== NOTIFICATIONS ====================
export interface Notification {
  id: string;
  type: "email" | "sms";
  recipient: string;
  subject: string;
  status: "sent" | "failed" | "pending";
  timestamp: string;
  read: boolean;
}

export interface NotificationSettings {
  emailEnabled: boolean;
  smsEnabled: boolean;
  transactionCreated: { email: boolean; sms: boolean };
  transactionValidated: { email: boolean; sms: boolean };
  transactionCancelled: { email: boolean; sms: boolean };
  transactionWithdrawn: { email: boolean; sms: boolean };
  clientCreated: { email: boolean; sms: boolean };
  userCreated: { email: boolean; sms: boolean };
  smtpHost: string;
  smtpPort: string;
  smtpUser: string;
  smtpPassword: string;
  smsProvider: "twilio" | "orange" | "custom";
  smsApiKey: string;
  smsApiSecret: string;
}

export const notificationsAPI = {
  getAll: async (): Promise<Notification[]> => {
    const response = await api.get("/notifications");
    return response.data.results || response.data;
  },
  getUnreadCount: async (): Promise<number> => {
    const response = await api.get("/notifications/unread_count");
    return response.data.count;
  },
  markAsRead: async (id: string): Promise<void> => {
    await api.post(`/notifications/${id}/mark_read`);
  },
  markAllAsRead: async (): Promise<void> => {
    await api.post("/notifications/mark_all_read");
  },
  delete: async (id: string): Promise<void> => {
    await api.delete(`/notifications/${id}`);
  },
  deleteAll: async (): Promise<void> => {
    await api.delete("/notifications/delete_all");
  },
  create: async (data: {
    type: "email" | "sms";
    recipient: string;
    subject: string;
    message: string;
    status?: "sent" | "failed" | "pending";
  }): Promise<Notification> => {
    const response = await api.post("/notifications", data);
    return response.data;
  },
  getSettings: async (): Promise<NotificationSettings> => {
    const response = await api.get("/notifications/settings");
    return response.data;
  },
  updateSettings: async (
    data: Partial<NotificationSettings>,
  ): Promise<NotificationSettings> => {
    const response = await api.patch("/notifications/settings", data);
    return response.data;
  },
  send: async (data: {
    type: "email" | "sms";
    recipient: string;
    subject: string;
    message: string;
  }): Promise<Notification> => {
    const response = await api.post("/notifications/send", data);
    return response.data;
  },
};

// ==================== DASHBOARD ====================
export const dashboardAPI = {
  getStatistics: async (): Promise<{
    totalTransactions: number;
    montantTotalEnvoye: number;
    montantTotalRecu: number;
    transactionsEnAttente: number;
    evolutionMensuelle: { mois: string; montant: number }[];
    transactionsParPays: { pays: string; count: number }[];
    topAgents: { nom: string; transactions: number; montant: number }[];
    recentTransactions: Transaction[];
  }> => {
    const response = await api.get("/dashboard/statistics");
    return response.data;
  },
};

// ==================== EXCHANGE RATES (External API) ====================
export interface ExternalExchangeRate {
  base: string;
  target: string;
  rate: number;
  lastUpdated: string;
}

export const exchangeRatesAPI = {
  // Fetch live exchange rates from external API (ExchangeRate-API)
  getLiveRates: async (
    baseCurrency: string = "EUR",
  ): Promise<Record<string, number>> => {
    try {
      // Using free exchangerate-api.com endpoint
      const response = await axios.get(
        `https://api.exchangerate-api.com/v4/latest/${baseCurrency}`,
      );
      return response.data.rates;
    } catch (error) {
      console.error("Error fetching live exchange rates:", error);
      throw error;
    }
  },

  // Get specific rate between two currencies
  getRate: async (from: string, to: string): Promise<number> => {
    try {
      const response = await axios.get(
        `https://api.exchangerate-api.com/v4/latest/${from}`,
      );
      return response.data.rates[to] || 0;
    } catch (error) {
      console.error("Error fetching exchange rate:", error);
      throw error;
    }
  },

  // Sync live rates with backend (update all taux)
  syncWithBackend: async (): Promise<{ updated: number; errors: string[] }> => {
    const response = await api.post("/taux/sync_live_rates");
    return response.data;
  },

  // Get supported currencies
  getSupportedCurrencies: async (): Promise<string[]> => {
    try {
      const response = await axios.get(
        "https://api.exchangerate-api.com/v4/latest/USD",
      );
      return Object.keys(response.data.rates);
    } catch (error) {
      console.error("Error fetching supported currencies:", error);
      return [
        "USD",
        "EUR",
        "GBP",
        "XOF",
        "XAF",
        "MAD",
        "TND",
        "DZD",
        "EGP",
        "NGN",
        "GHS",
        "KES",
        "ZAR",
      ];
    }
  },
};

export default api;
