import { useEffect, useState } from "react";
import { useAuthStore } from "../../store/authStore";
import { Button } from "../../components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "../../components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "../../components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../../components/ui/select";
import { Textarea } from "../../components/ui/textarea";
import { Label } from "../../components/ui/label";
import { Input } from "../../components/ui/input";
import { toast } from "react-hot-toast";
import { roleLabels } from "../../utils/roleConfig";
import type { User } from "../../types";

// Fonction pour générer un mot de passe aléatoire
function generateRandomPassword(): string {
  const chars =
    "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*";
  let password = "";
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
  return d.toLocaleString("en-US");
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
      setFilteredUsers(users.filter((u) => u.role?.name === roleFilter));
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
      console.log("🔑 Mot de passe généré:", autoPassword);

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
      toast.error("Please specify a rejection reason");
      return;
    }
    setActionLoading(id);
    try {
      await rejectUser(id, rejectReason);
      toast.success("User rejected. Notification email sent.");
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
    setCurrentPage((prev) => Math.max(prev - 1, 1));
  };

  const goToNextPage = () => {
    setCurrentPage((prev) => Math.min(prev + 1, totalPages));
  };

  const goToPage = (pageNumber: number) => {
    setCurrentPage(pageNumber);
  };

  const openRejectDialog = (user: User) => {
    setSelectedUser(user);
    setRejectDialogOpen(true);
  };

  // Obtenir la liste des roles uniques pour le filtre
  const uniqueRoles = Array.from(
    new Set(users.map((u) => u.role?.name).filter(Boolean)),
  );

  // Fonction pour obtenir le label du rôle
  const getRoleLabel = (role: any) => {
    if (!role) return "Role not defined";
    if (typeof role === "object" && role.name) {
      return roleLabels[role.name] || "Role not defined";
    }
    if (typeof role === "string") {
      return roleLabels[role] || "Role not defined";
    }
    // Si c'est un document contenant _id, essayer de mapper l'id du rôle
    if (typeof role === "object" && role._id) {
      const roleMap: { [key: string]: string } = {
        "699e1c79ccc723bcf4a61cad": "super_admin",
        "699e1c79ccc723bcf4a61cae": "director",
        "699e1c79ccc723bcf4a61caf": "project_manager",
        "699e1c79ccc723bcf4a61cb0": "site_manager",
        "699e1c79ccc723bcf4a61cb1": "works_manager",
        "699e1c79ccc723bcf4a61cb2": "accountant",
        "699e1c79ccc723bcf4a61cb3": "procurement_manager",
        "699e1c79ccc723bcf4a61cb4": "qhse_manager",
        "699e1c79ccc723bcf4a61cb5": "client",
        "699e1c79ccc723bcf4a61cb6": "subcontractor",
        "699e1c79ccc723bcf4a61cb7": "user",
      };

      const roleId = String(role._id);
      return roleMap[roleId]
        ? (roleLabels as any)[roleMap[roleId]] || roleMap[roleId]
        : "Role not defined";
    }

    return roleLabels[role] || "Role not defined";
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
      await new Promise((resolve) => setTimeout(resolve, 1500)); // Simulation de chargement

      const generatedReason = `Après examen de votre demande d'inscription en tant que ${getRoleLabel(selectedUser.role?.name) || "candidat"}, nous regrettons de vous informer que votre profil ne correspond pas actuellement aux critères requis pour ce rôle. Nous vous encourageons à consulter nos exigences et à soumettre une nouvelle candidature lorsque vous aurez complété les qualifications nécessaires. Pour améliorer votre profil, nous vous suggérons de fournir plus d'informations sur vos expériences professionnelles et de mettre à jour vos compétences.`;

      setRejectReason(generatedReason);
      toast.success("Rejection reason generated successfully!");
    } catch (error) {
      console.error("Erreur lors de la génération du motif:", error);
      toast.error("Error generating rejection reason");
    } finally {
      setIsGeneratingReason(false);
    }
  };

  return (
    <div className="container mx-auto p-4">
      <Card>
        <CardHeader>
          <CardTitle>Users Pending Approval</CardTitle>
        </CardHeader>
        <CardContent>
          {/* Filtre par role */}
          <div className="mb-4 flex items-center gap-4">
            <Label htmlFor="role-filter">Filter by role:</Label>
            <Select value={roleFilter} onValueChange={setRoleFilter}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="All roles" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All roles</SelectItem>
                {uniqueRoles.map((role) => (
                  <SelectItem key={role} value={role}>
                    {getRoleLabel(role)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {loading ? (
            <div className="text-sm text-gray-500">Loading...</div>
          ) : filteredUsers.length === 0 ? (
            <div className="text-sm text-gray-500">
              {users.length === 0
                ? "No pending users"
                : "No users found for this filter"}
            </div>
          ) : (
            <div className="space-y-3">
              {currentUsers.map((u) => (
                <div
                  key={u._id}
                  onClick={() => {
                    setSelectedUser(u);
                    setDetailsOpen(true);
                  }}
                  className="flex items-center justify-between p-3 border rounded-md cursor-pointer hover:bg-gray-50 transition-colors"
                >
                  <div>
                    <div className="font-semibold">
                      {(u as any).firstName || (u as any).firstName}{" "}
                      {(u as any).lastName || (u as any).lastName}
                      {(u as any).firstName || (u as any).firstName}{" "}
                      {(u as any).lastName || (u as any).lastName}
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
                        <span className="font-medium">Phone:</span>{" "}
                        {(u as any).phoneNumber || (u as any).phone || "N/A"}
                      </div>
                      <div>
                        <span className="font-medium">Address:</span>{" "}
                        {(u as any).address || (u as any).adresse || "N/A"}
                      </div>
                      <div>
                        <span className="font-medium">Role:</span>{" "}
                        {getRoleLabel(u.role)}
                      </div>
                      <div className="text-xs text-gray-400">
                        <span className="font-medium">Status:</span>{" "}
                        {(u as any).status || "pending"}
                      </div>
                      <div className="text-xs text-gray-400">
                        <span className="font-medium">Created:</span>{" "}
                        {getUserCreatedAtLabel(u)}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      size="sm"
                      onClick={() => handleApprove(u._id)}
                      disabled={actionLoading !== null}
                    >
                      {actionLoading === u._id ? "..." : "Approve"}
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
                      {actionLoading === u._id ? "..." : "Reject"}
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Pending user details */}
      <Dialog
        open={detailsOpen}
        onOpenChange={(open) => {
          setDetailsOpen(open);
          if (!open) setSelectedUser(null);
        }}
      >
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Détails complets de l'utilisateur</DialogTitle>
          </DialogHeader>
          {selectedUser && (
            <div className="space-y-4 text-sm">
              {/* Informations personnelles */}
              <div className="border-b pb-4">
                <h3 className="font-semibold text-base mb-3">Informations personnelles</h3>
                <div className="grid grid-cols-2 gap-4">
                  <p>
                    <span className="font-medium">Prénom:</span>{" "}
                    {(selectedUser as any).firstName || (selectedUser as any).firstname || "N/A"}
                  </p>
                  <p>
                    <span className="font-medium">Nom:</span>{" "}
                    {(selectedUser as any).lastName || (selectedUser as any).lastname || "N/A"}
                  </p>
                  <p>
                    <span className="font-medium">CIN:</span>{" "}
                    {(selectedUser as any).cin || "N/A"}
                  </p>
                  <p>
                    <span className="font-medium">Email:</span>{" "}
                    {selectedUser.email || "N/A"}
                  </p>
                  <p>
                    <span className="font-medium">Téléphone:</span>{" "}
                    {(selectedUser as any).telephone || (selectedUser as any).phone || (selectedUser as any).phoneNumber || "N/A"}
                  </p>
                  <p>
                    <span className="font-medium">Rôle demandé:</span>{" "}
                    {getRoleLabel(selectedUser.role) || "Non défini"}
                  </p>
                </div>
              </div>

              {/* Adresse et localisation */}
              <div className="border-b pb-4">
                <h3 className="font-semibold text-base mb-3">Adresse et localisation</h3>
                <div className="grid grid-cols-2 gap-4">
                  <p className="col-span-2">
                    <span className="font-medium">Adresse:</span>{" "}
                    {(selectedUser as any).address || (selectedUser as any).adresse || (selectedUser as any).addressLine || "N/A"}
                  </p>
                  <p>
                    <span className="font-medium">Ville:</span>{" "}
                    {(selectedUser as any).city || (selectedUser as any).ville || "N/A"}
                  </p>
                  <p>
                    <span className="font-medium">Code postal:</span>{" "}
                    {(selectedUser as any).postalCode || (selectedUser as any).codePostal || "N/A"}
                  </p>
                  <p>
                    <span className="font-medium">Pays:</span>{" "}
                    {(selectedUser as any).country || (selectedUser as any).pays || "N/A"}
                  </p>
                </div>
              </div>

              {/* Informations du compte */}
              <div className="border-b pb-4">
                <h3 className="font-semibold text-base mb-3">Informations du compte</h3>
                <div className="grid grid-cols-2 gap-4">
                  <p>
                    <span className="font-medium">Statut:</span>{" "}
                    <span className="inline-block px-2 py-1 rounded text-xs font-medium bg-yellow-100 text-yellow-800">
                      {(selectedUser as any).status || "pending"}
                    </span>
                  </p>
                  <p>
                    <span className="font-medium">Actif:</span>{" "}
                    {(selectedUser as any).isActive ? "✓ Oui" : "✗ Non"}
                  </p>
                  <p>
                    <span className="font-medium">Date d'inscription:</span>{" "}
                    {getUserCreatedAtLabel(selectedUser)}
                  </p>
                  <p>
                    <span className="font-medium">Dernière connexion:</span>{" "}
                    {(selectedUser as any).lastLoginDate ? new Date((selectedUser as any).lastLoginDate).toLocaleString("fr-FR") : "Jamais"}
                  </p>
                  <p>
                    <span className="font-medium">ID utilisateur:</span>{" "}
                    <code className="bg-gray-100 px-2 py-1 rounded text-xs">{selectedUser._id}</code>
                  </p>
                </div>
              </div>

              {/* Informations supplémentaires */}
              <div className="pb-4">
                <h3 className="font-semibold text-base mb-3">Informations supplémentaires</h3>
                <div className="space-y-2">
                  {(selectedUser as any).department && (
                    <p>
                      <span className="font-medium">Département:</span> {(selectedUser as any).department}
                    </p>
                  )}
                  {(selectedUser as any).position && (
                    <p>
                      <span className="font-medium">Position:</span> {(selectedUser as any).position}
                    </p>
                  )}
                  {(selectedUser as any).companyName && (
                    <p>
                      <span className="font-medium">Entreprise:</span> {(selectedUser as any).companyName}
                    </p>
                  )}
                  {(selectedUser as any).description && (
                    <p>
                      <span className="font-medium">Description:</span>
                      <div className="bg-gray-50 p-2 rounded mt-1 text-xs">{(selectedUser as any).description}</div>
                    </p>
                  )}
                </div>
              </div>

              {/* Actions */}
              <div className="flex justify-end gap-2 pt-4 border-t">
                <Button
                  variant="outline"
                  onClick={() => setDetailsOpen(false)}
                >
                  Fermer
                </Button>
                <Button
                  onClick={() => {
                    setDetailsOpen(false);
                    handleApprove(selectedUser._id);
                  }}
                  disabled={actionLoading !== null}
                >
                  {actionLoading === selectedUser._id ? "..." : "Approuver"}
                </Button>
                <Button
                  variant="destructive"
                  onClick={() => {
                    setDetailsOpen(false);
                    openRejectDialog(selectedUser);
                  }}
                  disabled={actionLoading !== null}
                >
                  Rejeter
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Rejection dialog */}
      <Dialog
        open={rejectDialogOpen}
        onOpenChange={(open) => {
          setRejectDialogOpen(open);
          if (!open) {
            setRejectReason("");
            setSelectedUser(null);
          }
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reject User</DialogTitle>
          </DialogHeader>
          {selectedUser && (
            <div className="space-y-4">
              <div className="text-sm">
                <p>
                  <span className="font-semibold">User:</span>{" "}
                  {(selectedUser as any).firstname ||
                    (selectedUser as any).firstName}{" "}
                  {(selectedUser as any).lastname ||
                    (selectedUser as any).lastName}
                </p>
                <p>
                  <span className="font-semibold">Email:</span>{" "}
                  {selectedUser.email || "N/A"}
                </p>
                <p>
                  <span className="font-semibold">CIN:</span>{" "}
                  {(selectedUser as any).cin || "N/A"}
                </p>
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="reject-reason">Rejection Reason *</Label>
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
                        Generating...
                      </>
                    ) : (
                      <>✨ Generate with AI</>
                    )}
                  </Button>
                </div>
                <Textarea
                  id="reject-reason"
                  placeholder="Please specify the rejection reason..."
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
                  Cancel
                </Button>
                <Button
                  variant="destructive"
                  onClick={() => selectedUser && handleReject(selectedUser._id)}
                  disabled={actionLoading !== null || !rejectReason.trim()}
                >
                  {actionLoading === selectedUser._id
                    ? "Rejecting..."
                    : "Reject and send email"}
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
            {Array.from({ length: totalPages }, (_, i) => i + 1).map(
              (pageNum) => (
                <Button
                  key={pageNum}
                  variant={currentPage === pageNum ? "default" : "outline"}
                  size="sm"
                  onClick={() => goToPage(pageNum)}
                  className="w-8 h-8 p-0"
                >
                  {pageNum}
                </Button>
              ),
            )}
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
