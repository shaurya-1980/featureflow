/**
 * test/e2e.test.js
 *
 * Full End-to-End Regression & Integration Suite:
 * Validates Phase 1 Authentication alongside Phase 2 Feature Request & Voting.
 */

import 'dotenv/config';
import test, { before, after, describe } from 'node:test';
import assert from 'node:assert/strict';
import mongoose from 'mongoose';

import app from '../src/app.js';
import connectDB from '../src/config/db.js';
import User from '../src/models/User.js';
import Post from '../src/models/Post.js';
import Comment from '../src/models/Comment.js';
import RefreshToken from '../src/models/RefreshToken.js';

let server;
let baseUrl;

const userCredentials = {
  name: 'Full E2E Tester',
  email: 'e2e_tester@example.com',
  password: 'Password123!',
};

before(async () => {
  await connectDB();

  await new Promise((resolve) => {
    server = app.listen(0, () => {
      const port = server.address().port;
      baseUrl = `http://localhost:${port}/api`;
      resolve();
    });
  });

  // Clean prior test artifacts
  const existingUser = await User.findOne({ email: userCredentials.email });
  if (existingUser) {
    await RefreshToken.deleteMany({ userId: existingUser._id });
    await Comment.deleteMany({ author: existingUser._id });
    await Post.deleteMany({ author: existingUser._id });
    await User.deleteOne({ _id: existingUser._id });
  }
});

after(async () => {
  const existingUser = await User.findOne({ email: userCredentials.email });
  if (existingUser) {
    await RefreshToken.deleteMany({ userId: existingUser._id });
    await Comment.deleteMany({ author: existingUser._id });
    await Post.deleteMany({ author: existingUser._id });
    await User.deleteOne({ _id: existingUser._id });
  }

  if (server) {
    await new Promise((resolve) => server.close(resolve));
  }
  await mongoose.disconnect();
});

describe('Phase 1 & Phase 2 Complete End-to-End Flow', () => {
  let devVerificationToken = '';
  let accessToken = '';
  let refreshCookie = '';
  let createdPostId = '';

  test('1. Phase 1: Sign up new user and verify demo verification URL', async () => {
    const res = await fetch(`${baseUrl}/auth/signup`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(userCredentials),
    });

    assert.equal(res.status, 201);
    const body = await res.json();
    assert.equal(body.success, true);
    assert.ok(body.demoVerificationUrl || body.data?.demoVerificationUrl);
    assert.ok(body.devVerificationUrl); // Backward compatibility check

    const verificationUrlString = body.demoVerificationUrl || body.data?.demoVerificationUrl;
    assert.ok(verificationUrlString.includes('/verify-email?token='));

    // Extract token from verification URL
    const url = new URL(verificationUrlString);
    devVerificationToken = url.searchParams.get('token');
    assert.ok(devVerificationToken);
    assert.ok(devVerificationToken.length > 20);

    // Verify user in MongoDB is created unverified and raw token is NOT stored
    const dbUser = await User.findOne({ email: userCredentials.email }).select('+emailVerificationToken +passwordHash');
    assert.ok(dbUser);
    assert.equal(dbUser.isEmailVerified, false);
    // Token in DB must be a 64-character SHA-256 hash, not the raw token
    assert.notEqual(dbUser.emailVerificationToken, devVerificationToken);
    assert.equal(dbUser.emailVerificationToken.length, 64);
    // Password must be bcrypt hash, not plaintext
    assert.notEqual(dbUser.passwordHash, userCredentials.password);
    assert.ok(dbUser.passwordHash.startsWith('$2b$'));
  });

  test('2. Phase 1: Login before email verification is forbidden (403)', async () => {
    const res = await fetch(`${baseUrl}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: userCredentials.email,
        password: userCredentials.password,
      }),
    });

    assert.equal(res.status, 403);
    const body = await res.json();
    assert.equal(body.success, false);
  });

  test('3. Phase 1: Invalid or expired verification token is rejected (400)', async () => {
    // Test invalid token
    const invalidRes = await fetch(`${baseUrl}/auth/verify-email`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token: 'completely-invalid-random-token' }),
    });

    assert.equal(invalidRes.status, 400);
    const invalidBody = await invalidRes.json();
    assert.equal(invalidBody.success, false);

    // Test expired token by temporarily adjusting user expiry
    await User.updateOne(
      { email: userCredentials.email },
      { emailVerificationExpires: new Date(Date.now() - 1000) }
    );

    const expiredRes = await fetch(`${baseUrl}/auth/verify-email`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token: devVerificationToken }),
    });

    assert.equal(expiredRes.status, 400);
    const expiredBody = await expiredRes.json();
    assert.equal(expiredBody.success, false);

    // Restore future expiry for subsequent successful verification test
    await User.updateOne(
      { email: userCredentials.email },
      { emailVerificationExpires: new Date(Date.now() + 24 * 60 * 60 * 1000) }
    );
  });

  test('4. Phase 1: Verify email using valid token', async () => {
    const res = await fetch(`${baseUrl}/auth/verify-email`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token: devVerificationToken }),
    });

    assert.equal(res.status, 200);
    const body = await res.json();
    assert.equal(body.success, true);

    // Verify DB user is now marked verified and token fields cleared
    const dbUser = await User.findOne({ email: userCredentials.email }).select('+emailVerificationToken +emailVerificationExpires');
    assert.equal(dbUser.isEmailVerified, true);
    assert.equal(dbUser.emailVerificationToken, undefined);
    assert.equal(dbUser.emailVerificationExpires, undefined);
  });

  test('5. Phase 1: Log in with verified credentials and receive tokens', async () => {
    const res = await fetch(`${baseUrl}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: userCredentials.email,
        password: userCredentials.password,
      }),
    });

    assert.equal(res.status, 200);
    const body = await res.json();
    assert.equal(body.success, true);
    assert.ok(body.accessToken);
    assert.equal(body.user.email, userCredentials.email);

    accessToken = body.accessToken;

    // Extract refreshToken cookie
    const setCookie = res.headers.get('set-cookie');
    assert.ok(setCookie);
    assert.ok(setCookie.includes('refreshToken='));
    refreshCookie = setCookie.split(';')[0];
  });

  test('6. Phase 1: Verify /auth/me returns user profile', async () => {
    const res = await fetch(`${baseUrl}/auth/me`, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });

    assert.equal(res.status, 200);
    const body = await res.json();
    assert.equal(body.success, true);
    assert.equal(body.user.email, userCredentials.email);
    assert.equal(body.user.isEmailVerified, true);
  });

  test('7. Phase 1: Refresh token rotation', async () => {
    const res = await fetch(`${baseUrl}/auth/refresh`, {
      method: 'POST',
      headers: {
        Cookie: refreshCookie,
      },
    });

    assert.equal(res.status, 200);
    const body = await res.json();
    assert.equal(body.success, true);
    assert.ok(body.accessToken);

    // Update access token & cookie with rotated values
    accessToken = body.accessToken;
    const setCookie = res.headers.get('set-cookie');
    if (setCookie) {
      refreshCookie = setCookie.split(';')[0];
    }
  });

  test('8. Phase 2: Create a feature request with access token', async () => {
    const res = await fetch(`${baseUrl}/posts`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${accessToken}`,
      },
      body: JSON.stringify({
        title: '[E2E] Automated GitHub Sync',
        descriptionMarkdown: 'Automatically synchronize feature request status with GitHub issues.',
        category: 'Integrations',
      }),
    });

    assert.equal(res.status, 201);
    const body = await res.json();
    assert.equal(body.success, true);
    assert.equal(body.post.title, '[E2E] Automated GitHub Sync');
    assert.equal(body.post.voteCount, 0);
    assert.equal(body.post.status, 'Under Review');
    assert.equal(body.post.hasVoted, false);

    createdPostId = body.post._id;
    assert.ok(createdPostId);
  });

  test('9. Phase 2: Public feature feed displays the created request', async () => {
    const res = await fetch(`${baseUrl}/posts?category=Integrations&search=GitHub`);
    assert.equal(res.status, 200);
    const body = await res.json();
    assert.equal(body.success, true);
    assert.ok(body.posts.length > 0);

    const match = body.posts.find((p) => p._id.toString() === createdPostId.toString());
    assert.ok(match);
    assert.equal(match.title, '[E2E] Automated GitHub Sync');
    assert.equal(match.hasVoted, false); // Anonymous viewer
  });

  test('10. Phase 2: Upvote the feature request', async () => {
    const res = await fetch(`${baseUrl}/posts/${createdPostId}/vote`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${accessToken}` },
    });

    assert.equal(res.status, 200);
    const body = await res.json();
    assert.equal(body.success, true);
    assert.equal(body.voteCount, 1);
    assert.equal(body.hasVoted, true);
  });

  test('11. Phase 2: Duplicate vote is safely ignored and count stays 1', async () => {
    const res = await fetch(`${baseUrl}/posts/${createdPostId}/vote`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${accessToken}` },
    });

    assert.equal(res.status, 200);
    const body = await res.json();
    assert.equal(body.voteCount, 1);
    assert.equal(body.hasVoted, true);
  });

  test('12. Phase 2: Authenticated feed query shows hasVoted: true', async () => {
    const res = await fetch(`${baseUrl}/posts?search=Automated+GitHub`, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });

    assert.equal(res.status, 200);
    const body = await res.json();
    const match = body.posts.find((p) => p._id.toString() === createdPostId.toString());
    assert.ok(match);
    assert.equal(match.hasVoted, true);
    assert.equal(match.voteCount, 1);
  });

  test('13. Phase 2: Remove vote decrements count back to 0 and hasVoted: false', async () => {
    const res = await fetch(`${baseUrl}/posts/${createdPostId}/vote`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${accessToken}` },
    });

    assert.equal(res.status, 200);
    const body = await res.json();
    assert.equal(body.success, true);
    assert.equal(body.voteCount, 0);
    assert.equal(body.hasVoted, false);
  });

  let createdCommentId = '';

  test('14. Phase 3: Fetch feature detail via GET /api/posts/:id', async () => {
    const res = await fetch(`${baseUrl}/posts/${createdPostId}`, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });

    assert.equal(res.status, 200);
    const body = await res.json();
    assert.equal(body.success, true);
    assert.equal(body.post._id.toString(), createdPostId.toString());
    assert.equal(body.post.title, '[E2E] Automated GitHub Sync');
    assert.equal(body.post.commentCount, 0);
    assert.equal(body.post.hasVoted, false);
  });

  test('15. Phase 3: Create root comment on feature request', async () => {
    const res = await fetch(`${baseUrl}/posts/${createdPostId}/comments`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${accessToken}`,
      },
      body: JSON.stringify({
        contentMarkdown: 'This would save our engineering team hours each sprint!',
      }),
    });

    assert.equal(res.status, 201);
    const body = await res.json();
    assert.equal(body.success, true);
    assert.equal(body.comment.contentMarkdown, 'This would save our engineering team hours each sprint!');
    assert.equal(body.comment.parentComment, null);

    createdCommentId = body.comment._id;
    assert.ok(createdCommentId);
  });

  test('16. Phase 3: Create threaded reply to root comment', async () => {
    const res = await fetch(`${baseUrl}/posts/${createdPostId}/comments`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${accessToken}`,
      },
      body: JSON.stringify({
        contentMarkdown: 'Agreed, bidirectional webhooks would be best.',
        parentComment: createdCommentId,
      }),
    });

    assert.equal(res.status, 201);
    const body = await res.json();
    assert.equal(body.success, true);
    assert.equal(body.comment.parentComment.toString(), createdCommentId.toString());
  });

  test('17. Phase 3: Fetch threaded comments and verify 1-level hierarchy', async () => {
    const res = await fetch(`${baseUrl}/posts/${createdPostId}/comments`);

    assert.equal(res.status, 200);
    const body = await res.json();
    assert.equal(body.success, true);
    assert.equal(body.totalComments, 2);
    assert.equal(body.comments.length, 1);
    assert.equal(body.comments[0].replies.length, 1);
  });

  test('18. Phase 3: Soft delete comment and verify sanitized content', async () => {
    const res = await fetch(`${baseUrl}/comments/${createdCommentId}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${accessToken}` },
    });

    assert.equal(res.status, 200);
    const body = await res.json();
    assert.equal(body.success, true);

    const checkRes = await fetch(`${baseUrl}/posts/${createdPostId}/comments`);
    const checkBody = await checkRes.json();
    const deletedComment = checkBody.comments.find((c) => c._id.toString() === createdCommentId.toString());
    assert.ok(deletedComment);
    assert.equal(deletedComment.contentMarkdown, '[Comment deleted]');
  });

  test('19. Phase 1: Logout clears session', async () => {
    const res = await fetch(`${baseUrl}/auth/logout`, {
      method: 'POST',
      headers: {
        Cookie: refreshCookie,
      },
    });

    assert.equal(res.status, 200);
    const body = await res.json();
    assert.equal(body.success, true);

    // Ensure refreshing with logged-out cookie fails
    const refreshAfterLogout = await fetch(`${baseUrl}/auth/refresh`, {
      method: 'POST',
      headers: {
        Cookie: refreshCookie,
      },
    });
    assert.equal(refreshAfterLogout.status, 401);
  });
});
