import { StreamChat } from "stream-chat";
import "dotenv/config";
const apiKey = process.env.STREAM_API_KEY || process.env.STEAM_API_KEY;
const apiSecret =
  process.env.STREAM_API_SECRET ||
  process.env.STREAM_SECRET_KEY ||
  process.env.STEAM_API_SECRET;

if (!apiKey || !apiSecret) {
  console.error("Stream API key or Secret is missing");
}

const streamClient = apiKey && apiSecret ? StreamChat.getInstance(apiKey, apiSecret) : null;

export const upsertStreamUser = async (userData) => {
  try {
    if (!streamClient) {
      throw new Error("Stream client is not initialized. Check Stream env variables.");
    }

    await streamClient.upsertUsers([userData]);
    return userData;
  } catch (error) {
    console.error("Error upserting Stream user:", error);
  }
};

export const generateStreamToken = (userId) => {
  try {
    if (!streamClient) {
      throw new Error("Stream client is not initialized. Check Stream env variables.");
    }

    const userIdStr = userId.toString();
    console.log("Generating Stream token for user ID:llllllllllllllllllllllllllllllllllllll", userIdStr);
    return streamClient.createToken(userIdStr);
  } catch (error) {
    console.error("Error generating Stream token:", error);
  }
};
