/**
 * test/post.test.js
 *
 * End-to-end integration tests for Phase 2 Feature Request Feed & Voting system.
 * Uses native Node.js test runner (node:test) and native fetch.
 */

import 'dotenv/config';
import test, { before, after, describe } from 'node:test';
import assert from 'node:assert/strict';
import jwt from 'jsonwebtoken';
import mongoose from 'mongoose';

import app from '../src/app.js';
import connectDB from '../src/config/db.js';
import env from '../src/config/env.js';
import User from '../src/models/User.js';
import Post from '../src/models/Post.js';

let server;
let baseUrl;
let testUser1;
let testUser2;
let adminUser;
let tokenUser1;
let tokenUser2;
let tokenAdmin;

before(async () => {
  await connectDB();

  // Start server on an ephemeral port
  await new Promise((resolve) => {
    server = app.listen(0, () => {
      const port = server.address().port;
      baseUrl = `http://localhost:${port}/api`;
      resolve();
    });
  });

  // Create test users for voting, admin and authorization tests
  await User.deleteMany({ email: { $in: ['test_author_p2@example.com', 'test_voter_p2@example.com', 'test_admin_p2@example.com'] } });
  await Post.deleteMany({ title: { $regex: /^\[TEST\]/ } });

  testUser1 = await User.create({
    name: 'Test Author',
    email: 'test_author_p2@example.com',
    passwordHash: '$2b$12$eX4mpleH4shedP4ssw0rdF0rTest1ngPurp0sesOnly000',
    role: 'user',
    isEmailVerified: true,
  });

  testUser2 = await User.create({
    name: 'Test Voter',
    email: 'test_voter_p2@example.com',
    passwordHash: '$2b$12$eX4mpleH4shedP4ssw0rdF0rTest1ngPurp0sesOnly000',
    role: 'user',
    isEmailVerified: true,
  });

  adminUser = await User.create({
    name: 'Test Admin',
    email: 'test_admin_p2@example.com',
    passwordHash: '$2b$12$eX4mpleH4shedP4ssw0rdF0rTest1ngPurp0sesOnly000',
    role: 'admin',
    isEmailVerified: true,
  });

  tokenUser1 = jwt.sign(
    { sub: testUser1._id.toString(), role: testUser1.role },
    env.jwt.accessSecret,
    { expiresIn: '1h' }
  );

  tokenUser2 = jwt.sign(
    { sub: testUser2._id.toString(), role: testUser2.role },
    env.jwt.accessSecret,
    { expiresIn: '1h' }
  );

  tokenAdmin = jwt.sign(
    { sub: adminUser._id.toString(), role: adminUser.role },
    env.jwt.accessSecret,
    { expiresIn: '1h' }
  );
});

after(async () => {
  // Cleanup test data
  if (testUser1?._id) {
    await User.deleteMany({ _id: { $in: [testUser1._id, testUser2._id, adminUser?._id] } });
  }
  await Post.deleteMany({ title: { $regex: /^\[TEST\]/ } });

  if (server) {
    await new Promise((resolve) => server.close(resolve));
  }
  await mongoose.disconnect();
});

describe('POST /api/posts - Create Feature Request', () => {
  test('rejects unauthenticated request with 401', async () => {
    const res = await fetch(`${baseUrl}/posts`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        title: '[TEST] Dark Mode Support',
        descriptionMarkdown: 'Please add a dark mode theme.',
        category: 'UI/UX',
      }),
    });

    const body = await res.json();
    assert.equal(res.status, 401);
    assert.equal(body.success, false);
  });

  test('rejects invalid title (empty or over 200 chars)', async () => {
    const emptyTitleRes = await fetch(`${baseUrl}/posts`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${tokenUser1}`,
      },
      body: JSON.stringify({
        title: '   ',
        descriptionMarkdown: 'Valid description.',
        category: 'UI/UX',
      }),
    });
    assert.equal(emptyTitleRes.status, 400);
    const emptyBody = await emptyTitleRes.json();
    assert.equal(emptyBody.success, false);

    const longTitleRes = await fetch(`${baseUrl}/posts`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${tokenUser1}`,
      },
      body: JSON.stringify({
        title: 'A'.repeat(201),
        descriptionMarkdown: 'Valid description.',
        category: 'UI/UX',
      }),
    });
    assert.equal(longTitleRes.status, 400);
  });

  test('rejects invalid category', async () => {
    const res = await fetch(`${baseUrl}/posts`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${tokenUser1}`,
      },
      body: JSON.stringify({
        title: '[TEST] Invalid Category Feature',
        descriptionMarkdown: 'Valid description.',
        category: 'NonExistentCategory',
      }),
    });

    assert.equal(res.status, 400);
    const body = await res.json();
    assert.equal(body.success, false);
    assert.ok(body.details.some((d) => d.field === 'category'));
  });

  test('successfully creates a feature request with safe defaults and authenticated author', async () => {
    const res = await fetch(`${baseUrl}/posts`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${tokenUser1}`,
      },
      body: JSON.stringify({
        title: '[TEST] Webhook Integration',
        descriptionMarkdown: 'Support GitHub & Slack webhooks for updates.',
        category: 'Integrations',
        // Attempting to inject fake fields that should be ignored/overridden
        author: '64f1a2b3c4d5e6f7a8b9c0d1',
        voteCount: 999,
        status: 'Completed',
      }),
    });

    assert.equal(res.status, 201);
    const body = await res.json();
    assert.equal(body.success, true);
    assert.equal(body.post.title, '[TEST] Webhook Integration');
    assert.equal(body.post.category, 'Integrations');
    assert.equal(body.post.status, 'Under Review');
    assert.equal(body.post.voteCount, 0);
    assert.equal(body.post.commentCount, 0);
    assert.equal(body.post.hasVoted, false);
    assert.equal(body.post.author._id.toString(), testUser1._id.toString());
    assert.equal(body.post.author.name, 'Test Author');
    // Ensure raw votes array is not exposed
    assert.equal(body.post.votes, undefined);
  });
});

describe('GET /api/posts - Feed, Pagination, Filter, Sort & Search', () => {
  let postUI;
  let postPerf;
  let postGen;

  before(async () => {
    // Seed 3 specific posts for feed tests
    postUI = await Post.create({
      title: '[TEST] Figma Design Tokens Sync',
      descriptionMarkdown: 'Directly sync color and typography tokens from Figma.',
      category: 'UI/UX',
      status: 'Planned',
      author: testUser1._id,
      voteCount: 15,
      commentCount: 4,
      createdAt: new Date(Date.now() - 2 * 3600000), // 2 hours ago
    });

    postPerf = await Post.create({
      title: '[TEST] Image Compression Optimization',
      descriptionMarkdown: 'Optimize high-res image uploads using WebP format.',
      category: 'Performance',
      status: 'In Progress',
      author: testUser1._id,
      voteCount: 40,
      commentCount: 12,
      createdAt: new Date(Date.now() - 10 * 3600000), // 10 hours ago
    });

    postGen = await Post.create({
      title: '[TEST] Weekly Summary Email Digest',
      descriptionMarkdown: 'Receive email digests for subscribed roadmaps.',
      category: 'General',
      status: 'Under Review',
      author: testUser1._id,
      voteCount: 5,
      commentCount: 1,
      createdAt: new Date(Date.now() - 24 * 3600000), // 24 hours ago
    });
  });

  test('is public and supports pagination', async () => {
    const res = await fetch(`${baseUrl}/posts?limit=2&page=1`);
    assert.equal(res.status, 200);
    const body = await res.json();
    assert.equal(body.success, true);
    assert.ok(Array.isArray(body.posts));
    assert.ok(body.posts.length <= 2);
    assert.equal(body.pagination.page, 1);
    assert.equal(body.pagination.limit, 2);
    assert.ok(body.pagination.total >= 3);
    assert.ok(body.pagination.totalPages >= 2);
  });

  test('filters by category', async () => {
    const res = await fetch(`${baseUrl}/posts?category=Performance`);
    assert.equal(res.status, 200);
    const body = await res.json();
    assert.ok(body.posts.length > 0);
    body.posts.forEach((p) => {
      assert.equal(p.category, 'Performance');
    });
  });

  test('filters by status', async () => {
    const res = await fetch(`${baseUrl}/posts?status=Planned`);
    assert.equal(res.status, 200);
    const body = await res.json();
    assert.ok(body.posts.length > 0);
    body.posts.forEach((p) => {
      assert.equal(p.status, 'Planned');
    });
  });

  test('rejects invalid category and status with 400', async () => {
    const badCatRes = await fetch(`${baseUrl}/posts?category=InvalidCategory`);
    assert.equal(badCatRes.status, 400);

    const badStatusRes = await fetch(`${baseUrl}/posts?status=InvalidStatus`);
    assert.equal(badStatusRes.status, 400);
  });

  test('sorts by newest', async () => {
    const res = await fetch(`${baseUrl}/posts?sort=newest`);
    assert.equal(res.status, 200);
    const body = await res.json();
    for (let i = 0; i < body.posts.length - 1; i++) {
      const current = new Date(body.posts[i].createdAt).getTime();
      const next = new Date(body.posts[i + 1].createdAt).getTime();
      assert.ok(current >= next);
    }
  });

  test('sorts by upvoted', async () => {
    const res = await fetch(`${baseUrl}/posts?sort=upvoted`);
    assert.equal(res.status, 200);
    const body = await res.json();
    for (let i = 0; i < body.posts.length - 1; i++) {
      assert.ok(body.posts[i].voteCount >= body.posts[i + 1].voteCount);
    }
  });

  test('sorts by discussed', async () => {
    const res = await fetch(`${baseUrl}/posts?sort=discussed`);
    assert.equal(res.status, 200);
    const body = await res.json();
    for (let i = 0; i < body.posts.length - 1; i++) {
      assert.ok(body.posts[i].commentCount >= body.posts[i + 1].commentCount);
    }
  });

  test('sorts by trending using mathematical formula', async () => {
    const res = await fetch(`${baseUrl}/posts?sort=trending`);
    assert.equal(res.status, 200);
    const body = await res.json();
    assert.equal(body.success, true);
    assert.ok(body.posts.length > 0);
  });

  test('searches case-insensitively across title and description', async () => {
    // Search title term
    const resTitle = await fetch(`${baseUrl}/posts?search=figma`);
    assert.equal(resTitle.status, 200);
    const bodyTitle = await resTitle.json();
    assert.ok(bodyTitle.posts.some((p) => p.title.includes('Figma')));

    // Search description term
    const resDesc = await fetch(`${baseUrl}/posts?search=webp`);
    assert.equal(resDesc.status, 200);
    const bodyDesc = await resDesc.json();
    assert.ok(bodyDesc.posts.some((p) => p.descriptionMarkdown.includes('WebP')));
  });

  test('returns empty array when search query matches nothing', async () => {
    const res = await fetch(`${baseUrl}/posts?search=unmatchednonexistentqueryxyz123`);
    assert.equal(res.status, 200);
    const body = await res.json();
    assert.equal(body.posts.length, 0);
    assert.equal(body.pagination.total, 0);
  });
});

describe('POST & DELETE /api/posts/:id/vote - Atomic Voting', () => {
  let targetPost;

  before(async () => {
    targetPost = await Post.create({
      title: '[TEST] Atomic Voting Candidate',
      descriptionMarkdown: 'Testing atomic voting mechanics.',
      category: 'Performance',
      status: 'Under Review',
      author: testUser1._id,
      votes: [],
      voteCount: 0,
    });
  });

  test('rejects unauthenticated vote with 401', async () => {
    const res = await fetch(`${baseUrl}/posts/${targetPost._id}/vote`, {
      method: 'POST',
    });
    assert.equal(res.status, 401);
  });

  test('rejects invalid ObjectId with 400', async () => {
    const res = await fetch(`${baseUrl}/posts/invalid-id/vote`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${tokenUser1}` },
    });
    assert.equal(res.status, 400);
    const body = await res.json();
    assert.equal(body.success, false);
  });

  test('returns 404 for non-existent valid ObjectId', async () => {
    const nonExistentId = new mongoose.Types.ObjectId().toString();
    const res = await fetch(`${baseUrl}/posts/${nonExistentId}/vote`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${tokenUser1}` },
    });
    assert.equal(res.status, 404);
  });

  test('first vote increments voteCount by 1 and sets hasVoted: true', async () => {
    const res = await fetch(`${baseUrl}/posts/${targetPost._id}/vote`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${tokenUser1}` },
    });

    assert.equal(res.status, 200);
    const body = await res.json();
    assert.equal(body.success, true);
    assert.equal(body.voteCount, 1);
    assert.equal(body.hasVoted, true);

    // Verify in database
    const postInDb = await Post.findById(targetPost._id);
    assert.equal(postInDb.voteCount, 1);
    assert.equal(postInDb.votes.length, 1);
    assert.equal(postInDb.votes[0].toString(), testUser1._id.toString());
  });

  test('duplicate vote by same user does not increase voteCount (idempotent & atomic)', async () => {
    const res = await fetch(`${baseUrl}/posts/${targetPost._id}/vote`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${tokenUser1}` },
    });

    assert.equal(res.status, 200);
    const body = await res.json();
    assert.equal(body.voteCount, 1);
    assert.equal(body.hasVoted, true);

    const postInDb = await Post.findById(targetPost._id);
    assert.equal(postInDb.voteCount, 1);
    assert.equal(postInDb.votes.length, 1);
  });

  test('second user vote increments voteCount to 2', async () => {
    const res = await fetch(`${baseUrl}/posts/${targetPost._id}/vote`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${tokenUser2}` },
    });

    assert.equal(res.status, 200);
    const body = await res.json();
    assert.equal(body.voteCount, 2);
    assert.equal(body.hasVoted, true);

    const postInDb = await Post.findById(targetPost._id);
    assert.equal(postInDb.voteCount, 2);
    assert.equal(postInDb.votes.length, 2);
  });

  test('feed endpoint reflects hasVoted accurately for authenticated user', async () => {
    const resUser1 = await fetch(`${baseUrl}/posts?search=Atomic+Voting`, {
      headers: { Authorization: `Bearer ${tokenUser1}` },
    });
    const bodyUser1 = await resUser1.json();
    const postFound1 = bodyUser1.posts.find((p) => p._id.toString() === targetPost._id.toString());
    assert.ok(postFound1);
    assert.equal(postFound1.hasVoted, true);

    // Unauthenticated feed visitor
    const resAnon = await fetch(`${baseUrl}/posts?search=Atomic+Voting`);
    const bodyAnon = await resAnon.json();
    const postFoundAnon = bodyAnon.posts.find((p) => p._id.toString() === targetPost._id.toString());
    assert.ok(postFoundAnon);
    assert.equal(postFoundAnon.hasVoted, false);
  });

  test('removes vote and decrements voteCount', async () => {
    const res = await fetch(`${baseUrl}/posts/${targetPost._id}/vote`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${tokenUser1}` },
    });

    assert.equal(res.status, 200);
    const body = await res.json();
    assert.equal(body.success, true);
    assert.equal(body.voteCount, 1);
    assert.equal(body.hasVoted, false);

    const postInDb = await Post.findById(targetPost._id);
    assert.equal(postInDb.voteCount, 1);
    assert.equal(postInDb.votes.length, 1);
    assert.equal(postInDb.votes[0].toString(), testUser2._id.toString());
  });

  test('removing nonexistent vote does not decrement count and cannot become negative', async () => {
    // User1 already removed their vote
    const res = await fetch(`${baseUrl}/posts/${targetPost._id}/vote`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${tokenUser1}` },
    });

    assert.equal(res.status, 200);
    const body = await res.json();
    assert.equal(body.voteCount, 1);
    assert.equal(body.hasVoted, false);

    const postInDb = await Post.findById(targetPost._id);
    assert.equal(postInDb.voteCount, 1);
  });

  test('concurrent rapid voting is safe and does not double-increment', async () => {
    const rapidPost = await Post.create({
      title: '[TEST] Concurrent Vote Test',
      descriptionMarkdown: 'Testing concurrency safety.',
      category: 'General',
      author: testUser1._id,
      votes: [],
      voteCount: 0,
    });

    // Fire 5 concurrent votes from testUser1 simultaneously
    const promises = Array.from({ length: 5 }, () =>
      fetch(`${baseUrl}/posts/${rapidPost._id}/vote`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${tokenUser1}` },
      })
    );

    const responses = await Promise.all(promises);
    for (const r of responses) {
      assert.equal(r.status, 200);
    }

    const postInDb = await Post.findById(rapidPost._id);
    // Despite 5 concurrent calls from User 1, voteCount must strictly be 1!
    assert.equal(postInDb.voteCount, 1);
    assert.equal(postInDb.votes.length, 1);
  });
});

describe('GET /api/posts/admin/stats - Route Ordering Regression Test', () => {
  test('does NOT collide with GET /posts/:id and returns 200 or 403 (not 500 CastError)', async () => {
    // If route ordering was wrong, GET /posts/admin/stats matches GET /:id with id="admin"
    // and throws a Mongoose CastError (500). With correct ordering, it hits the admin route.
    const res = await fetch(`${baseUrl}/posts/admin/stats`, {
      headers: { Authorization: `Bearer ${tokenUser1}` },
    });
    // Non-admin user gets 403 Forbidden (handled cleanly by requireRole, NOT 500 CastError)
    assert.equal(res.status, 403);
    const body = await res.json();
    assert.equal(body.success, false);
    assert.notEqual(res.status, 500);
  });
});

describe('DELETE /api/posts/:id - Admin Feature Deletion', () => {
  let postToDelete;

  before(async () => {
    postToDelete = await Post.create({
      title: '[TEST] Post to Delete',
      descriptionMarkdown: 'This post will be deleted by an admin.',
      category: 'General',
      author: testUser1._id,
      votes: [testUser1._id],
      voteCount: 1,
    });
  });

  test('rejects unauthenticated request with 401', async () => {
    const res = await fetch(`${baseUrl}/posts/${postToDelete._id}`, {
      method: 'DELETE',
    });
    assert.equal(res.status, 401);
    const body = await res.json();
    assert.equal(body.success, false);
  });

  test('rejects regular non-admin user with 403', async () => {
    const res = await fetch(`${baseUrl}/posts/${postToDelete._id}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${tokenUser1}` },
    });
    assert.equal(res.status, 403);
    const body = await res.json();
    assert.equal(body.success, false);
  });

  test('returns 404 for nonexistent post', async () => {
    const fakeId = new mongoose.Types.ObjectId();
    const res = await fetch(`${baseUrl}/posts/${fakeId}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${tokenAdmin}` },
    });
    assert.equal(res.status, 404);
  });

  test('admin successfully deletes feature request', async () => {
    const res = await fetch(`${baseUrl}/posts/${postToDelete._id}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${tokenAdmin}` },
    });
    assert.equal(res.status, 200);
    const body = await res.json();
    assert.equal(body.success, true);
    assert.equal(body.message, 'Feature request deleted successfully');

    const inDb = await Post.findById(postToDelete._id);
    assert.equal(inDb, null);
  });
});
