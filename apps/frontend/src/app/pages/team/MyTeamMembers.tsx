import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router";
import {
  ArrowUpRight,
  Clock3,
  Mail,
  MessageCircle,
  Search,
  ShieldCheck,
  Sparkles,
  Users,
  Video,
} from "lucide-react";
import { getTeamMembers, type TeamMember } from "@/app/action/dashboard.action";
import { getTeamById } from "@/app/action/team.action";
import { getCurrentUser } from "@/app/action/auth.action";

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

function formatJoinedDate(dateValue: string) {
  const date = new Date(dateValue);

  if (Number.isNaN(date.getTime())) {
    return "Recently joined";
  }

  return new Intl.DateTimeFormat(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(date);
}

export default function MyTeamMembers() {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "active" | "inactive">("all");

  const {data:currentUser}= useQuery({
    queryKey: ["currentUser"],
    queryFn: getCurrentUser
  })

console.log(currentUser);
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

  const activeMembersCount = useMemo(
    () => members.filter((member) => member.isActive).length,
    [members],
  );
  const inactiveMembersCount = members.length - activeMembersCount;

  const memberIdsForRoom = useMemo(
    () => filteredMembers.slice(0, 20).map((member) => member._id).filter(Boolean),
    [filteredMembers],
  );

  const groupRoomLink = `/group-chat/my-team-room?name=My%20Team&members=${memberIdsForRoom.join(",")}`;

  return (
    <div className="p-4 space-y-6 sm:p-6 lg:space-y-8 lg:p-8">
      <section className="relative overflow-hidden rounded-3xl border border-base-300 bg-base-200/80 shadow-lg">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(59,130,246,0.22),transparent_35%),radial-gradient(circle_at_bottom_left,rgba(34,197,94,0.16),transparent_32%)]" />
        <div className="relative grid gap-6 p-6 xl:grid-cols-[1.5fr_0.85fr] xl:p-10 sm:p-8">
          <div className="space-y-5">
            <div className="inline-flex items-center gap-2 rounded-full border border-base-300 bg-base-100/70 px-3 py-1 text-xs font-medium uppercase tracking-[0.2em] text-base-content/70 backdrop-blur-sm">
              <Sparkles className="size-3.5 text-primary" />
              Team overview
            </div>

            <div className="space-y-3">
              <h1 className="text-3xl font-bold tracking-tight sm:text-4xl lg:text-5xl">
                My Team Members
              </h1>
              <p className="max-w-2xl text-sm leading-6 text-base-content/70 sm:text-base">
                Explore your team at a glance, filter people quickly, and jump straight into direct
                messages or a group video call.
              </p>
            </div>

            <div className="flex flex-wrap gap-3">
              <Link to={groupRoomLink} className="btn btn-primary shadow-md shadow-primary/20">
                <Video className="size-4" />
                Open Team Group Chat
                <ArrowUpRight className="size-4" />
              </Link>
              <div className="inline-flex items-center gap-2 rounded-full border border-base-300 bg-base-100/70 px-4 py-2 text-sm text-base-content/70 backdrop-blur-sm">
                <ShieldCheck className="size-4 text-success" />
                Fast access to the people you work with most
              </div>
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-1">
            <div className="rounded-2xl border border-base-300 bg-base-100/80 p-4 backdrop-blur-sm">
              <p className="text-xs uppercase tracking-[0.22em] text-base-content/60">Total members</p>
              <p className="mt-2 text-3xl font-semibold">{members.length}</p>
              <p className="mt-1 text-sm text-base-content/60">Everyone currently synced to your team.</p>
            </div>
            <div className="rounded-2xl border border-base-300 bg-base-100/80 p-4 backdrop-blur-sm">
              <p className="text-xs uppercase tracking-[0.22em] text-base-content/60">Live status</p>
              <div className="mt-2 flex items-end justify-between gap-3">
                <div>
                  <p className="text-3xl font-semibold text-success">{activeMembersCount}</p>
                  <p className="text-sm text-base-content/60">Active now</p>
                </div>
                <div className="text-right">
                  <p className="text-2xl font-semibold text-warning">{inactiveMembersCount}</p>
                  <p className="text-sm text-base-content/60">Inactive</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="grid gap-3 sm:grid-cols-3">
        <div className="card border border-base-300 bg-base-100/90 shadow-sm">
          <div className="card-body p-4">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-xs uppercase tracking-[0.2em] text-base-content/60">Visible</p>
                <p className="mt-2 text-2xl font-bold">{filteredMembers.length}</p>
              </div>
              <div className="rounded-2xl bg-primary/10 p-3 text-primary">
                <Users className="size-5" />
              </div>
            </div>
          </div>
        </div>
        <div className="card border border-base-300 bg-base-100/90 shadow-sm">
          <div className="card-body p-4">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-xs uppercase tracking-[0.2em] text-base-content/60">Available</p>
                <p className="mt-2 text-2xl font-bold text-success">{activeMembersCount}</p>
              </div>
              <div className="rounded-2xl bg-success/10 p-3 text-success">
                <Clock3 className="size-5" />
              </div>
            </div>
          </div>
        </div>
        <div className="card border border-base-300 bg-base-100/90 shadow-sm">
          <div className="card-body p-4">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-xs uppercase tracking-[0.2em] text-base-content/60">Ready to message</p>
                <p className="mt-2 text-2xl font-bold text-info">{filteredMembers.length}</p>
              </div>
              <div className="rounded-2xl bg-info/10 p-3 text-info">
                <MessageCircle className="size-5" />
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="card border border-base-300 bg-base-100/90 shadow-sm">
        <div className="card-body gap-4 p-4 sm:p-5">
          <div className="flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
            <div>
              <h2 className="text-lg font-semibold">Find the right person</h2>
              <p className="text-sm text-base-content/60">Search by name, email, or role and refine by status.</p>
            </div>
            <div className="text-sm text-base-content/60">
              Showing <span className="font-semibold text-base-content">{filteredMembers.length}</span> of{" "}
              <span className="font-semibold text-base-content">{members.length}</span>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-3 md:grid-cols-[1.4fr_0.8fr_auto]">
            <label className="input input-bordered flex items-center gap-2 bg-base-100">
              <Search className="size-4 text-base-content/50" />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full"
                placeholder="Search by name, email or role"
              />
            </label>

            <select
              className="select select-bordered w-full bg-base-100"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as "all" | "active" | "inactive")}
            >
              <option value="all">All status</option>
              <option value="active">Active only</option>
              <option value="inactive">Inactive only</option>
            </select>

            <div className="flex items-center rounded-2xl border border-dashed border-base-300 px-4 py-3 text-sm text-base-content/60">
              Use filters to narrow the list before starting a chat or call.
            </div>
          </div>
        </div>
      </section>

      {isLoading ? (
        <div className="flex justify-center py-16">
          <span className="loading loading-spinner loading-lg" />
        </div>
      ) : isError ? (
        <div className="card border border-error/30 bg-error/10 shadow-sm">
          <div className="card-body gap-2 p-6">
            <h2 className="card-title">Could not load team members</h2>
            <p className="text-sm text-base-content/70">Please check your API connection and try again.</p>
          </div>
        </div>
      ) : filteredMembers.length === 0 ? (
        <div className="card border border-base-300 bg-base-100/90 shadow-sm">
          <div className="card-body flex items-center py-14 text-center">
            <div className="mx-auto flex max-w-md flex-col items-center gap-3">
              <div className="rounded-full bg-base-200 p-4 text-base-content/60">
                <Users className="size-10" />
              </div>
              <h3 className="text-lg font-semibold">No members found</h3>
              <p className="text-sm text-base-content/60">Change your search or status filter to reveal more people.</p>
            </div>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
          {filteredMembers.map((member) => {
            const fullName = `${member.firstName || ""} ${member.lastName || ""}`.trim() || "Unnamed";

            return (
              <div
                key={member._id}
                className="group overflow-hidden rounded-3xl border border-base-300 bg-base-100/90 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-xl"
              >
                <div className={`h-1 w-full ${member.isActive ? "bg-success" : "bg-warning"}`} />

                <div className="space-y-5 p-5">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex min-w-0 items-center gap-4">
                      <div
                        className={`flex size-14 items-center justify-center rounded-2xl text-lg font-semibold text-white shadow-sm ${
                          member.isActive
                            ? "bg-linear-to-br from-success to-emerald-500"
                            : "bg-linear-to-br from-warning to-amber-500"
                        }`}
                      >
                        {getInitials(member)}
                      </div>

                      <div className="min-w-0">
                        <h3 className="truncate text-base font-semibold">{fullName}</h3>
                        <p className="truncate text-sm text-base-content/60">{member.email || "No email provided"}</p>
                      </div>
                    </div>

                    <span
                      className={`badge gap-1 border-0 px-3 py-3 text-xs font-medium ${
                        member.isActive ? "badge-success text-success-content" : "badge-warning text-warning-content"
                      }`}
                    >
                      <span className="size-2 rounded-full bg-current" />
                      {member.isActive ? "Active" : "Inactive"}
                    </span>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    <span className="badge badge-outline badge-sm">{getRoleLabel(member.role)}</span>
                    <span className="badge badge-ghost badge-sm gap-1 text-base-content/70">
                      <Mail className="size-3.5" />
                      Contact ready
                    </span>
                  </div>

                  <div className="rounded-2xl bg-base-200/70 p-3 text-sm text-base-content/70">
                    <div className="flex items-center gap-2 font-medium text-base-content">
                      <Clock3 className="size-4 text-primary" />
                      Joined {formatJoinedDate(member.createdAt)}
                    </div>
                    <p className="mt-1 pl-6 text-xs leading-5">
                      Use the message or video call actions below to reach this teammate quickly.
                    </p>
                  </div>

                  <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                    <Link to={`/chat/${member._id}`} className="btn btn-outline btn-sm justify-start">
                      <MessageCircle className="size-4" />
                      Message
                    </Link>
                    <Link to={`/chat/${member._id}?autocall=1`} className="btn btn-primary btn-sm justify-start">
                      <Video className="size-4" />
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