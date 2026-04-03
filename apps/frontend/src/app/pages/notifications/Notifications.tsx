import {
  Bell,
  CheckCircle,
  AlertTriangle,
  Info,
  X,
  CircleIcon,
} from "lucide-react";
import { useMemo } from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "../../components/ui/card";
import { Badge } from "../../components/ui/badge";
import { Button } from "../../components/ui/button";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "../../components/ui/tabs";

import { toast } from "sonner";
import { useInfiniteQuery, useQuery } from "@tanstack/react-query";
import { getCurrentUser } from "@/app/action/auth.action";
import {
  deleteNotificationById,
  getMyNotifications,
  getTeamNotifications,
  getUnreadNotifications,
  getTeamUnreadNotificationCount,
  getUnreadNotificationCount,
  markTeamNotificationsAsRead,
} from "@/app/action/notification.action";
import { useAuthStore } from "@/app/store/authStore";

export default function Notifications() {
  const authUser = useAuthStore((state) => state.user);
  const PAGE_SIZE = 5;

  const getIcon = (type: string) => {
    switch (type) {
      case "critical":
        return <AlertTriangle className="h-5 w-5 text-red-600" />;
      case "warning":
        return <AlertTriangle className="h-5 w-5 text-orange-600" />;
      case "success":
        return <CheckCircle className="h-5 w-5 text-green-600" />;
      default:
        return <Info className="h-5 w-5 text-blue-600" />;
    }
  };

  const { data: currentUser } = useQuery({
    queryKey: ["currentUser", authUser?.access_token],
    queryFn: () => getCurrentUser(authUser),
    enabled: Boolean(authUser?.access_token),
  });
  console.log("current user data in notifications page", currentUser);
  const normalizedTeamId = useMemo(() => {
    const assignedTeam = currentUser?.data?.assignedTeam;

    if (!Array.isArray(assignedTeam) || assignedTeam.length === 0) {
      return "";
    }

    const firstTeam = assignedTeam[0];

    if (typeof firstTeam === "string") {
      return firstTeam.trim();
    }

    if (firstTeam && typeof firstTeam === "object") {
      return String(firstTeam._id ?? firstTeam.id ?? "").trim();
    }

    return "";
  }, [currentUser]);

  const hasTeamFilter = normalizedTeamId.length > 0;

  const getBackgroundColor = (type: string) => {
    switch (type) {
      case "critical":
        return "bg-red-50 border-red-200";
      case "warning":
        return "bg-orange-50 border-orange-200";
      case "success":
        return "bg-green-50 border-green-200";
      default:
        return "bg-blue-50 border-blue-200";
    }
  };

  const handleMarkAllAsRead = async () => {
    if (!hasTeamFilter) {
      toast.error("No team found for the current user");
      return;
    }

    try {
      await markTeamNotificationsAsRead(normalizedTeamId);
      await Promise.all([
        myNotificationsQuery.refetch(),
        unreadNotificationsQuery.refetch(),
        teamNotificationsQuery.refetch(),
        teamUnreadCountQuery.refetch(),
      ]);
      toast.success("All team notifications marked as read");
    } catch {
      toast.error("Failed to mark notifications as read");
    }
  };

  const myNotificationsQuery = useInfiniteQuery({
    queryKey: ["myNotifications", PAGE_SIZE],
    queryFn: ({ pageParam = 1 }) => getMyNotifications(pageParam, PAGE_SIZE),
    initialPageParam: 1,
    getNextPageParam: (lastPage, allPages) =>
      lastPage.length === PAGE_SIZE ? allPages.length + 1 : undefined,
  });

  const unreadNotificationsQuery = useInfiniteQuery({
    queryKey: ["unreadNotifications", PAGE_SIZE],
    queryFn: ({ pageParam = 1 }) => getUnreadNotifications(pageParam, PAGE_SIZE),
    initialPageParam: 1,
    getNextPageParam: (lastPage, allPages) =>
      lastPage.length === PAGE_SIZE ? allPages.length + 1 : undefined,
  });

  const teamNotificationsQuery = useInfiniteQuery({
    queryKey: ["teamNotifications", normalizedTeamId, PAGE_SIZE],
    queryFn: ({ pageParam = 1 }) =>
      getTeamNotifications(normalizedTeamId, pageParam, PAGE_SIZE),
    initialPageParam: 1,
    enabled: hasTeamFilter,
    getNextPageParam: (lastPage, allPages) =>
      lastPage.length === PAGE_SIZE ? allPages.length + 1 : undefined,
  });

  const { data: UnreadNotifCount } = useQuery({
    queryKey: ["unreadNotificationsLength"],
    queryFn: () => getUnreadNotificationCount(),
  });

  const myNotifcations = useMemo(
    () => myNotificationsQuery.data?.pages.flat() ?? [],
    [myNotificationsQuery.data],
  );

  const unreadNotifs = useMemo(
    () => unreadNotificationsQuery.data?.pages.flat() ?? [],
    [unreadNotificationsQuery.data],
  );

  const teamNotifications = useMemo(
    () => teamNotificationsQuery.data?.pages.flat() ?? [],
    [teamNotificationsQuery.data],
  );

  const teamUnreadCountQuery = useQuery({
    queryKey: ["teamUnreadNotificationCount", normalizedTeamId],
    queryFn: () => getTeamUnreadNotificationCount(normalizedTeamId),
    enabled: hasTeamFilter,
  });

  const teamUnreadCount = teamUnreadCountQuery.data;

  const loadMoreMyNotifications = () => myNotificationsQuery.fetchNextPage();
  const loadMoreUnreadNotifications = () =>
    unreadNotificationsQuery.fetchNextPage();
  const loadMoreTeamNotifications = () => teamNotificationsQuery.fetchNextPage();

  console.log("unread notif", unreadNotifs);
  const handleDeleteNotification = async (id: string) => {
    const res = await deleteNotificationById(id);
    if (res.status === 200) {
      myNotificationsQuery.refetch();
      unreadNotificationsQuery.refetch();
      teamNotificationsQuery.refetch();
      toast.success("Notification removed");
    }
  };

  const teamAllNotifications = teamNotifications;
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Notifications</h1>
          <p className="text-gray-500 mt-1">
            Stay updated with alerts and announcements
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={handleMarkAllAsRead}
            disabled={!hasTeamFilter || (teamUnreadCount ?? 0) === 0}
          >
            Mark All as Read
          </Button>
          {/* <Button variant="outline" onClick={handleClearAll} disabled={notifications.length === 0}>
            <X className="h-4 w-4 mr-2" />
            Clear All
          </Button> */}
        </div>
      </div>

     
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bell className="h-5 w-5" />
            Notification Center
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="unread" className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="unread">Unread ({UnreadNotifCount})</TabsTrigger>
              <TabsTrigger value="all">All Notifications</TabsTrigger>
              <TabsTrigger value="team" disabled={!hasTeamFilter}>
                Team {hasTeamFilter ? `(${teamAllNotifications.length})` : ""}
              </TabsTrigger>
            </TabsList>

            <TabsContent value="unread" className="space-y-3 mt-4">
              {unreadNotifs.length === 0 ? (
                <div className="text-center py-12 text-gray-500">
                  <Bell className="h-12 w-12 mx-auto mb-3 text-gray-300" />
                  <p>No unread notifications</p>
                </div>
              ) : (
                unreadNotifs.map((notification) => (
                  <div
                    key={notification.id}
                    className={`flex items-start gap-4 p-4 border rounded-lg ${getBackgroundColor(notification.type)}`}
                  >
                    <div className="flex-shrink-0 mt-1">{getIcon(notification.type)}</div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1">
                          <h3 className={notification.read ? "font-semibold text-gray-900" : "font-extrabold text-gray-900"}>
                            {notification.title}
                          </h3>
                          <p className="text-sm text-gray-600 mt-1">{notification.message}</p>
                          <p className="text-xs text-gray-400 mt-2">{new Date(notification.createdAt).toLocaleString()}</p>
                        </div>
                        <Badge
                          variant={
                            notification.type === "critical"
                              ? "destructive"
                              : notification.type === "warning"
                                ? "destructive"
                                : notification.type === "success"
                                  ? "secondary"
                                  : "default"
                          }
                        >
                          {notification.type}
                        </Badge>
                      </div>
                    </div>
                    {!notification.read && (
                      <CircleIcon className="size-4 rounded-full text-gray-200 bg-gray-200 self-start my-auto" />
                    )}
                    <Button variant="ghost" size="icon" className="flex-shrink-0 my-auto">
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                ))
              )}

              {unreadNotifs.length > 0 && unreadNotificationsQuery.hasNextPage && (
                <div className="pt-2 flex justify-center">
                  <Button variant="outline" onClick={loadMoreUnreadNotifications} disabled={unreadNotificationsQuery.isFetchingNextPage}>
                    {unreadNotificationsQuery.isFetchingNextPage ? "Loading..." : "Load more"}
                  </Button>
                </div>
              )}
            </TabsContent>

            <TabsContent value="all" className="space-y-3 mt-4">
              {myNotifcations.length === 0 ? (
                <div className="text-center py-12 text-gray-500">
                  <Bell className="h-12 w-12 mx-auto mb-3 text-gray-300" />
                  <p>No notifications found</p>
                </div>
              ) : (
                myNotifcations.map((notification) => (
                  <div
                    key={notification.id}
                    className={`flex items-start gap-4 p-4 border rounded-lg ${notification.read ? "bg-gray-50 opacity-75" : getBackgroundColor(notification.type)}`}
                  >
                    <div className="flex-shrink-0 mt-1">{getIcon(notification.type)}</div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1">
                          <h3 className={notification.read ? "font-semibold text-gray-900" : "font-extrabold text-gray-900"}>
                            {notification.title}
                          </h3>
                          <p className="text-sm text-gray-600 mt-1">{notification.message}</p>
                          <p className="text-xs text-gray-400 mt-2">{new Date(notification.createdAt).toLocaleString()}</p>
                        </div>
                        <Badge
                          variant={
                            notification.type === "critical"
                              ? "destructive"
                              : notification.type === "warning"
                                ? "destructive"
                                : notification.type === "success"
                                  ? "secondary"
                                  : "default"
                          }
                        >
                          {notification.type}
                        </Badge>
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="flex-shrink-0"
                      onClick={() => handleDeleteNotification(notification._id)}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                ))
              )}

              {myNotifcations.length > 0 && myNotificationsQuery.hasNextPage && (
                <div className="pt-2 flex justify-center">
                  <Button variant="outline" onClick={loadMoreMyNotifications} disabled={myNotificationsQuery.isFetchingNextPage}>
                    {myNotificationsQuery.isFetchingNextPage ? "Loading..." : "Load more"}
                  </Button>
                </div>
              )}
            </TabsContent>

            <TabsContent value="team" className="space-y-3 mt-4">
              {!hasTeamFilter ? (
                <div className="text-center py-12 text-gray-500">
                  <Bell className="h-12 w-12 mx-auto mb-3 text-gray-300" />
                  <p>Enter a team id to load team notifications</p>
                </div>
              ) : teamAllNotifications.length === 0 ? (
                <div className="text-center py-12 text-gray-500">
                  <Bell className="h-12 w-12 mx-auto mb-3 text-gray-300" />
                  <p>No team notifications found</p>
                </div>
              ) : (
                teamAllNotifications.map((notification) => (
                  <div
                    key={notification._id ?? notification.id}
                    className={`flex items-start gap-4 p-4 border rounded-lg ${getBackgroundColor(notification.type)}`}
                  >
                    <div className="flex-shrink-0 mt-1">{getIcon(notification.type)}</div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1">
                          <h3 className="font-semibold text-gray-900">{notification.title}</h3>
                          <p className="text-sm text-gray-600 mt-1">{notification.message}</p>
                          <p className="text-xs text-gray-400 mt-2">{new Date(notification.createdAt).toLocaleString()}</p>
                        </div>
                        <Badge
                          variant={
                            notification.type === "critical"
                              ? "destructive"
                              : notification.type === "warning"
                                ? "destructive"
                                : notification.type === "success"
                                  ? "secondary"
                                  : "default"
                          }
                        >
                          {notification.type}
                        </Badge>
                      </div>
                    </div>
                  </div>
                ))
              )}

              {teamAllNotifications.length > 0 && teamNotificationsQuery.hasNextPage && (
                <div className="pt-2 flex justify-center">
                  <Button variant="outline" onClick={loadMoreTeamNotifications} disabled={teamNotificationsQuery.isFetchingNextPage}>
                    {teamNotificationsQuery.isFetchingNextPage ? "Loading..." : "Load more"}
                  </Button>
                </div>
              )}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}
