import { useEffect, useState } from "react";
import { useAuthStore } from "../../store/authStore";
import { Button } from "../../components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "../../components/ui/card";
import { toast } from "react-hot-toast";
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

export default function PendingUsers() {
  const getPendingUsers = useAuthStore((s) => s.getPendingUsers);
  const approveUser = useAuthStore((s) => s.approveUser);
  const rejectUser = useAuthStore((s) => s.rejectUser);
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const load = async () => {
    if (!getPendingUsers) return;
    setLoading(true);
    try {
      const res = await getPendingUsers();
      setUsers(res);
    } catch (err: any) {
      toast.error(err?.message || "Failed to load pending users");
    } finally {
      setLoading(false);
    }
  };

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
    setActionLoading(id);
    try {
      await rejectUser(id);
      toast.success("User rejected");
      await load();
    } catch (err: any) {
      toast.error(err?.message || "Failed to reject user");
    } finally {
      setActionLoading(null);
    }
  };

  return (
    <div className="container mx-auto p-4">
      <Card>
        <CardHeader>
          <CardTitle>Utilisateurs en attente d'approbation</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-sm text-gray-500">Chargement...</div>
          ) : users.length === 0 ? (
            <div className="text-sm text-gray-500">Aucun utilisateur en attente</div>
          ) : (
            <div className="space-y-3">
              {users.map((u) => (
                <div
                  key={u._id}
                  className="flex items-center justify-between p-3 border rounded-md"
                >
                  <div>
                    <div className="font-semibold">
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
                        <span className="font-medium">Téléphone:</span>{" "}
                        {(u as any).phoneNumber || (u as any).phone || "N/A"}
                      </div>
                      <div>
                        <span className="font-medium">Département:</span>{" "}
                        {(u as any).departement || (u as any).department || "N/A"}
                      </div>
                      <div>
                        <span className="font-medium">Adresse:</span>{" "}
                        {(u as any).address || (u as any).adresse || "N/A"}
                      </div>
                      <div>
                        <span className="font-medium">Rôle:</span>{" "}
                        {u.role?.name || "Rôle non défini"}
                      </div>
                      <div className="text-xs text-gray-400">
                        <span className="font-medium">Statut:</span>{" "}
                        {(u as any).status || "pending"}
                      </div>
                      <div className="text-xs text-gray-400">
                        <span className="font-medium">Créé le:</span>{" "}
                        {u.createdDate
                          ? new Date(u.createdDate).toLocaleString()
                          : "N/A"}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      size="sm"
                      onClick={() => handleApprove(u._id)}
                      disabled={actionLoading !== null}
                    >
                      {actionLoading === u._id ? "..." : "Approuver"}
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleReject(u._id)}
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
    </div>
  );
}
