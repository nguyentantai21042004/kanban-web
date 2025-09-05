# Kanban Web - Internal Task Management System

A modern Kanban board system built with Next.js 14, TypeScript, and Tailwind CSS for internal organizational task management.

## 🚀 Key Features

### 📋 Board Management
- Create and manage multiple Kanban boards
- Search and filter boards by keywords
- Responsive, user-friendly interface

### 📝 Card Management
- **Drag & Drop**: Drag cards between lists
- **Priority levels**: Low, Medium, High
- **Labels**: Categorize with customizable colors
- **Due dates**: Set deadlines for tasks
- **Descriptions**: Detailed task descriptions

### 🏷️ List Management
- Create, edit, and delete lists
- Custom card ordering
- Visual interface with categorized cards

### 🔐 User Authentication
- Login/logout system
- Session management
- User data security

### ⚡ Real-time Updates
- WebSocket integration for real-time updates
- Data synchronization across sessions
- Instant change notifications

## 🛠️ Technologies Used

- **Frontend**: Next.js 14, React 18, TypeScript
- **Styling**: Tailwind CSS, Radix UI Components
- **State Management**: React Hooks, Context API
- **Real-time**: WebSocket
- **Authentication**: Custom auth system
- **Package Manager**: pnpm

## 🐳 Running with Docker

### Development Mode (Recommended)
```bash
# Run with hot reload
docker-compose -f docker-compose.dev.yml up -d --build

# View logs
docker-compose -f docker-compose.dev.yml logs -f
```

### Production Mode
```bash
# Run production build
docker-compose up -d --build

# View logs
docker-compose logs -f
```

### Stop containers
```bash
# Development
docker-compose -f docker-compose.dev.yml down

# Production
docker-compose down
```

## 🚀 Local Development

### Requirements
- Node.js 18+
- pnpm

### Installation
```bash
# Clone repository
git clone <repository-url>
cd kanban-web

# Install dependencies
pnpm install

# Run development server
pnpm dev
```

## 📱 Interface

- **Responsive design**: Works well on desktop, tablet, and mobile
- **Dark/Light mode**: Support for dark/light themes
- **Modern UI**: Modern interface with smooth animations
- **Accessibility**: Compliant with accessibility standards

## 🔧 Project Structure

```
kanban-web/
├── app/                    # Next.js app router
│   ├── board/[id]/        # Kanban board page
│   ├── boards/            # Boards list page
│   ├── login/             # Authentication
│   └── profile/           # User profile
├── components/            # React components
│   ├── kanban/           # Kanban-specific components
│   └── ui/               # Reusable UI components
├── lib/                  # Utilities and configurations
├── hooks/                # Custom React hooks
└── public/               # Static assets
```

## 🎯 Key Features

- ✅ **Drag & Drop** cards between lists
- ✅ **Real-time updates** via WebSocket
- ✅ **Priority management** with 3 levels
- ✅ **Label system** with customizable colors
- ✅ **Due date tracking** for deadlines
- ✅ **Search & Filter** boards
- ✅ **Responsive design** for all devices
- ✅ **Modern UI/UX** with animations
- ✅ **TypeScript** for type safety
- ✅ **Docker support** for deployment

## 🌐 Live Demo

Access the application at: **https://kanban.tantai.dev**

### Local Development
After running containers, the application is available at:
- **Development**: http://localhost:3000
- **Production**: http://localhost:3000

## 📄 License

Internal project - All rights reserved.
