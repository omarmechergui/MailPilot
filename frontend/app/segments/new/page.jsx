'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { createSegment, previewSegment } from '../../../lib/api/segments';

const FILTER_FIELDS = [
  { value: 'email', label: 'Email' },
  { value: 'name', label: 'Name' },
  { value: 'status', label: 'Status' },
  { value: 'isSubscribed', label: 'Subscribed' },
  { value: 'source', label: 'Source' },
];

const FILTER_OPERATORS = [
  { value: 'equals', label: 'Equals' },
  { value: 'notEquals', label: 'Not Equals' },
  { value: 'contains', label: 'Contains' },
  { value: 'startsWith', label: 'Starts With' },
  { value: 'endsWith', label: 'Ends With' },
];

const emptyRule = () => ({ field: 'email', operator: 'contains', value: '' });

export default function NewSegmentPage() {
  const { admin, loading } = useAuth();
  const router = useRouter();

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [filters, setFilters] = useState([emptyRule()]);
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [previewCount, setPreviewCount] = useState(null);
  const [previewing, setPreviewing] = useState(false);

  useEffect(() => {
    if (!loading && !admin) router.push('/login');
  }, [admin, loading, router]);

  const updateRule = (index, key, val) => {
    const updated = [...filters];
    updated[index] = { ...updated[index], [key]: val };
    setFilters(updated);
    setPreviewCount(null);
  };

  const addRule = () => {
    if (filters.length >= 10) return;
    setFilters([...filters, emptyRule()]);
  };

  const removeRule = (index) => {
    if (filters.length <= 1) return;
    setFilters(filters.filter((_, i) => i !== index));
    setPreviewCount(null);
  };

  const handlePreview = async () => {
    setPreviewing(true);
    setError('');
    try {
      const res = await previewSegment({ name: name || 'Preview', filters });
      setPreviewCount(res.data.matchingContacts);
    } catch (err) {
      setError(err.message);
    } finally {
      setPreviewing(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSubmitting(true);
    try {
      await createSegment({ name, description, filters });
      router.push('/segments');
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading || !admin) return null;

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <header className="bg-white border-b border-slate-200 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center gap-6">
              <Link href="/" className="text-xl font-bold text-slate-900">MailPilot</Link>
              <nav className="hidden sm:flex items-center gap-4">
                <Link href="/" className="text-sm text-slate-500 hover:text-slate-900 transition-colors">Dashboard</Link>
                <Link href="/campaigns" className="text-sm text-slate-500 hover:text-slate-900 transition-colors">Campaigns</Link>
                <Link href="/templates" className="text-sm text-slate-500 hover:text-slate-900 transition-colors">Templates</Link>
                <Link href="/segments" className="text-sm font-medium text-blue-600">Segments</Link>
                <Link href="/contacts" className="text-sm text-slate-500 hover:text-slate-900 transition-colors">Contacts</Link>
              </nav>
            </div>
          </div>
        </div>
      </header>

      <main className="flex-1 max-w-5xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
          <h1 className="text-2xl font-bold text-slate-900 mb-6">Create Contact Segment</h1>
          {error && <div className="bg-red-50 text-red-700 p-4 rounded-lg mb-6">{error}</div>}

          <form onSubmit={handleSubmit}>
            <div className="grid gap-6 mb-6">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Segment Name *</label>
                <input type="text" required maxLength={100} value={name} onChange={e => setName(e.target.value)}
                  className="w-full border border-slate-300 rounded-lg px-3 py-2 outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500" />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Description</label>
                <input type="text" maxLength={500} value={description} onChange={e => setDescription(e.target.value)}
                  className="w-full border border-slate-300 rounded-lg px-3 py-2 outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500" placeholder="Optional description" />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-3">Filter Rules</label>
                <div className="space-y-3">
                  {filters.map((rule, i) => (
                    <div key={i} className="flex items-center gap-2 p-3 bg-slate-50 border border-slate-200 rounded-lg">
                      <select value={rule.field} onChange={e => updateRule(i, 'field', e.target.value)}
                        className="border border-slate-300 rounded px-2 py-1.5 text-sm bg-white">
                        {FILTER_FIELDS.map(f => <option key={f.value} value={f.value}>{f.label}</option>)}
                      </select>
                      <select value={rule.operator} onChange={e => updateRule(i, 'operator', e.target.value)}
                        className="border border-slate-300 rounded px-2 py-1.5 text-sm bg-white">
                        {FILTER_OPERATORS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                      </select>
                      <input type="text" value={String(rule.value)} onChange={e => updateRule(i, 'value', e.target.value)}
                        className="flex-1 border border-slate-300 rounded px-2 py-1.5 text-sm outline-none focus:border-blue-500" placeholder="Value" />
                      {filters.length > 1 && (
                        <button type="button" onClick={() => removeRule(i)} className="text-red-500 hover:text-red-700 px-2">&times;</button>
                      )}
                    </div>
                  ))}
                </div>
                {filters.length < 10 && (
                  <button type="button" onClick={addRule} className="mt-2 text-sm text-blue-600 hover:text-blue-700">+ Add Rule</button>
                )}
              </div>
            </div>

            <div className="flex items-center gap-4 mb-6 p-4 bg-slate-50 border border-slate-200 rounded-lg">
              <button type="button" onClick={handlePreview} disabled={previewing || filters.some(f => !f.value)}
                className="px-4 py-2 text-sm font-medium bg-slate-700 text-white rounded-lg hover:bg-slate-800 disabled:opacity-50">
                {previewing ? 'Counting...' : 'Preview Matching Contacts'}
              </button>
              {previewCount !== null && (
                <span className="text-sm text-slate-700">
                  <strong>{previewCount}</strong> eligible contact{previewCount !== 1 ? 's' : ''} match this segment.
                </span>
              )}
            </div>

            <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
              <button type="button" onClick={() => router.push('/segments')} className="px-4 py-2 text-sm text-slate-600 hover:bg-slate-100 rounded-lg transition-colors">Cancel</button>
              <button type="submit" disabled={submitting} className="px-4 py-2 text-sm font-medium bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50">
                {submitting ? 'Saving...' : 'Save Segment'}
              </button>
            </div>
          </form>
        </div>
      </main>
    </div>
  );
}
