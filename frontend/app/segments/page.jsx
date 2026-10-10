'use client';

import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { fetchSegments, deleteSegment } from '../../lib/api/segments';

export default function SegmentsPage() {
  const { admin, loading, logout } = useAuth();
  const router = useRouter();

  const [segments, setSegments] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, totalPages: 1, totalItems: 0 });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!loading && !admin) router.push('/login');
  }, [admin, loading, router]);

  const loadSegments = useCallback(async (page = 1) => {
    setIsLoading(true);
    setError('');
    try {
      const data = await fetchSegments(page);
      setSegments(data.data);
      setPagination(data.pagination);
    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!loading && admin) loadSegments(1);
  }, [loading, admin, loadSegments]);

  const handleDelete = async (id) => {
    if (!confirm('Are you sure you want to delete this segment?')) return;
    try {
      await deleteSegment(id);
      loadSegments(pagination.page);
    } catch (err) {
      setError(err.message);
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
            <div className="flex items-center gap-3">
              <Link href="/segments/new" className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700">New Segment</Link>
              <button onClick={logout} className="text-sm text-slate-500 hover:text-slate-900">Logout</button>
            </div>
          </div>
        </div>
      </header>

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <h1 className="text-2xl font-bold text-slate-900 mb-6">Contact Segments</h1>
        {error && <div className="bg-red-50 text-red-700 p-4 rounded-lg mb-6">{error}</div>}

        {isLoading ? (
          <div className="text-center text-slate-500 py-12">Loading segments...</div>
        ) : segments.length === 0 ? (
          <div className="text-center py-16 bg-white rounded-xl border border-slate-200">
            <p className="text-slate-500 mb-4">No segments yet.</p>
            <Link href="/segments/new" className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700">Create Your First Segment</Link>
          </div>
        ) : (
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 border-b border-slate-200">
                <tr>
                  <th className="px-6 py-3 text-slate-600 font-medium">Name</th>
                  <th className="px-6 py-3 text-slate-600 font-medium">Description</th>
                  <th className="px-6 py-3 text-slate-600 font-medium">Filters</th>
                  <th className="px-6 py-3 text-slate-600 font-medium">Created</th>
                  <th className="px-6 py-3 text-slate-600 font-medium text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {segments.map(s => (
                  <tr key={s.id} className="hover:bg-slate-50">
                    <td className="px-6 py-4 font-medium text-slate-900">{s.name}</td>
                    <td className="px-6 py-4 text-slate-600">{s.description || '—'}</td>
                    <td className="px-6 py-4 text-slate-500">{s.filters?.length || 0} rule(s)</td>
                    <td className="px-6 py-4 text-slate-500">{new Date(s.createdAt).toLocaleDateString()}</td>
                    <td className="px-6 py-4 text-right">
                      <Link href={`/segments/${s.id}/edit`} className="text-blue-600 hover:text-blue-700 mr-3">Edit</Link>
                      <button onClick={() => handleDelete(s.id)} className="text-red-600 hover:text-red-700">Delete</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </main>
    </div>
  );
}
