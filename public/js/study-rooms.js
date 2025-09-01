// study-rooms.js - Study room management
document.addEventListener("DOMContentLoaded", function () {
  const roomsList = document.getElementById("roomsList");

  // Default rooms
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
    {
      id: "English",
      name: "📚 English",
      description: "Literature and language",
    },
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

  // Populate rooms list
  defaultRooms.forEach((room) => {
    const roomElement = document.createElement("div");
    roomElement.className = "room-item";
    roomElement.dataset.roomId = room.id;
    roomElement.innerHTML = `
      <div>${room.name}</div>
      <small>${room.description}</small>
    `;

    roomElement.addEventListener("click", () => {
      // Switch to this room
      if (
        window.currentStudyHub &&
        window.currentStudyHub.currentRoom !== room.id
      ) {
        window.currentStudyHub.socket.emit("join", {
          username: window.currentStudyHub.currentUser,
          room: room.id,
        });

        // Update UI
        window.currentStudyHub.currentRoom = room.id;
        window.currentStudyHub.currentRoomSpan.textContent = room.name;
        window.currentStudyHub.roomDescription.textContent = room.description;

        // Update active room highlight
        document.querySelectorAll(".room-item").forEach((item) => {
          item.classList.remove("active");
        });
        roomElement.classList.add("active");
      }
    });

    roomsList.appendChild(roomElement);
  });
});
