import { generateStreamToken } from "../lib/stream";

export async function getStreamToken(req, res) {
  try {
    const token = generateStreamToken(req.user.id);
console.log("Generated Stream token for user IDss", req.user.id, ":", token);
    res.status(200).json({ token });
  } catch (error) {
    console.log("Error in getStreamToken controller:", error.message);
    res.status(500).json({ message: "Internal Server Error" });
  }
}
