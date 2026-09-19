# FeatureFlow API Reference

All API endpoints are prefixed with `/api`. Success and error response formats follow consistent JSON envelopes:

**Success Response:**
```json
{
  "success": true,
  "...additionalData": "..."
}
```

**Error Response:**
```json
{
  "success": false,
  "error": "Human-readable error description",
  "details": [
    {
      "field": "fieldName",
      "message": "Validation rule failure description"
    }
  ]
}
```

---

## 1. System & Health

### `GET /api/health`
Checks server status and database connectivity.

- **Auth Required:** No
- **Headers:** None
- **Request Body:** None
- **Response `200 OK`:**
  ```json
  {
    "success": true,
    "status": "ok",
    "db": "connected",
    "timestamp": "2026-09-17T10:30:00.000Z"
  }
  ```

---

## 2. Authentication (`/api/auth/*`)

### `POST /api/auth/signup`
Creates a new user account with `isEmailVerified: false` and generates an email verification token. Rate limited to 10 requests per 15 minutes per IP.

- **Auth Required:** No
- **Headers:** `Content-Type: application/json`
- **Request Body:**
  ```json
  {
    "name": "Alex Doe",
    "email": "alex@example.com",
    "password": "Password123"
  }
  ```
- **Validation Rules:**
  - `name`: String, 2–50 chars, trimmed.
  - `email`: String, valid email format, lowercased, trimmed.
  - `password`: String, min 8 chars, at least one letter and one number.
- **Success Response `201 Created` (Development Mode):**
  ```json
  {
    "success": true,
    "message": "Account created successfully. Please verify your email to continue.",
    "devVerificationUrl": "http://localhost:5173/verify-email?token=0123456789abcdef..."
  }
  ```
- **Success Response `201 Created` (Production Mode):**
  ```json
  {
    "success": true,
    "message": "Account created successfully. Please verify your email to continue."
  }
  ```
- **Error Responses:**
  - `400 Bad Request`: Validation failure (with `details` array).
  - `409 Conflict`: `{"success": false, "error": "An account with this email already exists."}`
  - `429 Too Many Requests`: Rate limit reached.

---

### `POST /api/auth/verify-email`
Verifies user email using the verification token. Clears token and sets `isEmailVerified = true`.

- **Auth Required:** No
- **Headers:** `Content-Type: application/json`
- **Request Body:**
  ```json
  {
    "token": "0123456789abcdef..."
  }
  ```
  *(Note: Token may also be passed via URL query string: `/api/auth/verify-email?token=0123456789abcdef...`)*
- **Success Response `200 OK`:**
  ```json
  {
    "success": true,
    "message": "Email verified successfully. You can now log in."
  }
  ```
- **Error Responses:**
  - `400 Bad Request`: `{"success": false, "error": "Verification token is invalid or has expired. Please request a new one."}`

---

### `POST /api/auth/login`
Authenticates a user with email and password. Issues a 15-minute JWT access token in the response body and sets a 7-day opaque refresh token in an `httpOnly` cookie. Rate limited to 10 requests per 15 minutes per IP.

- **Auth Required:** No
- **Headers:** `Content-Type: application/json`
- **Request Body:**
  ```json
  {
    "email": "alex@example.com",
    "password": "Password123"
  }
  ```
- **Success Response `200 OK`:**
  - **Set-Cookie:** `refreshToken=<opaque_token>; HttpOnly; Path=/api/auth; SameSite=Strict; Max-Age=604800`
  - **Body:**
    ```json
    {
      "success": true,
      "accessToken": "eyJhbGciOiJIUzI1NiIsIn...",
      "user": {
        "id": "64f1a2b3c4d5e6f7a8b9c0d1",
        "name": "Alex Doe",
        "email": "alex@example.com",
        "role": "user",
        "isEmailVerified": true
      }
    }
    ```
- **Error Responses:**
  - `400 Bad Request`: Validation failure.
  - `401 Unauthorized`: `{"success": false, "error": "Invalid credentials. Please check your email and password."}` *(identical message for missing user vs incorrect password)*
  - `403 Forbidden`: `{"success": false, "error": "Please verify your email address before logging in. Check your inbox for the verification link."}`
  - `429 Too Many Requests`: Rate limit reached.

---

### `POST /api/auth/refresh`
Rotates refresh token and issues a new access token. Detects token reuse (theft signal) and revokes all family sessions if an already-revoked token is received.

- **Auth Required:** No (requires `refreshToken` cookie)
- **Cookies:** `refreshToken=<opaque_token>`
- **Request Body:** None
- **Success Response `200 OK`:**
  - **Set-Cookie:** New rotated `refreshToken` cookie.
  - **Body:**
    ```json
    {
      "success": true,
      "accessToken": "eyJhbGciOiJIUzI1NiIsIn..."
    }
    ```
- **Error Responses:**
  - `401 Unauthorized`: No refresh token provided, expired session, or revoked token detected:
    ```json
    {
      "success": false,
      "error": "Session has been revoked for security reasons (possible token theft). Please log in again."
    }
    ```

---

### `POST /api/auth/logout`
Revokes the current refresh token and clears the `refreshToken` cookie on the browser.

- **Auth Required:** No (reads `refreshToken` cookie if present)
- **Cookies:** `refreshToken=<opaque_token>`
- **Request Body:** None
- **Success Response `200 OK`:**
  - **Set-Cookie:** `refreshToken=; Path=/api/auth; Max-Age=0`
  - **Body:**
    ```json
    {
      "success": true,
      "message": "Logged out successfully."
    }
    ```

---

### `POST /api/auth/forgot-password`
Generates a 15-minute password reset token. Returns a generic success message regardless of whether the email exists (prevents user enumeration). Rate limited to 10 requests per 15 minutes per IP.

- **Auth Required:** No
- **Headers:** `Content-Type: application/json`
- **Request Body:**
  ```json
  {
    "email": "alex@example.com"
  }
  ```
- **Success Response `200 OK` (Development Mode):**
  ```json
  {
    "success": true,
    "message": "If that email is registered, a password reset link has been sent.",
    "devResetUrl": "http://localhost:5173/reset-password?token=0123456789abcdef..."
  }
  ```
- **Success Response `200 OK` (Production Mode):**
  ```json
  {
    "success": true,
    "message": "If that email is registered, a password reset link has been sent."
  }
  ```
- **Error Responses:**
  - `400 Bad Request`: Invalid email format.
  - `429 Too Many Requests`: Rate limit reached.

---

### `POST /api/auth/reset-password`
Resets the user's password, clears the reset token, and revokes all existing refresh tokens for this user across all devices.

- **Auth Required:** No
- **Headers:** `Content-Type: application/json`
- **Request Body:**
  ```json
  {
    "token": "0123456789abcdef...",
    "newPassword": "NewPassword456"
  }
  ```
- **Success Response `200 OK`:**
  ```json
  {
    "success": true,
    "message": "Password reset successfully. All active sessions have been logged out. Please log in with your new password."
  }
  ```
- **Error Responses:**
  - `400 Bad Request`: `{"success": false, "error": "Password reset token is invalid or has expired. Please request a new one."}` or password validation failure.

---

### `GET /api/auth/me`
Fetches fresh user profile from the database for the authenticated user.

- **Auth Required:** Yes (`Authorization: Bearer <access_token>`)
- **Headers:** `Authorization: Bearer <JWT_ACCESS_TOKEN>`
- **Request Body:** None
- **Success Response `200 OK`:**
  ```json
  {
    "success": true,
    "user": {
      "id": "64f1a2b3c4d5e6f7a8b9c0d1",
      "name": "Alex Doe",
      "email": "alex@example.com",
      "role": "user",
      "isEmailVerified": true
    }
  }
  ```
- **Error Responses:**
  - `401 Unauthorized`: Missing, invalid, or expired access token.

---

## 3. Feature Requests & Voting (`/api/posts/*`) — Phase 2

### `POST /api/posts`
Creates a new feature request. The author identity is derived strictly from the verified JWT access token (never accepted from the client request body).

- **Auth Required:** Yes (`Authorization: Bearer <access_token>`)
- **Headers:** `Content-Type: application/json`, `Authorization: Bearer <access_token>`
- **Request Body:**
  ```json
  {
    "title": "Dark mode support",
    "descriptionMarkdown": "It would be useful to have a dark mode for the dashboard.",
    "category": "UI/UX"
  }
  ```
- **Validation Rules:**
  - `title`: String, required, trimmed, 1–200 characters.
  - `descriptionMarkdown`: String, required, trimmed, non-empty.
  - `category`: String, required, enum: `["UI/UX", "Integrations", "Performance", "General"]`.
- **System Defaults:**
  - `status`: `"Under Review"`
  - `voteCount`: `0`
  - `commentCount`: `0`
  - `hasVoted`: `false`
- **Success Response `201 Created`:**
  ```json
  {
    "success": true,
    "message": "Feature request submitted successfully",
    "post": {
      "_id": "64f1a2b3c4d5e6f7a8b9c0d2",
      "title": "Dark mode support",
      "descriptionMarkdown": "It would be useful to have a dark mode for the dashboard.",
      "category": "UI/UX",
      "status": "Under Review",
      "author": {
        "_id": "64f1a2b3c4d5e6f7a8b9c0d1",
        "name": "Alex Doe",
        "email": "alex@example.com"
      },
      "voteCount": 0,
      "commentCount": 0,
      "hasVoted": false,
      "createdAt": "2026-09-17T14:00:00.000Z",
      "updatedAt": "2026-09-17T14:00:00.000Z"
    }
  }
  ```
- **Error Responses:**
  - `400 Bad Request`: Validation failure (with `details` array).
  - `401 Unauthorized`: Missing, invalid, or expired access token.

---

### `GET /api/posts`
Retrieves a paginated feed of feature requests with support for category/status filtering, debounced search, and sorting. This is a public endpoint; anonymous visitors can browse, while authenticated users receive a personalized `hasVoted: true|false` flag.

- **Auth Required:** No (Optional: if `Authorization: Bearer <token>` is present, contextual `hasVoted` flags are populated)
- **Query Parameters:**
  - `page` *(optional, integer >= 1, default: 1)*: Current page number.
  - `limit` *(optional, integer 1–50, default: 10)*: Number of items per page.
  - `category` *(optional, enum)*: `"UI/UX"`, `"Integrations"`, `"Performance"`, or `"General"`.
  - `status` *(optional, enum)*: `"Under Review"`, `"Planned"`, `"In Progress"`, or `"Completed"`.
  - `sort` *(optional, enum, default: "newest")*:
    - `newest`: Sorted by `createdAt DESC`.
    - `upvoted`: Sorted by `voteCount DESC, createdAt DESC`.
    - `discussed`: Sorted by `commentCount DESC, createdAt DESC`.
    - `trending`: Sorted by calculated trending decay score.
  - `search` *(optional, string)*: Case-insensitive search across `title` and `descriptionMarkdown`.
- **Trending Formula:**
  Trending order calculates a decay score on the database server using MongoDB aggregation:
  $$\text{score} = \frac{\text{voteCount}}{(\text{ageInHours} + 2)^{1.5}}$$
  where $\text{ageInHours} = (\text{currentTime} - \text{createdAt}) / 3600000$.
- **Success Response `200 OK`:**
  ```json
  {
    "success": true,
    "posts": [
      {
        "_id": "64f1a2b3c4d5e6f7a8b9c0d2",
        "title": "Dark mode support",
        "descriptionMarkdown": "It would be useful to have a dark mode for the dashboard.",
        "category": "UI/UX",
        "status": "Under Review",
        "author": {
          "_id": "64f1a2b3c4d5e6f7a8b9c0d1",
          "name": "Alex Doe",
          "email": "alex@example.com"
        },
        "voteCount": 24,
        "commentCount": 3,
        "hasVoted": true,
        "createdAt": "2026-09-17T12:00:00.000Z",
        "updatedAt": "2026-09-17T13:30:00.000Z"
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 10,
      "total": 42,
      "totalPages": 5
    }
  }
  ```
- **Error Responses:**
  - `400 Bad Request`: Invalid query parameters (e.g. invalid category, invalid status, or page < 1).

---

### `GET /api/posts/:id`
Retrieves full details for a single feature request. Populates author metadata and returns a personalized `hasVoted` boolean for authenticated users.

- **Auth Required:** No (Optional: `Authorization: Bearer <access_token>` populates contextual `hasVoted` flag)
- **URL Parameters:**
  - `id`: 24-character hexadecimal MongoDB ObjectId of the post.
- **Success Response `200 OK`:**
  ```json
  {
    "success": true,
    "post": {
      "_id": "64f1a2b3c4d5e6f7a8b9c0d2",
      "title": "Dark mode support",
      "descriptionMarkdown": "It would be useful to have a dark mode for the dashboard.",
      "category": "UI/UX",
      "status": "Under Review",
      "author": {
        "_id": "64f1a2b3c4d5e6f7a8b9c0d1",
        "name": "Alex Doe",
        "email": "alex@example.com",
        "role": "user"
      },
      "voteCount": 24,
      "commentCount": 3,
      "hasVoted": true,
      "createdAt": "2026-09-17T12:00:00.000Z",
      "updatedAt": "2026-09-17T13:30:00.000Z"
    }
  }
  ```
- **Error Responses:**
  - `400 Bad Request`: Invalid ObjectId format.
  - `404 Not Found`: Feature request not found.

---

### `POST /api/posts/:id/vote`
Records an upvote from the authenticated user. Enforces atomic conditional updates using MongoDB `$addToSet` and `$inc` with a query filter `{ _id: id, votes: { $ne: userId } }` to prevent duplicate votes, double-increments, and race conditions.

- **Auth Required:** Yes (`Authorization: Bearer <access_token>`)
- **Headers:** `Authorization: Bearer <access_token>`
- **URL Parameters:**
  - `id`: 24-character hexadecimal MongoDB ObjectId of the post.
- **Request Body:** None
- **Duplicate Vote Prevention:**
  If the user has already voted for this post, the conditional update does not modify the document, and the endpoint returns the existing vote count idempotently without incrementing.
- **Success Response `200 OK` (First vote or idempotent duplicate):**
  ```json
  {
    "success": true,
    "voteCount": 25,
    "hasVoted": true
  }
  ```
- **Error Responses:**
  - `400 Bad Request`: Invalid ObjectId format.
  - `401 Unauthorized`: Missing or invalid access token.
  - `404 Not Found`: Post with specified ID does not exist.

---

### `DELETE /api/posts/:id/vote`
Removes an existing upvote from the authenticated user. Uses an atomic conditional operation `{ _id: id, votes: userId }` with `$pull` and `$inc: { voteCount: -1 }`.

- **Auth Required:** Yes (`Authorization: Bearer <access_token>`)
- **Headers:** `Authorization: Bearer <access_token>`
- **URL Parameters:**
  - `id`: 24-character hexadecimal MongoDB ObjectId of the post.
- **Request Body:** None
- **Non-Existent Vote Safety:**
  If the user has not voted for this post, the document is not modified and `voteCount` is never decremented, guaranteeing `voteCount >= 0`.
- **Success Response `200 OK`:**
  ```json
  {
    "success": true,
    "voteCount": 24,
    "hasVoted": false
  }
  ```
- **Error Responses:**
  - `400 Bad Request`: Invalid ObjectId format.
  - `401 Unauthorized`: Missing or invalid access token.
  - `404 Not Found`: Post with specified ID does not exist.

---

## 4. Threaded Discussions (`/api/posts/:id/comments` & `/api/comments/*`) — Phase 3

### `POST /api/posts/:id/comments`
Creates a root comment or a 1-level nested threaded reply on a feature request. Atomically increments `Post.commentCount`.

- **Auth Required:** Yes (`Authorization: Bearer <access_token>`)
- **Headers:** `Content-Type: application/json`, `Authorization: Bearer <access_token>`
- **URL Parameters:**
  - `id`: 24-character hexadecimal MongoDB ObjectId of the post.
- **Request Body:**
  ```json
  {
    "contentMarkdown": "I would love to see this supported! Does this cover mobile?",
    "parentComment": "64f1a2b3c4d5e6f7a8b9c0d5"
  }
  ```
  *(Note: `parentComment` is optional or `null` for root comments. When provided, the comment is nested as a reply.)*
- **Validation Rules:**
  - `contentMarkdown`: String, required, trimmed, 1–5000 characters.
  - `parentComment`: 24-character hexadecimal ObjectId (optional/nullable).
- **Success Response `201 Created`:**
  ```json
  {
    "success": true,
    "message": "Comment posted successfully",
    "comment": {
      "_id": "64f1a2b3c4d5e6f7a8b9c0d6",
      "post": "64f1a2b3c4d5e6f7a8b9c0d2",
      "author": {
        "_id": "64f1a2b3c4d5e6f7a8b9c0d1",
        "name": "Alex Doe",
        "email": "alex@example.com",
        "role": "user"
      },
      "contentMarkdown": "I would love to see this supported! Does this cover mobile?",
      "parentComment": "64f1a2b3c4d5e6f7a8b9c0d5",
      "isDeleted": false,
      "createdAt": "2026-09-18T10:00:00.000Z",
      "updatedAt": "2026-09-18T10:00:00.000Z"
    }
  }
  ```
- **Error Responses:**
  - `400 Bad Request`: Validation failure or parent comment belongs to a different post.
  - `401 Unauthorized`: Missing or invalid access token.
  - `404 Not Found`: Feature request or parent comment not found.

---

### `GET /api/posts/:id/comments`
Retrieves all comments for a feature request grouped into a 1-level threaded hierarchy (`rootComments` containing `replies` array), sorted chronologically (oldest-first) for discussion readability. Soft-deleted comments have their content sanitized to `[Comment deleted]`.

- **Auth Required:** No
- **URL Parameters:**
  - `id`: 24-character hexadecimal MongoDB ObjectId of the post.
- **Success Response `200 OK`:**
  ```json
  {
    "success": true,
    "totalComments": 4,
    "comments": [
      {
        "_id": "64f1a2b3c4d5e6f7a8b9c0d5",
        "post": "64f1a2b3c4d5e6f7a8b9c0d2",
        "author": {
          "_id": "64f1a2b3c4d5e6f7a8b9c0d1",
          "name": "Alex Doe",
          "email": "alex@example.com",
          "role": "user"
        },
        "contentMarkdown": "Root comment content here.",
        "parentComment": null,
        "isDeleted": false,
        "createdAt": "2026-09-18T09:00:00.000Z",
        "updatedAt": "2026-09-18T09:00:00.000Z",
        "replies": [
          {
            "_id": "64f1a2b3c4d5e6f7a8b9c0d6",
            "post": "64f1a2b3c4d5e6f7a8b9c0d2",
            "author": {
              "_id": "64f1a2b3c4d5e6f7a8b9c0d9",
              "name": "Sarah Developer",
              "email": "sarah@example.com",
              "role": "admin"
            },
            "contentMarkdown": "Reply to root comment.",
            "parentComment": "64f1a2b3c4d5e6f7a8b9c0d5",
            "isDeleted": false,
            "createdAt": "2026-09-18T09:30:00.000Z",
            "updatedAt": "2026-09-18T09:30:00.000Z",
            "replies": []
          }
        ]
      }
    ]
  }
  ```
- **Error Responses:**
  - `400 Bad Request`: Invalid ObjectId format.
  - `404 Not Found`: Feature request not found.

---

### `DELETE /api/comments/:id`
Soft-deletes a comment. Only the comment author or a platform admin can delete a comment. Atomically decrements `Post.commentCount` while ensuring it never becomes negative. Soft-deleted comments preserve thread structure with content sanitized to `[Comment deleted]`.

- **Auth Required:** Yes (`Authorization: Bearer <access_token>`)
- **Headers:** `Authorization: Bearer <access_token>`
- **URL Parameters:**
  - `id`: 24-character hexadecimal MongoDB ObjectId of the comment.
- **Permission Rules:**
  - Author (`comment.author === req.user.id`): Allowed.
  - Admin (`req.user.role === 'admin'`): Allowed.
  - Other users: `403 Forbidden`.
- **Success Response `200 OK`:**
  ```json
  {
    "success": true,
    "message": "Comment deleted successfully"
  }
  ```
- **Error Responses:**
  - `400 Bad Request`: Invalid ObjectId format.
  - `401 Unauthorized`: Missing or invalid access token.
  - `403 Forbidden`: `{"success": false, "error": "You do not have permission to delete this comment"}`
  - `404 Not Found`: Comment not found.

---

## 7. Admin — Status Management (`/api/posts/*`)

### `PATCH /api/posts/:id/status`
Updates the workflow status of a feature request. **Admin role required.**

- **Auth Required:** Yes (`Authorization: Bearer <access_token>`)
- **Role Required:** `admin`
- **Headers:** `Content-Type: application/json`, `Authorization: Bearer <access_token>`
- **URL Parameters:**
  - `id`: 24-character hexadecimal MongoDB ObjectId of the post.
- **Request Body:**
  ```json
  {
    "status": "Planned"
  }
  ```
  Allowed values: `"Under Review"`, `"Planned"`, `"In Progress"`, `"Completed"`
- **Success Response `200 OK`:**
  ```json
  {
    "success": true,
    "post": {
      "_id": "...",
      "title": "Dark Mode Support",
      "status": "Planned",
      "category": "UI/UX",
      "descriptionMarkdown": "...",
      "author": { "_id": "...", "name": "Alice", "email": "alice@example.com", "role": "user" },
      "voteCount": 12,
      "commentCount": 4,
      "hasVoted": false,
      "createdAt": "...",
      "updatedAt": "..."
    },
    "message": "Status updated to 'Planned' successfully"
  }
  ```
- **Error Responses:**
  - `400 Bad Request`: Invalid ObjectId or invalid status value.
  - `401 Unauthorized`: Missing or invalid access token.
  - `403 Forbidden`: `{"success": false, "error": "Forbidden: admin role required"}` (non-admin attempt).
  - `404 Not Found`: Post does not exist.

---

### `GET /api/posts/admin/stats`
Returns a summary of feature request counts grouped by status. **Admin role required.**

> **Note:** This route is registered before `GET /api/posts/:id` in `post.routes.js` to avoid Express treating `"admin"` as a dynamic `:id` parameter.

- **Auth Required:** Yes (`Authorization: Bearer <access_token>`)
- **Role Required:** `admin`
- **Headers:** `Authorization: Bearer <access_token>`
- **Request Body:** None
- **Response `200 OK`:**
  ```json
  {
    "success": true,
    "stats": {
      "total": 47,
      "underReview": 15,
      "planned": 12,
      "inProgress": 8,
      "completed": 12
    }
  }
  ```
- **Error Responses:**
  - `401 Unauthorized`: Missing or invalid access token.
  - `403 Forbidden`: Non-admin user.

---

## 8. Public Roadmap

The public roadmap is served entirely through the existing `GET /api/posts` endpoint with `status` query parameter filtering. No separate roadmap database collection or endpoint exists.

**Fetching roadmap columns:**

| Column       | Query                                         |
|--------------|-----------------------------------------------|
| Planned      | `GET /api/posts?status=Planned&sort=upvoted`  |
| In Progress  | `GET /api/posts?status=In Progress&sort=upvoted` |
| Completed    | `GET /api/posts?status=Completed&sort=newest` |

`Under Review` is intentionally excluded from the public roadmap. Admin status changes via `PATCH /api/posts/:id/status` are immediately reflected in roadmap queries.

---

## Authentication Header Summary

| Endpoint Group          | Auth Required | Role    |
|-------------------------|---------------|---------|
| `POST /api/auth/signup` | No            | —       |
| `POST /api/auth/login`  | No            | —       |
| `POST /api/auth/logout` | Yes (cookie)  | Any     |
| `POST /api/auth/refresh`| No (cookie)   | —       |
| `GET  /api/auth/me`     | Yes (Bearer)  | Any     |
| `POST /api/auth/verify-email` | No      | —       |
| `POST /api/auth/forgot-password` | No   | —       |
| `POST /api/auth/reset-password`  | No   | —       |
| `POST /api/posts`       | Yes           | Any     |
| `GET  /api/posts`       | No (optional) | —       |
| `GET  /api/posts/:id`   | No (optional) | —       |
| `POST /api/posts/:id/vote` | Yes        | Any     |
| `DELETE /api/posts/:id/vote` | Yes      | Any     |
| `POST /api/posts/:id/comments` | Yes    | Any     |
| `GET  /api/posts/:id/comments` | No     | —       |
| `DELETE /api/comments/:id` | Yes        | Owner/Admin |
| `PATCH /api/posts/:id/status` | Yes     | **admin** |
| `GET  /api/posts/admin/stats` | Yes     | **admin** |
| `GET  /api/health`      | No            | —       |



