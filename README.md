# Study Hub - AI-Powered Study Groups 🎓🤖

A real-time collaborative study platform that integrates AI assistance to enhance group learning experiences. Students can join subject-specific study rooms, collaborate with peers, and get instant AI-powered help with academic questions.

![Version](https://img.shields.io/badge/Version-1.0.0-brightgreen)
![Node.js](https://img.shields.io/badge/Node.js-16%2B-green)
![Socket.io](https://img.shields.io/badge/Socket.io-4.7.2-blue)
![Google AI](https://img.shields.io/badge/Google%20AI-Gemini-orange)

## ✨ Features

- **Real-time Collaboration**: Chat with peers in subject-specific study rooms
- **AI-Powered Assistance**: Get instant help using `/ai [question]` command
- **Multiple Study Rooms**: Math, Science, English, History, Programming
- **File Sharing**: Upload and share images/PDFs (up to 5MB)
- **User Presence**: See who's online and typing indicators
- **Admin Dashboard**: Monitor platform activity and usage statistics
- **Responsive Design**: Works on desktop and mobile devices

## 🚀 Quick Start

### Prerequisites

- Node.js 16+
- Google Gemini AI API key ([Get one here](https://aistudio.google.com/app/apikey))
- Modern web browser with JavaScript enabled

### Installation

1. **Clone the repository:**
   ```bash
   git clone https://github.com/your-username/study-hub.git
   cd study-hub
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Create environment file:**
   ```bash
   cp .env.example .env
   ```

4. **Add your Google AI API key to `.env`:**
   ```text
   GOOGLE_AI_API_KEY=your_api_key_here
   PORT=3000
   ```

5. **Start the application:**
   ```bash
   npm start
   ```

6. **Open your browser and navigate to** `http://localhost:3000`

## 🎯 How to Use

1. **Join a Study Room**: Enter your username and select a subject
2. **Chat with Peers**: Send messages in real-time
3. **Get AI Help**: Type `/ai [your question]` for instant assistance
   - Example: `/ai Explain photosynthesis`
4. **Share Files**: Click the paperclip icon to upload study materials
5. **Invite Friends**: Share your room link to study together

## 🛠️ Technology Stack

- **Backend**: Node.js, Express.js, Socket.io
- **Frontend**: Vanilla JavaScript, HTML5, CSS3
- **AI Integration**: Google Gemini AI API
- **File Upload**: Multer middleware
- **Real-time Communication**: WebSockets via Socket.io

## 📁 Project Structure

```
study-hub/
├── server.js                 # Main server file
├── package.json              # Dependencies and scripts
├── .env                      # Environment variables
├── .gitignore               # Git ignore rules
└── public/                   # Frontend files
    ├── index.html           # Main application
    ├── admin-dashboard.html # Admin panel
    ├── css/
    │   └── styles.css       # Application styles
    └── js/
        ├── connections.js   # Socket connection management
        ├── script.js        # Main application logic
        └── study-rooms.js   # Room management
```

## 🔧 API Integration

This project uses Google's Gemini AI through their Generative AI API. The integration includes:

- Intelligent subject-specific responses
- Rate limiting to manage API quotas
- Fallback mechanisms for API failures
- Context-aware educational responses

**To get an API key:**
1. Visit [Google AI Studio](https://aistudio.google.com/app/apikey)
2. Create an account and generate an API key
3. Add it to your `.env` file

## 🌟 Key Features in Detail

### AI-Powered Assistance
- Natural language questions using `/ai` command
- Subject-specific responses tailored to each study room
- Educational explanations rather than just answers
- Rate limiting to ensure sustainable API usage

### Real-time Collaboration
- Instant messaging with typing indicators
- User presence tracking
- Room-based communication
- File sharing capabilities

**Happy Studying! 📚✨**
