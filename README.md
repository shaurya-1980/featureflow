# FeatureFlow — Feature Request & Public Roadmap Portal

A full-stack product feedback and public roadmap portal built with the MERN stack. Users can submit feature requests, vote on ideas, discuss in threaded comments, and follow progress through a public 3-column Kanban roadmap. Administrators can manage status transitions and moderate all feature requests.

---

## Features

### Authentication & Security
- Signup with simulated email verification
- Login with 15-minute JWT access tokens (in-memory, never `localStorage`)
- 7-day opaque refresh token stored in `httpOnly` cookie
- Refresh token rotation on every renewal
- Refresh token reuse detection — all sessions revoked on replay attack
- Logout with token invalidation
- Forgot password & reset password flow
- Protected routes (frontend + backend)
- RBAC: `user` and `admin` roles

### Feature Request Feed
- Create feature requests with title, Markdown description, and category
- Categories: `UI/UX`, `Integrations`, `Performance`, `General`
- Statuses: `Under Review`, `Planned`, `In Progress`, `Completed`
- Sorting: **Newest**, **Most Upvoted**, **Most Discussed**, **Trending** (time-decay score)
- Category and status filtering
- Debounced full-text search (title + description)
- Pagination (configurable limit, up to 50 per page)

### Atomic Voting
- MongoDB atomic `$addToSet` / `$pull` with `$inc` — no race conditions
- Duplicate vote prevention at the database layer
- Optimistic UI updates with automatic rollback on failure
- Unauthenticated vote attempts prompt login/signup modal

### Feature Detail & Threaded Discussions
- Dedicated `/posts/:id` page with full Markdown rendering
- One-level threaded replies (root comments + replies)
- Comment count synchronized atomically on create/delete
- Soft delete: content replaced with `[deleted]`, structure preserved
- Author and admin can delete any comment
- Authenticated users can reply to any root comment

### Admin Status Management
- `PATCH /api/posts/:id/status` — admin-only endpoint
- Statuses are freely transitionable by admin (no artificial restrictions)
- Zod-validated status values
- Inline status dropdown on Feature Detail page (admins only)
- Admin Moderation Dashboard (`/admin`) with stats overview and full feature list

### Public 3-Column Roadmap
- `/roadmap` — publicly accessible, no authentication required
- **Exactly 3 columns**: Planned · In Progress · Completed
- `Under Review` is intentionally excluded from the public roadmap
- Data sourced directly from the Post collection via status-filtered feed queries
- Voting on roadmap cards via existing atomic voting endpoint
- Clicking any card navigates to `/posts/:id`
- Loading skeletons, empty states, error retry

### UI/UX
- Premium SaaS design with consistent tokens (colors, spacing, typography)
- Shared `Navbar` component with active route highlighting
- Admin navigation tab visible only to authenticated admins
- Loading skeletons for all data-fetching states
- Empty state messages for empty lists/columns
- Toast notifications for all mutations (vote, status change, comment, etc.)
- Accessible labels, keyboard navigation, focus states
- Responsive layout (desktop/tablet/mobile)

---

## Tech Stack

| Layer        | Technology                                                    |
|--------------|---------------------------------------------------------------|
| Backend      | Node.js + Express.js (ES Modules)                             |
| Database     | MongoDB + Mongoose                                            |
| Validation   | Zod                                                           |
| Auth         | JWT (access) + opaque refresh token in `httpOnly` cookie      |
| Password     | bcrypt (cost factor 12)                                       |
| Security     | helmet, cors, express-rate-limit                              |
| Frontend     | React 18 + Vite (JavaScript/JSX)                             |
| Routing      | react-router-dom v6                                           |
| HTTP Client  | axios with 401 interceptor + silent token refresh             |
| Markdown     | Custom safe Markdown renderer                                 |
| Monorepo     | Native npm workspaces (`apps/api`, `apps/web`)                |

---

## Project Structure

```
feature-roadmap-portal/
├── apps/
│   ├── api/                          # Express backend
│   │   ├── src/
│   │   │   ├── config/
│   │   │   │   ├── db.js             # MongoDB connection
│   │   │   │   └── env.js            # Environment validation
│   │   │   ├── controllers/
│   │   │   │   ├── auth.controller.js
│   │   │   │   ├── comment.controller.js
│   │   │   │   └── post.controller.js  # createPost, getPosts, votePost, unvotePost,
│   │   │   │                           #   getPostById, updatePostStatus, getAdminStats
│   │   │   ├── middleware/
│   │   │   │   ├── authenticate.js   # Verify JWT Bearer token
│   │   │   │   ├── errorHandler.js   # Global error formatter
│   │   │   │   ├── optionalAuthenticate.js
│   │   │   │   ├── rateLimit.js
│   │   │   │   ├── requireRole.js    # RBAC guard (admin)
│   │   │   │   └── validate.js       # Zod schema validation middleware
│   │   │   ├── models/
│   │   │   │   ├── Comment.js        # Threaded comments with soft delete
│   │   │   │   ├── Post.js           # Feature requests with votes array
│   │   │   │   ├── RefreshToken.js   # Opaque refresh token store
│   │   │   │   └── User.js           # Users with role, emailVerified
│   │   │   ├── routes/
│   │   │   │   ├── auth.routes.js
│   │   │   │   ├── comment.routes.js
│   │   │   │   ├── health.routes.js
│   │   │   │   └── post.routes.js
│   │   │   ├── seed/
│   │   │   │   └── seedAdmin.js      # Idempotent admin user seeding
│   │   │   ├── services/
│   │   │   │   ├── password.service.js
│   │   │   │   └── token.service.js
│   │   │   ├── utils/
│   │   │   │   ├── ApiError.js
│   │   │   │   ├── ApiResponse.js
│   │   │   │   └── catchAsync.js
│   │   │   └── validators/
│   │   │       ├── auth.schema.js
│   │   │       ├── comment.schema.js
│   │   │       └── post.schema.js    # createPost, getPosts, postId, updatePostStatus schemas
│   │   ├── test/
│   │   │   ├── e2e.test.js           # Phase 1 & 2 full end-to-end test
│   │   │   ├── post.test.js          # POST/GET /api/posts unit tests
│   │   │   ├── vote.test.js          # Atomic voting tests
│   │   │   ├── comment.test.js       # Comment CRUD tests
│   │   │   └── roadmap.test.js       # Admin status + stats tests
│   │   ├── .env                      # (git-ignored) environment secrets
│   │   └── .env.example              # Safe placeholder template
│   └── web/                          # React frontend
│       ├── src/
│       │   ├── api/
│       │   │   └── axiosClient.js    # Configured Axios with interceptors
│       │   ├── components/
│       │   │   ├── admin/
│       │   │   │   └── AdminStatusSelect.jsx   # Inline status dropdown for admins
│       │   │   ├── comments/
│       │   │   │   ├── CommentComposer.jsx
│       │   │   │   ├── CommentItem.jsx
│       │   │   │   ├── CommentSection.jsx
│       │   │   │   └── DeleteConfirmModal.jsx
│       │   │   ├── layout/
│       │   │   │   └── Navbar.jsx    # Shared navigation with active state & auth controls
│       │   │   └── posts/
│       │   │       ├── AuthPromptModal.jsx
│       │   │       ├── CreateFeatureModal.jsx
│       │   │       ├── FeatureCard.jsx
│       │   │       ├── FeatureFeed.jsx
│       │   │       ├── FeedFilters.jsx
│       │   │       ├── MarkdownRenderer.jsx
│       │   │       ├── SearchInput.jsx
│       │   │       ├── SkeletonCard.jsx
│       │   │       ├── Toast.jsx
│       │   │       └── VoteButton.jsx
│       │   ├── context/
│       │   │   └── AuthContext.jsx   # Global auth state + silent refresh
│       │   ├── pages/
│       │   │   ├── AdminPage.jsx     # /admin — moderation dashboard (admin only)
│       │   │   ├── ForgotPasswordPage.jsx
│       │   │   ├── HomePage.jsx      # / — feature request feed
│       │   │   ├── LoginPage.jsx
│       │   │   ├── PostDetailPage.jsx  # /posts/:id — detail + comments
│       │   │   ├── ResetPasswordPage.jsx
│       │   │   ├── RoadmapPage.jsx   # /roadmap — 3-column Kanban
│       │   │   ├── SignupPage.jsx
│       │   │   └── VerifyEmailPage.jsx
│       │   ├── routes/
│       │   │   ├── AdminRoute.jsx    # Admin-role route guard
│       │   │   ├── AppRouter.jsx     # All route definitions
│       │   │   └── ProtectedRoute.jsx
│       │   └── utils/
│       │       └── statusStyles.js   # Centralized status/category design tokens
│       └── index.html
├── docs/
│   └── API.md                        # Full API reference documentation
├── scripts/                          # Dev utility scripts
├── package.json                      # Monorepo root — workspace definitions & scripts
└── README.md
```

---

## Database Models

### User
| Field              | Type      | Notes                               |
|--------------------|-----------|-------------------------------------|
| `name`             | String    | Required, trimmed                   |
| `email`            | String    | Unique, lowercase, required         |
| `passwordHash`     | String    | bcrypt hash (cost 12)               |
| `role`             | String    | `"user"` (default) or `"admin"`     |
| `isEmailVerified`  | Boolean   | false until token verified          |
| `emailVerificationToken` | String | Hashed token, expires 24h       |
| `passwordResetToken` | String  | Hashed token, expires 1h           |

### Post (Feature Request)
| Field                 | Type       | Notes                             |
|-----------------------|------------|-----------------------------------|
| `title`               | String     | Max 200 chars                     |
| `descriptionMarkdown` | String     | Full Markdown content             |
| `category`            | String     | Enum: UI/UX, Integrations, Performance, General |
| `status`              | String     | Enum: Under Review, Planned, In Progress, Completed |
| `author`              | ObjectId   | Ref: User                         |
| `votes`               | [ObjectId] | Array of user IDs who voted       |
| `voteCount`           | Number     | Atomically maintained integer     |
| `commentCount`        | Number     | Atomically maintained integer     |

### Comment
| Field       | Type     | Notes                                      |
|-------------|----------|--------------------------------------------|
| `post`      | ObjectId | Ref: Post                                  |
| `author`    | ObjectId | Ref: User                                  |
| `content`   | String   | Markdown content                           |
| `parentComment` | ObjectId | Null for root; points to parent for replies |
| `isDeleted` | Boolean  | Soft delete flag                           |

### RefreshToken
| Field       | Type     | Notes                         |
|-------------|----------|-------------------------------|
| `tokenHash` | String   | SHA-256 hash of the opaque token |
| `user`      | ObjectId | Ref: User                     |
| `expiresAt` | Date     | TTL index                     |
| `isRevoked` | Boolean  | Revoked on use/logout/theft   |

---

## API Overview

| Method   | Endpoint                        | Auth     | Role    | Description                           |
|----------|---------------------------------|----------|---------|---------------------------------------|
| `GET`    | `/api/health`                   | No       | —       | Server + DB health check              |
| `POST`   | `/api/auth/signup`              | No       | —       | Create user account                   |
| `POST`   | `/api/auth/verify-email`        | No       | —       | Verify email with token               |
| `POST`   | `/api/auth/login`               | No       | —       | Authenticate, receive tokens          |
| `POST`   | `/api/auth/logout`              | Cookie   | Any     | Revoke refresh token                  |
| `POST`   | `/api/auth/refresh`             | Cookie   | —       | Rotate refresh token, get new access  |
| `GET`    | `/api/auth/me`                  | Bearer   | Any     | Get current user profile              |
| `POST`   | `/api/auth/forgot-password`     | No       | —       | Send password reset email             |
| `POST`   | `/api/auth/reset-password`      | No       | —       | Reset password with token             |
| `POST`   | `/api/posts`                    | Bearer   | Any     | Create feature request                |
| `GET`    | `/api/posts`                    | Optional | —       | Feed: filter, sort, search, paginate  |
| `GET`    | `/api/posts/admin/stats`        | Bearer   | admin   | Status count summary                  |
| `GET`    | `/api/posts/:id`                | Optional | —       | Single feature request detail         |
| `PATCH`  | `/api/posts/:id/status`         | Bearer   | admin   | Update workflow status                |
| `POST`   | `/api/posts/:id/vote`           | Bearer   | Any     | Atomic upvote                         |
| `DELETE` | `/api/posts/:id/vote`           | Bearer   | Any     | Remove upvote                         |
| `POST`   | `/api/posts/:id/comments`       | Bearer   | Any     | Create comment or reply               |
| `GET`    | `/api/posts/:id/comments`       | No       | —       | Get threaded comments                 |
| `DELETE` | `/api/comments/:id`             | Bearer   | Owner/Admin | Soft delete comment              |

See [`docs/API.md`](docs/API.md) for full request/response examples.

---

## Environment Variables

Create `apps/api/.env` (copy from `apps/api/.env.example`):

```env
# Server
NODE_ENV=development
PORT=5000

# MongoDB
MONGODB_URI=mongodb+srv://<user>:<pass>@cluster0.xxxxx.mongodb.net/feature-roadmap-portal

# JWT
JWT_ACCESS_SECRET=replace_with_a_long_random_string_minimum_32_characters
JWT_ACCESS_EXPIRES_IN=15m
REFRESH_TOKEN_EXPIRES_IN_DAYS=7

# CORS
CLIENT_ORIGIN=http://localhost:5173

# Admin Seed (used once on startup to create the admin account)
SEED_ADMIN_NAME=Admin
SEED_ADMIN_EMAIL=admin@example.com
SEED_ADMIN_PASSWORD=ChangeThisPassword123
```

> ⚠️ `apps/api/.env` is git-ignored. Never commit real credentials.

---

## Admin Account & RBAC Security Model

- **Demo Admin Credentials:**
  - **Email:** `admin@example.com`
  - **Password:** `ChangeThisPassword123`
- **Server-Side Role Assignment:** Roles are assigned strictly server-side. Users cannot select "Admin" or choose their role during registration or login. Regular signups always receive `role: 'user'`.
- **Idempotent Seeding & Production Safety:** On API startup, `autoSeedAdmin` runs automatically. It creates or verifies the administrator account from `SEED_ADMIN_*` environment variables. In development/test mode (or when `SEED_ADMIN_FORCE_RESET=true`), it ensures credentials match the environment configuration. In production (`NODE_ENV=production` without force reset), existing user passwords are never overwritten.
- **Production Warning:** The demo credentials above are for local development and testing only. Production deployments must configure strong, unique administrator credentials via environment variables.

---

## Local Development Setup

### Prerequisites
- Node.js ≥ 18
- MongoDB Atlas connection string (or local MongoDB)

### Install

```bash
# From the monorepo root
npm install
```

### Run Backend

```bash
npm run dev:api
# or from apps/api: npm run dev
```

API starts on `http://localhost:5000`.

### Run Frontend

```bash
npm run dev:web
# or from apps/web: npm run dev
```

Frontend starts on `http://localhost:5173`.

### Run Both (concurrently)

```bash
npm run dev
```

---

## Running Tests

```bash
# Run all backend tests
npm run test:api

# Run from API workspace directly
cd apps/api && npm test
```

**Test suites:**
- `e2e.test.js` — Phase 1, 2 & 3 full end-to-end flow (18 tests)
- `post.test.js` — Feed, pagination, filter, sort, search, atomic voting & route ordering (25 tests)
- `comment.test.js` — Comment CRUD, replies, soft delete, auth & counter sync (15 tests)
- `roadmap.test.js` — Admin status transitions, admin stats, RBAC & admin seed (13 tests)

**Total: 71 tests, 0 failures**

---

## Production Build

```bash
npm run build:web
```

Output is in `apps/web/dist/`. Serve with any static file server or reverse proxy.

---

## Key Technical Decisions

### Atomic Voting
MongoDB `$addToSet` / `$pull` with `$inc` on the same document ensures no race conditions or double-votes, even under concurrent load. No application-level locking needed.

### Refresh Token Security
Refresh tokens are opaque random strings stored as SHA-256 hashes in MongoDB. On every use, the token is rotated (old one invalidated, new one issued). If a revoked token is reused, **all sessions for that user are immediately revoked** (theft detection).

### No Separate Roadmap Model
The public roadmap queries the same `Post` collection with `status` filters (`Planned`, `In Progress`, `Completed`). No data duplication. Admin status changes are immediately reflected everywhere.

### Route Ordering for `/api/posts/admin/stats`
`GET /api/posts/admin/stats` is registered **before** `GET /api/posts/:id` to prevent Express from matching `"admin"` as a dynamic `:id` parameter.

### `hasVoted` Derivation
The `votes` array (containing user ObjectIds) is never sent to the client. `hasVoted` is computed per-request by checking if the authenticated user's ID appears in the array. This prevents client-side manipulation of vote state.
