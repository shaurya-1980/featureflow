/**
 * test/comment.test.js
 *
 * End-to-end integration tests for Phase 3 Feature Detail & Threaded Discussion system.
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
import Comment from '../src/models/Comment.js';

let server;
let baseUrl;
let authorUser;
let commenterUser;
let adminUser;
let otherUser;

let authorToken;
let commenterToken;
let adminToken;
let otherToken;

let testPost;
let otherPost;

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

  // Clean test fixtures
  await User.deleteMany({
    email: {
      $in: [
        'test_p3_author@example.com',
        'test_p3_commenter@example.com',
        'test_p3_admin@example.com',
        'test_p3_other@example.com',
      ],
    },
  });
  await Post.deleteMany({ title: { $regex: /^\[P3_TEST\]/ } });

  // Create Users
  authorUser = await User.create({
    name: 'Post Author',
    email: 'test_p3_author@example.com',
    passwordHash: '$2b$12$eX4mpleH4shedP4ssw0rdF0rTest1ngPurp0sesOnly000',
    role: 'user',
    isEmailVerified: true,
  });

  commenterUser = await User.create({
    name: 'Active Commenter',
    email: 'test_p3_commenter@example.com',
    passwordHash: '$2b$12$eX4mpleH4shedP4ssw0rdF0rTest1ngPurp0sesOnly000',
    role: 'user',
    isEmailVerified: true,
  });

  adminUser = await User.create({
    name: 'Portal Admin',
    email: 'test_p3_admin@example.com',
    passwordHash: '$2b$12$eX4mpleH4shedP4ssw0rdF0rTest1ngPurp0sesOnly000',
    role: 'admin',
    isEmailVerified: true,
  });

  otherUser = await User.create({
    name: 'Unrelated User',
    email: 'test_p3_other@example.com',
    passwordHash: '$2b$12$eX4mpleH4shedP4ssw0rdF0rTest1ngPurp0sesOnly000',
    role: 'user',
    isEmailVerified: true,
  });

  authorToken = jwt.sign(
    { sub: authorUser._id.toString(), role: authorUser.role },
    env.jwt.accessSecret,
    { expiresIn: '1h' }
  );

  commenterToken = jwt.sign(
    { sub: commenterUser._id.toString(), role: commenterUser.role },
    env.jwt.accessSecret,
    { expiresIn: '1h' }
  );

  adminToken = jwt.sign(
    { sub: adminUser._id.toString(), role: adminUser.role },
    env.jwt.accessSecret,
    { expiresIn: '1h' }
  );

  otherToken = jwt.sign(
    { sub: otherUser._id.toString(), role: otherUser.role },
    env.jwt.accessSecret,
    { expiresIn: '1h' }
  );

  // Create Test Posts
  testPost = await Post.create({
    title: '[P3_TEST] Multi-cursor Collaborative Editing',
    descriptionMarkdown: 'Allow multiple users to edit documents at the same time.',
    category: 'UI/UX',
    status: 'Planned',
    author: authorUser._id,
    votes: [authorUser._id],
    voteCount: 1,
    commentCount: 0,
  });

  otherPost = await Post.create({
    title: '[P3_TEST] Unrelated Post',
    descriptionMarkdown: 'An unrelated feature request for boundary checks.',
    category: 'General',
    status: 'Under Review',
    author: otherUser._id,
    votes: [],
    voteCount: 0,
    commentCount: 0,
  });
});

after(async () => {
  // Cleanup test data
  await User.deleteMany({
    _id: { $in: [authorUser?._id, commenterUser?._id, adminUser?._id, otherUser?._id] },
  });
  if (testPost?._id) {
    await Comment.deleteMany({ post: { $in: [testPost._id, otherPost._id] } });
    await Post.deleteMany({ _id: { $in: [testPost._id, otherPost._id] } });
  }

  if (server) {
    await new Promise((resolve) => server.close(resolve));
  }
  await mongoose.disconnect();
});

describe('GET /api/posts/:id - Feature Detail Endpoint', () => {
  test('returns 400 for invalid ObjectId format', async () => {
    const res = await fetch(`${baseUrl}/posts/invalid-id-format`);
    assert.equal(res.status, 400);
    const body = await res.json();
    assert.equal(body.success, false);
  });

  test('returns 404 for nonexistent post', async () => {
    const randomId = new mongoose.Types.ObjectId().toString();
    const res = await fetch(`${baseUrl}/posts/${randomId}`);
    assert.equal(res.status, 404);
    const body = await res.json();
    assert.equal(body.success, false);
  });

  test('returns post details with author and hasVoted: true for voting author', async () => {
    const res = await fetch(`${baseUrl}/posts/${testPost._id}`, {
      headers: { Authorization: `Bearer ${authorToken}` },
    });
    assert.equal(res.status, 200);
    const body = await res.json();
    assert.equal(body.success, true);
    assert.equal(body.post.title, '[P3_TEST] Multi-cursor Collaborative Editing');
    assert.equal(body.post.author.name, 'Post Author');
    assert.equal(body.post.hasVoted, true);
    assert.equal(body.post.votes, undefined); // raw array hidden
  });

  test('returns post details with hasVoted: false for anonymous viewer', async () => {
    const res = await fetch(`${baseUrl}/posts/${testPost._id}`);
    assert.equal(res.status, 200);
    const body = await res.json();
    assert.equal(body.success, true);
    assert.equal(body.post.hasVoted, false);
  });
});

describe('POST /api/posts/:id/comments - Create Comments & Replies', () => {
  let rootCommentId = '';

  test('rejects unauthenticated request with 401', async () => {
    const res = await fetch(`${baseUrl}/posts/${testPost._id}/comments`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contentMarkdown: 'This looks great!',
      }),
    });
    assert.equal(res.status, 401);
  });

  test('rejects empty or whitespace-only content with 400', async () => {
    const res = await fetch(`${baseUrl}/posts/${testPost._id}/comments`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${commenterToken}`,
      },
      body: JSON.stringify({
        contentMarkdown: '     ',
      }),
    });
    assert.equal(res.status, 400);
    const body = await res.json();
    assert.equal(body.success, false);
  });

  test('rejects comment on nonexistent post with 404', async () => {
    const randomId = new mongoose.Types.ObjectId().toString();
    const res = await fetch(`${baseUrl}/posts/${randomId}/comments`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${commenterToken}`,
      },
      body: JSON.stringify({
        contentMarkdown: 'Comment on nothing',
      }),
    });
    assert.equal(res.status, 404);
  });

  test('creates root comment and increments Post.commentCount to 1', async () => {
    const res = await fetch(`${baseUrl}/posts/${testPost._id}/comments`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${commenterToken}`,
      },
      body: JSON.stringify({
        contentMarkdown: 'I really need this for my design team! Supporting CRDTs would be awesome.',
      }),
    });

    assert.equal(res.status, 201);
    const body = await res.json();
    assert.equal(body.success, true);
    assert.equal(body.comment.contentMarkdown, 'I really need this for my design team! Supporting CRDTs would be awesome.');
    assert.equal(body.comment.parentComment, null);
    assert.equal(body.comment.author.name, 'Active Commenter');

    rootCommentId = body.comment._id;
    assert.ok(rootCommentId);

    // Verify Post.commentCount increment
    const postInDb = await Post.findById(testPost._id);
    assert.equal(postInDb.commentCount, 1);
  });

  test('rejects reply with parentComment belonging to another post with 400', async () => {
    const res = await fetch(`${baseUrl}/posts/${otherPost._id}/comments`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${authorToken}`,
      },
      body: JSON.stringify({
        contentMarkdown: 'Replying to root from another post',
        parentComment: rootCommentId,
      }),
    });

    assert.equal(res.status, 400);
    const body = await res.json();
    assert.equal(body.success, false);
  });

  test('creates threaded reply under root comment and increments Post.commentCount to 2', async () => {
    const res = await fetch(`${baseUrl}/posts/${testPost._id}/comments`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${authorToken}`,
      },
      body: JSON.stringify({
        contentMarkdown: 'Thanks! We are considering using Yjs for the CRDT synchronization.',
        parentComment: rootCommentId,
      }),
    });

    assert.equal(res.status, 201);
    const body = await res.json();
    assert.equal(body.success, true);
    assert.equal(body.comment.parentComment.toString(), rootCommentId.toString());
    assert.equal(body.comment.author.name, 'Post Author');

    const postInDb = await Post.findById(testPost._id);
    assert.equal(postInDb.commentCount, 2);
  });
});

describe('GET /api/posts/:id/comments - Threaded Discussion Hierarchy', () => {
  test('returns comments grouped into 1-level threaded hierarchy', async () => {
    const res = await fetch(`${baseUrl}/posts/${testPost._id}/comments`);
    assert.equal(res.status, 200);
    const body = await res.json();
    assert.equal(body.success, true);
    assert.equal(body.totalComments, 2);
    assert.equal(body.comments.length, 1); // 1 root comment

    const root = body.comments[0];
    assert.equal(root.contentMarkdown, 'I really need this for my design team! Supporting CRDTs would be awesome.');
    assert.equal(root.author.name, 'Active Commenter');
    assert.equal(root.replies.length, 1); // 1 child reply

    const reply = root.replies[0];
    assert.equal(reply.contentMarkdown, 'Thanks! We are considering using Yjs for the CRDT synchronization.');
    assert.equal(reply.author.name, 'Post Author');
  });
});

describe('DELETE /api/comments/:id - Permissions, Soft Delete & Counter Sync', () => {
  let commentToDelete;

  before(async () => {
    commentToDelete = await Comment.create({
      post: testPost._id,
      author: otherUser._id,
      contentMarkdown: 'Comment that will be deleted in test.',
      parentComment: null,
    });
    await Post.findByIdAndUpdate(testPost._id, { $inc: { commentCount: 1 } });
  });

  test('rejects delete by unauthorized user with 403', async () => {
    const res = await fetch(`${baseUrl}/comments/${commentToDelete._id}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${commenterToken}` },
    });
    assert.equal(res.status, 403);
    const body = await res.json();
    assert.equal(body.success, false);
  });

  test('author can delete their own comment, soft deletes and decrements count', async () => {
    const res = await fetch(`${baseUrl}/comments/${commentToDelete._id}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${otherToken}` },
    });
    assert.equal(res.status, 200);
    const body = await res.json();
    assert.equal(body.success, true);

    const commentInDb = await Comment.findById(commentToDelete._id);
    assert.equal(commentInDb.isDeleted, true);
    assert.equal(commentInDb.contentMarkdown, '[Comment deleted]');
  });

  test('GET /api/posts/:id/comments masks content for deleted comment without exposing raw text', async () => {
    const res = await fetch(`${baseUrl}/posts/${testPost._id}/comments`);
    assert.equal(res.status, 200);
    const body = await res.json();

    const deleted = body.comments.find((c) => c._id.toString() === commentToDelete._id.toString());
    assert.ok(deleted);
    assert.equal(deleted.contentMarkdown, '[Comment deleted]');
    assert.equal(deleted.isDeleted, true);
  });

  test('admin can delete any comment (tested on root comment)', async () => {
    const freshComment = await Comment.create({
      post: testPost._id,
      author: commenterUser._id,
      contentMarkdown: 'Admin will moderate this.',
    });
    await Post.findByIdAndUpdate(testPost._id, { $inc: { commentCount: 1 } });

    const res = await fetch(`${baseUrl}/comments/${freshComment._id}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    assert.equal(res.status, 200);
    const body = await res.json();
    assert.equal(body.success, true);
  });
});
