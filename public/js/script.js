// script.js - Main client-side JavaScript
class StudyHub {
  constructor() {
    this.socket = io();
    this.currentUser = null;
    this.currentRoom = null;
    this.typingTimer = null;
    this.isTyping = false;

    this.initializeElements();
    this.bindEvents();
    this.showLoginModal();
  }

  initializeElements() {
    // Modal elements
    this.loginModal = document.getElementById("loginModal");
    this.loginForm = document.getElementById("loginForm");
    this.usernameInput = document.getElementById("usernameInput");
    this.roomSelect = document.getElementById("roomSelect");

    // Chat elements
    this.chatContainer = document.getElementById("chatContainer");
    this.messagesContainer = document.getElementById("messagesContainer");
    this.messageInput = document.getElementById("messageInput");
    this.sendBtn = document.getElementById("sendBtn");
    this.fileUploadBtn = document.getElementById("fileUploadBtn");
    this.fileInput = document.getElementById("fileInput");

    // Info elements
    this.currentUserSpan = document.getElementById("currentUser");
    this.currentRoomSpan = document.getElementById("currentRoom");
    this.roomDescription = document.getElementById("roomDescription");
    this.usersList = document.getElementById("usersList");
    this.typingIndicator = document.getElementById("typingIndicator");
    this.typingText = document.getElementById("typingText");

    // Admin elements
    this.adminBtn = document.getElementById("adminBtn");

    // Store reference for global access
    window.currentStudyHub = this;
  }

  bindEvents() {
    // Login form
    this.loginForm.addEventListener("submit", (e) => this.handleLogin(e));

    // Message sending
    this.sendBtn.addEventListener("click", () => this.sendMessage());
    this.messageInput.addEventListener("keypress", (e) => {
      if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault();
        this.sendMessage();
      }
    });

    // Typing indicator
    this.messageInput.addEventListener("input", () => this.handleTyping());

    // File upload
    this.fileUploadBtn.addEventListener("click", () => this.fileInput.click());
    this.fileInput.addEventListener("change", (e) => this.handleFileUpload(e));

    // Leave room button
    document.getElementById("leaveRoomBtn").addEventListener("click", () => {
      window.location.reload();
    });

    // Toggle sidebar button (for mobile)
    document.getElementById("toggleSidebar").addEventListener("click", () => {
      document.querySelector(".sidebar").classList.toggle("active");
    });

    // Socket events
    this.socket.on("connect", () => {
      console.log("Connected to server");
    });

    this.socket.on("room-history", (messages) =>
      this.displayRoomHistory(messages)
    );
    this.socket.on("message", (message) => this.displayMessage(message));
    this.socket.on("user-joined", (data) =>
      this.showNotification(data.message, "info")
    );
    this.socket.on("user-left", (data) =>
      this.showNotification(data.message, "info")
    );
    this.socket.on("users-update", (users) => this.updateUsersList(users));
    this.socket.on("typing", (data) => this.handleTypingIndicator(data));
    this.socket.on("error", (error) => this.showNotification(error, "error"));

    // Admin button
    this.adminBtn.addEventListener("click", () => {
      window.location.href = "/admin";
    });
  }

  showLoginModal() {
    this.loginModal.style.display = "flex";
    this.chatContainer.style.display = "none";
  }

  handleLogin(e) {
    e.preventDefault();

    const username = this.usernameInput.value.trim();
    const room = this.roomSelect.value;

    if (!username || !room) {
      this.showNotification("Please fill in all fields", "error");
      return;
    }

    this.currentUser = username;
    this.currentRoom = room;

    // Update UI
    this.currentUserSpan.textContent = username;
    this.currentRoomSpan.textContent =
      this.roomSelect.options[this.roomSelect.selectedIndex].text;
    this.roomDescription.textContent = this.getRoomDescription(room);

    // Show/hide admin button based on username
    if (username === "admin" || username === "Dishmi Bawanga") {
      this.adminBtn.style.display = "block";
    } else {
      this.adminBtn.style.display = "none";
    }

    // Join room
    this.socket.emit("join", { username, room });

    // Hide modal, show chat
    this.loginModal.style.display = "none";
    this.chatContainer.style.display = "flex";

    // Focus message input
    this.messageInput.focus();
  }

  getRoomDescription(room) {
    const descriptions = {
      Math: "Solve mathematical problems together",
      Science: "Explore scientific concepts and experiments",
      English: "Discuss literature and improve language skills",
      History: "Learn about historical events and civilizations",
      Programming: "Code, debug, and learn programming together",
    };
    return descriptions[room] || "Study and learn together";
  }

  sendMessage() {
    const text = this.messageInput.value.trim();
    if (!text) return;

    this.socket.emit("message", { text });
    this.messageInput.value = "";
    this.stopTyping();
  }

  displayRoomHistory(messages) {
    this.messagesContainer.innerHTML = `
      <div class="welcome-message">
        <i class="fas fa-comments"></i>
        <h3>Welcome to the ${this.currentRoom} study room!</h3>
        <p>Start collaborating with your peers. Use <strong>/ai [question]</strong> to get help from our AI assistant.</p>
      </div>
    `;

    messages.forEach((message) => this.displayMessage(message));
    this.scrollToBottom();
  }
  displayRoomHistory(messages) {
    // Clear previous messages but keep the welcome message
    const welcomeMessage =
      this.messagesContainer.querySelector(".welcome-message");
    this.messagesContainer.innerHTML = "";
    if (welcomeMessage) {
      this.messagesContainer.appendChild(welcomeMessage);
    }

    messages.forEach((message) => this.displayMessage(message));
    this.scrollToBottom();
  }

  displayMessage(message) {
    const messageElement = document.createElement("div");
    messageElement.className = `message ${
      message.isAI ? "ai-message" : "user-message"
    }`;

    const time = new Date(message.timestamp).toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    });

    let messageContent = `
      <div class="message-header">
        <span class="username ${message.isAI ? "ai-username" : ""}">${
      message.username
    }</span>
        <span class="timestamp">${time}</span>
      </div>
      <div class="message-content">${this.formatMessageText(message.text)}</div>
    `;

    if (message.fileUrl) {
      messageContent += `
        <div class="file-attachment">
          <a href="${message.fileUrl}" target="_blank" class="file-link">
            <i class="fas fa-paperclip"></i> ${message.fileName}
          </a>
        </div>
      `;
    }

    messageElement.innerHTML = messageContent;
    this.messagesContainer.appendChild(messageElement);
    this.scrollToBottom();
  }
  formatMessageText(text) {
    // Basic formatting
    return text
      .replace(/\n/g, "<br>")
      .replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>")
      .replace(/\*(.*?)\*/g, "<em>$1</em>");
  }

  handleTyping() {
    if (!this.isTyping) {
      this.isTyping = true;
      this.socket.emit("typing", { isTyping: true });
    }

    clearTimeout(this.typingTimer);
    this.typingTimer = setTimeout(() => {
      this.stopTyping();
    }, 1000);
  }

  stopTyping() {
    if (this.isTyping) {
      this.isTyping = false;
      this.socket.emit("typing", { isTyping: false });
    }
  }

  handleTypingIndicator(data) {
    if (data.isTyping) {
      this.typingText.textContent = `${data.username} is typing...`;
      this.typingIndicator.style.display = "flex";
    } else {
      this.typingIndicator.style.display = "none";
    }
  }

  updateUsersList(users) {
    this.usersList.innerHTML = "";
    users.forEach((username) => {
      const userElement = document.createElement("div");
      userElement.className = "user-item";
      userElement.innerHTML = `
        <i class="fas fa-circle online-dot"></i>
        <span>${username}</span>
      `;
      this.usersList.appendChild(userElement);
    });
  }

  async handleFileUpload(e) {
    const file = e.target.files[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      this.showNotification("File size must be less than 5MB", "error");
      return;
    }

    const formData = new FormData();
    formData.append("file", file);

    try {
      const response = await fetch("/upload", {
        method: "POST",
        body: formData,
      });

      const result = await response.json();
      if (result.success) {
        this.socket.emit("message", {
          text: `Shared a file: ${result.originalName}`,
          fileUrl: result.url,
          fileName: result.originalName,
        });
      } else {
        this.showNotification("Failed to upload file", "error");
      }
    } catch (error) {
      this.showNotification("Failed to upload file", "error");
    }

    // Clear file input
    e.target.value = "";
  }

  showNotification(message, type = "info") {
    const toast = document.createElement("div");
    toast.className = `toast toast-${type}`;
    toast.textContent = message;

    const container = document.getElementById("toastContainer");
    container.appendChild(toast);

    setTimeout(() => {
      toast.classList.add("show");
    }, 100);

    setTimeout(() => {
      toast.classList.remove("show");
      setTimeout(() => container.removeChild(toast), 300);
    }, 3000);
  }

  scrollToBottom() {
    this.messagesContainer.scrollTop = this.messagesContainer.scrollHeight;
  }
}

// Initialize when DOM is loaded
document.addEventListener("DOMContentLoaded", () => {
  new StudyHub();
});
