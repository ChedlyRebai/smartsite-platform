import { useEffect, useState } from "react";
import { useAuthStore } from "../../store/authStore";
import { Button } from "../../components/ui/button";
import { AlertTriangle, CheckCircle2, XCircle } from "lucide-react";
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
import { Badge } from "../../components/ui/badge";
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

      await rejectUser(id);
      toast.success("Utilisateur rejeté. Email de notification envoyé.");

      // await rejectUser(id, rejectReason);
      // toast.success("User rejected. Notification email sent.");

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
    <div className="space-y-6">
      {/* Header Section */}
      <div className="bg-gradient-to-r from-slate-900 via-blue-900 to-slate-900 rounded-lg p-8 text-white">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Pending Users Approval</h1>
            <p className="text-blue-100 mt-2">Manage and approve user registration requests</p>
          </div>
          <div className="text-right">
            <div className="text-4xl font-bold">{users.length}</div>
            <p className="text-blue-100 text-sm">Total Pending</p>
          </div>
        </div>
      </div>

      {/* Filters Section */}
      <Card className="border-none shadow-lg">
        <CardHeader className="bg-gradient-to-r from-slate-50 to-blue-50 border-b">
          <CardTitle className="text-lg">Filters</CardTitle>
        </CardHeader>
        <CardContent className="pt-6">
          <div className="flex items-end gap-4">
            <div className="flex-1">
              <Label htmlFor="role-filter" className="font-semibold text-slate-700 mb-2 block">Filter by Role</Label>
              <Select value={roleFilter} onValueChange={setRoleFilter}>
                <SelectTrigger className="border-slate-200">
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
            <Button 
              variant="outline"
              onClick={() => {
                setRoleFilter("all");
                setCurrentPage(1);
              }}
              className="border-slate-200"
            >
              Reset Filters
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Users List Section */}
      <Card className="border-none shadow-lg">
        <CardHeader className="bg-gradient-to-r from-slate-50 to-blue-50 border-b">
          <CardTitle className="flex items-center justify-between">
            <span>Pending Users ({filteredUsers.length})</span>
            <span className="text-xs font-normal text-slate-500">
              Page {currentPage} of {totalPages || 1}
            </span>
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-6">
          {loading ? (
            <div className="flex justify-center items-center py-12">
              <div className="text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-3"></div>
                <p className="text-slate-600">Loading pending users...</p>
              </div>
            </div>
          ) : filteredUsers.length === 0 ? (
            <div className="flex justify-center items-center py-12">
              <div className="text-center">
                <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <AlertTriangle className="h-8 w-8 text-blue-600" />
                </div>
                <p className="text-slate-600 font-medium">
                  {users.length === 0
                    ? "No pending users to approve"
                    : "No users found for this filter"}
                </p>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              {currentUsers.map((u) => (
                <div
                  key={u._id}
                  className="p-6 border border-slate-200 rounded-lg hover:shadow-lg hover:border-blue-300 transition-all duration-200 bg-white cursor-pointer"
                  onClick={() => {
                    setSelectedUser(u);
                    setDetailsOpen(true);
                  }}
                >
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <h3 className="font-bold text-slate-900 text-lg">
                        {(u as any).firstName || (u as any).firstname}{" "}
                        {(u as any).lastName || (u as any).lastname}
                      </h3>
                      <p className="text-sm text-slate-600 mt-1">
                        {(u as any).cin || "N/A"} • {u.email || "N/A"}
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <Badge className="bg-blue-100 text-blue-800">
                        {getRoleLabel(u.role)}
                      </Badge>
                      <Badge className="bg-amber-100 text-amber-800">
                        {(u as any).status || "pending"}
                      </Badge>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4 pb-4 border-b border-slate-100">
                    <div>
                      <p className="text-xs text-slate-500 font-medium">PHONE</p>
                      <p className="text-sm text-slate-700">
                        {(u as any).phoneNumber || (u as any).phone || "N/A"}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-slate-500 font-medium">LOCATION</p>
                      <p className="text-sm text-slate-700">
                        {(u as any).city || (u as any).ville || "N/A"}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-slate-500 font-medium">REQUESTED</p>
                      <p className="text-sm text-slate-700">
                        {new Date(u.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-slate-500 font-medium">STATUS</p>
                      <p className="text-sm font-medium text-slate-700">
                        {(u as any).isActive ? "✓ Active" : "Inactive"}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center justify-between gap-2">
                    <p className="text-xs text-slate-500">
                      Click to view full details
                    </p>
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        className="bg-emerald-600 hover:bg-emerald-700 text-white"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleApprove(u._id);
                        }}
                        disabled={actionLoading !== null}
                      >
                        {actionLoading === u._id ? "..." : "✓ Approve"}
                      </Button>
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={(e) => {
                          e.stopPropagation();
                          openRejectDialog(u);
                        }}
                        disabled={actionLoading !== null}
                      >
                        {actionLoading === u._id ? "..." : "✗ Reject"}
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between bg-slate-50 p-4 rounded-lg border border-slate-200">
          <p className="text-sm text-slate-600">
            Showing <span className="font-bold">{indexOfFirstUser + 1}</span> to{" "}
            <span className="font-bold">{Math.min(indexOfLastUser, filteredUsers.length)}</span> of{" "}
            <span className="font-bold">{filteredUsers.length}</span> users
          </p>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={goToPreviousPage}
              disabled={currentPage === 1}
              className="border-slate-200"
            >
              Previous
            </Button>
            <div className="flex gap-1">
              {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
                const startPage = Math.max(1, currentPage - 2);
                return i + startPage;
              }).map((pageNum) => (
                <Button
                  key={pageNum}
                  variant={currentPage === pageNum ? "default" : "outline"}
                  size="sm"
                  onClick={() => goToPage(pageNum)}
                  className="w-8 h-8 p-0 border-slate-200"
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
              className="border-slate-200"
            >
              Next
            </Button>
          </div>
        </div>
      )}

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
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="text-xl">Reject User Application</DialogTitle>
          </DialogHeader>
          {selectedUser && (
            <div className="space-y-6">
              <div className="bg-slate-50 p-4 rounded-lg border border-slate-200">
                <h4 className="font-semibold text-slate-900 mb-3">User Information</h4>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-slate-500 font-medium">Name</p>
                    <p className="text-slate-900">
                      {(selectedUser as any).firstName || (selectedUser as any).firstname}{" "}
                      {(selectedUser as any).lastName || (selectedUser as any).lastname}
                    </p>
                  </div>
                  <div>
                    <p className="text-slate-500 font-medium">Email</p>
                    <p className="text-slate-900">{selectedUser.email || "N/A"}</p>
                  </div>
                  <div>
                    <p className="text-slate-500 font-medium">CIN</p>
                    <p className="text-slate-900">
                      {(selectedUser as any).cin || "N/A"}
                    </p>
                  </div>
                  <div>
                    <p className="text-slate-500 font-medium">Applied Role</p>
                    <p className="text-slate-900">{getRoleLabel(selectedUser.role?.name)}</p>
                  </div>
                </div>
              </div>

              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <Label htmlFor="reject-reason" className="font-semibold text-slate-700">
                    Rejection Reason *
                  </Label>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={generateRejectReason}
                    disabled={isGeneratingReason}
                    className="border-slate-200 text-xs"
                  >
                    {isGeneratingReason ? (
                      <>
                        <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-blue-600 mr-2"></div>
                        Generating...
                      </>
                    ) : (
                      <>✨ Generate with AI</>
                    )}
                  </Button>
                </div>
                <Textarea
                  id="reject-reason"
                  placeholder="Please provide a professional and courteous rejection reason..."
                  value={rejectReason}
                  onChange={(e) => setRejectReason(e.target.value)}
                  rows={5}
                  className="border-slate-200 resize-none"
                />
                <p className="text-xs text-slate-500">
                  This message will be sent to the user via email. Be professional and constructive.
                </p>
              </div>

              <div className="flex justify-end gap-2 pt-4 border-t">
                <Button
                  variant="outline"
                  onClick={() => setRejectDialogOpen(false)}
                  disabled={actionLoading !== null}
                  className="border-slate-200"
                >
                  Cancel
                </Button>
                <Button
                  className="bg-red-600 hover:bg-red-700"
                  onClick={() => selectedUser && handleReject(selectedUser._id)}
                  disabled={actionLoading !== null || !rejectReason.trim()}
                >
                  {actionLoading === selectedUser._id
                    ? "Rejecting..."
                    : "✗ Reject & Send Email"}
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
