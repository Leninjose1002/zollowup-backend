require("dotenv").config();
const connectDB = require("./config/db");
const app = require("./app");
const http = require("http");
const { Server } = require("socket.io");
const ChatMessage = require("./models/ChatMessage");

const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: [
      "http://localhost:3000",
      "https://zollowup.com",
      "https://zollowup-frontend.vercel.app"
    ],
    methods: ["GET", "POST"],
    credentials: true,
  },
});


// ✅ Attach socket events
io.on("connection", (socket) => {
  console.log("🟢 Client connected:", socket.id);

  socket.on("chat_message", async ({ sender, receiver, message }) => {
    console.log("📥 Message received:", { sender, receiver, message });

    try {
      const newMessage = new ChatMessage({ sender, receiver, message });
      const saved = await newMessage.save();
      console.log("✅ Saved to DB:", saved);
    } catch (err) {
      console.error("❌ Failed to save message:", err.message);
    }

    io.emit("chat_message", { sender, receiver, message });
  });

  socket.on("typing", ({ sender }) => {
    socket.broadcast.emit("typing", { sender });
  });

  socket.on("disconnect", () => {
    console.log("🔴 Client disconnected:", socket.id);
  });
});

app.set("io", io);

// ✅ Start server
const startServer = async () => {
  try {
    await connectDB();
    console.log("✅ MongoDB connection established");

    const PORT = process.env.PORT || 5000;
    server.listen(PORT, () => {
      console.log(`🚀 Server is live on port ${PORT}`);
    });
  } catch (err) {
    console.error("❌ Server start failed:", err.message);
    process.exit(1);
  }
};

startServer();
