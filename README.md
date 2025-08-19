## Kanban Web

- **Description**: This is a Kanban project developed by Nguyen Tan Tai for personal use.
- **Live site**: [kanban.ngtantai.pro](https://kanban.ngtantai.pro/)

### Key features
- **Boards**: Create and manage multiple Kanban boards
- **Cards**: Drag and drop across lists, set priority, labels, due date, description
- **Lists**: Add/edit/delete, flexible sorting
- **Real-time**: Real-time updates via WebSocket
- **Auth**: Sign in/out, session management

### Tech stack
- **Next.js 14**, **React 18**, **TypeScript**
- **Tailwind CSS**, **Radix UI**
- **WebSocket** for realtime

### Run locally (development)
```bash
npm ci
npm run dev
# Default: http://localhost:3000
```

### Production build
```bash
npm run build
npm run start
```

### Docker (optional)
```bash
# Development
docker-compose -f docker-compose.dev.yml up -d --build

# Production
docker-compose up -d --build
```

### Folder structure (simplified)
```
kanban-web/
├── app/            # Next.js app router
├── components/     # UI & Kanban components
├── lib/            # Logic, API clients, websocket, utils
├── hooks/          # Custom hooks
└── public/         # Static assets
```

### License
Personal use.
