import { useEffect, useState } from "react";
import { useParams } from "react-router";
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
import { StreamChat, Channel as StreamChannel } from "stream-chat";
import toast from "react-hot-toast";
import { useAuthStore } from "@/app/store/authStore";
import { getStreamToken } from "@/lib/videocall/api";
import { extractStreamUserIdFromToken } from "@/lib/videocall/stream";
import ChatLoader from "@/app/components/videoCall/ChatLoader";
import CallButton from "@/app/components/videoCall/CallButton";

const STREAM_API_KEY = "gcatxrhb47wf";

const ChatPage = () => {
  const { id: targetUserId } = useParams();
  const [chatClient, setChatClient] = useState<StreamChat | null>(null);
  const [channel, setChannel] = useState<StreamChannel | null>(null);
  const [loading, setLoading] = useState(true);
  const { user: authuser } = useAuthStore();

  const { data: tokenData } = useQuery({
    queryKey: ["streamToken"],
    queryFn: getStreamToken,
    enabled: !!authuser, // this will run only when user is available
  });
  const streamUserId = tokenData?.token
    ? extractStreamUserIdFromToken(tokenData.token)
    : null;

  useEffect(() => {
    let mounted = true;
    let activeClient: StreamChat | null = null;

    const initChat = async () => {
      if (!tokenData?.token || !authuser || !targetUserId || !streamUserId) {
        setLoading(false);
        return;
      }

      try {
        console.log("Initializing stream chat client...");

        const client = StreamChat.getInstance(STREAM_API_KEY);
        activeClient = client;
        if (client.userID) {
          console.log("User already connected");
        } else {
          await client.connectUser(
            {
              id: streamUserId,
              name: authuser.firstName,
              image: `https://ui-avatars.com/api/?name=${authuser.firstName}`,
            },
            tokenData.token,
          );
        }
        //
        if (streamUserId === targetUserId) {
          console.error("Cannot create chat with yourself");
          return;
        }
        const channelId = [String(streamUserId), String(targetUserId)]
          .sort((a, b) => a.localeCompare(b, undefined, { sensitivity: "base" }))
          .join("-");

        // you and me
        // if i start the chat => channelId: [myId, yourId]
        // if you start the chat => channelId: [yourId, myId]  => [myId,yourId]
        console.log("Creating or accessing channel with ID:", channelId);
        console.log("Current user ID:", streamUserId);
        console.log("Target user ID:", targetUserId);
        const currChannel = client.channel("messaging", channelId, {
          members: [streamUserId, targetUserId],
        });

        await currChannel.watch();

        if (!mounted) {
          return;
        }

        setChatClient(client);
        setChannel(currChannel);
      } catch (error) {
        console.error("Error initializing chat:", error);
        toast.error("Could not connect to chat. Please try again.");
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    };

    initChat();

    return () => {
      mounted = false;
      if (activeClient) {
        activeClient.disconnectUser().catch((error) => {
          console.error("Error disconnecting Stream chat client:", error);
        });
      }
    };
  }, [tokenData, authuser, targetUserId]);

  const handleVideoCall = () => {
    if (channel) {
      const callUrl = `${window.location.origin}/call/${channel.id}`;

      channel.sendMessage({
        text: `I've started a video call. Join me here: ${callUrl}`,
      });

      toast.success("Video call link sent successfully!");
    }
  };

  if (loading || !chatClient || !channel) return <ChatLoader />;

  return (
    <div className="h-[93vh]">
      <Chat client={chatClient}>
        <Channel channel={channel}>
          <div className="w-full relative">
            <CallButton handleVideoCall={handleVideoCall} />
            <Window >
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
export default ChatPage;
