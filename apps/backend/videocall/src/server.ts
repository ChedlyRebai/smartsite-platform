import express from "express";
import "dotenv/config";
import cookieParser from "cookie-parser";
import cors from "cors";
import path from "path";

import authRoutes from "./routes/auth.route";
import userRoutes from "./routes/user.route";
import chatRoutes from "./routes/chat.route";

import { connectDB } from "./lib/db";
import { upsertStreamUser } from "./lib/stream";

const app = express();
const PORT = process.env.PORT;

const __dirname = path.resolve();

app.use(
  cors({
    origin: ["http://localhost:5173","http://localhost:5174"],
    credentials: true, // allow frontend to send cookies
  })
);

app.use(express.json());
app.use(cookieParser());

app.use("/api/auth", authRoutes);
app.use("/api/users", userRoutes);
app.use("/api/chat", chatRoutes);

app.use("/api/stream-user/:id", (req, res) => {

  upsertStreamUser({
    id: req.params.id,
    name: "John Doe",
    image: "https://getstream.io/random_png/?id=123&name=John",
  }).then((data) => {
    console.log("Stream user upserted successfully");
    console.log("Upserted user data:", data);
  })
  res.status(200).json({ message: "Stream user endpoint is working" });

});

if (process.env.NODE_ENV === "production") {
  app.use(express.static(path.join(__dirname, "../frontend/dist")));

  app.get("*", (req, res) => {
    res.sendFile(path.join(__dirname, "../frontend", "dist", "index.html"));
  });
}

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
  connectDB();
});
