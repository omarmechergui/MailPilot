'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { createCampaign } from '../../../lib/api/campaigns';

export default function NewCampaignPage() {
  const { admin, loading } = useAuth();
  const router = useRouter();

  const [formData, setFormData] = useState({ name: '', subject: '', htmlContent: '', textContent: '' });
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [isPreview, setIsPreview] = useState(false);

  useEffect(() => {
    if (!loading && !admin) {
      router.push('/login');
    }
  }, [admin, loading, router]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSubmitting(true);
    try {
      await createCampaign(formData);
      router.push('/campaigns');
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return null;
  if (!admin) return null;

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <header className="bg-white border-b border-slate-200 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center gap-6">
              <Link href="/" className="text-xl font-bold text-slate-900">MailPilot</Link>
              <nav className="hidden sm:flex items-center gap-4">
                <Link href="/" className="text-sm text-slate-500 hover:text-slate-900 transition-colors">Dashboard</Link>
                <Link href="/campaigns" className="text-sm font-medium text-blue-600">Campaigns</Link>
                <Link href="/templates" className="text-sm text-slate-500 hover:text-slate-900 transition-colors">Templates</Link>
                <Link href="/segments" className="text-sm text-slate-500 hover:text-slate-900 transition-colors">Segments</Link>
                <Link href="/contacts" className="text-sm text-slate-500 hover:text-slate-900 transition-colors">Contacts</Link>
              </nav>
            </div>
          </div>
        </div>
      </header>

      <main className="flex-1 max-w-5xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
          <h1 className="text-2xl font-bold text-slate-900 mb-6">Create Campaign Draft</h1>
          {error && <div className="bg-red-50 text-red-700 p-4 rounded-lg mb-6">{error}</div>}

          <div className="flex gap-4 mb-6">
            <button onClick={() => setIsPreview(false)} className={`px-4 py-2 text-sm font-medium rounded-lg ${!isPreview ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}>Editor</button>
            <button onClick={() => setIsPreview(true)} className={`px-4 py-2 text-sm font-medium rounded-lg ${isPreview ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}>Preview</button>
          </div>

          {!isPreview ? (
            <form onSubmit={handleSubmit}>
              <div className="grid gap-6 mb-6">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Campaign Name *</label>
                  <input type="text" required maxLength={100} value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})}
                    className="w-full border border-slate-300 rounded-lg px-3 py-2 outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Subject Line *</label>
                  <input type="text" required maxLength={200} value={formData.subject} onChange={e => setFormData({...formData, subject: e.target.value})}
                    className="w-full border border-slate-300 rounded-lg px-3 py-2 outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">HTML Content</label>
                  <textarea rows={8} value={formData.htmlContent} onChange={e => setFormData({...formData, htmlContent: e.target.value})}
                    className="w-full border border-slate-300 rounded-lg px-3 py-2 outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 font-mono text-sm" placeholder="<p>Hello world</p>" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Plain Text Content</label>
                  <textarea rows={6} value={formData.textContent} onChange={e => setFormData({...formData, textContent: e.target.value})}
                    className="w-full border border-slate-300 rounded-lg px-3 py-2 outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 font-mono text-sm" placeholder="Leave empty to auto-generate from HTML" />
                  <p className="text-xs text-slate-500 mt-1">If left empty, text content will be automatically generated from HTML as a basic fallback.</p>
                </div>
              </div>
              <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
                <button type="button" onClick={() => router.push('/campaigns')} className="px-4 py-2 text-sm text-slate-600 hover:bg-slate-100 rounded-lg transition-colors">Cancel</button>
                <button type="submit" disabled={submitting} className="px-4 py-2 text-sm font-medium bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50">
                  {submitting ? 'Saving...' : 'Save Draft'}
                </button>
              </div>
            </form>
          ) : (
            <div className="space-y-6">
              <div className="border border-slate-200 rounded-lg p-4 bg-slate-50">
                <div className="text-sm text-slate-500 mb-1">Subject</div>
                <div className="font-medium text-slate-900">{formData.subject || 'No subject'}</div>
              </div>
              <div className="border border-slate-200 rounded-lg overflow-hidden">
                <div className="bg-slate-100 px-4 py-2 border-b border-slate-200 text-sm font-medium text-slate-700">HTML Preview</div>
                <div className="p-4 bg-white min-h-[200px]">
                  <iframe
                    title="Campaign HTML Preview"
                    srcDoc={formData.htmlContent || '<span style="color:#94a3b8">No HTML content</span>'}
                    sandbox=""
                    className="w-full min-h-[200px] border-0"
                  />
                </div>
              </div>
              <div className="border border-slate-200 rounded-lg overflow-hidden">
                <div className="bg-slate-100 px-4 py-2 border-b border-slate-200 text-sm font-medium text-slate-700">Plain Text Preview (Manual)</div>
                <div className="p-4 bg-white min-h-[100px] whitespace-pre-wrap font-mono text-sm">
                  {formData.textContent || 'No manual text provided. Will be auto-generated on save.'}
                </div>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
