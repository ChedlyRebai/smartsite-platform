const API_URL = "http://localhost:3001";

export interface PrixArticle {
  _id?: string;
  fournisseurId: any;
  articleId: any;
  prixUnitaire: number;
  tauxTva?: number;
  dateDebut?: string;
  dateFin?: string;
  estActif?: boolean;
  notes?: string;
  prixPrecedent?: number;
  dateModification?: string;
  createdAt?: string;
  updatedAt?: string;
}

export async function getPrixArticles(): Promise<PrixArticle[]> {
  try {
    const response = await fetch(`${API_URL}/prix-articles`);
    if (!response.ok) throw new Error("Failed to fetch prix articles");
    return await response.json();
  } catch (error) {
    console.error("Error fetching prix articles:", error);
    return [];
  }
}

export async function getPrixActif(): Promise<PrixArticle[]> {
  try {
    const response = await fetch(`${API_URL}/prix-articles?actif=true`);
    if (!response.ok) throw new Error("Failed to fetch prix articles");
    return await response.json();
  } catch (error) {
    console.error("Error fetching prix articles:", error);
    return [];
  }
}

export async function getPrixByFournisseur(
  fournisseurId: string,
): Promise<PrixArticle[]> {
  try {
    const response = await fetch(
      `${API_URL}/prix-articles/fournisseur/${fournisseurId}`,
    );
    if (!response.ok) throw new Error("Failed to fetch prix articles");
    return await response.json();
  } catch (error) {
    console.error("Error fetching prix articles:", error);
    return [];
  }
}

export async function getPrixByArticle(
  articleId: string,
): Promise<PrixArticle[]> {
  try {
    const response = await fetch(
      `${API_URL}/prix-articles/article/${articleId}`,
    );
    if (!response.ok) throw new Error("Failed to fetch prix articles");
    return await response.json();
  } catch (error) {
    console.error("Error fetching prix articles:", error);
    return [];
  }
}

export async function getComparaisonPrix(
  articleId: string,
): Promise<PrixArticle[]> {
  try {
    const response = await fetch(
      `${API_URL}/prix-articles/comparaison/${articleId}`,
    );
    if (!response.ok) throw new Error("Failed to fetch comparaison");
    return await response.json();
  } catch (error) {
    console.error("Error fetching comparaison:", error);
    return [];
  }
}

export async function getHistoriquePrix(
  fournisseurId: string,
  articleId: string,
): Promise<PrixArticle[]> {
  try {
    const response = await fetch(
      `${API_URL}/prix-articles/historique/${fournisseurId}/${articleId}`,
    );
    if (!response.ok) throw new Error("Failed to fetch historique");
    return await response.json();
  } catch (error) {
    console.error("Error fetching historique:", error);
    return [];
  }
}

export async function createPrixArticle(
  data: Partial<PrixArticle>,
): Promise<PrixArticle | null> {
  try {
    const response = await fetch(`${API_URL}/prix-articles`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    if (!response.ok) throw new Error("Failed to create prix article");
    return await response.json();
  } catch (error) {
    console.error("Error creating prix article:", error);
    return null;
  }
}

export async function updatePrix(
  fournisseurId: string,
  articleId: string,
  nouveauPrix: number,
  tauxTva?: number,
): Promise<PrixArticle | null> {
  try {
    const response = await fetch(`${API_URL}/prix-articles/update-prix`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ fournisseurId, articleId, nouveauPrix, tauxTva }),
    });
    if (!response.ok) throw new Error("Failed to update prix");
    return await response.json();
  } catch (error) {
    console.error("Error updating prix:", error);
    return null;
  }
}
