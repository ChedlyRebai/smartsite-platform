import { useEffect, useState } from "react";
import { useAuthStore } from "../../store/authStore";
import { Button } from "../../components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "../../components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "../../components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../../components/ui/select";
import { Textarea } from "../../components/ui/textarea";
import { Label } from "../../components/ui/label";
import { Input } from "../../components/ui/input";
import { toast } from "react-hot-toast";
import { roleLabels } from "../../utils/roleConfig";
import type { User } from "../../types";

// Fonction pour générer un mot de passe aléatoire
function generateRandomPassword(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*';
  let password = '';
  for (let i = 0; i < 12; i++) {
    password += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return password;
}

function getUserCreatedAtLabel(user: any): string {
  const raw =
    user?.createdDate ??
    user?.createdAt ??
    user?.created_at ??
    user?.dateCreation ??
    user?.date_creation;
  if (!raw) return "N/A";
  const d = new Date(raw);
  if (Number.isNaN(d.getTime())) return "N/A";
  return d.toLocaleString("fr-FR");
}

export default function PendingUsers() {
  const getPendingUsers = useAuthStore((s) => s.getPendingUsers);
  const approveUser = useAuthStore((s) => s.approveUser);
  const rejectUser = useAuthStore((s) => s.rejectUser);
  const [users, setUsers] = useState<User[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [rejectDialogOpen, setRejectDialogOpen] = useState(false);
  const [rejectReason, setRejectReason] = useState("");
  const [isGeneratingReason, setIsGeneratingReason] = useState(false);
  const [roleFilter, setRoleFilter] = useState<string>("all");

  // États de pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [usersPerPage] = useState(6); // 6 utilisateurs par page

  const load = async () => {
    if (!getPendingUsers) return;
    setLoading(true);
    try {
      const res = await getPendingUsers();
      setUsers(res);
      setFilteredUsers(res); // Initialiser les utilisateurs filtrés
    } catch (err: any) {
      toast.error(err?.message || "Failed to load pending users");
    } finally {
      setLoading(false);
    }
  };

  // Filtrer les utilisateurs par role
  useEffect(() => {
    if (roleFilter === "all") {
      setFilteredUsers(users);
    } else {
      setFilteredUsers(users.filter(u => u.role?.name === roleFilter));
    }
    // Réinitialiser à la page 1 lors du filtrage
    setCurrentPage(1);
  }, [users, roleFilter]);

  // Calculer les utilisateurs pour la page actuelle
  const indexOfLastUser = currentPage * usersPerPage;
  const indexOfFirstUser = indexOfLastUser - usersPerPage;
  const currentUsers = filteredUsers.slice(indexOfFirstUser, indexOfLastUser);
  const totalPages = Math.ceil(filteredUsers.length / usersPerPage);

  useEffect(() => {
    load();
  }, []);

  const handleApprove = async (id: string) => {
    if (!approveUser) return;
    setActionLoading(id);
    try {
      // Générer un mot de passe automatiquement
      const autoPassword = generateRandomPassword();
      console.log('🔑 Mot de passe généré:', autoPassword);

      await approveUser(id, autoPassword);
      toast.success("User approved! Email sent with auto-generated password.");
      await load();
    } catch (err: any) {
      toast.error(err?.message || "Failed to approve user");
    } finally {
      setActionLoading(null);
    }
  };

  const handleReject = async (id: string) => {
    if (!rejectUser) return;
    if (!rejectReason.trim()) {
      toast.error("Veuillez spécifier un motif de rejet");
      return;
    }
    setActionLoading(id);
    try {
      await rejectUser(id, rejectReason);
      toast.success("Utilisateur rejeté. Email de notification envoyé.");
      setRejectDialogOpen(false);
      setRejectReason("");
      setSelectedUser(null);
      await load();
    } catch (err: any) {
      toast.error(err?.message || "Failed to reject user");
    } finally {
      setActionLoading(null);
    }
  };

  // Fonctions de pagination
  const goToPreviousPage = () => {
    setCurrentPage(prev => Math.max(prev - 1, 1));
  };

  const goToNextPage = () => {
    setCurrentPage(prev => Math.min(prev + 1, totalPages));
  };

  const goToPage = (pageNumber: number) => {
    setCurrentPage(pageNumber);
  };

  const openRejectDialog = (user: User) => {
    setSelectedUser(user);
    setRejectDialogOpen(true);
  };

  // Obtenir la liste des roles uniques pour le filtre
  const uniqueRoles = Array.from(new Set(users.map(u => u.role?.name).filter(Boolean)));

  // Fonction pour obtenir le label du rôle
  const getRoleLabel = (role: any) => {
    if (!role) return "Rôle non défini";
    if (typeof role === 'object' && role.name) {
      return roleLabels[role.name] || "Rôle non défini";
    }
    if (typeof role === 'string') {
      return roleLabels[role] || "Rôle non défini";
    }
    // Si c'est un document contenant _id, essayer de mapper l'id du rôle
    if (typeof role === 'object' && role._id) {
      const roleMap: { [key: string]: string } = {
        '699e1c79ccc723bcf4a61cad': 'super_admin',
        '699e1c79ccc723bcf4a61cae': 'director',
        '699e1c79ccc723bcf4a61caf': 'project_manager',
        '699e1c79ccc723bcf4a61cb0': 'site_manager',
        '699e1c79ccc723bcf4a61cb1': 'works_manager',
        '699e1c79ccc723bcf4a61cb2': 'accountant',
        '699e1c79ccc723bcf4a61cb3': 'procurement_manager',
        '699e1c79ccc723bcf4a61cb4': 'qhse_manager',
        '699e1c79ccc723bcf4a61cb5': 'client',
        '699e1c79ccc723bcf4a61cb6': 'subcontractor',
        '699e1c79ccc723bcf4a61cb7': 'user',
      };

      const roleId = String(role._id);
      return roleMap[roleId] ? (roleLabels as any)[roleMap[roleId]] || roleMap[roleId] : "Rôle non défini";
    }

    return roleLabels[role] || "Rôle non défini";
  };

  // Fonction pour générer un motif de rejet avec IA
  const generateRejectReason = async () => {
    if (!selectedUser) return;

    setIsGeneratingReason(true);
    try {
      // Créer un prompt pour l'IA
      const prompt = `Génère un motif de rejet professionnel et courtois pour l'utilisateur suivant:
      
Nom: ${(selectedUser as any).firstname || (selectedUser as any).firstName} ${(selectedUser as any).lastname || (selectedUser as any).lastName}
Email: ${selectedUser.email || "N/A"}
CIN: ${(selectedUser as any).cin || "N/A"}
Rôle demandé: ${getRoleLabel(selectedUser.role?.name) || "Rôle non défini"}

Le motif doit être:
- Professionnel et courtois
- Spécifique au contexte de l'inscription
- Constructif si possible
- En français
- Concis mais complet (2-3 phrases maximum)
- Inclure une suggestion pour améliorer le profil de l'utilisateur`;

      // Appeler une API de génération de texte (simulé pour l'instant)
      // Dans un vrai cas, vous appelleriez une API comme OpenAI, Claude, etc.
      await new Promise(resolve => setTimeout(resolve, 1500)); // Simulation de chargement

      const generatedReason = `Après examen de votre demande d'inscription en tant que ${getRoleLabel(selectedUser.role?.name) || "candidat"}, nous regrettons de vous informer que votre profil ne correspond pas actuellement aux critères requis pour ce rôle. Nous vous encourageons à consulter nos exigences et à soumettre une nouvelle candidature lorsque vous aurez complété les qualifications nécessaires. Pour améliorer votre profil, nous vous suggérons de fournir plus d'informations sur vos expériences professionnelles et de mettre à jour vos compétences.`;

      setRejectReason(generatedReason);
      toast.success("Motif de rejet généré avec succès !");
    } catch (error) {
      console.error("Erreur lors de la génération du motif:", error);
      toast.error("Erreur lors de la génération du motif de rejet");
    } finally {
      setIsGeneratingReason(false);
    }
  };

  return (
    <div className="container mx-auto p-4">
      <Card>
        <CardHeader>
          <CardTitle>Utilisateurs en attente d'approbation</CardTitle>
        </CardHeader>
        <CardContent>
          {/* Filtre par role */}
          <div className="mb-4 flex items-center gap-4">
            <Label htmlFor="role-filter">Filtrer par role:</Label>
            <Select value={roleFilter} onValueChange={setRoleFilter}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Tous les roles" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tous les roles</SelectItem>
                {uniqueRoles.map(role => (
                  <SelectItem key={role} value={role}>
                    {getRoleLabel(role)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {loading ? (
            <div className="text-sm text-gray-500">Chargement...</div>
          ) : filteredUsers.length === 0 ? (
            <div className="text-sm text-gray-500">
              {users.length === 0 ? "Aucun utilisateur en attente" : "Aucun utilisateur trouvé pour ce filtre"}
            </div>
          ) : (
            <div className="space-y-3">
              {currentUsers.map((u) => (
                <div
                  key={u._id}
                  className="flex items-center justify-between p-3 border rounded-md cursor-pointer hover:bg-gray-50"
                  onClick={() => {
                    setSelectedUser(u);
                    setDetailsOpen(true);
                  }}
                >
                  <div>
                    <div className="font-semibold">
                      {(u as any).firstname || (u as any).firstName}{" "}
                      {(u as any).lastname || (u as any).lastName}
                    </div>
                    <div className="text-sm text-gray-600 space-y-1">
                      <div>
                        <span className="font-medium">CIN:</span>{" "}
                        {(u as any).cin || "N/A"}
                      </div>
                      <div>
                        <span className="font-medium">Email:</span>{" "}
                        {u.email || "N/A"}
                      </div>
                      <div>
                        <span className="font-medium">Téléphone:</span>{" "}
                        {(u as any).telephone || (u as any).phone || "N/A"}
                      </div>
                      <div>
                        <span className="font-medium">Adresse:</span>{" "}
                        {(u as any).address || (u as any).adresse || "N/A"}
                      </div>
                      <div>
                        <span className="font-medium">Rôle:</span>{" "}
                        {getRoleLabel(u.role)}
                      </div>
                      <div className="text-xs text-gray-400">
                        <span className="font-medium">Statut:</span>{" "}
                        {(u as any).status || "pending"}
                      </div>
                      <div className="text-xs text-gray-400">
                        <span className="font-medium">Créé le:</span>{" "}
                        {getUserCreatedAtLabel(u)}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleApprove(u._id);
                      }}
                      disabled={actionLoading !== null}
                    >
                      {actionLoading === u._id ? "..." : "Approuver"}
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        openRejectDialog(u);
                      }}
                      disabled={actionLoading !== null}
                    >
                      {actionLoading === u._id ? "..." : "Rejeter"}
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Détails utilisateur en attente */}
      <Dialog open={detailsOpen} onOpenChange={(open) => {
        setDetailsOpen(open);
        if (!open) setSelectedUser(null);
      }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Détails de l'utilisateur en attente</DialogTitle>
          </DialogHeader>
          {selectedUser && (
            <div className="space-y-2 text-sm">
              <p><span className="font-semibold">Nom complet :</span> {(selectedUser as any).firstname || (selectedUser as any).firstName} {(selectedUser as any).lastname || (selectedUser as any).lastName}</p>
              <p><span className="font-semibold">CIN :</span> {(selectedUser as any).cin || "N/A"}</p>
              <p><span className="font-semibold">Email :</span> {selectedUser.email || "N/A"}</p>
              <p><span className="font-semibold">Téléphone :</span> {(selectedUser as any).telephone || (selectedUser as any).phone || "N/A"}</p>
              <p><span className="font-semibold">Adresse :</span> {(selectedUser as any).address || (selectedUser as any).adresse || "N/A"}</p>
              <p><span className="font-semibold">Rôle :</span> {getRoleLabel(selectedUser.role) || "Rôle non défini"}</p>
              <p><span className="font-semibold">Statut :</span> {(selectedUser as any).status || "pending"}</p>
              <p><span className="font-semibold">Créé le :</span> {getUserCreatedAtLabel(selectedUser)}</p>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Dialogue de rejet */}
      <Dialog open={rejectDialogOpen} onOpenChange={(open) => {
        setRejectDialogOpen(open);
        if (!open) {
          setRejectReason("");
          setSelectedUser(null);
        }
      }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Rejeter l'utilisateur</DialogTitle>
          </DialogHeader>
          {selectedUser && (
            <div className="space-y-4">
              <div className="text-sm">
                <p><span className="font-semibold">Utilisateur :</span> {(selectedUser as any).firstname || (selectedUser as any).firstName} {(selectedUser as any).lastname || (selectedUser as any).lastName}</p>
                <p><span className="font-semibold">Email :</span> {selectedUser.email || "N/A"}</p>
                <p><span className="font-semibold">CIN :</span> {(selectedUser as any).cin || "N/A"}</p>
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="reject-reason">Motif du rejet *</Label>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={generateRejectReason}
                    disabled={isGeneratingReason}
                    className="text-xs"
                  >
                    {isGeneratingReason ? (
                      <>
                        <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-gray-900 mr-2"></div>
                        Génération...
                      </>
                    ) : (
                      <>
                        ✨ Générer avec IA
                      </>
                    )}
                  </Button>
                </div>
                <Textarea
                  id="reject-reason"
                  placeholder="Veuillez spécifier la raison du rejet..."
                  value={rejectReason}
                  onChange={(e) => setRejectReason(e.target.value)}
                  rows={4}
                />
              </div>

              <div className="flex justify-end gap-2">
                <Button
                  variant="outline"
                  onClick={() => setRejectDialogOpen(false)}
                  disabled={actionLoading !== null}
                >
                  Annuler
                </Button>
                <Button
                  variant="destructive"
                  onClick={() => selectedUser && handleReject(selectedUser._id)}
                  disabled={actionLoading !== null || !rejectReason.trim()}
                >
                  {actionLoading === selectedUser._id ? "Rejet en cours..." : "Rejeter et envoyer email"}
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2 mt-6">
          <Button
            variant="outline"
            size="sm"
            onClick={goToPreviousPage}
            disabled={currentPage === 1}
          >
            Précédent
          </Button>

          <div className="flex gap-1">
            {Array.from({ length: totalPages }, (_, i) => i + 1).map(pageNum => (
              <Button
                key={pageNum}
                variant={currentPage === pageNum ? "default" : "outline"}
                size="sm"
                onClick={() => goToPage(pageNum)}
                className="w-8 h-8 p-0"
              >
                {pageNum}
              </Button>
            ))}
          </div>

          <Button
            variant="outline"
            size="sm"
            onClick={goToNextPage}
            disabled={currentPage === totalPages}
          >
            Suivant
          </Button>
        </div>
      )}
    </div>
  );
}
