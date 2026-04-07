import { useEffect, useState } from "react";
import { useParams } from "react-router";
import { useQuery } from "@tanstack/react-query";
import "@stream-io/video-react-sdk/dist/css/styles.css";
import "stream-chat-react/dist/css/v2/index.css";
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
import toast from "react-hot-toast";
import { useAuthStore } from "@/app/store/authStore";
import { getStreamToken } from "@/lib/videocall/api";
import { extractStreamUserIdFromToken } from "@/lib/videocall/stream";
import ChatLoader from "@/app/components/videoCall/ChatLoader";
import CallButton from "@/app/components/videoCall/CallButton";

const STREAM_API_KEY = "gcatxrhb47wf";

const ChatPage = () => {
  const { id: targetUserId } = useParams();
  const [chatClient, setChatClient] = useState(null);
  const [channel, setChannel] = useState(null);
  const [loading, setLoading] = useState(true);
  const { user: userauth } = useAuthStore();

  const { data: tokenData } = useQuery({
    queryKey: ["streamToken"],
    queryFn: getStreamToken,
    enabled: !!userauth, // this will run only when authUser is available
  });
  const streamUserId = tokenData?.token ? extractStreamUserIdFromToken(tokenData.token) : null;
  
  useEffect(() => {
    const initChat = async () => {
      if (!tokenData?.token || !userauth || !user) return;

      try {
        console.log("Initializing stream chat client...");

        const client = StreamChat.getInstance(STREAM_API_KEY);

        await client.connectUser(
          {
            id: userauth.id.toString(),
            name: `${userauth.firstName || ""} ${userauth.lastName || ""}`.trim() || "User",
            image: "",
          },
          tokenData.token,
        );

        //
        const channelId = [userauth.id.toString(), targetUserId].sort().join("-");

        // you and me
        // if i start the chat => channelId: [myId, yourId]
        // if you start the chat => channelId: [yourId, myId]  => [myId,yourId]

        const currChannel = client.channel("messaging", channelId, {
          members: [userauth.id.toString(), targetUserId],
        });
        console.log("STream user id::::::::::::::", userauth.id);
        console.log("Target user id::::::::::::::", targetUserId);
        console.log("Watching channel::::::::::::::", channelId);
        await currChannel.watch();

        setChatClient(client);
        setChannel(currChannel);
      } catch (error) {
        console.error("Error initializing chat:", error);
        toast.error("Could not connect to chat. Please try again.");
      } finally {
        setLoading(false);
      }
    };

    initChat();
  }, [tokenData, userauth, targetUserId, streamUserId]);

  const handleVideoCall = () => {
    if (channel) {
      const callUrl = `${window.location.origin}/call/${channel.id}`;

      channel.sendMessage({
        text: `I've started a video call. Join me here: ${callUrl}`,
      });

      toast.success("Video call link sent successfully!");
    }
  };
  console.log("Loading state:", loading, "Chat Client:", chatClient, "Channel:", channel);
  if (loading || !chatClient || !channel) return <ChatLoader />;

  return (
    <div className="h-[93vh]">
      <Chat client={chatClient}>
        <Channel channel={channel}>
          <div className="w-full relative">
            <CallButton handleVideoCall={handleVideoCall} />
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
export default ChatPage;
