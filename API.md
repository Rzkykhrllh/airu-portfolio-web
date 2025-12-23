# **Portfolio API Documentation**

Base URL: `http://localhost:3000` (development)

---

## **Table of Contents**
1. [Authentication](#authentication)
2. [Photos](#photos)
3. [Health Check](#health-check)
4. [Error Responses](#error-responses)

---

## **Authentication**

### **Register**
Create a new user account.

```http
POST /auth/register
```

**Request Body:**
```json
{
  "username": "admin",
  "password": "yourpassword123"
}
```

**Response:** `201 Created`
```json
{
  "success": true,
  "message": "User registered successfully",
  "data": {
    "id": "uuid-here",
    "username": "admin"
  }
}
```

---

### **Login**
Authenticate and receive JWT token.

```http
POST /auth/login
```

**Request Body:**
```json
{
  "username": "admin",
  "password": "yourpassword123"
}
```

**Response:** `200 OK`
```json
{
  "success": true,
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "uuid-here",
    "username": "admin"
  }
}
```

**Usage:**
Include token in subsequent protected requests:
```http
Authorization: Bearer <token>
```

---

## **Photos**

### **Get All Photos**
Retrieve list of photos with optional filters.

```http
GET /photos
```

**Query Parameters:**
| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `page` | number | 1 | Page number for pagination |
| `limit` | number | 100 | Items per page |
| `featured` | boolean | - | Filter by featured status (`true`/`false`) |
| `tag` | string | - | Filter by tag name |
| `collectionId` | string | - | Filter by collection ID |

**Examples:**
```http
GET /photos
GET /photos?featured=true
GET /photos?tag=landscape&page=1&limit=10
GET /photos?collectionId=uuid-here
```

**Response:** `200 OK`
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid-here",
      "title": "Mountain Peak at Sunset",
      "description": "Golden hour illuminates the majestic mountain peaks",
      "location": "Swiss Alps, Switzerland",
      "featured": true,
      "sortOrder": 0,
      "metadata": {},
      "urlSmall": "https://picsum.photos/id/1018/800/600",
      "urlMedium": "https://picsum.photos/id/1018/1600/1200",
      "urlLarge": "https://picsum.photos/id/1018/2400/1800",
      "createdAt": "2024-01-15T10:30:00.000Z",
      "capturedAt": null,
      "updatedAt": "2024-01-15T10:30:00.000Z",
      "tags": [
        { "photoId": "uuid", "tag": "landscape" },
        { "photoId": "uuid", "tag": "mountain" }
      ],
      "collections": [
        {
          "photoId": "uuid",
          "collectionId": "uuid",
          "collection": {
            "id": "uuid",
            "slug": "landscapes",
            "name": "Landscapes",
            "description": "Beautiful landscape photography"
          }
        }
      ]
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 100,
    "total": 8,
    "totalPages": 1
  }
}
```

---

### **Get Photo by ID**
Retrieve single photo details.

```http
GET /photos/:id
```

**Response:** `200 OK`
```json
{
  "success": true,
  "data": {
    "id": "uuid-here",
    "title": "Mountain Peak at Sunset",
    "description": "Golden hour illuminates the majestic mountain peaks",
    "location": "Swiss Alps, Switzerland",
    "featured": true,
    "urlSmall": "https://picsum.photos/id/1018/800/600",
    "urlMedium": "https://picsum.photos/id/1018/1600/1200",
    "urlLarge": "https://picsum.photos/id/1018/2400/1800",
    "tags": [...],
    "collections": [...]
  }
}
```

**Error:** `404 Not Found`
```json
{
  "success": false,
  "message": "Photo not found"
}
```

---

### **Create Photo** 🔒
Create a new photo. Requires authentication.

```http
POST /photos
Authorization: Bearer <token>
```

**Request Body:**
```json
{
  "title": "Beautiful Sunset",
  "description": "A stunning sunset over the ocean",
  "location": "Bali, Indonesia",
  "featured": false,
  "tags": ["sunset", "ocean", "travel"],
  "collectionIds": ["uuid-collection-1", "uuid-collection-2"]
}
```

**Required Fields:**
- `title` (string, min 1 character)

**Optional Fields:**
- `description` (string)
- `location` (string)
- `featured` (boolean)
- `tags` (array of strings)
- `collectionIds` (array of collection UUIDs)

**Response:** `201 Created`
```json
{
  "success": true,
  "data": {
    "id": "uuid-here",
    "title": "Beautiful Sunset",
    "description": "A stunning sunset over the ocean",
    "location": "Bali, Indonesia",
    "featured": false,
    "urlSmall": "https://example.com/.../small.jpg",
    "urlMedium": "https://example.com/.../medium.jpg",
    "urlLarge": "https://example.com/.../large.jpg",
    "tags": [
      { "photoId": "uuid", "tag": "sunset" },
      { "photoId": "uuid", "tag": "ocean" },
      { "photoId": "uuid", "tag": "travel" }
    ],
    "collections": [...]
  }
}
```

---

### **Update Photo** 🔒
Update existing photo. Requires authentication.

```http
PUT /photos/:id
Authorization: Bearer <token>
```

**Request Body:** (all fields optional)
```json
{
  "title": "Updated Title",
  "description": "Updated description",
  "location": "New Location",
  "featured": true,
  "tags": ["new", "tags"],
  "collectionIds": ["uuid-1"]
}
```

**Response:** `200 OK`
```json
{
  "success": true,
  "data": {
    // Updated photo object
  }
}
```

**Note:**
- Tags and collections will be **replaced** (not merged) with new values
- Omitted fields remain unchanged

---

### **Delete Photo** 🔒
Delete a photo. Requires authentication.

```http
DELETE /photos/:id
Authorization: Bearer <token>
```

**Response:** `200 OK`
```json
{
  "success": true,
  "message": "Photo deleted successfully"
}
```

---

## **Health Check**

### **Public Health Check**
```http
GET /health
```

**Response:** `200 OK`
```json
{
  "status": "ok",
  "timeStamp": "2024-01-15T10:30:00.000Z"
}
```

---

### **Authenticated Health Check** 🔒
```http
GET /user/health
Authorization: Bearer <token>
```

**Response:** `200 OK`
```json
{
  "status": "Successfully authenticated",
  "timeStamp": "2024-01-15T10:30:00.000Z"
}
```

---

## **Error Responses**

### **Validation Error**
```json
{
  "success": false,
  "message": "Validation failed",
  "errors": [
    {
      "field": "title",
      "message": "Title is required"
    }
  ]
}
```

### **Unauthorized**
```json
{
  "success": false,
  "message": "Unauthorized"
}
```

### **Not Found**
```json
{
  "success": false,
  "message": "Photo not found"
}
```

### **Server Error**
```json
{
  "success": false,
  "message": "Internal server error"
}
```

---

## **Response Image Sizes**

Each photo has 3 image URLs:
- `urlSmall`: 800x600 - Use for thumbnails, list views
- `urlMedium`: 1600x1200 - Use for detail views, modals
- `urlLarge`: 2400x1800 - Use for full-screen, downloads

**Recommendation:**
```jsx
// List view
<img src={photo.urlSmall} alt={photo.title} />

// Detail/modal view
<img src={photo.urlMedium} alt={photo.title} />

// Full resolution (optional download link)
<a href={photo.urlLarge}>Download High-Res</a>
```

---

## **CORS**

CORS is enabled for all origins in development. For production, configure allowed origins in backend.

---

## **Rate Limiting**

Currently no rate limiting. Will be added in production.

---

**Notes:**
- 🔒 = Requires authentication (Bearer token in Authorization header)
- All timestamps are in ISO 8601 format (UTC)
- All IDs are UUIDs
