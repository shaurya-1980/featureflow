# FeatureFlow — Feature Request & Public Roadmap Portal

FeatureFlow is a full-stack customer feedback and public product roadmap platform built on the MERN stack. It enables product teams to collect user feature requests, prioritize ideas through atomic voting, engage in one-level threaded discussions, and provide transparent progress updates through an interactive 3-column Kanban roadmap.

---

## Live Deployments

| Service | Platform | URL |
|---|---|---|
| **Frontend** | Vercel | [https://featureflow-theta.vercel.app](https://featureflow-theta.vercel.app) |
| **Backend** | Render | [https://featureflow-7jje.onrender.com](https://featureflow-7jje.onrender.com) |
| **Health API** | Render | [https://featureflow-7jje.onrender.com/api/health](https://featureflow-7jje.onrender.com/api/health) |

---

## High-Level Architecture

```text
                  ┌─────────────────────────────────┐
                  │          User Browser           │
                  └──────────────┬──────────────────┘
                                 │ HTTPS
                                 ▼
                  ┌─────────────────────────────────┐
                  │       Vercel (React + Vite)     │
                  │   Coss UI / Axios Interceptors  │
                  └──────────────┬──────────────────┘
                                 │ REST API (JSON / httpOnly Cookie)
                                 ▼
                  ┌─────────────────────────────────┐
                  │     Render (Node + Express)     │
                  │ Helmet / RateLimit / Zod / Auth │
                  └──────────────┬──────────────────┘
                                 │ Mongoose ODM / TLS
                                 ▼
                  ┌─────────────────────────────────┐
                  │      MongoDB Atlas Database     │
                  │ (Text, TTL & Compound Indexes)  │
                  └─────────────────────────────────┘
```

---

## Key Features

### Authentication & Security
- **JWT & httpOnly Cookie Architecture**: 15-minute in-memory JWT access tokens combined with 7-day cryptographically secure refresh tokens stored in `httpOnly`, `SameSite=Strict`, `Secure` cookies scoped to `/api/auth`.
- **Refresh Token Rotation & Reuse Detection**: Automatic token rotation on every renewal. If an already-revoked refresh token is reused (theft signal), the entire token family for that user is immediately revoked.
- **Simulated Email Verification**: Demonstrates user email verification flows in local and staging environments without requiring a live transactional email service. Verification tokens are hashed (SHA-256) in the database, and simulation URLs are provided in API responses.
- **Forgot & Reset Password**: Token-based password reset flow that automatically revokes all active refresh tokens upon successful password update.
- **Server-Side RBAC**: Strict role-based access control supporting `user` and `admin` roles. Roles are assigned strictly server-side and cannot be selected during registration.
- **Security Middleware**: Rate limiting on sensitive auth endpoints (10 requests / 15 minutes per IP), Helmet security headers, CORS origin whitelisting with credentials, and bcrypt password hashing (cost factor 12).

### Feature Request Feed & Discovery
- **Feature Submission**: Users can submit feature requests with a title (up to 200 characters), category, and Markdown description.
- **Categories**: `UI/UX`, `Integrations`, `Performance`, `General`.
- **Status Lifecycle**: `Under Review`, `Planned`, `In Progress`, `Completed`.
- **Sorting Options**:
  - **Newest**: Chronological by creation timestamp.
  - **Most Upvoted**: Ordered by highest `voteCount`.
  - **Most Discussed**: Ordered by highest `commentCount`.
  - **Trending**: Calculated via time-decay formula: `score = voteCount / ((ageInHours + 2) ^ 1.5)`.
- **Filtering & Search**: Category and status filtering with debounced, regex-escaped full-text search across titles and descriptions.
- **Pagination**: Configurable page parameters (default 10, maximum 50 items per page).

### Atomic & Optimistic Voting
- **Concurrency-Safe MongoDB Updates**: Votes are processed atomically using `$addToSet` / `$pull` and `$inc` operators on the `Post` document, preventing race conditions, negative counts, and duplicate voting without application-level locking.
- **Personalized State Derivation**: The `hasVoted` state is evaluated dynamically per request for authenticated users while withholding raw voter ID arrays from client responses.
- **Optimistic UI**: Client-side vote counters and toggles respond instantly with automatic rollback on network failure.
- **Auth Interception**: Unauthenticated vote attempts trigger an inline modal prompting the user to log in or register.

### Feature Details & Threaded Discussions
- **Dedicated Detail View (`/posts/:id`)**: Displays full feature details with safe Markdown rendering and metadata.
- **One-Level Threaded Replies**: Flat root comments with direct child replies. Replies to replies are automatically anchored to the top-level root comment.
- **Atomic Counter Synchronization**: Post `commentCount` increments and decrements atomically on creation and soft deletion.
- **Soft Deletion**: Comment removal marks `isDeleted: true`, replaces text with `[Comment deleted]`, and displays the author as `Deleted User` while maintaining discussion thread hierarchy.
- **Permissions Guard**: Only the original comment author or an administrator can delete a comment.

### Public 3-Column Roadmap
- **Publicly Accessible (`/roadmap`)**: Open to all visitors without requiring authentication.
- **3 Workflow Columns**: Exactly `Planned`, `In Progress`, and `Completed` (`Under Review` is excluded from the public roadmap).
- **Single Source of Truth**: Roadmap queries the `Post` collection directly; admin status transitions are instantly reflected across both the feed and the roadmap.
- **Interactive Roadmap Cards**: Cards display status badges, vote buttons, comment counters, and links to full discussion threads.

### Admin Portal & Moderation
- **Protected Dashboard (`/admin`)**: Restricted to administrators via frontend route guards (`AdminRoute`) and backend role-verification middleware (`requireRole('admin')`).
- **System Metrics**: Real-time overview of total submissions and counts broken down by status.
- **Workflow Management**: Inline status transition controls on feature detail pages and the moderation dashboard.
- **Feature Deletion**: Admin endpoint to delete posts with automatic cascade cleanup of associated comments.

### UI / UX & Design System
- **Coss UI Primitives**: Accessible, headless UI component architecture built using `@base-ui/react` primitives and styled with CSS custom properties.
- **Light & Dark Themes**: Fully supported dual-theme system with local persistence and a zero-flash initialization script.
- **Feedback States**: Shimmer skeleton loaders for feed, card, and detail views; contextual empty states; and toast notifications for user actions.

---

## Technology Stack

```text
Frontend:       React 18  ·  Vite  ·  React Router v6  ·  Axios  ·  Lucide Icons
Backend:        Node.js (>=18)  ·  Express.js (ES Modules)  ·  Mongoose 8  ·  Zod
Database:       MongoDB Atlas (Text, Compound & TTL Indexes)
Security:       JWT  ·  bcrypt (12 rounds)  ·  httpOnly Cookies  ·  Helmet  ·  Rate Limiting
UI / Styling:   Coss UI Primitives  ·  @base-ui/react  ·  Vanilla CSS Custom Properties
Deployment:     Vercel (Frontend)  ·  Render (Backend)  ·  MongoDB Atlas (Database)
```

| Area | Technologies |
|---|---|
| **Frontend Framework & Tooling** | React 18, Vite, React Router DOM v6, Axios |
| **UI Components & Icons** | Coss UI Primitives, `@base-ui/react`, Lucide React, `class-variance-authority`, `clsx`, `tailwind-merge` |
| **Backend Runtime & Framework** | Node.js (>= 18.0.0), Express.js (ES Modules), Morgan |
| **Database & ODM** | MongoDB Atlas, Mongoose 8.x |
| **Validation & Error Handling** | Zod schemas for query, param, and body validation |
| **Authentication & Cryptography** | `jsonwebtoken`, `bcrypt` (cost 12), Node.js native `crypto` (SHA-256 token hashing, `randomBytes`) |
| **Security & Middleware** | `helmet`, `cors`, `cookie-parser`, `express-rate-limit` |
| **Monorepo Management** | Native npm workspaces (`apps/api`, `apps/web`) |

---

## Project Structure

```text
featureflow/
├── apps/
│   ├── api/                          # Express backend application
│   │   ├── src/
│   │   │   ├── config/
│   │   │   │   ├── db.js             # Mongoose connection setup
│   │   │   │   └── env.js            # Centralized environment variable validation
│   │   │   ├── controllers/
│   │   │   │   ├── auth.controller.js
│   │   │   │   ├── comment.controller.js
│   │   │   │   └── post.controller.js
│   │   │   ├── middleware/
│   │   │   │   ├── authenticate.js   # JWT verification middleware
│   │   │   │   ├── errorHandler.js   # Centralized JSON error formatting
│   │   │   │   ├── optionalAuthenticate.js # Populates user if token present
│   │   │   │   ├── rateLimit.js      # Auth route rate limiting
│   │   │   │   ├── requireRole.js    # RBAC authorization guard
│   │   │   │   └── validate.js       # Zod schema validation middleware
│   │   │   ├── models/
│   │   │   │   ├── Comment.js        # Threaded comments with soft delete
│   │   │   │   ├── Post.js           # Feature requests with atomic vote arrays
│   │   │   │   ├── RefreshToken.js   # Hashed refresh token store with TTL index
│   │   │   │   └── User.js           # User accounts with roles and hashed tokens
│   │   │   ├── routes/
│   │   │   │   ├── auth.routes.js    # /api/auth endpoints
│   │   │   │   ├── comment.routes.js # /api/comments endpoints
│   │   │   │   ├── health.routes.js  # /api/health endpoint
│   │   │   │   └── post.routes.js    # /api/posts and vote endpoints
│   │   │   ├── seed/
│   │   │   │   ├── seedAdmin.js      # Idempotent admin account seeding
│   │   │   │   └── seedDemoFeatures.js # 10 demo features and community users
│   │   │   ├── services/
│   │   │   │   ├── password.service.js # bcrypt hashing and verification
│   │   │   │   └── token.service.js  # JWT signing, refresh token rotation & hashing
│   │   │   ├── utils/
│   │   │   │   ├── ApiError.js       # Operational error class
│   │   │   │   ├── ApiResponse.js    # Standard JSON envelope helpers
│   │   │   │   └── catchAsync.js     # Async controller wrapper
│   │   │   ├── validators/
│   │   │   │   ├── auth.schema.js    # Zod schemas for signup, login, reset
│   │   │   │   ├── comment.schema.js # Zod schemas for comment operations
│   │   │   │   └── post.schema.js    # Zod schemas for post creation, query, status
│   │   │   ├── app.js                # Express app configuration & middleware pipeline
│   │   │   └── server.js             # HTTP server listener & DB lifecycle
│   │   ├── test/
│   │   │   ├── comment.test.js       # Comment CRUD, threading, soft delete tests
│   │   │   ├── e2e.test.js           # Full user lifecycle end-to-end integration tests
│   │   │   ├── post.test.js          # Feed, search, filter, sort, atomic voting tests
│   │   │   └── roadmap.test.js       # Admin status transitions, stats, RBAC tests
│   │   ├── .env.example              # Backend environment template
│   │   └── package.json
│   │
│   └── web/                          # React client application
│       ├── src/
│       │   ├── api/
│       │   │   └── axiosClient.js    # Axios instance with 401 interceptor & token refresh
│       │   ├── components/
│       │   │   ├── admin/
│       │   │   │   └── AdminStatusSelect.jsx # Status dropdown for admin users
│       │   │   ├── brand/
│       │   │   │   └── FeatureFlowLogo.jsx
│       │   │   ├── comments/
│       │   │   │   ├── CommentComposer.jsx
│       │   │   │   ├── CommentItem.jsx
│       │   │   │   ├── CommentSection.jsx
│       │   │   │   └── DeleteConfirmModal.jsx
│       │   │   ├── layout/
│       │   │   │   ├── AuthLayout.jsx
│       │   │   │   └── Navbar.jsx
│       │   │   ├── posts/
│       │   │   │   ├── AuthPromptModal.jsx
│       │   │   │   ├── CreateFeatureModal.jsx
│       │   │   │   ├── FeatureCard.jsx
│       │   │   │   ├── FeatureFeed.jsx
│       │   │   │   ├── FeedFilters.jsx
│       │   │   │   ├── MarkdownRenderer.jsx # Custom safe markdown renderer
│       │   │   │   ├── SearchInput.jsx
│       │   │   │   ├── SkeletonCard.jsx
│       │   │   │   ├── Toast.jsx
│       │   │   │   └── VoteButton.jsx
│       │   │   └── ui/                   # Coss UI primitives (@base-ui/react)
│       │   │       ├── alert.jsx
│       │   │       ├── avatar.jsx
│       │   │       ├── badge.jsx
│       │   │       ├── button.jsx
│       │   │       ├── card.jsx
│       │   │       ├── dialog.jsx
│       │   │       ├── input.jsx
│       │   │       ├── select.jsx
│       │   │       ├── skeleton.jsx
│       │   │       ├── spinner.jsx
│       │   │       ├── tabs.jsx
│       │   │       ├── textarea.jsx
│       │   │       ├── toast.jsx
│       │   │       └── ThemeToggle.jsx
│       │   ├── context/
│       │   │   ├── AuthContext.jsx   # In-memory token management & silent auth
│       │   │   └── ThemeContext.jsx  # Dark/light theme state provider
│       │   ├── lib/
│       │   │   ├── segmented-control.js
│       │   │   └── utils.js          # cn class merge utility
│       │   ├── pages/
│       │   │   ├── AdminPage.jsx     # Moderation dashboard (/admin)
│       │   │   ├── ForgotPasswordPage.jsx
│       │   │   ├── HomePage.jsx      # Main feature feed (/)
│       │   │   ├── LoginPage.jsx
│       │   │   ├── PostDetailPage.jsx # Feature detail & comments (/posts/:id)
│       │   │   ├── ResetPasswordPage.jsx
│       │   │   ├── RoadmapPage.jsx   # 3-column Kanban roadmap (/roadmap)
│       │   │   ├── SignupPage.jsx
│       │   │   └── VerifyEmailPage.jsx
│       │   ├── routes/
│       │   │   ├── AdminRoute.jsx    # Guard requiring admin role
│       │   │   ├── AppRouter.jsx     # Application route definitions
│       │   │   └── ProtectedRoute.jsx
│       │   ├── utils/
│       │   │   └── statusStyles.js   # Category & status design tokens
│       │   ├── App.jsx
│       │   ├── index.css             # Design tokens and theme styling
│       │   └── main.jsx
│       ├── components.json           # Coss UI registry configuration
│       ├── .env.example              # Frontend environment template
│       ├── index.html
│       ├── vite.config.js
│       └── package.json
│
├── docs/
│   └── API.md                        # Extended API contract documentation
├── scripts/
│   └── patch-cmd.js                  # Windows npm workspace CLI compatibility patch
├── package.json                      # Workspace orchestrator
└── README.md
```

---

## Database Design

FeatureFlow uses four Mongoose models stored in MongoDB:

```text
┌─────────────────┐       ┌─────────────────┐
│      User       │       │  RefreshToken   │
├─────────────────┤       ├─────────────────┤
│ _id             │◄──────│ user (ref)      │
│ name            │       │ tokenHash       │
│ email           │       │ expiresAt (TTL) │
│ passwordHash    │       │ revoked         │
│ role            │       │ replacedByHash  │
│ isEmailVerified │       └─────────────────┘
└────────┬────────┘
         │ 1
         │
         │ *
┌────────┴────────┐ 1     * ┌─────────────────┐
│      Post       │◄────────│     Comment     │
├─────────────────┤         ├─────────────────┤
│ _id             │         │ _id             │
│ title           │         │ post (ref)      │
│ descriptionMd   │         │ author (ref)    │
│ category        │         │ contentMarkdown │
│ status          │         │ parentComment   │
│ author (ref)    │         │ isDeleted       │
│ votes [User._id]│         │ deletedAt       │
│ voteCount       │         └─────────────────┘
│ commentCount    │
└─────────────────┘
```

### 1. `User` Model
Stores registered user identities and authentication verification states.
- **Fields**:
  - `name` (String, required, 2–50 chars)
  - `email` (String, required, unique, lowercase, indexed)
  - `passwordHash` (String, required, `select: false` — excluded from default queries)
  - `role` (String, enum: `['user', 'admin']`, default: `'user'`)
  - `isEmailVerified` (Boolean, default: `false`)
  - `emailVerificationToken` (String, SHA-256 hash, `select: false`)
  - `emailVerificationExpires` (Date, `select: false`)
  - `passwordResetToken` (String, SHA-256 hash, `select: false`)
  - `passwordResetExpires` (Date, `select: false`)
  - `createdAt`, `updatedAt` (Timestamps)

### 2. `Post` Model
Stores user-submitted feature requests, categories, workflow statuses, and vote counters.
- **Fields**:
  - `title` (String, required, max 200 chars, trimmed)
  - `descriptionMarkdown` (String, required, trimmed)
  - `category` (String, enum: `['UI/UX', 'Integrations', 'Performance', 'General']`)
  - `author` (ObjectId, ref: `User`, required, indexed)
  - `status` (String, enum: `['Under Review', 'Planned', 'In Progress', 'Completed']`, default: `'Under Review'`, indexed)
  - `votes` (Array of `User` ObjectIds, default: `[]`)
  - `voteCount` (Number, default: `0`, min: `0`)
  - `commentCount` (Number, default: `0`, min: `0`)
  - `createdAt`, `updatedAt` (Timestamps)
- **Indexes**:
  - Full-text index: `{ title: 'text', descriptionMarkdown: 'text' }` (title weight: 5, description weight: 1)
  - Compound filter & sort indexes:
    - `{ category: 1, status: 1, createdAt: -1 }`
    - `{ category: 1, status: 1, voteCount: -1 }`
    - `{ category: 1, status: 1, commentCount: -1 }`
    - `{ status: 1, voteCount: -1 }`
    - `{ status: 1, commentCount: -1 }`
    - `{ status: 1, createdAt: -1 }`
  - Standalone sort indexes: `{ createdAt: -1 }`, `{ voteCount: -1 }`, `{ commentCount: -1 }`

### 3. `Comment` Model
Stores threaded comments and replies with soft-delete metadata.
- **Fields**:
  - `post` (ObjectId, ref: `Post`, required, indexed)
  - `author` (ObjectId, ref: `User`, required, indexed)
  - `contentMarkdown` (String, required, max 5000 chars, trimmed)
  - `parentComment` (ObjectId, ref: `Comment`, nullable, default: `null`, indexed)
  - `isDeleted` (Boolean, default: `false`, indexed)
  - `deletedAt` (Date, default: `null`)
  - `createdAt`, `updatedAt` (Timestamps)
- **Indexes**:
  - Chronological post discussion: `{ post: 1, createdAt: 1 }`
  - Child replies under parent: `{ parentComment: 1, createdAt: 1 }`

### 4. `RefreshToken` Model
Stores SHA-256 hashed refresh tokens for session rotation and theft detection.
- **Fields**:
  - `user` (ObjectId, ref: `User`, required, indexed)
  - `tokenHash` (String, required)
  - `expiresAt` (Date, required)
  - `revoked` (Boolean, default: `false`)
  - `replacedByTokenHash` (String, default: `null`)
  - `createdAt`, `updatedAt` (Timestamps)
- **Indexes**:
  - MongoDB TTL Index: `{ expiresAt: 1 }` with `expireAfterSeconds: 0` for automatic document deletion.

---

## Authentication Architecture

```text
[ Client Application ]                          [ Backend API ]                           [ Database ]
        │                                              │                                        │
        ├───────── POST /api/auth/login ──────────────►│                                        │
        │          { email, password }                 ├──── Validate credentials (bcrypt) ────►│
        │                                              ├──── Create SHA-256 Refresh Token ─────►│ (Persist Hash)
        │◄──────── 200 OK + JWT Access Token ──────────┤
        │          Set-Cookie: refreshToken (httpOnly) │
        │                                              │
        │                                              │
   (After 15 min - Access Token Expired)               │
        │                                              │
        ├───────── GET /api/posts (with Bearer) ──────►│
        │◄──────── 401 Unauthorized ───────────────────┤
        │                                              │
   (Axios Interceptor Catches 401)                     │
        │                                              │
        ├───────── POST /api/auth/refresh ────────────►│
        │          (Cookie sent automatically)         ├──── Verify & Rotate Refresh Token ────►│ (Mark Old Revoked,
        │                                              │                                           Save New Hash)
        │◄──────── 200 OK + New JWT Access Token ──────┤
        │          Set-Cookie: new refreshToken        │
        │                                              │
   (Axios Retries Original Request Silently)           │
        ├───────── GET /api/posts (New Bearer) ───────►│
        │◄──────── 200 OK (Data Delivered) ────────────┤
```

- **Access Tokens**: Signed JWT containing `{ sub: userId, role }`, valid for 15 minutes by default (`JWT_ACCESS_EXPIRES_IN=15m`), stored strictly in JavaScript memory within React state.
- **Refresh Tokens**: 32-byte cryptographically random hex strings generated via `crypto.randomBytes(32)`. The raw token is set exclusively as an `httpOnly`, `SameSite=Strict`, `Secure` cookie, while its SHA-256 hash is persisted in MongoDB.
- **Silent Refresh**: Configured Axios response interceptor catches `401 Unauthorized` responses and issues a `POST /api/auth/refresh` request before retrying the original request with the new access token.
- **Theft Detection & Family Revocation**: If a refresh token document with `revoked: true` is presented at `/api/auth/refresh`, all refresh tokens belonging to that user are immediately revoked (`revokeAllUserTokens`).
- **Simulated Verification & Reset**:
  - Signup generates a verification token hash (valid for 24 hours). No live transactional email service is configured; the simulated verification link is returned in the API response and logged to the console in development mode.
  - Forgot password generates a 15-minute reset token. Resetting the password updates the bcrypt hash and revokes all active refresh tokens for that user.

---

## API Documentation

All API endpoints are prefixed with `/api`. Success responses return `{ success: true, ... }` and error responses return `{ success: false, error: string, details?: Array }`.

### 1. Health
| Method | Endpoint | Auth | Role | Description |
|---|---|---|---|---|
| `GET` | `/api/health` | Public | None | Returns server health, DB connection status, and server timestamp |

### 2. Authentication
| Method | Endpoint | Auth | Role | Description |
|---|---|---|---|---|
| `POST` | `/api/auth/signup` | Public | None | Creates a user account and returns a simulated email verification link (rate-limited) |
| `POST` | `/api/auth/verify-email` | Public | None | Verifies user email with the verification token |
| `POST` | `/api/auth/login` | Public | None | Authenticates credentials, returns JWT access token, and sets httpOnly refresh cookie (rate-limited) |
| `POST` | `/api/auth/refresh` | Cookie | None | Rotates refresh token and issues a new JWT access token |
| `POST` | `/api/auth/logout` | Cookie | Any | Revokes the current refresh token and clears the cookie |
| `POST` | `/api/auth/forgot-password` | Public | None | Generates a 15-minute password reset token (rate-limited) |
| `POST` | `/api/auth/reset-password` | Public | None | Resets password with token and revokes all existing sessions |
| `GET` | `/api/auth/me` | Bearer | Any | Returns the authenticated user profile |

### 3. Feature Requests (Posts) & Admin
| Method | Endpoint | Auth | Role | Description |
|---|---|---|---|---|
| `POST` | `/api/posts` | Bearer | Any | Submits a new feature request with title, description, and category |
| `GET` | `/api/posts` | Optional | None | Public feed with search, category/status filters, sorting, and pagination |
| `GET` | `/api/posts/admin/stats` | Bearer | `admin` | Admin dashboard metrics overview by status (registered before `/:id` to prevent routing collisions) |
| `GET` | `/api/posts/:id` | Optional | None | Returns feature request details and author information |
| `PATCH` | `/api/posts/:id/status` | Bearer | `admin` | Updates feature request status (`Under Review`, `Planned`, `In Progress`, `Completed`) |
| `DELETE` | `/api/posts/:id` | Bearer | `admin` | Deletes a feature request and cascades deletion to associated comments |

### 4. Atomic Voting
| Method | Endpoint | Auth | Role | Description |
|---|---|---|---|---|
| `POST` | `/api/posts/:id/vote` | Bearer | Any | Atomically adds user upvote and increments `voteCount` by 1 |
| `DELETE` | `/api/posts/:id/vote` | Bearer | Any | Atomically removes user upvote and decrements `voteCount` by 1 |

### 5. Threaded Comments
| Method | Endpoint | Auth | Role | Description |
|---|---|---|---|---|
| `POST` | `/api/posts/:id/comments` | Bearer | Any | Creates a root comment or reply and atomically increments `post.commentCount` |
| `GET` | `/api/posts/:id/comments` | Public | None | Fetches chronological comments formatted into a 1-level threaded hierarchy |
| `DELETE` | `/api/comments/:id` | Bearer | Author / Admin | Soft-deletes a comment and decrements `post.commentCount` |

---

## Environment Variables

### Backend Configuration (`apps/api/.env`)
Create `apps/api/.env` by copying `apps/api/.env.example`.

```env
# Server
NODE_ENV=development
PORT=5000

# Database
MONGODB_URI=mongodb://localhost:27017/feature-roadmap-portal

# JWT & Authentication
JWT_ACCESS_SECRET=your_jwt_access_secret_minimum_32_characters
JWT_ACCESS_EXPIRES_IN=15m
REFRESH_TOKEN_EXPIRES_IN_DAYS=7

# CORS Allowed Origin
CLIENT_ORIGIN=http://localhost:5173

# Admin Seeding (Configures the initial administrator on startup)
SEED_ADMIN_NAME=Admin
SEED_ADMIN_EMAIL=admin@example.com
SEED_ADMIN_PASSWORD=your_secure_admin_password
# SEED_ADMIN_FORCE_RESET=true  # Optional: forces password update on startup in development
```

### Frontend Configuration (`apps/web/.env`)
Create `apps/web/.env` by copying `apps/web/.env.example`.

```env
# Base API endpoint
VITE_API_BASE_URL=http://localhost:5000/api
```

> **Security Notice**: Never commit `.env` files to version control. Both `.env` files are ignored via `.gitignore`. Always use strong, unique secrets in staging and production environments.

---

## Local Development Setup

### 1. Prerequisites
- **Node.js**: version `18.0.0` or higher
- **npm**: version `9.0.0` or higher
- **MongoDB**: Local instance running on port `27017` or a MongoDB Atlas connection URI

### 2. Installation
Clone the repository and install all workspace dependencies from the root directory:

```bash
git clone https://github.com/shaurya-1980/featureflow.git
cd featureflow
npm install
```

### 3. Configure Environments
```bash
# Setup backend environment
cp apps/api/.env.example apps/api/.env

# Setup frontend environment
cp apps/web/.env.example apps/web/.env
```

### 4. Running Development Servers

Run both backend and frontend concurrently:
```bash
npm run dev
```

Or run services individually:
```bash
# Start backend API (runs on http://localhost:5000)
npm run dev:api

# Start frontend web client (runs on http://localhost:5173)
npm run dev:web
```

---

## Admin Access & Moderation

- **Server-Controlled Authorization**: Roles are assigned strictly server-side. Standard registrations via `POST /api/auth/signup` always default to `role: 'user'`.
- **Automatic Seed on Startup**: When the API server starts, `autoSeedAdmin` runs idempotently. It checks if the email defined in `SEED_ADMIN_EMAIL` exists:
  - If missing, it creates the administrator account with `role: 'admin'` and `isEmailVerified: true`.
  - In development mode (or if `SEED_ADMIN_FORCE_RESET=true`), it verifies credentials match the environment configuration.
  - In production (`NODE_ENV=production` without force reset), existing user passwords are never overwritten.
- **Manual Admin Seed Command**:
  ```bash
  npm run seed:admin
  ```

---

## Demo Data

FeatureFlow includes a dedicated seed script to populate realistic demonstration data:

```bash
npm run seed:features
```

The feature seeding script:
- Creates 4 primary feature authors (`aarav.demo@featureflow.local`, `priya.demo@featureflow.local`, `rohan.demo@featureflow.local`, `ananya.demo@featureflow.local`).
- Creates 21 community voter accounts (25 demo users total) for realistic vote attribution.
- Seeds 10 realistic feature requests across all 4 categories (`UI/UX`, `Integrations`, `Performance`, `General`) and all 4 lifecycle statuses (`Under Review`, `Planned`, `In Progress`, `Completed`).
- Attaches genuine user ObjectIds to the `votes` array to mirror real voting distributions.
- Operates idempotently without altering admin credentials or duplicating existing data.

---

## Testing

FeatureFlow uses the native Node.js test runner (`node --test`) for zero-dependency API and integration testing:

```bash
# Run all backend test suites from monorepo root
npm test
# or
npm run test:api

# Run directly inside apps/api workspace
npm test --workspace=apps/api
```

### Test Coverage Overview
- `test/e2e.test.js`: Full integration lifecycle spanning registration, simulated email verification, login, token refresh rotation, reuse detection, post creation, voting, threaded comments, and admin moderation.
- `test/post.test.js`: Post creation validation, feed pagination, category/status filtering, text search, sorting algorithms (newest, upvoted, discussed, trending math), atomic voting concurrency, and literal route order safety.
- `test/comment.test.js`: Comment creation, 1-level threading hierarchy enforcement, orphan reply handling, soft deletion, and atomic counter synchronization.
- `test/roadmap.test.js`: Admin status transitions, metric overview aggregations, RBAC permissions guards, and idempotent admin seeding.

**Current Test Suite Status**: **76 passing tests, 13 suites, 0 failures**.

---

## Production Build

To build the client application for production:

```bash
npm run build:web
```

The compiled assets are emitted to `apps/web/dist/`, optimized for static hosting providers (Vercel, Cloudflare Pages, AWS S3/CloudFront).

---

## Deployment Configuration

FeatureFlow is configured for decoupled cloud deployment:

- **Frontend**: Hosted on [Vercel](https://vercel.com)
  - Root directory: `apps/web`
  - Build command: `npm run build`
  - Output directory: `dist`
  - Environment variable: `VITE_API_BASE_URL=https://featureflow-7jje.onrender.com/api`
- **Backend**: Hosted on [Render](https://render.com)
  - Root directory: `apps/api`
  - Build command: `npm install`
  - Start command: `node src/server.js`
  - Environment variables: `NODE_ENV=production`, `PORT=5000`, `CLIENT_ORIGIN=https://featureflow-theta.vercel.app`, `MONGODB_URI`, `JWT_ACCESS_SECRET`, `SEED_ADMIN_*`
- **Database**: [MongoDB Atlas](https://www.mongodb.com/atlas) cloud cluster with TLS encryption.

---

## Key Technical Decisions

1. **Atomic Concurrency for Votes & Counters**: Handled at the database level using MongoDB's `$addToSet`, `$pull`, and `$inc` operators. This eliminates application-level mutexes while guaranteeing accurate vote and comment counts under concurrent requests.
2. **Dual-Token Authentication with Replay Protection**: Avoids storing sensitive tokens in `localStorage`. Access tokens are kept in JavaScript memory, while refresh tokens are isolated in `httpOnly` cookies. Refresh token rotation with family revocation provides rapid containment against stolen token replay.
3. **Derived Roadmap Architecture**: Rather than maintaining separate Roadmap collections, the roadmap dynamically queries the `Post` collection for statuses `['Planned', 'In Progress', 'Completed']`. Status changes made by admins immediately synchronize across both views.
4. **Literal Route Precedence in Express**: `GET /api/posts/admin/stats` is registered before `GET /api/posts/:id` in Express routing to prevent `:id` from matching the literal `"admin"` string and causing database CastErrors.
5. **Safe Native Markdown Renderer**: Uses a custom React markdown component that sanitizes dangerous protocol schemes (`javascript:`, `data:`, `vbscript:`) without introducing heavy external parser bundles.
6. **Axios Interceptor Token Bridge**: Configured with registration hooks (`registerTokenGetter`, `registerTokenSetter`, `registerLogoutHandler`) that connect Axios interceptors to React `AuthContext` state without relying on global window objects.
7. **Coss UI Headless Primitives**: Built using `@base-ui/react` primitives combined with CSS custom properties to ensure full keyboard navigation, accessible ARIA roles, and seamless theme switching.

---

## Main Pages & Application Routes

- **`/` — Feature Feed (`HomePage`)**: Public discovery feed with status pill filters, category selection, search bar, sort options, pagination, and feature submission modal.
- **`/posts/:id` — Feature Details (`PostDetailPage`)**: Comprehensive feature view with markdown rendering, upvoting, inline admin status controls, and 1-level threaded discussion.
- **`/roadmap` — Public Roadmap (`RoadmapPage`)**: 3-column Kanban board displaying Planned, In Progress, and Completed features with direct voting and discussion navigation.
- **`/admin` — Moderation Dashboard (`AdminPage`)**: Admin portal featuring aggregate status metrics and a feature management table.
- **`/login` — Sign In (`LoginPage`)**: Account authentication with email and password.
- **`/signup` — Registration (`SignupPage`)**: Account creation with notification of simulated email verification link.
- **`/verify-email` — Email Verification (`VerifyEmailPage`)**: Handles email verification via token query parameter.
- **`/forgot-password` — Password Recovery (`ForgotPasswordPage`)**: Request password reset instructions.
- **`/reset-password` — Password Reset (`ResetPasswordPage`)**: Form to set a new password using reset token.

---

## Project Status

FeatureFlow is a fully functional, tested, and deployed full-stack application implementing customer feedback collection, atomic voting, threaded discussions, public roadmaps, dual-token JWT authentication, and admin moderation workflows.

---

## Future Improvements

- Integration with transactional email delivery providers (e.g., Resend or SendGrid).
- OAuth 2.0 / Social authentication providers (GitHub, Google).
- Real-time roadmap updates via WebSockets or Server-Sent Events (SSE).
- Webhook notifications for Slack, Discord, and Jira integrations.
- User activity and notification preferences center.
