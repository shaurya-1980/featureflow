/**
 * test/roadmap.test.js
 *
 * Automated tests for Admin Status Transitions & Public Roadmap queries.
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
import { autoSeedAdmin } from '../src/seed/seedAdmin.js';

let server;
let baseUrl;
let regularUser;
let adminUser;
let userToken;
let adminToken;
let testPost;

before(async () => {
  await connectDB();

  await new Promise((resolve) => {
    server = app.listen(0, () => {
      const port = server.address().port;
      baseUrl = `http://localhost:${port}/api`;
      resolve();
    });
  });

  // Clean test fixtures
  await User.deleteMany({
    email: { $in: ['test_regular_roadmap@example.com', 'test_admin_roadmap@example.com'] },
  });
  await Post.deleteMany({ title: { $regex: /^\[ROADMAP_TEST\]/ } });

  regularUser = await User.create({
    name: 'Regular Member',
    email: 'test_regular_roadmap@example.com',
    passwordHash: '$2b$12$eX4mpleH4shedP4ssw0rdF0rTest1ngPurp0sesOnly000',
    role: 'user',
    isEmailVerified: true,
  });

  adminUser = await User.create({
    name: 'Roadmap Lead Admin',
    email: 'test_admin_roadmap@example.com',
    passwordHash: '$2b$12$eX4mpleH4shedP4ssw0rdF0rTest1ngPurp0sesOnly000',
    role: 'admin',
    isEmailVerified: true,
  });

  userToken = jwt.sign(
    { sub: regularUser._id.toString(), role: regularUser.role },
    env.jwt.accessSecret,
    { expiresIn: '1h' }
  );

  adminToken = jwt.sign(
    { sub: adminUser._id.toString(), role: adminUser.role },
    env.jwt.accessSecret,
    { expiresIn: '1h' }
  );

  testPost = await Post.create({
    title: '[ROADMAP_TEST] Real-time Canvas Collaboration',
    descriptionMarkdown: 'Multiplayer whiteboarding tools.',
    category: 'UI/UX',
    status: 'Under Review',
    author: regularUser._id,
    voteCount: 10,
    commentCount: 2,
  });
});

after(async () => {
  await User.deleteMany({
    _id: { $in: [regularUser?._id, adminUser?._id] },
  });
  if (testPost?._id) {
    await Post.deleteMany({ title: { $regex: /^\[ROADMAP_TEST\]/ } });
  }

  if (server) {
    await new Promise((resolve) => server.close(resolve));
  }
  await mongoose.disconnect();
});

describe('PATCH /api/posts/:id/status - Admin Status Transitions', () => {
  test('rejects unauthenticated request with 401', async () => {
    const res = await fetch(`${baseUrl}/posts/${testPost._id}/status`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: 'Planned' }),
    });
    assert.equal(res.status, 401);
    const body = await res.json();
    assert.equal(body.success, false);
  });

  test('rejects regular non-admin user with 403', async () => {
    const res = await fetch(`${baseUrl}/posts/${testPost._id}/status`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${userToken}`,
      },
      body: JSON.stringify({ status: 'Planned' }),
    });
    assert.equal(res.status, 403);
    const body = await res.json();
    assert.equal(body.success, false);
  });

  test('rejects invalid ObjectId format with 400', async () => {
    const res = await fetch(`${baseUrl}/posts/invalid-id/status`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${adminToken}`,
      },
      body: JSON.stringify({ status: 'Planned' }),
    });
    assert.equal(res.status, 400);
    const body = await res.json();
    assert.equal(body.success, false);
  });

  test('returns 404 for nonexistent post', async () => {
    const randomId = new mongoose.Types.ObjectId().toString();
    const res = await fetch(`${baseUrl}/posts/${randomId}/status`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${adminToken}`,
      },
      body: JSON.stringify({ status: 'Planned' }),
    });
    assert.equal(res.status, 404);
    const body = await res.json();
    assert.equal(body.success, false);
  });

  test('rejects invalid status value with 400', async () => {
    const res = await fetch(`${baseUrl}/posts/${testPost._id}/status`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${adminToken}`,
      },
      body: JSON.stringify({ status: 'InvalidStatus' }),
    });
    assert.equal(res.status, 400);
    const body = await res.json();
    assert.equal(body.success, false);
  });

  test('admin successfully transitions status to "Planned"', async () => {
    const res = await fetch(`${baseUrl}/posts/${testPost._id}/status`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${adminToken}`,
      },
      body: JSON.stringify({ status: 'Planned' }),
    });

    assert.equal(res.status, 200);
    const body = await res.json();
    assert.equal(body.success, true);
    assert.equal(body.post.status, 'Planned');

    // Verify in MongoDB
    const postInDb = await Post.findById(testPost._id);
    assert.equal(postInDb.status, 'Planned');
  });

  test('admin successfully transitions status to "In Progress"', async () => {
    const res = await fetch(`${baseUrl}/posts/${testPost._id}/status`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${adminToken}`,
      },
      body: JSON.stringify({ status: 'In Progress' }),
    });

    assert.equal(res.status, 200);
    const body = await res.json();
    assert.equal(body.post.status, 'In Progress');
  });

  test('admin successfully transitions status to "Completed"', async () => {
    const res = await fetch(`${baseUrl}/posts/${testPost._id}/status`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${adminToken}`,
      },
      body: JSON.stringify({ status: 'Completed' }),
    });

    assert.equal(res.status, 200);
    const body = await res.json();
    assert.equal(body.post.status, 'Completed');
  });
});

describe('GET /api/posts/admin/stats - Admin Summary Metrics', () => {
  test('rejects unauthenticated request with 401', async () => {
    const res = await fetch(`${baseUrl}/posts/admin/stats`);
    assert.equal(res.status, 401);
  });

  test('rejects regular user with 403', async () => {
    const res = await fetch(`${baseUrl}/posts/admin/stats`, {
      headers: { Authorization: `Bearer ${userToken}` },
    });
    assert.equal(res.status, 403);
  });

  test('admin retrieves status count overview', async () => {
    const res = await fetch(`${baseUrl}/posts/admin/stats`, {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    assert.equal(res.status, 200);
    const body = await res.json();
    assert.equal(body.success, true);
    assert.ok(typeof body.stats.total === 'number');
    assert.ok(typeof body.stats.underReview === 'number');
    assert.ok(typeof body.stats.planned === 'number');
    assert.ok(typeof body.stats.inProgress === 'number');
    assert.ok(typeof body.stats.completed === 'number');
  });
});

describe('Admin Seed & Demo Credentials Authentication', () => {
  test('autoSeedAdmin creates or verifies the demo admin account idempotently', async () => {
    // Run seed twice to verify idempotency
    await autoSeedAdmin();
    await autoSeedAdmin();

    const admins = await User.find({ email: env.seed.adminEmail });
    assert.equal(admins.length, 1, 'Never creates duplicate admin users');
    assert.equal(admins[0].role, 'admin');
    assert.equal(admins[0].isEmailVerified, true);
  });

  test('admin logs in successfully with configured demo credentials', async () => {
    const res = await fetch(`${baseUrl}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: env.seed.adminEmail,
        password: env.seed.adminPassword,
      }),
    });

    assert.equal(res.status, 200);
    const body = await res.json();
    assert.equal(body.success, true);
    assert.equal(body.user.role, 'admin');
    assert.ok(body.accessToken);

    // Verify GET /api/auth/me returns role: "admin"
    const meRes = await fetch(`${baseUrl}/auth/me`, {
      headers: { Authorization: `Bearer ${body.accessToken}` },
    });
    assert.equal(meRes.status, 200);
    const meBody = await meRes.json();
    assert.equal(meBody.user.role, 'admin');
    assert.equal(meBody.user.email, env.seed.adminEmail);

    // Verify admin access to stats endpoint
    const statsRes = await fetch(`${baseUrl}/posts/admin/stats`, {
      headers: { Authorization: `Bearer ${body.accessToken}` },
    });
    assert.equal(statsRes.status, 200);
    const statsBody = await statsRes.json();
    assert.equal(statsBody.success, true);
    assert.ok(typeof statsBody.stats.total === 'number');
  });
});
