/**
 * pages/HomePage.jsx
 *
 * FeatureFlow Main Portal & Feature Request Feed using Coss UI primitives.
 * Publicly accessible to both visitors and authenticated members.
 *
 * Sections:
 *  - Shared Navbar (handles auth controls & nav links including Admin)
 *  - Polished Hero header communicating the product purpose
 *  - Dual CTAs: "+ Submit Feature Request" (Coss Button) and "Explore Public Roadmap →"
 *  - Full FeatureFeed with category/status filters, search, sorting, pagination
 *  - CreateFeatureModal for submitting new ideas
 *  - AuthPromptModal for unauthenticated interactions
 *  - Toast notification container
 */

import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import Navbar from '../components/layout/Navbar.jsx';
import FeatureFeed from '../components/posts/FeatureFeed.jsx';
import CreateFeatureModal from '../components/posts/CreateFeatureModal.jsx';
import AuthPromptModal from '../components/posts/AuthPromptModal.jsx';
import { Button } from '../components/ui/button.jsx';

const HomePage = () => {
  const { isAuthenticated } = useAuth();

  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [authActionName, setAuthActionName] = useState('vote on feature requests');
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  const handleOpenCreateModal = () => {
    if (!isAuthenticated) {
      setAuthActionName('submit a new feature request');
      setIsAuthModalOpen(true);
      return;
    }
    setIsCreateModalOpen(true);
  };

  const handleAuthRequiredForVote = () => {
    setAuthActionName('vote on feature requests');
    setIsAuthModalOpen(true);
  };

  const handlePostCreated = () => {
    setRefreshTrigger((prev) => prev + 1);
  };

  return (
    <div style={styles.container}>
      {/* Global Navigation */}
      <Navbar />

      {/* Hero Section */}
      <section style={styles.hero}>
        <div style={styles.heroContent}>
          <div style={styles.heroBadge}>
            <span style={styles.heroBadgeDot} aria-hidden="true" />
            <span>Community-Driven Product Portal</span>
          </div>

          <h1 style={styles.heroTitle}>Shape the Future of FeatureFlow</h1>

          <p style={styles.heroSubtitle}>
            Submit your ideas, upvote feature requests from other members, and follow our live roadmap
            as we build the next generation of developer tooling.
          </p>

          <div style={styles.heroActions}>
            <Button
              type="button"
              onClick={handleOpenCreateModal}
              variant="default"
              size="lg"
            >
              + Submit Feature Request
            </Button>

            <Button
              variant="outline"
              size="lg"
              render={<Link to="/roadmap" />}
            >
              Explore Public Roadmap →
            </Button>
          </div>
        </div>
      </section>

      {/* Main Content / Feature Request Feed */}
      <main style={styles.main}>
        <FeatureFeed
          isAuthenticated={isAuthenticated}
          onAuthRequired={handleAuthRequiredForVote}
          onOpenCreateModal={handleOpenCreateModal}
          refreshTrigger={refreshTrigger}
        />
      </main>

      {/* Modals */}
      <CreateFeatureModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onPostCreated={handlePostCreated}
      />

      <AuthPromptModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        actionName={authActionName}
      />
    </div>
  );
};

const styles = {
  container: {
    minHeight: '100vh',
    backgroundColor: 'var(--bg-app)',
    color: 'var(--text-primary)',
  },
  hero: {
    backgroundColor: 'var(--bg-card)',
    borderBottom: '1px solid var(--border-subtle)',
    padding: '3rem 1.5rem',
    textAlign: 'center',
  },
  heroContent: {
    maxWidth: '720px',
    margin: '0 auto',
  },
  heroBadge: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '0.45rem',
    padding: '0.25rem 0.75rem',
    borderRadius: 'var(--radius-full)',
    backgroundColor: 'var(--color-brand-subtle)',
    color: 'var(--color-brand)',
    fontSize: '0.75rem',
    fontWeight: 600,
    letterSpacing: '0.02em',
    marginBottom: '1rem',
    border: '1px solid var(--color-brand-border)',
  },
  heroBadgeDot: {
    width: '6px',
    height: '6px',
    borderRadius: '50%',
    backgroundColor: 'var(--color-brand)',
  },
  heroTitle: {
    fontSize: '2.25rem',
    fontWeight: 800,
    color: 'var(--text-primary)',
    letterSpacing: '-0.03em',
    marginBottom: '0.85rem',
    lineHeight: 1.2,
  },
  heroSubtitle: {
    fontSize: '1.05rem',
    color: 'var(--text-muted)',
    lineHeight: 1.6,
    margin: '0 0 1.75rem 0',
  },
  heroActions: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '0.85rem',
    flexWrap: 'wrap',
  },
  main: {
    maxWidth: '880px',
    margin: '1.75rem auto',
    padding: '0 1.25rem 4rem 1.25rem',
  },
};

export default HomePage;
