/**
 * components/posts/CreateFeatureModal.jsx
 *
 * Polished SaaS modal for submitting a new feature request using authentic Coss UI primitives:
 *  - Coss UI Dialog (Dialog, DialogPopup, DialogHeader, DialogTitle, DialogDescription, DialogPanel, DialogFooter, DialogClose)
 *  - Coss UI Input (title with max 200 chars, character counter)
 *  - Coss UI Select (UI/UX, Integrations, Performance, General)
 *  - Coss UI Tabs (Write / Preview switch)
 *  - Coss UI Textarea (Markdown description)
 *  - Coss UI Button (Cancel / Submit)
 *  - Preserves validation, toast notifications, feed refresh
 */

import React, { useState, useEffect, useRef } from 'react';
import axiosClient from '../../api/axiosClient.js';
import MarkdownRenderer from './MarkdownRenderer.jsx';
import { useToast } from './Toast.jsx';
import {
  Dialog,
  DialogPopup,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogPanel,
  DialogFooter,
  DialogClose,
} from '../ui/dialog.jsx';
import { Input } from '../ui/input.jsx';
import { Textarea } from '../ui/textarea.jsx';
import { Button } from '../ui/button.jsx';
import { Tabs, TabsList, TabsTab, TabsPanel } from '../ui/tabs.jsx';
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectPopup,
  SelectItem,
} from '../ui/select.jsx';

const CATEGORIES = ['UI/UX', 'Integrations', 'Performance', 'General'];

export const CreateFeatureModal = ({ isOpen, onClose, onPostCreated }) => {
  const { addToast } = useToast();
  const titleInputRef = useRef(null);

  const [form, setForm] = useState({
    title: '',
    category: 'UI/UX',
    descriptionMarkdown: '',
  });

  const [activeTab, setActiveTab] = useState('write');
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setForm({
        title: '',
        category: 'UI/UX',
        descriptionMarkdown: '',
      });
      setErrors({});
      setActiveTab('write');
      setTimeout(() => {
        titleInputRef.current?.focus();
      }, 50);
    }
  }, [isOpen]);

  const validate = () => {
    const errs = {};
    const trimmedTitle = form.title.trim();
    const trimmedDesc = form.descriptionMarkdown.trim();

    if (!trimmedTitle) {
      errs.title = 'Title is required';
    } else if (trimmedTitle.length > 200) {
      errs.title = 'Title cannot exceed 200 characters';
    }

    if (!trimmedDesc) {
      errs.descriptionMarkdown = 'Description is required';
    }

    if (!CATEGORIES.includes(form.category)) {
      errs.category = 'Please select a valid category';
    }

    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validate()) {
      return;
    }

    setSubmitting(true);
    try {
      await axiosClient.post('/posts', {
        title: form.title.trim(),
        category: form.category,
        descriptionMarkdown: form.descriptionMarkdown.trim(),
      });

      addToast('Feature request created successfully', 'success');
      onClose();
      if (onPostCreated) {
        onPostCreated();
      }
    } catch (err) {
      const res = err.response?.data;
      if (res?.details && Array.isArray(res.details)) {
        const fieldErrors = {};
        res.details.forEach((d) => {
          fieldErrors[d.field] = d.message;
        });
        setErrors(fieldErrors);
      } else {
        addToast(res?.error || 'Failed to submit feature request', 'error');
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogPopup style={{ maxWidth: '560px' }}>
        <DialogHeader>
          <DialogTitle>Submit a Feature Request</DialogTitle>
          <DialogDescription>
            Share your idea or suggestion with the community and team.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} noValidate>
          <DialogPanel style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem', padding: '1.5rem' }}>
            {/* Title Field */}
            <div>
              <div style={styles.labelRow}>
                <label htmlFor="feature-title" style={styles.label}>
                  Title <span style={styles.requiredMark}>*</span>
                </label>
                <span
                  style={{
                    ...styles.charCounter,
                    color: form.title.length > 200 ? '#dc2626' : 'var(--text-muted)',
                  }}
                >
                  {form.title.length}/200
                </span>
              </div>
              <Input
                ref={titleInputRef}
                id="feature-title"
                type="text"
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
                placeholder="e.g. Dark mode support for code snippets"
                maxLength={200}
                style={{
                  borderColor: errors.title ? '#ef4444' : 'var(--border-medium)',
                }}
                required
              />
              {errors.title && <span style={styles.errorText}>{errors.title}</span>}
            </div>

            {/* Category Field */}
            <div>
              <label htmlFor="feature-category" style={styles.label}>
                Category <span style={styles.requiredMark}>*</span>
              </label>
              <Select
                value={form.category}
                onValueChange={(val) => val && setForm({ ...form, category: val })}
              >
                <SelectTrigger id="feature-category">
                  <SelectValue placeholder="Select a category" />
                </SelectTrigger>
                <SelectPopup>
                  {CATEGORIES.map((cat) => (
                    <SelectItem key={cat} value={cat}>
                      {cat}
                    </SelectItem>
                  ))}
                </SelectPopup>
              </Select>
              {errors.category && <span style={styles.errorText}>{errors.category}</span>}
            </div>

            {/* Description Field with Markdown Preview Tabs */}
            <div>
              <div style={styles.tabHeader}>
                <label htmlFor="feature-description" style={styles.label}>
                  Description (Markdown supported) <span style={styles.requiredMark}>*</span>
                </label>
              </div>

              <Tabs value={activeTab} onValueChange={setActiveTab}>
                <TabsList style={{ marginBottom: '0.65rem' }}>
                  <TabsTab value="write">Write</TabsTab>
                  <TabsTab value="preview">Preview</TabsTab>
                </TabsList>

                <TabsPanel value="write">
                  <Textarea
                    id="feature-description"
                    value={form.descriptionMarkdown}
                    onChange={(e) => setForm({ ...form, descriptionMarkdown: e.target.value })}
                    placeholder="Explain what feature you'd like to see and why it would be beneficial. Markdown formatting (headings, lists, code blocks) is supported."
                    rows={6}
                    style={{
                      borderColor: errors.descriptionMarkdown ? '#ef4444' : 'var(--border-medium)',
                    }}
                    required
                  />
                </TabsPanel>

                <TabsPanel value="preview">
                  <div style={styles.previewBox}>
                    {form.descriptionMarkdown ? (
                      <MarkdownRenderer content={form.descriptionMarkdown} />
                    ) : (
                      <span style={styles.emptyPreviewText}>Nothing to preview yet. Start typing in the Write tab!</span>
                    )}
                  </div>
                </TabsPanel>
              </Tabs>
              {errors.descriptionMarkdown && (
                <span style={styles.errorText}>{errors.descriptionMarkdown}</span>
              )}
            </div>
          </DialogPanel>

          <DialogFooter style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', padding: '1rem 1.5rem' }}>
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={submitting}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="default"
              disabled={submitting}
            >
              {submitting ? 'Submitting...' : 'Submit Feature Request'}
            </Button>
          </DialogFooter>
        </form>
      </DialogPopup>
    </Dialog>
  );
};

const styles = {
  labelRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '0.35rem',
  },
  label: {
    display: 'block',
    fontSize: '0.85rem',
    fontWeight: 600,
    color: 'var(--text-primary)',
    marginBottom: '0.35rem',
  },
  requiredMark: {
    color: '#ef4444',
  },
  charCounter: {
    fontSize: '0.75rem',
    fontWeight: 500,
  },
  tabHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '0.45rem',
  },
  previewBox: {
    minHeight: '140px',
    maxHeight: '220px',
    overflowY: 'auto',
    padding: '0.85rem',
    border: '1px solid var(--border-subtle)',
    borderRadius: 'var(--radius-md)',
    backgroundColor: 'var(--bg-app)',
  },
  emptyPreviewText: {
    color: 'var(--text-muted)',
    fontStyle: 'italic',
    fontSize: '0.85rem',
  },
  errorText: {
    display: 'block',
    color: '#dc2626',
    fontSize: '0.8rem',
    marginTop: '0.3rem',
    fontWeight: 500,
  },
};

export default CreateFeatureModal;
