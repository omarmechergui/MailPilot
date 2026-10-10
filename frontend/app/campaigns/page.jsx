'use client';

import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { fetchCampaigns, deleteCampaign } from '../../lib/api/campaigns';

export default function CampaignsPage() {
  const { admin, loading, logout } = useAuth();
  const router = useRouter();

  const [campaigns, setCampaigns] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, pageSize: 20, totalPages: 1, totalItems: 0 });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!loading && !admin) {
      router.push('/login');
    }
  }, [admin, loading, router]);

  const loadCampaigns = useCallback(async (page = 1) => {
    setIsLoading(true);
    setError('');
    try {
      const data = await fetchCampaigns(page);
      setCampaigns(data.data);
      setPagination(data.pagination);
    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!loading && admin) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      loadCampaigns(1);
    }
  }, [loading, admin, loadCampaigns]);

  const handleDelete = async (id) => {
    if (!confirm('Are you sure you want to delete this draft?')) return;
    try {
      await deleteCampaign(id);
      loadCampaigns(pagination.page);
    } catch (err) {
      setError(err.message);
    }
  };

  if (loading) return <div className="min-h-screen bg-slate-50 flex items-center justify-center"><div className="text-slate-500">Loading...</div></div>;
  if (!admin) return null;

  const renderStatusBadge = (status) => {
    let colors = 'bg-slate-100 text-slate-700';
    if (status === 'SENDING') colors = 'bg-blue-100 text-blue-700';
    else if (status === 'COMPLETED') colors = 'bg-green-100 text-green-700';
    else if (status === 'COMPLETED_WITH_FAILURES') colors = 'bg-amber-100 text-amber-700';
    else if (status === 'FAILED') colors = 'bg-red-100 text-red-700';
    
    return <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${colors}`}>{status}</span>;
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <header className="bg-white border-b border-slate-200 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center gap-6">
              <Link href="/" className="text-xl font-bold text-slate-900 hover:text-blue-600 transition-colors">MailPilot</Link>
              <nav className="hidden sm:flex items-center gap-4">
                <Link href="/" className="text-sm text-slate-500 hover:text-slate-900 transition-colors">Dashboard</Link>
                <Link href="/campaigns" className="text-sm font-medium text-blue-600">Campaigns</Link>
                <Link href="/templates" className="text-sm text-slate-500 hover:text-slate-900 transition-colors">Templates</Link>
                <Link href="/segments" className="text-sm text-slate-500 hover:text-slate-900 transition-colors">Segments</Link>
                <Link href="/contacts" className="text-sm text-slate-500 hover:text-slate-900 transition-colors">Contacts</Link>
              </nav>
            </div>
            <div className="flex items-center gap-4">
              <span className="text-sm text-slate-500 hidden sm:inline">{admin.email}</span>
              <button onClick={logout} className="text-sm font-medium text-slate-600 hover:text-slate-900 transition-colors">Sign out</button>
            </div>
          </div>
        </div>
      </header>

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold text-slate-900">Campaigns</h1>
          <button onClick={() => router.push('/campaigns/new')} className="px-4 py-2 text-sm font-medium bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
            + Create Draft
          </button>
        </div>

        {error && <div className="bg-red-50 text-red-700 p-4 rounded-lg mb-6">{error}</div>}

        <div className="bg-white rounded-lg shadow-sm border border-slate-200 overflow-hidden">
          {isLoading ? (
            <div className="p-12 text-center text-slate-500">Loading campaigns...</div>
          ) : campaigns.length === 0 ? (
            <div className="p-12 text-center text-slate-500">No campaigns yet.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200">
                    <th className="px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Name</th>
                    <th className="px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Subject</th>
                    <th className="px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Status</th>
                    <th className="px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Recipients</th>
                    <th className="px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Created</th>
                    <th className="px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {campaigns.map((c) => (
                    <tr key={c.id} className="hover:bg-slate-50 transition-colors">
                      <td className="px-4 py-3 text-sm font-medium text-slate-900">{c.name}</td>
                      <td className="px-4 py-3 text-sm text-slate-500 truncate max-w-xs">{c.subject}</td>
                      <td className="px-4 py-3 text-sm">
                        {renderStatusBadge(c.status)}
                      </td>
                      <td className="px-4 py-3 text-sm text-slate-500">{c.totalRecipients || 0}</td>
                      <td className="px-4 py-3 text-sm text-slate-500">{new Date(c.createdAt).toLocaleDateString()}</td>
                      <td className="px-4 py-3 text-sm text-right">
                        <div className="flex justify-end gap-2">
                          {c.status === 'DRAFT' ? (
                            <>
                              <button onClick={() => router.push(`/campaigns/${c.id}/edit`)} className="text-slate-500 hover:text-blue-600 transition-colors">Edit</button>
                              <button onClick={() => handleDelete(c.id)} className="text-slate-500 hover:text-red-600 transition-colors">Delete</button>
                            </>
                          ) : (
                            <button onClick={() => router.push(`/campaigns/${c.id}`)} className="text-slate-500 hover:text-blue-600 transition-colors">View</button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {pagination.totalPages >= 1 && !isLoading && campaigns.length > 0 && (
          <div className="mt-4 flex flex-col sm:flex-row justify-between items-center gap-3 text-sm text-slate-500">
            <div>Page {pagination.page} of {pagination.totalPages}</div>
            <div className="flex gap-2">
              <button disabled={pagination.page <= 1} onClick={() => loadCampaigns(pagination.page - 1)}
                className="px-3 py-1.5 bg-white border border-slate-300 rounded-lg disabled:opacity-40 hover:bg-slate-50 transition-colors disabled:cursor-not-allowed">Previous</button>
              <button disabled={pagination.page >= pagination.totalPages} onClick={() => loadCampaigns(pagination.page + 1)}
                className="px-3 py-1.5 bg-white border border-slate-300 rounded-lg disabled:opacity-40 hover:bg-slate-50 transition-colors disabled:cursor-not-allowed">Next</button>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
