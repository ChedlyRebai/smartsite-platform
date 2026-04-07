import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router";

import { useQuery } from "@tanstack/react-query";

import {
  StreamVideo,
  StreamVideoClient,
  StreamCall,
  CallControls,
  SpeakerLayout,
  StreamTheme,
  CallingState,
  useCallStateHooks,
} from "@stream-io/video-react-sdk";

import "@stream-io/video-react-sdk/dist/css/styles.css";
import toast from "react-hot-toast";
import { getStreamToken } from "@/lib/videocall/api";
import { extractStreamUserIdFromToken } from "@/lib/videocall/stream";
import PageLoader from "@/app/components/videoCall/PageLoader";
import { useAuthStore } from "@/app/store/authStore";

const STREAM_API_KEY = "gcatxrhb47wf";

const CallPage = () => {
  const { id: callId } = useParams();
  const [client, setClient] = useState(null);
  const [call, setCall] = useState(null);
  const [isConnecting, setIsConnecting] = useState(true);

  const { user:athuser } = useAuthStore();

  const {
    data: tokenData,
    isLoading: tokenLoading,
    isError: tokenError,
  } = useQuery({
    queryKey: ["streamToken", athuser?.id],
    queryFn: getStreamToken,
    enabled: !!athuser?.id,
  });
  
  const streamUserId = tokenData?.token
    ? extractStreamUserIdFromToken(tokenData.token)
    : null;

  useEffect(() => {
    let isMounted = true;
    let activeClient = null;

    const initCall = async () => {
      if (!callId || tokenLoading) return;

      if (!tokenData?.token || !streamUserId) {
        setIsConnecting(false);
        return;
      }

      try {
        console.log("Initializing Stream video client...");

        const user = {
          id: streamUserId,
          name:
            [athuser?.firstName, athuser?.lastName].filter(Boolean).join(" ") ||
            athuser?.cin ||
            "User",
          image: "",
        };

        const videoClient = new StreamVideoClient({
          apiKey: STREAM_API_KEY,
          user,
          token: tokenData.token,
        });
        activeClient = videoClient;

        const callInstance = videoClient.call("default", callId);

        await callInstance.join({ create: true });

        console.log("Joined call successfully");

        setClient(videoClient);
        setCall(callInstance);
      } catch (error) {
        console.error("Error joining call:", error);
        toast.error("Could not join the call. Please try again.");
      } finally {
        if (isMounted) {
          setIsConnecting(false);
        }
      }
    };

    initCall();

    return () => {
      isMounted = false;

      if (activeClient) {
        activeClient.disconnectUser().catch((error) => {
          console.error("Error disconnecting Stream video client:", error);
        });
      }
    };
  }, [tokenData, athuser, callId, tokenLoading, streamUserId]);

  if (  tokenLoading || isConnecting) return <PageLoader />;

  return (
    <div className="h-screen flex flex-col items-center justify-center">
      <div className="relative">
        {tokenError || !tokenData?.token ? (
          <div className="flex items-center justify-center h-full">
            <p>Unable to get Stream token. Please sign in again and retry.</p>
          </div>
        ) : client && call ? (
          <StreamVideo client={client}>
            <StreamCall call={call}>
              <CallContent />
            </StreamCall>
          </StreamVideo>
        ) : (
          <div className="flex items-center justify-center h-full">
            <p>Could not initialize call. Please refresh or try again later.</p>
          </div>
        )}
      </div>
    </div>
  );
};

const CallContent = () => {
  const { useCallCallingState } = useCallStateHooks();
  const callingState = useCallCallingState();

  const navigate = useNavigate();

  useEffect(() => {
    if (callingState === CallingState.LEFT) {
      navigate("/");
    }
  }, [callingState, navigate]);

  if (callingState === CallingState.LEFT) return null;

  return (
    <StreamTheme>
      <SpeakerLayout />
      <CallControls />
    </StreamTheme>
  );
};

export default CallPage;
