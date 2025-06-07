# 🎨 Scriblo

> **Unleash your creativity in a game of sketches and smarts!**

A real-time multiplayer drawing and guessing game where users can create or join rooms, draw prompts, and guess others' drawings. Built with Prisma, Node.js, and WebSockets for live interaction.

## 🚀 Live Demo

🔗 **[Play Scriblo Now](link will be updated here, once deployed.)** 



## ✨ Features

- 🎮 **Real-time Multiplayer** - Play with friends in custom rooms
- 🖼️ **Interactive Drawing Canvas** - Smooth drawing experience with various tools
- 💬 **Live Chat** - Communicate with other players during the game
- 🎯 **Word Guessing** - Dynamic word selection and scoring system
- 🌙 **Dark/Light Mode** - Toggle between themes for comfortable playing
- 📱 **Responsive Design** - Play on desktop, tablet, or mobile devices
- ⚡ **Fast & Smooth** - Built with performance in mind using modern tech stack

## 🛠️ Tech Stack

### Frontend
- **[Next.js 15](https://nextjs.org/)** - React framework with App Router
- **[React 19](https://react.dev/)** - UI library
- **[TypeScript](https://www.typescriptlang.org/)** - Type safety
- **[Tailwind CSS](https://tailwindcss.com/)** - Styling
- **[Shadcn UI](https://ui.shadcn.com/)** - UI components

### Backend & Real-time
- **WebSocket** - Real-time communication for live gameplay
- **Redis** - Session Management
- **Custom HTTP API** - *(Prepared for v2 - not currently active)*

### Development & Build
- **[Turborepo](https://turbo.build/)** - Monorepo build system
- **[pnpm](https://pnpm.io/)** - Fast, disk space efficient package manager

## 📋 Prerequisites

Before you begin, ensure you have the following installed:
- **Node.js** (version 18 or higher)
- **pnpm** (recommended) or npm
- **Git**

## 🚀 Getting Started

### 1. Clone the Repository
```bash
git clone https://github.com/your-username/scriblo.git
cd scriblo
```

### 2. Install Dependencies
```bash
# Using pnpm (recommended)
pnpm install

# Or using npm
npm install
```

### 3. Start the Development Server
```bash
# Start all apps in development mode
pnpm dev

# Or start individual apps
pnpm dev --filter=web    # Landing page (http://localhost:3000)
pnpm dev --filter=game   # Game app (http://localhost:3001)
pnpm dev --filter=ws     # WebSocket server
pnpm dev --filter=http   # HTTP API server (v2 - not currently used)
```

### 4. Open Your Browser
- **Landing Page**: [http://localhost:3000](http://localhost:3000)
- **Game Interface**: [http://localhost:3001](http://localhost:3001)

## 🏗️ Project Structure

```
scriblo/
├── apps/
│   ├── web/          # Landing page (Next.js)
│   ├── game/         # Game interface (Next.js)
│   ├── ws/           # WebSocket server
│   └── http/         # HTTP API server (v2 - prepared for future)
├── packages/
│   ├── ui/           # Shared UI components
│   ├── common/       # Shared utilities
│   ├── db/           # Database utilities (v2 - prepared for future)
│   └── backend-common/ # Shared backend code
└── docs/             # Documentation and assets
```

## 🎮 How to Play

1. **Create or Join a Room** - Start a new game or join an existing room with a code
2. **Take Turns Drawing** - When it's your turn, draw the given word
3. **Guess the Drawing** - Try to guess what other players are drawing
4. **Chat & Have Fun** - Use the chat to communicate and celebrate good guesses!

## 🔧 Available Scripts

```bash
# Development
pnpm dev              # Start all apps in development mode
pnpm dev --filter=web # Start specific app

# Building
pnpm build            # Build all apps for production
pnpm build --filter=game # Build specific app

# Code Quality
pnpm lint             # Run ESLint on all packages
pnpm format           # Format code with Prettier
pnpm check-types      # Run TypeScript type checking

# Testing
pnpm test             # Run tests (when implemented)
```

## 🤝 Contributing

Here's how you can help make Scriblo even better:

### 🐛 Bug Reports
Found a bug? Please create an issue with:
- Clear description of the problem
- Steps to reproduce
- Expected vs actual behavior
- Screenshots (if applicable)

### 💡 Feature Requests
Have an idea? We'd love to hear it! Create an issue with:
- Description of the feature
- Why it would be useful
- Any examples or mockups

### 🔀 Pull Requests
1. **Fork** the repository
2. **Create** a feature branch (`git checkout -b feature/amazing-feature`)
3. **Commit** your changes (`git commit -m 'Add amazing feature'`)
4. **Push** to the branch (`git push origin feature/amazing-feature`)
5. **Open** a Pull Request

### 📝 Development Guidelines
- Follow the existing code style
- Write clear commit messages
- Add tests for new features (when testing is set up)
- Update documentation as needed

## 🐛 Known Issues

- [ ] Mobile canvas drawing needs optimization
- [ ] Add player avatars
- [ ] Implement scoring system
- [ ] Add sound effects

## 🗺️ Roadmap

### 🚀 Version 2.0 (Planned)
- [ ] **HTTP API Integration** - Enhanced backend with REST endpoints
- [ ] **Database Integration** - Persistent data storage for users and games
- [ ] **User Authentication** - Save progress and stats
- [ ] **Game Statistics** - Track wins, drawings, and more

### 🎯 Future Features
- [ ] **Custom Word Lists** - Upload your own words
- [ ] **Private Rooms** - Password-protected games
- [ ] **Spectator Mode** - Watch games without playing
- [ ] **Mobile App** - Native iOS and Android apps


## 📧 Contact

- **GitHub Issues**: [Report bugs or request features](https://github.com/ayushman31/scriblo/issues)
- **X**: https://x.com/ayushman00singh

---

<div align="center">
  <sub>Built with ❤️ by Ayushman Singh</sub>
</div>

<div align="center">
  <sub>⭐ Star this repository if you found it helpful!</sub>
</div>
