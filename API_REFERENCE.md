# API Reference - WPAnyWhere

## Base URL
```
http://localhost:3001
```

## Authentication

All requests except `/auth/register` and `/auth/login` require JWT Token in the Authorization header or API Key in `x-api-key` header.

### Headers

```
Authorization: Bearer {JWT_TOKEN}
X-API-Key: {API_KEY}
Content-Type: application/json
```

---

## Authentication Endpoints

### 1. Register User
- **Endpoint:** `POST /auth/register`
- **Authentication:** None
- **Request Body:**
  ```json
  {
    "name": "John Doe",
    "email": "john@example.com",
    "password": "SecurePassword123",
    "confirmPassword": "SecurePassword123"
  }
  ```
- **Response:**
  ```json
  {
    "success": true,
    "message": "User registered successfully",
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "user": {
      "id": 1,
      "name": "John Doe",
      "email": "john@example.com",
      "api_key": "mext_abc123def456...",
      "whatsapp_status": "disconnected"
    }
  }
  ```

### 2. Login User
- **Endpoint:** `POST /auth/login`
- **Authentication:** None
- **Request Body:**
  ```json
  {
    "email": "john@example.com",
    "password": "SecurePassword123"
  }
  ```
- **Response:** Same as Register

### 3. Get User Profile
- **Endpoint:** `GET /auth/profile`
- **Authentication:** JWT Token Required
- **Response:**
  ```json
  {
    "success": true,
    "user": {
      "id": 1,
      "name": "John Doe",
      "email": "john@example.com",
      "api_key": "mext_abc123def456...",
      "whatsapp_status": "connected"
    }
  }
  ```

---

## WhatsApp Endpoints

### 1. Initialize WhatsApp
- **Endpoint:** `POST /whatsapp/initialize`
- **Authentication:** JWT Token Required
- **Request Body:** None
- **Response:**
  ```json
  {
    "success": true,
    "message": "WhatsApp client initialized",
    "data": {
      "status": "initializing"
    }
  }
  ```

### 2. Get QR Code
- **Endpoint:** `GET /whatsapp/qr`
- **Authentication:** JWT Token Required
- **Response:**
  ```json
  {
    "success": true,
    "qr": "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAQoAAAEKCAYAAADy..."
  }
  ```

### 3. Get WhatsApp Status
- **Endpoint:** `GET /whatsapp/status`
- **Authentication:** JWT Token Required
- **Response:**
  ```json
  {
    "success": true,
    "status": "connected"
  }
  ```
- **Status Values:** `connected` | `disconnected`

### 4. Disconnect WhatsApp
- **Endpoint:** `POST /whatsapp/disconnect`
- **Authentication:** JWT Token Required
- **Response:**
  ```json
  {
    "success": true,
    "message": "WhatsApp disconnected successfully"
  }
  ```

---

## Message API Endpoints

### 1. Send Message
- **Endpoint:** `POST /api/send`
- **Authentication:** API Key Required (x-api-key header)
- **Request Body:**
  ```json
  {
    "number": "919999999999",
    "message": "Hello from WPAnyWhere!"
  }
  ```
- **Response:**
  ```json
  {
    "success": true,
    "message": "Message sent successfully"
  }
  ```

### 2. Send Media (File Upload)
- **Endpoint:** `POST /api/send-media`
- **Authentication:** API Key Required (x-api-key header)
- **Content-Type:** `multipart/form-data`
- **Request Body (form fields):**
  - `to` (required): Phone number with country code (e.g. 919876543210)
  - `file` (required): Image/video/document file
  - `caption` (optional): Caption for the media
- **Example (cURL):**
  ```bash
  curl -X POST http://localhost:3001/api/send-media \
    -H "x-api-key: YOUR_API_KEY" \
    -F "to=919876543210" \
    -F "file=@image.jpg" \
    -F "caption=Check this!"
  ```
- **Response:**
  ```json
  {
    "success": true,
    "message": "Media sent successfully"
  }
  ```

### 3. Send Media from URL
- **Endpoint:** `POST /api/send-media-url`
- **Authentication:** API Key Required (x-api-key header)
- **Request Body:**
  ```json
  {
    "to": "919876543210",
    "url": "https://example.com/image.jpg",
    "caption": "Image",
    "filename": "receipt.pdf"
  }
  ```
- **Note:** URLs without file extensions (e.g. API endpoints) are supported. MIME type is detected from the server's Content-Type header.
- **Response:**
  ```json
  {
    "success": true,
    "message": "Media sent successfully"
  }
  ```

### 4. Test Message
- **Endpoint:** `POST /api/test`
- **Authentication:** JWT Token Required
- **Request Body:**
  ```json
  {
    "message": "This is a test message"
  }
  ```
- **Response:**
  ```json
  {
    "success": true,
    "message": "Test message validated successfully"
  }
  ```

---

## Error Responses

All error responses follow this format:

```json
{
  "success": false,
  "message": "Error description"
}
```

### Common Status Codes
- **200:** Success
- **201:** Created
- **400:** Bad Request
- **401:** Unauthorized
- **404:** Not Found
- **500:** Internal Server Error

---

## Rate Limiting

Currently no rate limiting is implemented. For production, add:
- Maximum 100 requests per minute per user
- Maximum 10 messages per second

---

## Webhook Events (Future)

```
- user.created
- whatsapp.connected
- whatsapp.disconnected
- message.sent
- message.received
```

---

## SDK/Library Recommendations

- **JavaScript:** axios, fetch
- **Python:** requests, httpx
- **Go:** net/http
- **Ruby:** httparty, faraday
- **PHP:** guzzle, curl

---

## Testing Tools

- **Postman:** Import API endpoints
- **cURL:** Command-line testing
- **Insomnia:** REST client
- **Thunder Client:** VS Code extension

---

Last Updated: 2026-02-05
