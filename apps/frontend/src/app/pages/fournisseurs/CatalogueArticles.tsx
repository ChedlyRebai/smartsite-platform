import { useEffect, useState } from 'react';
import { Package } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { Badge } from '../../components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '../../components/ui/dialog';
import { toast } from 'sonner';
import { useAuthStore } from '../../store/authStore';
import { canEdit, canView } from '../../utils/permissions';
import { Article, getArticles, createArticle, deleteArticle } from '../../action/article.action';

export default function CatalogueArticles() {
  const [articles, setArticles] = useState<Article[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);

  // Permission check - use 'fournisseurs' permission for full manage access
  const user = useAuthStore((state) => state.user);
  const canManageFournisseurs = user && canEdit(user.role.name, 'fournisseurs');

  const [newArticle, setNewArticle] = useState({
    code: '',
    designation: '',
    unite: 'piece',
    categorie: 'matériaux',
    marque: '',
    stock: 0,
    stockMinimum: 0,
  });

  const loadArticles = async () => {
    setLoading(true);
    const data = await getArticles();
    setArticles(data);
    setLoading(false);
  };

  useEffect(() => {
    loadArticles();
  }, []);

  const handleCreateArticle = async () => {
    if (!newArticle.code || !newArticle.designation || !newArticle.unite) {
      toast.error('Code, désignation et unité sont obligatoires');
      return;
    }

    const result = await createArticle(newArticle);
    if (result) {
      toast.success('Article créé avec succès');
      setDialogOpen(false);
      setNewArticle({
        code: '',
        designation: '',
        unite: 'piece',
        categorie: 'matériaux',
        marque: '',
        stock: 0,
        stockMinimum: 0,
      });
      loadArticles();
    } else {
      toast.error('Erreur lors de la création');
    }
  };

  const handleDeleteArticle = async (id: string) => {
    if (confirm('Voulez-vous vraiment supprimer cet article?')) {
      const success = await deleteArticle(id);
      if (success) {
        toast.success('Article supprimé');
        loadArticles();
      } else {
        toast.error('Erreur lors de la suppression');
      }
    }
  };

  const categories = ['matériaux', 'équipements', 'services', 'sous-traitance'];
  const unites = ['piece', 'kg', 'tonne', 'm3', 'm2', 'ml', 'sachet', 'rouleau'];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Catalogue Articles</h1>
          <p className="text-gray-500 mt-1">Gérer le catalogue des articles et matériaux</p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button 
              className="bg-gradient-to-r from-blue-600 to-green-600 hover:from-blue-700 hover:to-green-700"
              disabled={!canManageFournisseurs}
            >
              + Ajouter un Article
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Nouvel Article</DialogTitle>
              <DialogDescription>
                Ajouter un nouvel article au catalogue
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Code Article</Label>
                  <Input
                    placeholder="CIM-001"
                    value={newArticle.code}
                    onChange={(e) => setNewArticle({ ...newArticle, code: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Catégorie</Label>
                  <select
                    className="w-full px-3 py-2 border rounded-md"
                    value={newArticle.categorie}
                    onChange={(e) => setNewArticle({ ...newArticle, categorie: e.target.value })}
                  >
                    {categories.map((cat) => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="space-y-2">
                <Label>Désignation</Label>
                <Input
                  placeholder="Ciment CPJ 45"
                  value={newArticle.designation}
                  onChange={(e) => setNewArticle({ ...newArticle, designation: e.target.value })}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Unité</Label>
                  <select
                    className="w-full px-3 py-2 border rounded-md"
                    value={newArticle.unite}
                    onChange={(e) => setNewArticle({ ...newArticle, unite: e.target.value })}
                  >
                    {unites.map((u) => (
                      <option key={u} value={u}>{u}</option>
                    ))}
                  </select>
                </div>
                <div className="space-y-2">
                  <Label>Marque</Label>
                  <Input
                    placeholder="Ciments Bizerte"
                    value={newArticle.marque}
                    onChange={(e) => setNewArticle({ ...newArticle, marque: e.target.value })}
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Stock</Label>
                  <Input
                    type="number"
                    value={newArticle.stock}
                    onChange={(e) => setNewArticle({ ...newArticle, stock: parseInt(e.target.value) })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Stock Minimum</Label>
                  <Input
                    type="number"
                    value={newArticle.stockMinimum}
                    onChange={(e) => setNewArticle({ ...newArticle, stockMinimum: parseInt(e.target.value) })}
                  />
                </div>
              </div>
              <Button 
                className="w-full bg-gradient-to-r from-blue-600 to-green-600"
                onClick={handleCreateArticle}
              >
                Créer l'Article
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Package className="h-5 w-5" />
            Liste des Articles
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <p>Chargement...</p>
          ) : articles.length === 0 ? (
            <p className="text-gray-500">Aucun article trouvé</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-3 px-4">Code</th>
                    <th className="text-left py-3 px-4">Désignation</th>
                    <th className="text-left py-3 px-4">Catégorie</th>
                    <th className="text-left py-3 px-4">Unité</th>
                    <th className="text-left py-3 px-4">Marque</th>
                    <th className="text-left py-3 px-4">Stock</th>
                    <th className="text-left py-3 px-4">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {articles.map((article) => (
                    <tr key={article._id} className="border-b hover:bg-gray-50">
                      <td className="py-3 px-4 font-medium">{article.code}</td>
                      <td className="py-3 px-4">{article.designation}</td>
                      <td className="py-3 px-4">
                        <Badge variant="secondary">{article.categorie}</Badge>
                      </td>
                      <td className="py-3 px-4">{article.unite}</td>
                      <td className="py-3 px-4">{article.marque || '-'}</td>
                      <td className="py-3 px-4">
                        <span className={article.stock <= article.stockMinimum ? 'text-red-600 font-bold' : ''}>
                          {article.stock} {article.unite}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <Button 
                          variant="destructive" 
                          size="sm"
                          disabled={!canManageFournisseurs}
                          onClick={() => article._id && handleDeleteArticle(article._id)}
                        >
                          Supprimer
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
