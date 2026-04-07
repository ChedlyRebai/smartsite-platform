import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router";
import { MessageCircle, Users, Video } from "lucide-react";
import { getTeamMembers, type TeamMember } from "@/app/action/dashboard.action";

function getRoleLabel(role: TeamMember["role"]) {
  if (!role) return "Member";
  if (typeof role === "string") {
    return role
      .split("_")
      .map((chunk) => chunk.charAt(0).toUpperCase() + chunk.slice(1))
      .join(" ");
  }

  if (typeof role === "object" && "name" in role && role.name) {
    return String(role.name)
      .split("_")
      .map((chunk) => chunk.charAt(0).toUpperCase() + chunk.slice(1))
      .join(" ");
  }

  return "Member";
}

function getInitials(member: TeamMember) {
  const source = `${member.firstName || ""} ${member.lastName || ""}`.trim();
  if (!source) return "TM";

  return source
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part.charAt(0).toUpperCase())
    .join("");
}

export default function MyTeamMembers() {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "active" | "inactive">("all");

  const { data: members = [], isLoading, isError } = useQuery({
    queryKey: ["myTeamMembers"],
    queryFn: getTeamMembers,
  });

  const filteredMembers = useMemo(() => {
    const text = search.trim().toLowerCase();

    return members.filter((member) => {
      const fullName = `${member.firstName || ""} ${member.lastName || ""}`.toLowerCase();
      const email = (member.email || "").toLowerCase();
      const role = getRoleLabel(member.role).toLowerCase();

      const matchesSearch =
        !text || fullName.includes(text) || email.includes(text) || role.includes(text);

      const matchesStatus =
        statusFilter === "all" ||
        (statusFilter === "active" && member.isActive) ||
        (statusFilter === "inactive" && !member.isActive);

      return matchesSearch && matchesStatus;
    });
  }, [members, search, statusFilter]);

  const memberIdsForRoom = useMemo(
    () => filteredMembers.slice(0, 20).map((member) => member._id).filter(Boolean),
    [filteredMembers],
  );

  const groupRoomLink = `/group-chat/my-team-room?name=My%20Team&members=${memberIdsForRoom.join(",")}`;

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">My Team Members</h1>
          <p className="text-sm opacity-70 mt-1">
            View your team list and start direct messages or a group video call.
          </p>
        </div>
        <Link to={groupRoomLink} className="btn btn-primary">
          <Video className="size-4 mr-2" />
          Open Team Group Chat
        </Link>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="card bg-base-200">
          <div className="card-body p-4">
            <p className="text-xs uppercase opacity-60">Total</p>
            <p className="text-2xl font-bold">{members.length}</p>
          </div>
        </div>
        <div className="card bg-base-200">
          <div className="card-body p-4">
            <p className="text-xs uppercase opacity-60">Active</p>
            <p className="text-2xl font-bold text-success">
              {members.filter((m) => m.isActive).length}
            </p>
          </div>
        </div>
        <div className="card bg-base-200">
          <div className="card-body p-4">
            <p className="text-xs uppercase opacity-60">Inactive</p>
            <p className="text-2xl font-bold text-warning">
              {members.filter((m) => !m.isActive).length}
            </p>
          </div>
        </div>
      </div>

      <div className="card bg-base-200">
        <div className="card-body p-4 sm:p-5">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="input input-bordered w-full"
              placeholder="Search by name, email or role"
            />

            <select
              className="select select-bordered w-full"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as "all" | "active" | "inactive")}
            >
              <option value="all">All status</option>
              <option value="active">Active only</option>
              <option value="inactive">Inactive only</option>
            </select>

            <div className="flex items-center justify-start md:justify-end text-sm opacity-70">
              {filteredMembers.length} member(s)
            </div>
          </div>
        </div>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-16">
          <span className="loading loading-spinner loading-lg" />
        </div>
      ) : isError ? (
        <div className="card bg-error/10 border border-error/30">
          <div className="card-body">
            <h2 className="card-title">Could not load team members</h2>
            <p className="text-sm">Please check your API connection and try again.</p>
          </div>
        </div>
      ) : filteredMembers.length === 0 ? (
        <div className="card bg-base-200">
          <div className="card-body text-center py-12">
            <Users className="size-10 opacity-50 mx-auto mb-3" />
            <h3 className="font-semibold text-lg">No members found</h3>
            <p className="text-sm opacity-70">Change your search or status filter.</p>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {filteredMembers.map((member) => {
            const fullName = `${member.firstName || ""} ${member.lastName || ""}`.trim() || "Unnamed";

            return (
              <div key={member._id} className="card bg-base-200 hover:shadow-md transition-shadow">
                <div className="card-body p-5 space-y-4">
                  <div className="flex items-center gap-3">
                    <div className="avatar placeholder">
                      <div className="bg-primary text-primary-content rounded-full w-12">
                        <span className="text-sm">{getInitials(member)}</span>
                      </div>
                    </div>

                    <div className="min-w-0">
                      <h3 className="font-semibold truncate">{fullName}</h3>
                      <p className="text-xs opacity-70 truncate">{member.email || "No email"}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="badge badge-outline">{getRoleLabel(member.role)}</span>
                    <span className={`badge ${member.isActive ? "badge-success" : "badge-warning"}`}>
                      {member.isActive ? "Active" : "Inactive"}
                    </span>
                  </div>

                  <div className="card-actions justify-end">
                    <Link to={`/chat/${member._id}`} className="btn btn-outline btn-sm">
                      <MessageCircle className="size-4 mr-2" />
                      Message
                    </Link>
                    <Link to={`/chat/${member._id}?autocall=1`} className="btn btn-success btn-sm text-white">
                      <Video className="size-4 mr-2" />
                      Video Call
                    </Link>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}