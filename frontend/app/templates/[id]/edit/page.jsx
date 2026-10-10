'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { getTemplate, updateTemplate } from '../../../../lib/api/templates';
import { useAuth } from '../../../context/AuthContext';

export default function EditTemplatePage() {
  const params = useParams();
  const id = params?.id;
  const { admin, loading } = useAuth();
  const router = useRouter();

  const [formData, setFormData] = useState({ name: '', subject: '', htmlContent: '', textContent: '' });
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [fetching, setFetching] = useState(true);
  const [isPreview, setIsPreview] = useState(false);

  useEffect(() => {
    if (!loading && !admin) router.push('/login');
  }, [admin, loading, router]);

  useEffect(() => {
    if (admin && id) {
      getTemplate(id).then(data => {
        const t = data.data;
        setFormData({ name: t.name, subject: t.subject, htmlContent: t.htmlContent || '', textContent: t.textContent || '' });
        setFetching(false);
      }).catch(err => {
        setError(err.message);
        setFetching(false);
      });
    }
  }, [admin, id]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSubmitting(true);
    try {
      await updateTemplate(id, formData);
      router.push('/templates');
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading || fetching) return null;
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
                <Link href="/campaigns" className="text-sm text-slate-500 hover:text-slate-900 transition-colors">Campaigns</Link>
                <Link href="/templates" className="text-sm font-medium text-blue-600">Templates</Link>
                <Link href="/segments" className="text-sm text-slate-500 hover:text-slate-900 transition-colors">Segments</Link>
                <Link href="/contacts" className="text-sm text-slate-500 hover:text-slate-900 transition-colors">Contacts</Link>
              </nav>
            </div>
          </div>
        </div>
      </header>

      <main className="flex-1 max-w-5xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
          <h1 className="text-2xl font-bold text-slate-900 mb-6">Edit Template</h1>
          {error && <div className="bg-red-50 text-red-700 p-4 rounded-lg mb-6">{error}</div>}

          <div className="flex gap-4 mb-6">
            <button onClick={() => setIsPreview(false)} className={`px-4 py-2 text-sm font-medium rounded-lg ${!isPreview ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}>Editor</button>
            <button onClick={() => setIsPreview(true)} className={`px-4 py-2 text-sm font-medium rounded-lg ${isPreview ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}>Preview</button>
          </div>

          {!isPreview ? (
            <form onSubmit={handleSubmit}>
              <div className="grid gap-6 mb-6">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Template Name *</label>
                  <input type="text" required maxLength={100} value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})}
                    className="w-full border border-slate-300 rounded-lg px-3 py-2 outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Default Subject *</label>
                  <input type="text" required maxLength={200} value={formData.subject} onChange={e => setFormData({...formData, subject: e.target.value})}
                    className="w-full border border-slate-300 rounded-lg px-3 py-2 outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">HTML Content</label>
                  <textarea rows={8} value={formData.htmlContent} onChange={e => setFormData({...formData, htmlContent: e.target.value})}
                    className="w-full border border-slate-300 rounded-lg px-3 py-2 outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 font-mono text-sm" placeholder="<p>Hello {{name}}</p>" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Plain Text Content</label>
                  <textarea rows={6} value={formData.textContent} onChange={e => setFormData({...formData, textContent: e.target.value})}
                    className="w-full border border-slate-300 rounded-lg px-3 py-2 outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 font-mono text-sm" placeholder="Leave empty to auto-generate from HTML" />
                </div>
              </div>
              <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
                <button type="button" onClick={() => router.push('/templates')} className="px-4 py-2 text-sm text-slate-600 hover:bg-slate-100 rounded-lg transition-colors">Cancel</button>
                <button type="submit" disabled={submitting} className="px-4 py-2 text-sm font-medium bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50">
                  {submitting ? 'Saving...' : 'Update Template'}
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
                <iframe
                  title="Template Preview"
                  srcDoc={formData.htmlContent || '<span style="color:#94a3b8">No HTML content</span>'}
                  sandbox=""
                  className="w-full min-h-[200px] border-0 bg-white"
                />
              </div>
              <div className="border border-slate-200 rounded-lg overflow-hidden">
                <div className="bg-slate-100 px-4 py-2 border-b border-slate-200 text-sm font-medium text-slate-700">Plain Text Preview</div>
                <div className="p-4 bg-white min-h-[100px] whitespace-pre-wrap font-mono text-sm">
                  {formData.textContent || 'No text content.'}
                </div>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
