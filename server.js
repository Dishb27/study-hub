// server.js - Main Node.js Server
require("dotenv").config();
const express = require("express");
const http = require("http");
const socketIo = require("socket.io");
const path = require("path");
const multer = require("multer");
const fs = require("fs");
const { GoogleGenerativeAI } = require("@google/generative-ai");

const app = express();
const server = http.createServer(app);
const io = socketIo(server);
const genAI = new GoogleGenerativeAI(process.env.GOOGLE_AI_API_KEY);

// Middleware
app.use(express.static("public"));
app.use(express.json());

// File upload configuration
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = "public/uploads/";
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + "-" + file.originalname);
  },
});

const upload = multer({
  storage: storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
  fileFilter: (req, file, cb) => {
    const allowedTypes = [
      "image/jpeg",
      "image/png",
      "image/gif",
      "application/pdf",
    ];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error("Invalid file type"));
    }
  },
});

// Data storage (in production, use a database)
let users = new Map();
let rooms = new Map();
let messages = new Map();
let adminUsers = new Set(["admin", "Dishmi Bawanga"]);

// Global rate limiting
let globalAIRateLimit = { count: 0, lastReset: Date.now() };

function canMakeGlobalAIRequest() {
  const now = Date.now();

  // Reset count every minute
  if (now - globalAIRateLimit.lastReset > 60000) {
    globalAIRateLimit.count = 0;
    globalAIRateLimit.lastReset = now;
  }

  // Global limit of 30 requests per minute
  if (globalAIRateLimit.count >= 30) {
    return false;
  }

  globalAIRateLimit.count++;
  return true;
}

// Initialize default rooms
const defaultRooms = [
  {
    id: "Math",
    name: "📐 Math",
    description: "Mathematics and problem solving",
  },
  {
    id: "Science",
    name: "🔬 Science",
    description: "Physics, Chemistry, Biology",
  },
  { id: "English", name: "📚 English", description: "Literature and language" },
  {
    id: "History",
    name: "🏛️ History",
    description: "World history and events",
  },
  {
    id: "Programming",
    name: "💻 Programming",
    description: "Coding and software development",
  },
];

defaultRooms.forEach((room) => {
  rooms.set(room.id, { ...room, users: new Set(), messageCount: 0 });
  messages.set(room.id, []);
});

// Routes
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "index.html"));
});

app.get("/admin", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "admin.html"));
});

app.post("/upload", upload.single("file"), (req, res) => {
  if (req.file) {
    res.json({
      success: true,
      filename: req.file.filename,
      originalName: req.file.originalname,
      url: `/uploads/${req.file.filename}`,
    });
  } else {
    res.status(400).json({ success: false, message: "No file uploaded" });
  }
});

// Rate limiting to avoid hitting API quotas
const aiRateLimit = new Map();

// Improved rate limiting
function canMakeAIRequest(userId) {
  const now = Date.now();
  const userLimit = aiRateLimit.get(userId) || {
    count: 0,
    lastRequest: 0,
    lastReset: now,
  };

  // Reset count if more than 1 minute has passed
  if (now - userLimit.lastReset > 60000) {
    userLimit.count = 0;
    userLimit.lastReset = now;
  }

  // Allow max 5 requests per minute per user for free tier
  if (userLimit.count >= 5) {
    return false;
  }

  userLimit.count++;
  userLimit.lastRequest = now;
  aiRateLimit.set(userId, userLimit);
  return true;
}

// Updated AI response function with Google AI Studio integration
// Updated AI response function with better error handling and model selection
async function getAIResponse(question, subject, userId) {
  // Check rate limiting
  if (!canMakeAIRequest(userId) || !canMakeGlobalAIRequest()) {
    return "🤖 AI Assistant: I'm getting a lot of requests right now. Please wait a moment before asking another question.";
  }

  try {
    // Try to use a lighter model first to avoid quota issues
    let modelToUse = "gemini-1.5-flash";

    // For complex questions, try the pro model
    const complexKeywords = ["explain", "why", "how", "analyze", "compare"];
    const isComplex = complexKeywords.some((keyword) =>
      question.toLowerCase().includes(keyword)
    );

    if (isComplex) {
      modelToUse = "gemini-1.5-pro";
    }

    const model = genAI.getGenerativeModel({
      model: modelToUse,
      generationConfig: {
        temperature: 0.7,
        topK: 40,
        topP: 0.9,
        maxOutputTokens: 500,
      },
    });

    const prompt = `As a study hub AI assistant specializing in ${subject}, provide a helpful response.

Question: ${question}

Please:
1. Give an educational response that promotes learning
2. Break down complex ideas
3. Provide examples if relevant
4. Suggest related concepts to explore
5. If question is unclear, ask for clarification politely

Response:`;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();

    return `🤖 AI Assistant: ${text}\n\n*Generated for ${subject} question: "${question}"*`;
  } catch (error) {
    console.error("Error calling Google AI API:", error);

    // Fallback to a different model if the first one fails
    if (error.message.includes("404") || error.message.includes("not found")) {
      try {
        // Try a different model
        const fallbackModel = genAI.getGenerativeModel({
          model: "gemini-1.5-flash-8b",
          generationConfig: {
            temperature: 0.7,
            maxOutputTokens: 300,
          },
        });

        const result = await fallbackModel.generateContent(
          `Answer this ${subject} question: ${question}`
        );
        const response = await result.response;
        const text = response.text();

        return `🤖 AI Assistant: ${text}\n\n*Generated for ${subject} question: "${question}"*`;
      } catch (fallbackError) {
        console.error("Fallback model also failed:", fallbackError);
      }
    }

    const fallbackResponses = {
      Math: "I'm having trouble accessing math resources right now. For math help, try breaking the problem into smaller steps or check out Khan Academy for similar examples.",
      Science:
        "Science resources are temporarily unavailable. You might find helpful information on NASA's website or ScienceDaily for current research.",
      English:
        "Literature resources are experiencing issues. For writing help, try using the Hemingway Editor app or Purdue OWL for grammar guidelines.",
      History:
        "History archives are temporarily unavailable. The Digital Public Library of America has excellent primary sources you could explore.",
      Programming:
        "Coding resources are having connection issues. For programming help, Stack Overflow usually has answers to common coding problems.",
      default:
        "I'm having technical difficulties. In the meantime, you could try rephrasing your question or breaking it down into smaller parts.",
    };

    return `🤖 AI Assistant: ${
      fallbackResponses[subject] || fallbackResponses.default
    }`;
  }
}

// Socket.IO connection handling
io.on("connection", (socket) => {
  console.log("User connected:", socket.id);

  // Handle user joining
  socket.on("join", async (data) => {
    const { username, room } = data;

    if (!username || !room) {
      socket.emit("error", "Username and room are required");
      return;
    }

    // Store user information
    users.set(socket.id, { username, room, isAdmin: adminUsers.has(username) });

    // Join the room
    socket.join(room);

    // Add user to room
    if (rooms.has(room)) {
      rooms.get(room).users.add(socket.id);
    }

    // Send room history
    const roomMessages = messages.get(room) || [];
    socket.emit("room-history", roomMessages);

    // Notify others
    socket.to(room).emit("user-joined", {
      username,
      message: `${username} joined the study room`,
      timestamp: new Date().toISOString(),
    });

    // Send updated user list
    updateRoomUsers(room);

    console.log(`${username} joined room: ${room}`);
  });

  // Handle messages
  // Handle messages
  socket.on("message", async (data) => {
    const user = users.get(socket.id);
    if (!user) return;

    const { text, fileUrl, fileName } = data;
    const { username, room } = user;

    // Check if it's an AI command (more flexible detection)
    const aiCommandRegex = /^\/ai\s+(.+)/i;
    const aiMatch = text.match(aiCommandRegex);

    if (aiMatch) {
      const question = aiMatch[1];
      if (question.trim()) {
        // First, display the user's question in the chat
        const userMessage = {
          id: Date.now(),
          username,
          text: `🤖 Asked AI: ${question}`,
          timestamp: new Date().toISOString(),
          isAI: false,
        };

        // Add user's question to room messages
        if (!messages.has(room)) messages.set(room, []);
        messages.get(room).push(userMessage);

        // Broadcast user's question to room
        io.to(room).emit("message", userMessage);

        // Show typing indicator
        socket
          .to(room)
          .emit("typing", { username: "AI Assistant", isTyping: true });

        try {
          const aiResponse = await getAIResponse(question, room, socket.id);

          const aiMessage = {
            id: Date.now() + 1, // Ensure unique ID
            username: "AI Assistant",
            text: aiResponse,
            timestamp: new Date().toISOString(),
            isAI: true,
          };

          // Add AI response to room messages
          messages.get(room).push(aiMessage);

          // Send AI response to room
          io.to(room).emit("message", aiMessage);

          // Update message count
          if (rooms.has(room)) {
            rooms.get(room).messageCount += 2; // Count both user and AI messages
          }
        } catch (error) {
          // Send error message if AI fails
          const errorMessage = {
            id: Date.now() + 1,
            username: "AI Assistant",
            text: "❌ Sorry, I'm having trouble connecting to the AI service. Please try again later.",
            timestamp: new Date().toISOString(),
            isAI: true,
          };

          messages.get(room).push(errorMessage);
          io.to(room).emit("message", errorMessage);

          rooms.get(room).messageCount += 2;
        } finally {
          // Hide typing indicator
          socket
            .to(room)
            .emit("typing", { username: "AI Assistant", isTyping: false });
        }
        return;
      }
    }

    // Regular message processing
    const message = {
      id: Date.now(),
      username,
      text,
      fileUrl,
      fileName,
      timestamp: new Date().toISOString(),
      isAI: false,
    };

    // Add to room messages
    if (!messages.has(room)) messages.set(room, []);
    messages.get(room).push(message);

    // Broadcast message to room
    io.to(room).emit("message", message);

    // Update message count
    if (rooms.has(room)) {
      rooms.get(room).messageCount++;
    }
  });

  // Handle typing indicators
  socket.on("typing", (data) => {
    const user = users.get(socket.id);
    if (!user) return;

    socket.to(user.room).emit("typing", {
      username: user.username,
      isTyping: data.isTyping,
    });
  });

  // Handle disconnect
  socket.on("disconnect", () => {
    const user = users.get(socket.id);
    if (user) {
      const { username, room } = user;

      // Remove from room
      if (rooms.has(room)) {
        rooms.get(room).users.delete(socket.id);
      }

      // Notify others
      socket.to(room).emit("user-left", {
        username,
        message: `${username} left the study room`,
        timestamp: new Date().toISOString(),
      });

      // Update user list
      updateRoomUsers(room);

      // Remove user
      users.delete(socket.id);

      console.log(`${username} disconnected from room: ${room}`);
    }
  });

  // Admin endpoints
  socket.on("admin-stats", () => {
    const user = users.get(socket.id);
    if (user && user.isAdmin) {
      const stats = {
        totalUsers: users.size,
        totalRooms: rooms.size,
        roomStats: Array.from(rooms.entries()).map(([id, room]) => ({
          id,
          name: room.name,
          activeUsers: room.users.size,
          messageCount: room.messageCount,
        })),
      };
      socket.emit("admin-stats", stats);
    }
  });

  function updateRoomUsers(room) {
    const roomData = rooms.get(room);
    if (roomData) {
      const userList = Array.from(roomData.users)
        .map((socketId) => {
          const user = users.get(socketId);
          return user ? user.username : null;
        })
        .filter(Boolean);

      io.to(room).emit("users-update", userList);
    }
  }
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`Study Hub server running on port ${PORT}`);
  console.log(`Visit: http://localhost:${PORT}`);
});
