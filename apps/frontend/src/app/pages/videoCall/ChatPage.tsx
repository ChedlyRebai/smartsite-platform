import { useEffect, useState } from "react";
import { useNavigate, useParams, useSearchParams } from "react-router";
import "@stream-io/video-react-sdk/dist/css/styles.css";

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
import useAuthUser from "@/app/hooks/videoCAllHooks/useAuthUser";
import { useQuery } from "@tanstack/react-query";
import { getStreamToken } from "@/lib/videocall/api";
import ChatLoader from "@/app/components/videoCall/ChatLoader";
import CallButton from "@/app/components/videoCall/CallButton";


const STREAM_API_KEY = "gcatxrhb47wf";
const ChatPage = () => {
  const navigate = useNavigate();
  const { id: targetUserId } = useParams();
  const [searchParams] = useSearchParams();

  const [chatClient, setChatClient] = useState(null);
  const [channel, setChannel] = useState(null);
  const [loading, setLoading] = useState(true);
  const [autoCallDone, setAutoCallDone] = useState(false);

  const { authUser } = useAuthUser();

  const {
    data: tokenData,
    isLoading: tokenLoading,
    isError: tokenError,
  } = useQuery({
    queryKey: ["streamToken", authUser?._id],
    queryFn: getStreamToken,
    enabled: !!authUser?._id, // this will run only when authUser is available
  });

  useEffect(() => {
    let isMounted = true;
    let activeClient = null;

    const initChat = async () => {
      if (!authUser || !targetUserId) {
        return;
      }

      if (!STREAM_API_KEY) {
        toast.error("Missing VITE_STREAM_API_KEY in frontend env.");
        setLoading(false);
        return;
      }

      if (tokenLoading) return;

      if (!tokenData?.token) {
        setLoading(false);
        return;
      }

      try {
        console.log("Initializing stream chat client...");

        const client = StreamChat.getInstance(STREAM_API_KEY);
        activeClient = client;

        await client.connectUser(
          {
            id: authUser._id,
            name: authUser.fullName,
            image: authUser.profilePic || "",
          },
          tokenData.token
        );

        //
        const channelId = [authUser._id, targetUserId].sort().join("-");

        // you and me
        // if i start the chat => channelId: [myId, yourId]
        // if you start the chat => channelId: [yourId, myId]  => [myId,yourId]

        const currChannel = client.channel("messaging", channelId, {
          members: [authUser._id, targetUserId],
        });

        await currChannel.watch();

        setChatClient(client);
        setChannel(currChannel);
      } catch (error) {
        console.error("Error initializing chat:", error);
        toast.error("Could not connect to chat. Please try again.");
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    initChat();

    return () => {
      isMounted = false;

      if (activeClient) {
        activeClient.disconnectUser().catch((error) => {
          console.error("Error disconnecting Stream chat client:", error);
        });
      }
    };
  }, [tokenData, authUser, targetUserId, tokenLoading]);

  const handleVideoCall = async (navigateToCall = false) => {
    if (!channel) return;

    const callId = `${channel.id}-${Date.now()}`;
    const callUrl = `${window.location.origin}/call/${callId}`;

    await channel.sendMessage({
      text: `I've started a video call. Join me here: ${callUrl}`,
    });

    toast.success("Video call link sent successfully!");

    if (navigateToCall) {
      navigate(`/call/${callId}`);
    }
  };

  useEffect(() => {
    const startAutoCall = async () => {
      const shouldAutoCall = searchParams.get("autocall") === "1";

      if (!shouldAutoCall || !channel || autoCallDone) return;

      try {
        await handleVideoCall(true);
      } catch (error) {
        console.error("Error auto-starting video call:", error);
        toast.error("Unable to start video call");
      } finally {
        setAutoCallDone(true);
      }
    };

    startAutoCall();
  }, [channel, autoCallDone, searchParams]);

  if (loading || tokenLoading) return <ChatLoader />;

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

  if (!chatClient || !channel) return <ChatLoader />;

  return (
    <div className="h-[93vh]">
      <Chat client={chatClient}>
        <Channel channel={channel}>
          <div className="w-full relative">
            hh<CallButton handleVideoCall={handleVideoCall} />hh
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
