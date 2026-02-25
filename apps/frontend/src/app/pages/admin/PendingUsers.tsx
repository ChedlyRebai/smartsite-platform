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
      await approveUser(id);
      toast.success("User approved");
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
    <div>
      <Card>
        <CardHeader>
          <CardTitle>Pending User Approvals</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div>Loading...</div>
          ) : users.length === 0 ? (
            <div className="text-sm text-gray-500">No pending users</div>
          ) : (
            <div className="space-y-3">
              {users.map((u) => (
                <div
                  key={u._id}
                  className="flex items-center justify-between p-3 border rounded-md"
                >
                  <div>
                    <div className="font-semibold">
                      {u.firstName} {u.lastName}
                    </div>
                    <div className="text-sm text-gray-600">
                      {u.email} • {u.role.name}
                    </div>
                    <div className="text-xs text-gray-400">
                      Registered: {new Date(u.createdDate).toLocaleString()}
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
                      onClick={() => handleReject(u._id)}
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
    </div>
  );
}
