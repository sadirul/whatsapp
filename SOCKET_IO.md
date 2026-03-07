# Socket.IO Integration

Real-time communication between the backend and frontend for WhatsApp events.

## Events

| Event | Payload | Description |
|-------|---------|-------------|
| `whatsapp:qr` | `{ qr: string }` | QR code data URL for scanning |
| `whatsapp:ready` | `{ status: 'connected' }` | Client connected successfully |
| `whatsapp:authenticated` | `{}` | Session authenticated |
| `whatsapp:message` | `{ chatId, message }` | New incoming message |
| `whatsapp:disconnected` | `{ status: 'disconnected' }` | Client disconnected |

## Architecture

- **Backend**: Socket.IO attached to the HTTP server. JWT auth via handshake. User rooms (`user:${userId}`) ensure each user receives only their events.
- **Frontend**: `SocketContext` connects when user is logged in. `useWhatsAppSocket` hook subscribes to events.

## Production Best Practices

1. **Authentication**: Socket connections require a valid JWT in `auth.token` or `Authorization` header. Invalid tokens are rejected.

2. **Namespaces/Rooms**: Each user is joined to `user:${userId}`. Events are emitted only to that room.

3. **CORS**: Set `CORS_ORIGIN` in backend `.env` to your frontend URL (e.g. `https://app.example.com`).

4. **Scaling**: For multiple backend instances, use Redis adapter:
   ```bash
   npm install @socket.io/redis-adapter redis
   ```
   See [Socket.IO Redis adapter](https://socket.io/docs/v4/redis-adapter/).

5. **Environment**: Set `NEXT_PUBLIC_SOCKET_URL` if your Socket.IO server runs on a different host than the REST API.
