# 🏠 Room Collaboration System

## Overview
The Room Collaboration system allows multiple users to join the same quest room and collaboratively manage quests. Users can create rooms, share QR codes, and work together to complete quests in real-time.

## Features

### 🎯 Core Functionality
- **Room Creation**: Host creates a room with a unique QR code
- **QR Code Sharing**: Easy room joining via QR code scan
- **Real-time Updates**: Live synchronization of quest status across all devices
- **Mobile-Friendly**: Optimized interface for mobile devices
- **Quest Management**: Accept, complete, and track quests collaboratively

### 📱 Mobile Interface
- **Responsive Design**: Works perfectly on phones and tablets
- **Touch-Optimized**: Large buttons and easy navigation
- **Real-time Sync**: Instant updates when quests are completed
- **Room Status**: See who's in the room and connection status

## How to Use

### For Hosts (Desktop/Laptop)
1. **Create Room**: Click "Create Room" in the Quest tab
2. **Share QR Code**: Show the generated QR code to other users
3. **Manage Quests**: Generate quest batches and manage room
4. **Monitor Progress**: See real-time quest completion

### For Participants (Mobile)
1. **Scan QR Code**: Use phone camera to scan the room QR code
2. **Join Room**: Automatically join the room via the mobile interface
3. **Accept Quests**: Tap "Accept" on pending quests
4. **Complete Quests**: Mark quests as completed when done
5. **Real-time Updates**: See quests update instantly across all devices

## Technical Implementation

### Frontend Components
- **`RoomCollaboration.js`**: Main room management component
- **`MobileRoomPage.js`**: Mobile-optimized room interface
- **QR Code Generation**: Uses `qrcode` library for QR codes
- **WebSocket Integration**: Real-time updates via `socket.io-client`

### Backend Services
- **Room API**: REST endpoints for room creation and joining
- **WebSocket Server**: Real-time communication on port 8001
- **Quest Management**: Shared quest state across room members

### Dependencies Added
```json
{
  "qrcode": "^1.5.3",
  "socket.io-client": "^4.7.2",
  "react-router-dom": "^6.8.1"
}
```

## API Endpoints

### Room Management
- `POST /api/rooms/create` - Create a new room
- `POST /api/rooms/{room_id}/join` - Join an existing room
- `GET /api/rooms/{room_id}/quests` - Get room quests

### WebSocket Events
- `join-room` - Join a room
- `quest-accepted` - Quest accepted by user
- `quest-completed` - Quest completed by user
- `room-updated` - Room state updated

## Setup Instructions

### 1. Install Dependencies
```bash
cd frontend
npm install
```

### 2. Start Servers
```bash
# Start both API and WebSocket servers
./start_servers.sh

# Or start individually
python backend/main.py &          # Port 8000
python backend/websocket_server.py &  # Port 8001
```

### 3. Start Frontend
```bash
cd frontend
npm start
```

## Usage Flow

### Room Creation
1. Host opens the main app
2. Goes to Quest tab
3. Clicks "Create Room"
4. QR code is generated
5. Room is ready for participants

### Room Joining
1. Participant scans QR code with phone
2. Mobile interface opens automatically
3. User joins the room
4. Real-time quest updates begin

### Quest Collaboration
1. Host generates quest batches
2. Quests appear in "Pending" for all users
3. Any user can accept quests
4. Accepted quests move to "Active"
5. Any user can complete quests
6. Completed quests show in "Completed" for all

## Mobile Optimization

### Design Features
- **Large Touch Targets**: Easy to tap on mobile
- **Responsive Layout**: Adapts to different screen sizes
- **Clear Visual Hierarchy**: Easy to understand at a glance
- **Status Indicators**: Connection and room status clearly shown

### Performance
- **Efficient Updates**: Only necessary data is transmitted
- **Connection Management**: Automatic reconnection on network issues
- **Optimized Rendering**: Smooth animations and transitions

## Future Enhancements

### Planned Features
- **User Names**: Custom names for room members
- **Quest Assignment**: Assign specific quests to specific users
- **Room Chat**: Text communication within rooms
- **Quest Categories**: Filter quests by type or difficulty
- **Room History**: Track completed quests over time
- **Leaderboards**: Room-based competition

### Technical Improvements
- **Database Persistence**: Store room data in database
- **Authentication**: User accounts and room permissions
- **Scalability**: Support for larger rooms
- **Offline Support**: Work without internet connection

## Troubleshooting

### Common Issues
1. **QR Code Not Working**: Ensure both devices are on same network
2. **Connection Lost**: Check network connection and refresh
3. **Quests Not Updating**: Verify WebSocket connection is active
4. **Mobile Interface Issues**: Clear browser cache and reload

### Debug Information
- Check browser console for WebSocket connection status
- Verify both servers are running (ports 8000 and 8001)
- Ensure CORS settings allow mobile connections

## Security Considerations

### Current Implementation
- **No Authentication**: Anyone with room code can join
- **No Data Persistence**: Room data is not stored
- **Local Network Only**: Designed for local collaboration

### Future Security
- **User Authentication**: Login required for room access
- **Room Permissions**: Host controls who can join
- **Data Encryption**: Secure transmission of sensitive data
- **Rate Limiting**: Prevent abuse of room creation

---

**Built with ❤️ for collaborative quest management!**
