const API_URL = "http://localhost:3001";

export interface Article {
  _id?: string;
  code: string;
  designation: string;
  description?: string;
  unite: string;
  categorie?: string;
  sousCategorie?: string;
  marque?: string;
  referenceFournisseur?: string;
  stock?: number;
  stockMinimum?: number;
  prixReference?: number;
  tauxTva?: number;
  uniteStock?: string;
  origine?: string;
  reference?: string;
  estActif?: boolean;
  notes?: string;
  tags?: string[];
  createdAt?: string;
  updatedAt?: string;
}

// Catégories disponibles pour les matériaux BTP
export const categoriesOptions = [
  "béton",
  "fer",
  "acier",
  "électricité",
  "plomberie",
  "bois",
  "sable",
  "gravier",
  "ciment",
  "brique",
  "carrelage",
  "peinture",
  "isolation",
  "toiture",
  "menuiserie",
  "vitrerie",
  "équipements",
  "services",
  "autres",
];

// Unités disponibles
export const unitesOptions = [
  "piece",
  "kg",
  "tonne",
  "m3",
  "m2",
  "ml",
  "sachet",
  "rouleau",
  "palette",
];

export async function getArticles(): Promise<Article[]> {
  try {
    const response = await fetch(`${API_URL}/articles`);
    if (!response.ok) throw new Error("Failed to fetch articles");
    return await response.json();
  } catch (error) {
    console.error("Error fetching articles:", error);
    return [];
  }
}

export async function getArticleById(id: string): Promise<Article | null> {
  try {
    const response = await fetch(`${API_URL}/articles/${id}`);
    if (!response.ok) throw new Error("Failed to fetch article");
    return await response.json();
  } catch (error) {
    console.error("Error fetching article:", error);
    return null;
  }
}

export async function createArticle(
  data: Partial<Article>,
): Promise<Article | null> {
  try {
    const response = await fetch(`${API_URL}/articles`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    if (!response.ok) throw new Error("Failed to create article");
    return await response.json();
  } catch (error) {
    console.error("Error creating article:", error);
    return null;
  }
}

export async function updateArticle(
  id: string,
  data: Partial<Article>,
): Promise<Article | null> {
  try {
    const response = await fetch(`${API_URL}/articles/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    if (!response.ok) throw new Error("Failed to update article");
    return await response.json();
  } catch (error) {
    console.error("Error updating article:", error);
    return null;
  }
}

export async function deleteArticle(id: string): Promise<boolean> {
  try {
    const response = await fetch(`${API_URL}/articles/${id}`, {
      method: "DELETE",
    });
    return response.ok;
  } catch (error) {
    console.error("Error deleting article:", error);
    return false;
  }
}

export async function searchArticles(term: string): Promise<Article[]> {
  try {
    const response = await fetch(
      `${API_URL}/articles/search?q=${encodeURIComponent(term)}`,
    );
    if (!response.ok) throw new Error("Failed to search articles");
    return await response.json();
  } catch (error) {
    console.error("Error searching articles:", error);
    return [];
  }
}

export async function getLowStockArticles(): Promise<Article[]> {
  try {
    const response = await fetch(`${API_URL}/articles/low-stock`);
    if (!response.ok) throw new Error("Failed to fetch low stock articles");
    return await response.json();
  } catch (error) {
    console.error("Error fetching low stock articles:", error);
    return [];
  }
}

export async function getArticlesByCategorie(
  categorie: string,
): Promise<Article[]> {
  try {
    const response = await fetch(`${API_URL}/articles/categorie/${categorie}`);
    if (!response.ok) throw new Error("Failed to fetch articles by categorie");
    return await response.json();
  } catch (error) {
    console.error("Error fetching articles by categorie:", error);
    return [];
  }
}
