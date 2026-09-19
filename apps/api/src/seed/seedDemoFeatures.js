/**
 * seed/seedDemoFeatures.js
 *
 * Seeds 10 realistic demo feature requests and demo users for FeatureFlow.
 * Can be executed manually via: npm run seed:features
 *
 * Idempotent:
 *  - Checks if demo users exist before creating them.
 *  - Checks if posts exist (by title) before creating them.
 *  - Populates valid user ObjectIds in the `votes` array to strictly match `voteCount`.
 *  - Never deletes existing data or alters the admin account.
 */

import 'dotenv/config';
import path from 'path';
import { fileURLToPath } from 'url';
import connectDB from '../config/db.js';
import User from '../models/User.js';
import Post from '../models/Post.js';
import { hashPassword } from '../services/password.service.js';

// 4 Primary Demo Authors
const PRIMARY_AUTHORS = [
  {
    name: 'Aarav Mehta',
    email: 'aarav.demo@featureflow.local',
    role: 'user',
    isEmailVerified: true,
  },
  {
    name: 'Priya Sharma',
    email: 'priya.demo@featureflow.local',
    role: 'user',
    isEmailVerified: true,
  },
  {
    name: 'Rohan Patel',
    email: 'rohan.demo@featureflow.local',
    role: 'user',
    isEmailVerified: true,
  },
  {
    name: 'Ananya Singh',
    email: 'ananya.demo@featureflow.local',
    role: 'user',
    isEmailVerified: true,
  },
];

// Additional demo community members for realistic voting attribution (up to 25 total voters)
const COMMUNITY_VOTERS = [
  { name: 'Devon Vance', email: 'devon.vance.demo@featureflow.local' },
  { name: 'Elena Rostova', email: 'elena.rostova.demo@featureflow.local' },
  { name: 'Marcus Chen', email: 'marcus.chen.demo@featureflow.local' },
  { name: 'Sarah Jenkins', email: 'sarah.jenkins.demo@featureflow.local' },
  { name: 'Liam O\'Connor', email: 'liam.oconnor.demo@featureflow.local' },
  { name: 'Maya Lin', email: 'maya.lin.demo@featureflow.local' },
  { name: 'Carlos Gomez', email: 'carlos.gomez.demo@featureflow.local' },
  { name: 'Zoe Washington', email: 'zoe.washington.demo@featureflow.local' },
  { name: 'Kavita Rao', email: 'kavita.rao.demo@featureflow.local' },
  { name: 'Lucas Silva', email: 'lucas.silva.demo@featureflow.local' },
  { name: 'Chloe Dubois', email: 'chloe.dubois.demo@featureflow.local' },
  { name: 'Nikhil Kapoor', email: 'nikhil.kapoor.demo@featureflow.local' },
  { name: 'Hannah Schmidt', email: 'hannah.schmidt.demo@featureflow.local' },
  { name: 'Tariq Mansoor', email: 'tariq.mansoor.demo@featureflow.local' },
  { name: 'Amara Okafor', email: 'amara.okafor.demo@featureflow.local' },
  { name: 'Kenji Takahashi', email: 'kenji.takahashi.demo@featureflow.local' },
  { name: 'Sophie Laurent', email: 'sophie.laurent.demo@featureflow.local' },
  { name: 'Vikram Joshi', email: 'vikram.joshi.demo@featureflow.local' },
  { name: 'Rachel Green', email: 'rachel.green.demo@featureflow.local' },
  { name: 'Omar Farooq', email: 'omar.farooq.demo@featureflow.local' },
  { name: 'Nina Petrov', email: 'nina.petrov.demo@featureflow.local' },
];

const DEMO_PASSWORD = 'DemoUser123!';

export const seedDemoFeatures = async () => {
  try {
    console.log('[seed:features] Starting demo features & users seeding...');

    // 1. Ensure all primary authors and voters exist
    const defaultPasswordHash = await hashPassword(DEMO_PASSWORD);
    const allUserSpecs = [
      ...PRIMARY_AUTHORS,
      ...COMMUNITY_VOTERS.map((v) => ({ ...v, role: 'user', isEmailVerified: true })),
    ];

    const userMap = new Map(); // email -> user doc / id
    let usersCreatedCount = 0;

    for (const spec of allUserSpecs) {
      let user = await User.findOne({ email: spec.email });
      if (!user) {
        user = await User.create({
          name: spec.name,
          email: spec.email,
          passwordHash: defaultPasswordHash,
          role: spec.role,
          isEmailVerified: spec.isEmailVerified,
        });
        usersCreatedCount++;
      }
      userMap.set(spec.email, user);
    }

    console.log(
      `[seed:features] User verification complete. (New users created: ${usersCreatedCount}, Total demo users available: ${userMap.size})`
    );

    const aarav = userMap.get('aarav.demo@featureflow.local');
    const priya = userMap.get('priya.demo@featureflow.local');
    const rohan = userMap.get('rohan.demo@featureflow.local');
    const ananya = userMap.get('ananya.demo@featureflow.local');

    // All available voter user IDs for distributing votes
    const allVoterIds = Array.from(userMap.values()).map((u) => u._id);

    // Helper to pick N distinct voter IDs
    const getVoterIds = (count) => {
      const shuffled = [...allVoterIds];
      return shuffled.slice(0, Math.min(count, shuffled.length));
    };

    const now = Date.now();
    const dayMs = 24 * 60 * 60 * 1000;

    // 2. Define the 10 realistic features
    const DEMO_FEATURES = [
      {
        title: 'Dark Mode Support',
        category: 'UI/UX',
        status: 'Completed',
        descriptionMarkdown: `Add a fully supported dark mode across the FeatureFlow dashboard, roadmap, feature details, forms, and comments.\n\nThe theme should respect the user's preference and remain consistent when navigating between pages.`,
        author: aarav._id,
        voteCount: 24,
        daysAgo: 2,
      },
      {
        title: 'Slack Integration for Feature Updates',
        category: 'Integrations',
        status: 'In Progress',
        descriptionMarkdown: `Allow teams to connect a Slack workspace and receive notifications when a feature request is created, updated, completed, or receives significant community activity.\n\nThis would help product teams stay informed without constantly checking the roadmap.`,
        author: priya._id,
        voteCount: 18,
        daysAgo: 4,
      },
      {
        title: 'Faster Feature Search',
        category: 'Performance',
        status: 'Planned',
        descriptionMarkdown: `Improve feature search performance for larger feedback collections.\n\nSearch should return relevant results quickly across feature titles and descriptions while supporting partial keyword matching.`,
        author: rohan._id,
        voteCount: 15,
        daysAgo: 7,
      },
      {
        title: 'Custom Notification Preferences',
        category: 'General',
        status: 'Planned',
        descriptionMarkdown: `Allow users to control which notifications they receive.\n\nUsers should be able to choose notifications for comments, feature status changes, votes, and roadmap updates instead of receiving every notification.`,
        author: ananya._id,
        voteCount: 11,
        daysAgo: 10,
      },
      {
        title: 'Keyboard Shortcuts for Power Users',
        category: 'UI/UX',
        status: 'Under Review',
        descriptionMarkdown: `Introduce keyboard shortcuts for common actions such as opening search, submitting a feature request, navigating the roadmap, and returning to the previous page.\n\nThis would make FeatureFlow faster to use for frequent contributors.`,
        author: aarav._id,
        voteCount: 9,
        daysAgo: 13,
      },
      {
        title: 'Jira Integration',
        category: 'Integrations',
        status: 'Under Review',
        descriptionMarkdown: `Connect FeatureFlow with Jira so accepted feature requests can be linked to Jira issues.\n\nProduct teams could move approved community requests into their existing engineering workflow without manually copying information.`,
        author: priya._id,
        voteCount: 21,
        daysAgo: 17,
      },
      {
        title: 'Feature Request Analytics',
        category: 'General',
        status: 'In Progress',
        descriptionMarkdown: `Provide analytics for product teams showing voting trends, discussion activity, popular categories, and feature request growth over time.\n\nThis would help teams understand which areas receive the most community interest.`,
        author: rohan._id,
        voteCount: 16,
        daysAgo: 21,
      },
      {
        title: 'Automatic Duplicate Detection',
        category: 'Performance',
        status: 'Planned',
        descriptionMarkdown: `Detect potentially duplicate feature requests while a user is creating a new request.\n\nThe system could suggest existing requests with similar titles or descriptions before the user submits a duplicate idea.`,
        author: ananya._id,
        voteCount: 13,
        daysAgo: 25,
      },
      {
        title: 'Roadmap Timeline View',
        category: 'UI/UX',
        status: 'Under Review',
        descriptionMarkdown: `Add an optional timeline-style view alongside the existing roadmap columns.\n\nUsers could see when planned features are expected to move into development and when completed features were released.`,
        author: aarav._id,
        voteCount: 7,
        daysAgo: 29,
      },
      {
        title: 'Webhook Support',
        category: 'Integrations',
        status: 'Completed',
        descriptionMarkdown: `Provide webhooks for important FeatureFlow events such as new feature requests, status changes, comments, and completed roadmap items.\n\nThis would allow teams to connect FeatureFlow with their own internal tools and automation workflows.`,
        author: priya._id,
        voteCount: 19,
        daysAgo: 34,
      },
    ];

    let featuresCreatedCount = 0;
    let featuresSkippedCount = 0;

    for (const feat of DEMO_FEATURES) {
      const existing = await Post.findOne({ title: feat.title });
      if (existing) {
        console.log(`[seed:features] Feature "${feat.title}" already exists. Skipping.`);
        featuresSkippedCount++;
        continue;
      }

      const votes = getVoterIds(feat.voteCount);
      const createdAt = new Date(now - feat.daysAgo * dayMs);

      const newPost = new Post({
        title: feat.title,
        category: feat.category,
        status: feat.status,
        descriptionMarkdown: feat.descriptionMarkdown,
        author: feat.author,
        votes: votes,
        voteCount: votes.length,
        commentCount: 0,
        createdAt: createdAt,
        updatedAt: createdAt,
      });

      await newPost.save();
      featuresCreatedCount++;
      console.log(
        `[seed:features] Created "${feat.title}" (${feat.category}, ${feat.status}, ${votes.length} votes, ${feat.daysAgo} days ago).`
      );
    }

    console.log(
      `[seed:features] Seeding summary: ${featuresCreatedCount} created, ${featuresSkippedCount} already existed.`
    );
  } catch (err) {
    console.error('[seed:features] Error seeding demo features:', err);
    throw err;
  }
};

// Check if this script was executed directly from CLI
const currentFilePath = fileURLToPath(import.meta.url);
const executedFilePath = process.argv[1] ? path.resolve(process.argv[1]) : '';

if (executedFilePath && currentFilePath === executedFilePath) {
  (async () => {
    try {
      await connectDB();
      await seedDemoFeatures();
      process.exit(0);
    } catch (error) {
      console.error('[seed:features] CLI execution failed:', error);
      process.exit(1);
    }
  })();
}

export default seedDemoFeatures;
