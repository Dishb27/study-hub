// connections.js - Socket.io connection management
console.log("Socket.io connections module loaded");

// Initialize socket connection
const socket = io();

// Export socket for use in other modules
window.socket = socket;
