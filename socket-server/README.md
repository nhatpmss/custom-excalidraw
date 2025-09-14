# Excalidraw Socket Server

Custom Socket.IO server implementing Excalidraw's collaboration protocol.

## 🚀 Quick Start

### 1. Install Dependencies
```bash
cd socket-server
npm install
```

### 2. Configuration
```bash
cp .env.example .env
# Edit .env if needed
```

### 3. Run Development Server
```bash
npm run dev
```

### 4. Run Production Server
```bash
npm start
```

## 🔧 Protocol Implementation

### Supported Events:
- ✅ `server-broadcast` - Scene updates
- ✅ `server-volatile-broadcast` - Real-time cursors
- ✅ `user-follow` - User following
- ✅ `user-follow-room-change` - Room events
- ✅ `join-room` - Room joining

### Message Types:
- ✅ `SCENE_INIT` - Initial room sync
- ✅ `SCENE_UPDATE` - Element changes  
- ✅ `MOUSE_LOCATION` - Real-time cursors
- ✅ `IDLE_STATUS` - User activity
- ✅ `USER_VISIBLE_SCENE_BOUNDS` - Viewport tracking

## 📡 API Endpoints

### Health Check
```
GET /health
```

### Room Info
```
GET /rooms/:roomId
```

## 🚀 Deployment Options

### Option 1: Railway (Recommended)
1. Create Railway account
2. Connect GitHub repo
3. Deploy with 1-click
4. Get WebSocket URL

### Option 2: Render
1. Create Render account
2. Connect GitHub repo  
3. Set build command: `npm install`
4. Set start command: `npm start`

### Option 3: Heroku
```bash
heroku create excalidraw-socket-server
git push heroku main
```

## 🔗 Connect to Excalidraw App

1. Set environment variable in Vercel:
```
VITE_APP_WS_SERVER_URL=wss://custom-excalidraw-websocket-production.up.railway.app
```

2. Enable collaboration in client:
```javascript
// excalidraw-app/App.tsx
const isCollabDisabled = false; // Enable collaboration
```

3. Redeploy Vercel app

## 🔧 Features

### ✅ Current:
- Room management
- Real-time collaboration
- User presence
- Cursor tracking
- Scene synchronization
- Auto cleanup

### 🔄 Future Enhancements:
- Encryption support
- Firebase integration
- Authentication
- Rate limiting
- Metrics/monitoring

## 🐛 Troubleshooting

### Connection Issues:
1. Check CORS settings
2. Verify WebSocket URL
3. Check server logs
4. Test with health endpoint

### Performance:
- Monitor room count
- Check memory usage
- Enable compression
- Add Redis for scaling
