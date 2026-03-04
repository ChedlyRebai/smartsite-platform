const API_URL = "http://localhost:3001";

export interface FournisseurContact {
  nom: string;
  fonction: string;
  telephone: string;
  email: string;
  estPrincipal: boolean;
}

export interface Interaction {
  date?: Date;
  type: "commande" | "retard" | "reclamation" | "paiement";
  description: string;
  montant?: number;
  evaluation?: number;
}

export interface Fournisseur {
  _id?: string;
  nom: string;
  adresse?: string;
  ville?: string;
  codePostal?: string;
  pays?: string;
  zoneGeographique?: string;
  telephone?: string;
  email?: string;
  siteWeb?: string;
  registreCommerce?: string;
  matriculeFiscale?: string;
  nif?: string;
  nis?: string;
  siret?: string;
  iban?: string;
  banque?: string;
  conditionsPaiement?: string;
  delaiLivraison?: number;
  remise?: number;
  noteFiabilite?: number;
  noteQualite?: number;
  noteRespectDelais?: number;
  notes?: string;
  statut?: "preferentiel" | "occasionnel" | "a_risque" | "inactif";
  estActif?: boolean;
  estArchive?: boolean;
  categories?: string[];
  contacts?: FournisseurContact[];
  historiqueInteractions?: Interaction[];
  chiffreAffaires?: number;
  dateDerniereCommande?: Date;
  nombreRetards?: number;
  personneContact?: string;
  telephoneContact?: string;
  createdAt?: string;
  updatedAt?: string;
}

export async function getFournisseurs(): Promise<Fournisseur[]> {
  try {
    const response = await fetch(`${API_URL}/fournisseurs`);
    if (!response.ok) throw new Error("Failed to fetch fournisseurs");
    return await response.json();
  } catch (error) {
    console.error("Error fetching fournisseurs:", error);
    return [];
  }
}

export async function getFournisseurById(
  id: string,
): Promise<Fournisseur | null> {
  try {
    const response = await fetch(`${API_URL}/fournisseurs/${id}`);
    if (!response.ok) throw new Error("Failed to fetch fournisseur");
    return await response.json();
  } catch (error) {
    console.error("Error fetching fournisseur:", error);
    return null;
  }
}

export async function createFournisseur(
  data: Partial<Fournisseur>,
): Promise<Fournisseur | null> {
  try {
    const response = await fetch(`${API_URL}/fournisseurs`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    if (!response.ok) throw new Error("Failed to create fournisseur");
    return await response.json();
  } catch (error) {
    console.error("Error creating fournisseur:", error);
    return null;
  }
}

export async function updateFournisseur(
  id: string,
  data: Partial<Fournisseur>,
): Promise<Fournisseur | null> {
  try {
    const response = await fetch(`${API_URL}/fournisseurs/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    if (!response.ok) throw new Error("Failed to update fournisseur");
    return await response.json();
  } catch (error) {
    console.error("Error updating fournisseur:", error);
    return null;
  }
}

export async function deleteFournisseur(id: string): Promise<boolean> {
  try {
    const response = await fetch(`${API_URL}/fournisseurs/${id}`, {
      method: "DELETE",
    });
    return response.ok;
  } catch (error) {
    console.error("Error deleting fournisseur:", error);
    return false;
  }
}

export async function searchFournisseurs(nom: string): Promise<Fournisseur[]> {
  try {
    const response = await fetch(
      `${API_URL}/fournisseurs/search?nom=${encodeURIComponent(nom)}`,
    );
    if (!response.ok) throw new Error("Failed to search fournisseurs");
    return await response.json();
  } catch (error) {
    console.error("Error searching fournisseurs:", error);
    return [];
  }
}

export async function archiveFournisseur(
  id: string,
): Promise<Fournisseur | null> {
  try {
    const response = await fetch(`${API_URL}/fournisseurs/${id}/archive`, {
      method: "PUT",
    });
    if (!response.ok) throw new Error("Failed to archive fournisseur");
    return await response.json();
  } catch (error) {
    console.error("Error archiving fournisseur:", error);
    return null;
  }
}

export async function unarchiveFournisseur(
  id: string,
): Promise<Fournisseur | null> {
  try {
    const response = await fetch(`${API_URL}/fournisseurs/${id}/unarchive`, {
      method: "PUT",
    });
    if (!response.ok) throw new Error("Failed to unarchive fournisseur");
    return await response.json();
  } catch (error) {
    console.error("Error unarchiving fournisseur:", error);
    return null;
  }
}

export async function updateFournisseurNotes(
  id: string,
  notes: {
    noteFiabilite?: number;
    noteQualite?: number;
    noteRespectDelais?: number;
  },
): Promise<Fournisseur | null> {
  try {
    const response = await fetch(`${API_URL}/fournisseurs/${id}/notes`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(notes),
    });
    if (!response.ok) throw new Error("Failed to update notes");
    return await response.json();
  } catch (error) {
    console.error("Error updating notes:", error);
    return null;
  }
}

export async function addInteraction(
  id: string,
  interaction: Interaction,
): Promise<Fournisseur | null> {
  try {
    const response = await fetch(`${API_URL}/fournisseurs/${id}/interactions`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(interaction),
    });
    if (!response.ok) throw new Error("Failed to add interaction");
    return await response.json();
  } catch (error) {
    console.error("Error adding interaction:", error);
    return null;
  }
}
