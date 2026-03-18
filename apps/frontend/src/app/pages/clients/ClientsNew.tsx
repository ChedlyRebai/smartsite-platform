import {
  UserCog,
  Edit,
  Eye,
  Trash2,
  Plus,
  Search,
  RefreshCw,
  UserPlus,
} from "lucide-react";
import { useEffect, useState } from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "../../components/ui/card";
import { Button } from "../../components/ui/button";
import { Input } from "../../components/ui/input";
import { Label } from "../../components/ui/label";
import { Badge } from "../../components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "../../components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "../../components/ui/alert-dialog";
import { useAuthStore } from "../../store/authStore";
import { canEdit } from "../../utils/permissions";
import { toast } from "sonner";
import {
  getAllClients,
  createClient,
  updateClient,
  deleteClient,
} from "@/app/action/user.action";
import { User } from "@/app/types";

export default function ClientsNew() {
  const user = useAuthStore((state) => state.user);

  const canManageClients = true;
  const [clients, setClients] = useState<User[]>([]);
  const [filteredClients, setFilteredClients] = useState<User[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [viewDetailsOpen, setViewDetailsOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [createOpen, setCreateOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [selectedClient, setSelectedClient] = useState<User | null>(null);
  const [editData, setEditData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    telephone: "",
    address: "",
    companyName: "",
  });
  const [newClientData, setNewClientData] = useState({
    cin: "",
    firstName: "",
    lastName: "",
    email: "",
    telephone: "",
    address: "",
    companyName: "",
  });

  // Load clients on mount
  useEffect(() => {
    loadClients();
  }, []);

  // Filter clients based on search query
  useEffect(() => {
    if (!searchQuery.trim()) {
      setFilteredClients(clients);
    } else {
      const query = searchQuery.toLowerCase();
      const filtered = clients.filter(
        (client) =>
          `${client.firstName} ${client.lastName}`
            .toLowerCase()
            .includes(query) ||
          client.email?.toLowerCase().includes(query) ||
          client.telephone?.toLowerCase().includes(query) ||
          client.companyName?.toLowerCase().includes(query),
      );
      setFilteredClients(filtered);
    }
  }, [searchQuery, clients]);

  const loadClients = async () => {
    setIsLoading(true);
    try {
      const token = user?.access_token;
      const res = await getAllClients(token);
      if (res.status === 200) {
        setClients(res.data);
      } else {
        toast.error(res.data || "Failed to load clients");
      }
    } catch (error) {
      console.error("Error loading clients:", error);
      toast.error("Failed to load clients");
    } finally {
      setIsLoading(false);
    }
  };

  const handleViewDetails = (client: User) => {
    setSelectedClient(client);
    setViewDetailsOpen(true);
  };

  const handleEditClient = (client: User) => {
    setSelectedClient(client);
    setEditData({
      firstName: client.firstName || "",
      lastName: client.lastName || "",
      email: client.email || "",
      telephone: client.telephone || "",
      address: client.address || "",
      companyName: client.companyName || "",
    });
    setEditOpen(true);
  };

  const handleSaveEdit = async () => {
    if (
      !editData.firstName ||
      !editData.lastName ||
      !editData.email ||
      !editData.telephone
    ) {
      toast.error("First name, last name, email, and phone are required");
      return;
    }

    if (!selectedClient) return;

    setIsLoading(true);
    try {
      const token = user?.access_token;
      const res = await updateClient(selectedClient._id, editData, token);
      if (res.status === 200) {
        toast.success("Client updated successfully!");
        setEditOpen(false);
        loadClients();
      } else {
        toast.error(res.data || "Failed to update client");
      }
    } catch (error) {
      console.error("Error updating client:", error);
      toast.error("Failed to update client");
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateClient = async () => {
    if (
      !newClientData.cin ||
      !newClientData.firstName ||
      !newClientData.lastName ||
      !newClientData.email ||
      !newClientData.telephone
    ) {
      toast.error("CIN, first name, last name, email, and phone are required");
      return;
    }

    setIsLoading(true);
    try {
      const token = user?.access_token;
      const res = await createClient(newClientData, token);
      if (res.status === 201) {
        toast.success("Client created successfully!");
        setCreateOpen(false);
        setNewClientData({
          cin: "",
          firstName: "",
          lastName: "",
          email: "",
          telephone: "",
          address: "",
          companyName: "",
        });
        loadClients();
      } else {
        toast.error(res.data || "Failed to create client");
      }
    } catch (error) {
      console.error("Error creating client:", error);
      toast.error("Failed to create client");
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteClient = async () => {
    if (!selectedClient) return;

    setIsLoading(true);
    try {
      const token = user?.access_token;
      const res = await deleteClient(selectedClient._id, token);
      if (res.status === 200) {
        toast.success("Client deleted successfully!");
        setDeleteOpen(false);
        setSelectedClient(null);
        loadClients();
      } else {
        toast.error(res.data || "Failed to delete client");
      }
    } catch (error) {
      console.error("Error deleting client:", error);
      toast.error("Failed to delete client");
    } finally {
      setIsLoading(false);
    }
  };

  const openDeleteDialog = (client: User) => {
    setSelectedClient(client);
    setDeleteOpen(true);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Clients</h1>
          <p className="text-gray-500 mt-1">Manage client relationships</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={loadClients} disabled={isLoading}>
            <RefreshCw
              className={`h-4 w-4 mr-2 ${isLoading ? "animate-spin" : ""}`}
            />
            Refresh
          </Button>
          {canManageClients ? (
            <Dialog open={createOpen} onOpenChange={setCreateOpen}>
              <DialogTrigger asChild>
                <Button className="bg-gradient-to-r from-blue-600 to-green-600 hover:from-blue-700 hover:to-green-700">
                  <UserPlus className="h-4 w-4 mr-2" />
                  New Client
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl">
                <DialogHeader>
                  <DialogTitle>Create New Client</DialogTitle>
                  <DialogDescription>
                    Add a new client to your database
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="new-cin">
                        CIN <span className="text-red-500">*</span>
                      </Label>
                      <Input
                        id="new-cin"
                        placeholder="e.g., AB123456"
                        value={newClientData.cin}
                        onChange={(e) =>
                          setNewClientData({
                            ...newClientData,
                            cin: e.target.value,
                          })
                        }
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="new-company">Company Name</Label>
                      <Input
                        id="new-company"
                        placeholder="e.g., ABC Corp"
                        value={newClientData.companyName}
                        onChange={(e) =>
                          setNewClientData({
                            ...newClientData,
                            companyName: e.target.value,
                          })
                        }
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="new-firstName">
                        First Name <span className="text-red-500">*</span>
                      </Label>
                      <Input
                        id="new-firstName"
                        placeholder="John"
                        value={newClientData.firstName}
                        onChange={(e) =>
                          setNewClientData({
                            ...newClientData,
                            firstName: e.target.value,
                          })
                        }
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="new-lastName">
                        Last Name <span className="text-red-500">*</span>
                      </Label>
                      <Input
                        id="new-lastName"
                        placeholder="Doe"
                        value={newClientData.lastName}
                        onChange={(e) =>
                          setNewClientData({
                            ...newClientData,
                            lastName: e.target.value,
                          })
                        }
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="new-email">
                        Email <span className="text-red-500">*</span>
                      </Label>
                      <Input
                        id="new-email"
                        type="email"
                        placeholder="john.doe@example.com"
                        value={newClientData.email}
                        onChange={(e) =>
                          setNewClientData({
                            ...newClientData,
                            email: e.target.value,
                          })
                        }
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="new-phone">
                        Phone <span className="text-red-500">*</span>
                      </Label>
                      <Input
                        id="new-phone"
                        placeholder="+216 12 345 678"
                        value={newClientData.telephone}
                        onChange={(e) =>
                          setNewClientData({
                            ...newClientData,
                            telephone: e.target.value,
                          })
                        }
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="new-address">Address</Label>
                    <Input
                      id="new-address"
                      placeholder="123 Street Name, City"
                      value={newClientData.address}
                      onChange={(e) =>
                        setNewClientData({
                          ...newClientData,
                          address: e.target.value,
                        })
                      }
                    />
                  </div>
                  <Button
                    className="w-full bg-gradient-to-r from-blue-600 to-green-600 hover:from-blue-700 hover:to-green-700"
                    onClick={handleCreateClient}
                    disabled={isLoading}
                  >
                    {isLoading ? "Creating..." : "Create Client"}
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          ) : (
            <Button disabled className="opacity-50 cursor-not-allowed">
              <UserPlus className="h-4 w-4 mr-2" />
              New Client (No Permission)
            </Button>
          )}
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="relative w-64">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search clients..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <RefreshCw className="h-8 w-8 animate-spin text-blue-600" />
              <span className="ml-3 text-gray-600">Loading clients...</span>
            </div>
          ) : filteredClients.length === 0 ? (
            <div className="text-center py-12">
              <UserCog className="h-16 w-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-700 mb-2">
                {searchQuery ? "No clients found" : "No clients yet"}
              </h3>
              <p className="text-gray-500 mb-4">
                {searchQuery
                  ? "Try adjusting your search criteria"
                  : "Start by creating your first client"}
              </p>
              {!searchQuery && canManageClients && (
                <Button
                  onClick={() => setCreateOpen(true)}
                  className="bg-gradient-to-r from-blue-600 to-green-600"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Create First Client
                </Button>
              )}
            </div>
          ) : (
            <div className="space-y-4">
              {filteredClients.map((client) => (
                <div
                  key={client._id}
                  className="p-4 border rounded-lg hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <h3 className="font-semibold text-gray-900">
                          {client.firstName} {client.lastName}
                        </h3>
                        {client.isActive ? (
                          <Badge
                            variant="secondary"
                            className="bg-green-100 text-green-800"
                          >
                            Active
                          </Badge>
                        ) : (
                          <Badge
                            variant="secondary"
                            className="bg-gray-100 text-gray-800"
                          >
                            Inactive
                          </Badge>
                        )}
                      </div>
                      {client.companyName && (
                        <p className="text-sm text-gray-600 mt-1">
                          {client.companyName}
                        </p>
                      )}
                      <p className="text-sm text-gray-500 mt-1">
                        {client.email} • {client.telephone}
                      </p>
                      {client.address && (
                        <p className="text-xs text-gray-400 mt-1">
                          {client.address}
                        </p>
                      )}
                      <div className="flex gap-4 mt-3 text-sm">
                        <span className="text-gray-600">
                          <strong>Projects:</strong> {client.projectsCount || 0}
                        </span>
                      </div>
                    </div>
                    <div className="flex gap-2 ml-4">
                      <Dialog
                        open={
                          viewDetailsOpen && selectedClient?._id === client._id
                        }
                        onOpenChange={setViewDetailsOpen}
                      >
                        <DialogTrigger
                          asChild
                          onClick={() => handleViewDetails(client)}
                        >
                          <Button size="sm" variant="outline">
                            <Eye className="h-4 w-4 mr-1" />
                            View
                          </Button>
                        </DialogTrigger>
                        <DialogContent>
                          <DialogHeader>
                            <DialogTitle>Client Details</DialogTitle>
                          </DialogHeader>
                          {selectedClient && (
                            <div className="space-y-4">
                              <div>
                                <p className="text-sm text-gray-600">
                                  Client Name
                                </p>
                                <p className="font-semibold text-gray-900">
                                  {selectedClient.firstName}{" "}
                                  {selectedClient.lastName}
                                </p>
                              </div>
                              {selectedClient.companyName && (
                                <div>
                                  <p className="text-sm text-gray-600">
                                    Company
                                  </p>
                                  <p className="font-semibold text-gray-900">
                                    {selectedClient.companyName}
                                  </p>
                                </div>
                              )}
                              <div>
                                <p className="text-sm text-gray-600">Email</p>
                                <p className="font-semibold text-gray-900">
                                  {selectedClient.email}
                                </p>
                              </div>
                              <div>
                                <p className="text-sm text-gray-600">Phone</p>
                                <p className="font-semibold text-gray-900">
                                  {selectedClient.telephone}
                                </p>
                              </div>
                              {selectedClient.address && (
                                <div>
                                  <p className="text-sm text-gray-600">
                                    Address
                                  </p>
                                  <p className="font-semibold text-gray-900">
                                    {selectedClient.address}
                                  </p>
                                </div>
                              )}
                              <div className="grid grid-cols-2 gap-4">
                                <div>
                                  <p className="text-sm text-gray-600">
                                    Active Projects
                                  </p>
                                  <p className="font-semibold text-gray-900">
                                    {selectedClient.projectsCount || 0}
                                  </p>
                                </div>
                                <div>
                                  <p className="text-sm text-gray-600">
                                    Status
                                  </p>
                                  <Badge
                                    variant="secondary"
                                    className={
                                      selectedClient.isActive
                                        ? "bg-green-100 text-green-800"
                                        : "bg-gray-100 text-gray-800"
                                    }
                                  >
                                    {selectedClient.isActive
                                      ? "Active"
                                      : "Inactive"}
                                  </Badge>
                                </div>
                              </div>
                              <Button
                                className="w-full bg-gradient-to-r from-blue-600 to-green-600"
                                onClick={() => setViewDetailsOpen(false)}
                              >
                                Close
                              </Button>
                            </div>
                          )}
                        </DialogContent>
                      </Dialog>

                      {canManageClients && (
                        <>
                          <Dialog
                            open={
                              editOpen && selectedClient?._id === client._id
                            }
                            onOpenChange={setEditOpen}
                          >
                            <DialogTrigger
                              asChild
                              onClick={() => handleEditClient(client)}
                            >
                              <Button size="sm" variant="outline">
                                <Edit className="h-4 w-4 mr-1" />
                                Edit
                              </Button>
                            </DialogTrigger>
                            <DialogContent className="max-w-2xl">
                              <DialogHeader>
                                <DialogTitle>Edit Client</DialogTitle>
                                <DialogDescription>
                                  Update client information
                                </DialogDescription>
                              </DialogHeader>
                              <div className="space-y-4">
                                <div className="grid grid-cols-2 gap-4">
                                  <div className="space-y-2">
                                    <Label htmlFor="edit-firstName">
                                      First Name
                                    </Label>
                                    <Input
                                      id="edit-firstName"
                                      value={editData.firstName}
                                      onChange={(e) =>
                                        setEditData({
                                          ...editData,
                                          firstName: e.target.value,
                                        })
                                      }
                                    />
                                  </div>
                                  <div className="space-y-2">
                                    <Label htmlFor="edit-lastName">
                                      Last Name
                                    </Label>
                                    <Input
                                      id="edit-lastName"
                                      value={editData.lastName}
                                      onChange={(e) =>
                                        setEditData({
                                          ...editData,
                                          lastName: e.target.value,
                                        })
                                      }
                                    />
                                  </div>
                                </div>
                                <div className="space-y-2">
                                  <Label htmlFor="edit-company">
                                    Company Name
                                  </Label>
                                  <Input
                                    id="edit-company"
                                    value={editData.companyName}
                                    onChange={(e) =>
                                      setEditData({
                                        ...editData,
                                        companyName: e.target.value,
                                      })
                                    }
                                  />
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                  <div className="space-y-2">
                                    <Label htmlFor="edit-email">Email</Label>
                                    <Input
                                      id="edit-email"
                                      type="email"
                                      value={editData.email}
                                      onChange={(e) =>
                                        setEditData({
                                          ...editData,
                                          email: e.target.value,
                                        })
                                      }
                                    />
                                  </div>
                                  <div className="space-y-2">
                                    <Label htmlFor="edit-phone">Phone</Label>
                                    <Input
                                      id="edit-phone"
                                      value={editData.telephone}
                                      onChange={(e) =>
                                        setEditData({
                                          ...editData,
                                          telephone: e.target.value,
                                        })
                                      }
                                    />
                                  </div>
                                </div>
                                <div className="space-y-2">
                                  <Label htmlFor="edit-address">Address</Label>
                                  <Input
                                    id="edit-address"
                                    value={editData.address}
                                    onChange={(e) =>
                                      setEditData({
                                        ...editData,
                                        address: e.target.value,
                                      })
                                    }
                                  />
                                </div>
                                <Button
                                  className="w-full bg-gradient-to-r from-blue-600 to-green-600"
                                  onClick={handleSaveEdit}
                                  disabled={isLoading}
                                >
                                  {isLoading ? "Saving..." : "Save Changes"}
                                </Button>
                              </div>
                            </DialogContent>
                          </Dialog>

                          <AlertDialog
                            open={
                              deleteOpen && selectedClient?._id === client._id
                            }
                            onOpenChange={setDeleteOpen}
                          >
                            <AlertDialogTrigger
                              asChild
                              onClick={() => openDeleteDialog(client)}
                            >
                              <Button
                                size="sm"
                                variant="outline"
                                className="text-red-600 hover:text-red-700"
                              >
                                <Trash2 className="h-4 w-4 mr-1" />
                                Delete
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>
                                  Are you sure?
                                </AlertDialogTitle>
                                <AlertDialogDescription>
                                  This will permanently delete the client{" "}
                                  <strong>
                                    {selectedClient?.firstName}{" "}
                                    {selectedClient?.lastName}
                                  </strong>
                                  . This action cannot be undone.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel
                                  onClick={() => setSelectedClient(null)}
                                >
                                  Cancel
                                </AlertDialogCancel>
                                <AlertDialogAction
                                  onClick={handleDeleteClient}
                                  disabled={isLoading}
                                  className="bg-red-600 hover:bg-red-700"
                                >
                                  {isLoading ? "Deleting..." : "Delete"}
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        </>
                      )}
                    </div>
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
