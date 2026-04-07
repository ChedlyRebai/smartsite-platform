import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useParams, useSearchParams } from "react-router";
import { useQuery } from "@tanstack/react-query";
import {
  Channel,
  ChannelHeader,
  Chat,
  MessageInput,
  MessageList,
  Thread,
  Window,
} from "stream-chat-react";
import { StreamChat } from "stream-chat";
import { VideoIcon, UsersIcon } from "lucide-react";
import toast from "react-hot-toast";
import { getStreamToken } from "@/lib/videocall/api";
import { extractStreamUserIdFromToken } from "@/lib/videocall/stream";
import ChatLoader from "@/app/components/videoCall/ChatLoader";
import { useAuthStore } from "@/app/store/authStore";

const STREAM_API_KEY = "gcatxrhb47wf";
// VITE_STREAM_API_KEY=gcatxrhb47wf
// STREAM_API_KEY=gcatxrhb47wf
// STREAM_SECRET_KEY=ffc8phr8tvyagup69r2x5m8vw8tx88mf7ye8ba4pzmd8emcjt6g27ytt2bw4xz3d

const GroupChatPage = () => {
  const navigate = useNavigate();
  const { groupId } = useParams();
  const [searchParams] = useSearchParams();

  const [chatClient, setChatClient] = useState<any>(null);
  const [channel, setChannel] = useState<any>(null);
  const [isConnecting, setIsConnecting] = useState(false);

  const { user:authUser } = useAuthStore();

  const {
    data: tokenData,
    isLoading: tokenLoading,
    isError: tokenError,
  } = useQuery({
    queryKey: ["streamToken", authUser?.id],
    queryFn: getStreamToken,
    enabled: !!authUser?.id,
  });
  const streamUserId = tokenData?.token ? extractStreamUserIdFromToken(tokenData.token) : null;

  const groupName = searchParams.get("name") || "Project Group";
  const membersFromQuery = searchParams.get("members") || "";

  const memberIds = useMemo(() => {
    const parsed = membersFromQuery
      .split(",")
      .map((id) => id.trim())
      .filter(Boolean);

    if (authUser?.id) {
      parsed.push(authUser.id);
    }

    return Array.from(new Set(parsed));
  }, [membersFromQuery, authUser?.id]);

  useEffect(() => {
    let isMounted = true;
    let activeClient: any = null;

    const initGroupChannel = async () => {
      if (!groupId || !authUser || tokenLoading) return;

      if (!tokenData?.token || !streamUserId) {
        setIsConnecting(false);
        return;
      }

      if (!STREAM_API_KEY) {
        toast.error("Missing Stream API key.");
        setIsConnecting(false);
        return;
      }

      setIsConnecting(true);

      try {
        const client = StreamChat.getInstance(STREAM_API_KEY);
        activeClient = client;

        if (!client.userID) {
          await client.connectUser(
            {
              id: streamUserId,
              name: `${authUser.firstName || ""} ${authUser.lastName || ""}`.trim() || "User",
              image: "",
            },
            tokenData.token
          );
        }

        const currChannel = client.channel("messaging", groupId, {
          name: groupName,
          members: memberIds,
        });

        await currChannel.watch();

        setChatClient(client);
        setChannel(currChannel);
      } catch (error) {
        console.error("Error initializing group chat:", error);
        toast.error("Could not open group chat. Please try again.");
      } finally {
        if (isMounted) {
          setIsConnecting(false);
        }
      }
    };

    initGroupChannel();

    return () => {
      isMounted = false;

      if (activeClient) {
        activeClient.disconnectUser().catch((error: unknown) => {
          console.error("Error disconnecting Stream group chat client:", error);
        });
      }
    };
  }, [groupId, groupName, memberIds, authUser, tokenData, tokenLoading, streamUserId]);

  const handleStartVideoCall = async () => {
    if (!channel || !authUser) return;

    try {
      const callId = `${channel.id}-${Date.now()}`;
      const callUrl = `${window.location.origin}/call/${callId}`;

      await channel.sendMessage({
        text: `${authUser.firstName} started a group video call. Join here: ${callUrl}`,
      });

      toast.success("Video call link sent to group chat");
      navigate(`/call/${callId}`);
    } catch (error) {
      console.error("Error sending group call link:", error);
      toast.error("Unable to send call link");
    }
  };

  if (!groupId) {
    return (
      <div className="p-6 md:p-8">
        <div className="max-w-2xl mx-auto card bg-base-200">
          <div className="card-body space-y-4">
            <h2 className="text-2xl font-bold">Open Group Chat</h2>
            <p className="text-sm opacity-80">
              Use this format to open a group room with messaging and video call support.
            </p>
            <div className="bg-base-100 rounded-lg p-4 text-sm break-all">
              /group-chat/your-group-id?name=Project%20Team&members=user1,user2,user3
            </div>
            <div className="card-actions justify-end">
              <Link className="btn btn-primary" to="/home">
                Back To Home
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (isConnecting || tokenLoading) {
    return <ChatLoader />;
  }

  if (tokenError || !tokenData?.token) {
    return (
      <div className="h-[93vh] flex items-center justify-center p-6">
        <div className="max-w-md text-center space-y-3">
          <h2 className="text-xl font-semibold">Unable to get Stream token</h2>
          <p className="opacity-70 text-sm">
            Please sign in again and make sure the videocall backend on port 9000 is reachable.
          </p>
        </div>
      </div>
    );
  }

  if (!chatClient || !channel) {
    return <ChatLoader />;
  }

  return (
    <div className="h-[93vh]">
      <Chat client={chatClient}>
        <Channel channel={channel}>
          <div className="w-full relative">
            <div className="p-3 border-b flex items-center justify-between max-w-7xl mx-auto w-full absolute top-0 z-10 bg-base-100/80 backdrop-blur-sm">
              <div className="flex items-center gap-2 text-sm font-medium">
                <UsersIcon className="size-4" />
                <span>{groupName}</span>
              </div>
              <button onClick={handleStartVideoCall} className="btn btn-success btn-sm text-white">
                <VideoIcon className="size-5" />
                Start Call
              </button>
            </div>

            <Window>
              <ChannelHeader />
              <MessageList />
              <MessageInput focus />
            </Window>
          </div>
          <Thread />
        </Channel>
      </Chat>
    </div>
  );
};

export default GroupChatPage;