import { useState, useEffect } from "react";
import {
  Plus,
  Search,
  Users,
  Edit,
  Trash2,
  User,
  Building,
} from "lucide-react";
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
import { Avatar, AvatarFallback } from "../../components/ui/avatar";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "../../components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../../components/ui/select";
import { mockTeamMembers } from "../../utils/mockData";
import { toast } from "sonner";
import {
  getAllTeams,
  createTeam,
  updateTeam,
  deleteTeam,
  addMemberToTeam,
  removeMemberFromTeam,
} from "../../action/team.action";
import { getAllUsers } from "../../action/user.action";
import { getAssignedTeamIds } from "../../action/site.action";

interface TeamData {
  _id: string;
  name: string;
  description?: string;
  members: any[];
  manager?: any;
  site?: any;
  isActive: boolean;
  teamCode?: string;
  createdAt?: string;
  updatedAt?: string;
}

interface UserData {
  _id: string;
  firstName: string;
  lastName: string;
  email: string;
}

export default function Team() {
  // Allow all users to manage teams - set to true always
  const canManageTeam = true;

  const [teams, setTeams] = useState<TeamData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [useMockData, setUseMockData] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");

  // Track which teams are assigned to sites: teamId -> { siteId, siteName, status }
  const [teamSiteAssignments, setTeamSiteAssignments] = useState<
    Record<string, { siteId: string; siteName: string; status: string }>
  >({});

  // Dialog states
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [viewDialogOpen, setViewDialogOpen] = useState(false);

  // Form states
  const [newTeam, setNewTeam] = useState({
    name: "",
    description: "",
    teamCode: "",
  });
  const [editTeam, setEditTeam] = useState<TeamData | null>(null);
  const [teamToDelete, setTeamToDelete] = useState<TeamData | null>(null);
  const [selectedTeamView, setSelectedTeamView] = useState<TeamData | null>(
    null,
  );

  // Available users for adding members
  const [availableUsers, setAvailableUsers] = useState<UserData[]>([]);
  const [memberDialogOpen, setMemberDialogOpen] = useState(false);
  const [selectedUserId, setSelectedUserId] = useState("");
  const [userLoadingError, setUserLoadingError] = useState(false);

  // Statistics
  const totalTeams = teams.length;
  const activeTeams = teams.filter((t) => t.isActive).length;
  const inactiveTeams = totalTeams - activeTeams;
  const totalMembers = teams.reduce(
    (sum, team) => sum + (team.members?.length || 0),
    0,
  );

  // Fetch teams from API
  useEffect(() => {
    loadTeams();
  }, []);

  const loadTeams = async () => {
    try {
      setLoading(true);
      setError(null);

      // Fetch teams and site assignments in parallel
      const [teamsResponse, siteAssignments] = await Promise.all([
        getAllTeams(),
        getAssignedTeamIds(),
      ]);

      console.log("Teams loaded from API:", teamsResponse.data);
      console.log("Site assignments:", siteAssignments);

      setTeams(teamsResponse.data);
     // setTeamSiteAssignments(siteAssignments);
      setUseMockData(false);
    } catch (err) {
      console.error("Error loading teams, using mock data:", err);
      setError("Backend not available, using mock data");
      // Create mock teams for demo
      setTeams([
        {
          _id: "1",
          name: "Team A",
          description: "Main construction team",
          members: mockTeamMembers.slice(0, 3),
          isActive: true,
          teamCode: "TEAM-A",
        },
        {
          _id: "2",
          name: "Team B",
          description: "Maintenance team",
          members: mockTeamMembers.slice(3, 5),
          isActive: true,
          teamCode: "TEAM-B",
        },
      ]);
      setUseMockData(true);
      toast.warning("Offline mode - demo data");
    } finally {
      setLoading(false);
    }
  };

  // Load available users when member dialog opens
  useEffect(() => {
    if (memberDialogOpen) {
      loadAvailableUsers();
    }
  }, [memberDialogOpen]);

  const loadAvailableUsers = async () => {
    try {
      const response = await getAllUsers();
      if (response?.status === 200 && Array.isArray(response.data)) {
        const normalizedUsers = response.data.map((user: any) => ({
          _id: String(user._id ?? user.id ?? ""),
          firstName: user.firstName || user.firstname || user.nom || "",
          lastName: user.lastName || user.lastname || user.prenom || "",
          email: user.email || "",
        }));
        setAvailableUsers(normalizedUsers);
        setUserLoadingError(false);
        return;
      }
      // API response not valid, use mock data
      
      setUserLoadingError(true);
    } catch (err) {
      console.error("Error loading users:", err);
      // Use mock data when API fails
     
      setUserLoadingError(true);
    }
  };

  const filteredTeams = teams.filter(
    (team) =>
      team.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      team.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      team.teamCode?.toLowerCase().includes(searchTerm.toLowerCase()),
  );

  // Helper function to check if a team is assigned to a site
  const isTeamAssignedToSite = (teamId: string) => {
    return !!teamSiteAssignments[teamId];
  };

  // Get all member IDs from all teams (for filtering available users in new team creation)
  const getAllTeamMemberIds = () => {
    const memberIds = new Set<string>();
    teams.forEach((team) => {
      team.members?.forEach((m: any) => {
        if (m._id) memberIds.add(m._id);
      });
    });
    return memberIds;
  };

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n.charAt(0))
      .join("")
      .substring(0, 2)
      .toUpperCase();
  };

  const handleAddTeam = async () => {
    // Validation
    const trimmedName = newTeam.name.trim();
    const trimmedDescription = newTeam.description.trim();
    const trimmedCode = newTeam.teamCode.trim();

    if (!trimmedName) {
      toast.error("Team name is required");
      return;
    }

    if (trimmedName.length < 2) {
      toast.error("Team name must be at least 2 characters");
      return;
    }

    if (trimmedName.length > 50) {
      toast.error("Team name must not exceed 50 characters");
      return;
    }

    // Check for duplicate team name
    const duplicateName = teams.find(
      (t) => t.name.toLowerCase() === trimmedName.toLowerCase(),
    );
    if (duplicateName) {
      toast.error("A team with this name already exists");
      return;
    }

    // Validate team code if provided
    if (trimmedCode) {
      if (trimmedCode.length > 20) {
        toast.error("Team code must not exceed 20 characters");
        return;
      }
      // Check for duplicate team code
      const duplicateCode = teams.find(
        (t) => t.teamCode?.toLowerCase() === trimmedCode.toLowerCase(),
      );
      if (duplicateCode) {
        toast.error("A team with this code already exists");
        return;
      }
    }

    try {
      if (useMockData) {
        const team: TeamData = {
          _id: String(teams.length + 1),
          name: trimmedName,
          description: trimmedDescription,
          teamCode: trimmedCode,
          members: [],
          isActive: true,
          createdAt: new Date().toISOString(),
        };
        setTeams([...teams, team]);
        toast.success("Team added successfully!");
      } else {
        const response = await createTeam({
          name: trimmedName,
          description: trimmedDescription,
          teamCode: trimmedCode,
          isActive: true,
        });
        setTeams([...teams, response.data]);
        toast.success("Team created successfully!");
      }
      setNewTeam({ name: "", description: "", teamCode: "" });
      setAddDialogOpen(false);
    } catch (error) {
      console.error("Error creating team:", error);
      toast.error("Error creating team");
    }
  };

  const handleEditTeam = (team: TeamData) => {
    setEditTeam(team);
    setEditDialogOpen(true);
  };

  const handleSaveEdit = async () => {
    if (!editTeam) return;

    // Validation
    const trimmedName = editTeam.name.trim();
    const trimmedDescription = editTeam.description?.trim() || "";
    const trimmedCode = editTeam.teamCode?.trim() || "";

    if (!trimmedName) {
      toast.error("Team name is required");
      return;
    }

    if (trimmedName.length < 2) {
      toast.error("Team name must be at least 2 characters");
      return;
    }

    if (trimmedName.length > 50) {
      toast.error("Team name must not exceed 50 characters");
      return;
    }

    // Check for duplicate team name (excluding current team)
    const duplicateName = teams.find(
      (t) =>
        t._id !== editTeam._id &&
        t.name.toLowerCase() === trimmedName.toLowerCase(),
    );
    if (duplicateName) {
      toast.error("A team with this name already exists");
      return;
    }

    // Validate team code if provided
    if (trimmedCode) {
      if (trimmedCode.length > 20) {
        toast.error("Team code must not exceed 20 characters");
        return;
      }
      // Check for duplicate team code (excluding current team)
      const duplicateCode = teams.find(
        (t) =>
          t._id !== editTeam._id &&
          t.teamCode?.toLowerCase() === trimmedCode.toLowerCase(),
      );
      if (duplicateCode) {
        toast.error("A team with this code already exists");
        return;
      }
    }

    try {
      if (useMockData) {
        const updatedTeam = {
          ...editTeam,
          name: trimmedName,
          description: trimmedDescription,
          teamCode: trimmedCode,
        };
        setTeams(teams.map((t) => (t._id === editTeam._id ? updatedTeam : t)));
        toast.success("Team updated successfully!");
      } else {
        const response = await updateTeam(editTeam._id, {
          name: trimmedName,
          description: trimmedDescription,
          teamCode: trimmedCode,
          isActive: editTeam.isActive,
        });
        setTeams(
          teams.map((t) => (t._id === editTeam._id ? response.data : t)),
        );
        toast.success("Team updated successfully!");
      }
      setEditDialogOpen(false);
      setEditTeam(null);
    } catch (error) {
      console.error("Error updating team:", error);
      toast.error("Error updating team");
    }
  };

  const handleDeleteTeam = (team: TeamData) => {
    setTeamToDelete(team);
    setDeleteDialogOpen(true);
  };

  const confirmDelete = async () => {
    if (!teamToDelete) return;

    try {
      if (useMockData) {
        setTeams(teams.filter((t) => t._id !== teamToDelete._id));
        toast.success("Team deleted successfully!");
      } else {
        await deleteTeam(teamToDelete._id);
        setTeams(teams.filter((t) => t._id !== teamToDelete._id));
        toast.success("Team deleted successfully!");
      }
    } catch (error) {
      console.error("Error deleting team:", error);
      toast.error("Error deleting team");
    } finally {
      setDeleteDialogOpen(false);
      setTeamToDelete(null);
    }
  };

  const handleViewTeam = (team: TeamData) => {
    setSelectedTeamView(team);
    setViewDialogOpen(true);
  };

  const handleAddMember = async () => {
    if (!selectedTeamView || !selectedUserId) {
      toast.error("Please select a member to add");
      return;
    }

    // Check if user is already a member of this team
    const isAlreadyMember = selectedTeamView.members?.some(
      (m: any) => m._id === selectedUserId,
    );
    if (isAlreadyMember) {
      toast.error("This user is already a member of the team");
      return;
    }

    // Check if user is already in a team assigned to an active site (not completed)
    const userTeamAssignment = Object.entries(teamSiteAssignments).find(
      ([teamId, assignment]) => {
        const team = teams.find(t => t._id === teamId);
        const isMemberOfTeam = team?.members?.some((m: any) => m._id === selectedUserId);
        const isSiteCompleted = assignment.status === 'completed';
        return isMemberOfTeam && !isSiteCompleted;
      }
    );
    if (userTeamAssignment) {
      const [teamId, assignment] = userTeamAssignment;
      const team = teams.find(t => t._id === teamId);
      toast.error(`Ce membre est déjà dans l'équipe "${team?.name}" assignée au site "${assignment.siteName}". Vous ne pouvez pas l'ajouter à une autre équipe.`);
      return;
    }

    try {
      if (useMockData) {
        const userToAdd = availableUsers.find((u) => u._id === selectedUserId);
        if (userToAdd) {
          const updatedTeam = {
            ...selectedTeamView,
            members: [...selectedTeamView.members, userToAdd],
          };
          setTeams(
            teams.map((t) =>
              t._id === selectedTeamView._id ? updatedTeam : t,
            ),
          );
          setSelectedTeamView(updatedTeam);
        }
        toast.success("Member added successfully!");
      } else {
        const response = await addMemberToTeam(
          selectedTeamView._id,
          selectedUserId,
        );
        setTeams(
          teams.map((t) =>
            t._id === selectedTeamView._id ? response.data : t,
          ),
        );
        setSelectedTeamView(response.data);
        toast.success("Member added successfully!");
      }
      setSelectedUserId("");
      setMemberDialogOpen(false);
    } catch (error) {
      console.error("Error adding member:", error);
      toast.error("Error adding member");
    }
  };

  const handleRemoveMember = async (memberId: string) => {
    if (!selectedTeamView) return;

    try {
      if (useMockData) {
        const updatedTeam = {
          ...selectedTeamView,
          members: selectedTeamView.members.filter(
            (m: any) => m._id !== memberId,
          ),
        };
        setTeams(
          teams.map((t) => (t._id === selectedTeamView._id ? updatedTeam : t)),
        );
        setSelectedTeamView(updatedTeam);
        toast.success("Member removed successfully!");
      } else {
        const response = await removeMemberFromTeam(
          selectedTeamView._id,
          memberId,
        );
        setTeams(
          teams.map((t) =>
            t._id === selectedTeamView._id ? response.data : t,
          ),
        );
        setSelectedTeamView(response.data);
        toast.success("Member removed successfully!");
      }
    } catch (error) {
      console.error("Error removing member:", error);
      toast.error("Error removing member");
    }
  };

  return (
    <div className="space-y-6">
      {/* Statistics Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="bg-gradient-to-br from-blue-500 to-blue-600 text-white">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-blue-100 text-sm">Total Teams</p>
                <p className="text-2xl font-bold">{totalTeams}</p>
              </div>
              <div className="bg-white/20 rounded-full p-2">
                <Users className="h-6 w-6" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-green-500 to-green-600 text-white">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-green-100 text-sm">Active Teams</p>
                <p className="text-2xl font-bold">{activeTeams}</p>
              </div>
              <div className="bg-white/20 rounded-full p-2">
                <Building className="h-6 w-6" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-orange-500 to-orange-600 text-white">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-orange-100 text-sm">Inactive Teams</p>
                <p className="text-2xl font-bold">{inactiveTeams}</p>
              </div>
              <div className="bg-white/20 rounded-full p-2">
                <Users className="h-6 w-6" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-purple-500 to-purple-600 text-white">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-purple-100 text-sm">Total Members</p>
                <p className="text-2xl font-bold">{totalMembers}</p>
              </div>
              <div className="bg-white/20 rounded-full p-2">
                <User className="h-6 w-6" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Header Section */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white">
            Teams
          </h1>
          <p className="text-sm sm:text-base text-gray-500 mt-1">
            {filteredTeams.length} team{filteredTeams.length !== 1 ? "s" : ""} •
            <span className="ml-1">
              {teams.filter((t) => t.isActive).length} active
              {teams.filter((t) => t.isActive).length !== 1 ? "s" : ""}
            </span>
          </p>
        </div>
        {canManageTeam ? (
          <Dialog open={addDialogOpen} onOpenChange={setAddDialogOpen}>
            <DialogTrigger asChild>
              <Button className="bg-gradient-to-r from-blue-600 to-green-600 hover:from-blue-700 hover:to-green-700 shadow-lg hover:shadow-xl transition-all">
                <Plus className="h-4 w-4 mr-2" />
                New Team
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Create New Team</DialogTitle>
                <DialogDescription>
                  Fill in the information below to create a new team
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="team-name">Team Name *</Label>
                  <Input
                    id="team-name"
                    placeholder="Team A"
                    value={newTeam.name}
                    onChange={(e) =>
                      setNewTeam({ ...newTeam, name: e.target.value })
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="team-code">Team Code</Label>
                  <Input
                    id="team-code"
                    placeholder="TEAM-A"
                    value={newTeam.teamCode}
                    onChange={(e) =>
                      setNewTeam({ ...newTeam, teamCode: e.target.value })
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="team-description">Description</Label>
                  <Input
                    id="team-description"
                    placeholder="Description of the team"
                    value={newTeam.description}
                    onChange={(e) =>
                      setNewTeam({ ...newTeam, description: e.target.value })
                    }
                  />
                </div>
                <Button
                  className="w-full bg-gradient-to-r from-blue-600 to-green-600 hover:from-blue-700 hover:to-green-700"
                  onClick={handleAddTeam}
                >
                  Create Team
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        ) : (
          <Button disabled className="opacity-50 cursor-not-allowed">
            <Plus className="h-4 w-4 mr-2" />
            Add Team (No Permission)
          </Button>
        )}
      </div>

      {/* Edit Team Dialog */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Team</DialogTitle>
            <DialogDescription>Update team information</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="edit-team-name">Team Name *</Label>
              <Input
                id="edit-team-name"
                value={editTeam?.name || ""}
                onChange={(e) =>
                  setEditTeam(
                    editTeam ? { ...editTeam, name: e.target.value } : null,
                  )
                }
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-team-code">Team Code</Label>
              <Input
                id="edit-team-code"
                value={editTeam?.teamCode || ""}
                onChange={(e) =>
                  setEditTeam(
                    editTeam ? { ...editTeam, teamCode: e.target.value } : null,
                  )
                }
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-team-description">Description</Label>
              <Input
                id="edit-team-description"
                value={editTeam?.description || ""}
                onChange={(e) =>
                  setEditTeam(
                    editTeam
                      ? { ...editTeam, description: e.target.value }
                      : null,
                  )
                }
              />
            </div>
            <div className="flex gap-2">
              <Button
                className="flex-1 bg-gradient-to-r from-blue-600 to-green-600 hover:from-blue-700 hover:to-green-700"
                onClick={handleSaveEdit}
              >
                Save
              </Button>
              <Button
                variant="outline"
                className="flex-1"
                onClick={() => setEditDialogOpen(false)}
              >
                Cancel
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirmer la suppression</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete the team "{teamToDelete?.name}"?
              This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <div className="flex gap-2">
            <Button
              variant="destructive"
              className="flex-1"
              onClick={confirmDelete}
            >
              Delete
            </Button>
            <Button
              variant="outline"
              className="flex-1"
              onClick={() => setDeleteDialogOpen(false)}
            >
              Cancel
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* View Team Details Dialog */}
      <Dialog open={viewDialogOpen} onOpenChange={setViewDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{selectedTeamView?.name}</DialogTitle>
            <DialogDescription>
              {selectedTeamView?.description}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <Badge
                variant={
                  selectedTeamView?.isActive ? "secondary" : "destructive"
                }
              >
                {selectedTeamView?.isActive ? "Active" : "Inactive"}
              </Badge>
              {selectedTeamView?.teamCode && (
                <Badge variant="outline">{selectedTeamView.teamCode}</Badge>
              )}
            </div>

            <div className="border-t pt-4">
              <div className="flex items-center justify-between mb-2">
                <h4 className="font-semibold flex items-center gap-2">
                  <Users className="h-4 w-4" />
                  Members ({selectedTeamView?.members?.length || 0})
                </h4>
                {canManageTeam && (
                  <Dialog
                    open={memberDialogOpen}
                    onOpenChange={setMemberDialogOpen}
                  >
                    <DialogTrigger asChild>
                      <Button variant="outline" size="sm">
                        <Plus className="h-3 w-3 mr-1" />
                        Add
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Add Member</DialogTitle>
                      </DialogHeader>
                      <div className="space-y-4">
                        <Select
                          value={selectedUserId}
                          onValueChange={setSelectedUserId}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select a member" />
                          </SelectTrigger>
                          <SelectContent>
                            {(() => {
                              // Filter users: not in current team, not in team assigned to active site (not completed)
                              const availableForSelection = availableUsers
                                .filter((u) => {
                                  // Not already in this team
                                  if (selectedTeamView?.members?.some((m: any) => m._id === u._id)) {
                                    return false;
                                  }
                                  // Check if user is in a team assigned to a site that's NOT completed
                                  const userInActiveAssignedTeam = Object.entries(teamSiteAssignments).find(
                                    ([teamId, assignment]) => {
                                      const team = teams.find(t => t._id === teamId);
                                      const isMemberOfTeam = team?.members?.some((m: any) => m._id === u._id);
                                      const isSiteCompleted = assignment.status === 'completed';
                                      return isMemberOfTeam && !isSiteCompleted;
                                    }
                                  );
                                  // Allow if not in any active assigned team (site not completed)
                                  return !userInActiveAssignedTeam;
                                });
                              if (availableForSelection.length === 0) {
                                return (
                                  <div className="py-4 px-2 text-sm text-gray-500 text-center">
                                    Aucun utilisateur disponible
                                  </div>
                                );
                              }
                              return availableForSelection.map((user) => (
                                <SelectItem key={user._id} value={user._id}>
                                  {user.firstName} {user.lastName} ({user.email})
                                </SelectItem>
                              ));
                            })()}
                          </SelectContent>
                        </Select>
                        <Button
                          className="w-full"
                          onClick={handleAddMember}
                          disabled={!selectedUserId}
                        >
                          Add Member
                        </Button>
                      </div>
                    </DialogContent>
                  </Dialog>
                )}
              </div>
              <div className="space-y-2 max-h-60 overflow-y-auto">
                {selectedTeamView?.members?.map((member: any) => (
                  <div
                    key={member._id}
                    className="flex items-center justify-between p-2 bg-gray-50 rounded"
                  >
                    <div className="flex items-center gap-2">
                      <Avatar className="h-8 w-8">
                        <AvatarFallback className="text-xs bg-blue-100 text-blue-600">
                          {member.firstName?.charAt(0)}
                          {member.lastName?.charAt(0)}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="text-sm font-medium">
                          {member.firstName} {member.lastName}
                        </p>
                        <p className="text-xs text-gray-500">{member.email}</p>
                      </div>
                    </div>
                    {canManageTeam && (
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-red-500 hover:text-red-700"
                        onClick={() => handleRemoveMember(member._id)}
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    )}
                  </div>
                ))}
                {(!selectedTeamView?.members ||
                  selectedTeamView.members.length === 0) && (
                  <p className="text-sm text-gray-500 text-center py-4">
                    No members in this team
                  </p>
                )}
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Teams Grid */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      ) : (
        <Card>
          <CardHeader>
            <div className="flex items-center gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Search teams..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {filteredTeams.length === 0 ? (
              <div className="text-center py-12">
                <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500">No teams found</p>
              </div>
            ) : (
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {filteredTeams.map((team) => (
                  <Card
                    key={team._id}
                    className="hover:shadow-md transition-shadow cursor-pointer"
                    onClick={() => handleViewTeam(team)}
                  >
                    <CardContent className="p-6">
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex items-center gap-3">
                          <Avatar className="h-12 w-12">
                            <AvatarFallback className="bg-gradient-to-br from-blue-600 to-green-600 text-white">
                              {getInitials(team.name)}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <h3 className="font-semibold text-gray-900 dark:text-white">
                              {team.name}
                            </h3>
                            {team.teamCode && (
                              <p className="text-xs text-gray-500">
                                {team.teamCode}
                              </p>
                            )}
                          </div>
                        </div>
                        <Badge
                          variant={team.isActive ? "secondary" : "destructive"}
                        >
                          {team.isActive ? "Active" : "Inactive"}
                        </Badge>
                      </div>

                      {team.description && (
                        <p className="text-sm text-gray-600 mb-4 line-clamp-2">
                          {team.description}
                        </p>
                      )}

                      <div className="flex items-center gap-4 text-sm text-gray-500 mb-4">
                        <div className="flex items-center gap-1">
                          <Users className="h-4 w-4" />
                          <span>{team.members?.length || 0} membres</span>
                        </div>
                        {isTeamAssignedToSite(team._id) && (
                          <div className="flex items-center gap-1">
                            <Building className="h-4 w-4" />
                            <span>
                              Site: {teamSiteAssignments[team._id].siteName}
                            </span>
                          </div>
                        )}
                      </div>

                      <div
                        className="flex gap-2 pt-4 border-t"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <Button
                          variant="outline"
                          size="sm"
                          className="flex-1"
                          onClick={() => handleEditTeam(team)}
                        >
                          <Edit className="h-3 w-3 mr-1" />
                          Modifier
                        </Button>
                        {canManageTeam && (
                          <Button
                            variant="outline"
                            size="sm"
                            className="flex-1 text-red-600 hover:text-red-700 hover:bg-red-50"
                            onClick={() => handleDeleteTeam(team)}
                          >
                            <Trash2 className="h-3 w-3 mr-1" />
                            Delete
                          </Button>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
