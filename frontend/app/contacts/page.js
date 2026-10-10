'use client';

import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function ContactsPage() {
  const { admin, loading, logout } = useAuth();
  const router = useRouter();

  // Data state
  const [contacts, setContacts] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, pageSize: 20, totalPages: 1, totalItems: 0 });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  // Filter state
  const [search, setSearch] = useState('');
  const [searchInput, setSearchInput] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [subscriptionFilter, setSubscriptionFilter] = useState('');
  const [archivedFilter, setArchivedFilter] = useState('false');

  // Modal state
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [editingContact, setEditingContact] = useState(null);
  const [formData, setFormData] = useState({ email: '', name: '' });
  const [formError, setFormError] = useState('');
  const [formSubmitting, setFormSubmitting] = useState(false);

  // Import state
  const [importFile, setImportFile] = useState(null);
  const [importReport, setImportReport] = useState(null);
  const [importLoading, setImportLoading] = useState(false);

  // Redirect unauthenticated users
  useEffect(() => {
    if (!loading && !admin) {
      router.push('/login');
    }
  }, [admin, loading, router]);

  // Build query string from current filters
  const buildQuery = useCallback((page = 1) => {
    const params = new URLSearchParams();
    params.set('page', String(page));
    if (search) params.set('search', search);
    if (statusFilter) params.set('status', statusFilter);
    if (subscriptionFilter) params.set('subscription', subscriptionFilter);
    params.set('archived', archivedFilter);
    return params.toString();
  }, [search, statusFilter, subscriptionFilter, archivedFilter]);

  // Fetch contacts with current filters
  const fetchContacts = useCallback(async (page = 1) => {
    setIsLoading(true);
    setError('');
    try {
      const res = await fetch(`/api/v1/contacts?${buildQuery(page)}`);
      if (res.status === 401) {
        router.push('/login');
        return;
      }
      if (!res.ok) throw new Error('Failed to load contacts');
      const json = await res.json();
      setContacts(json.data);
      setPagination(json.pagination);
    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  }, [buildQuery, router]);

  // Load contacts when auth resolves or filters change
  useEffect(() => {
    if (!loading && admin) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      fetchContacts(1);
    }
  }, [loading, admin, fetchContacts]);

  // --- Actions ---
  const handleSearch = (e) => {
    e.preventDefault();
    setSearch(searchInput);
  };

  const clearFilters = () => {
    setSearchInput('');
    setSearch('');
    setStatusFilter('');
    setSubscriptionFilter('');
    setArchivedFilter('false');
  };

  const goToPage = (page) => {
    fetchContacts(page);
  };

  const openAddModal = () => {
    setFormData({ email: '', name: '' });
    setFormError('');
    setIsAddModalOpen(true);
  };

  const openEditModal = (contact) => {
    setEditingContact(contact);
    setFormData({ email: contact.email, name: contact.name || '' });
    setFormError('');
    setIsEditModalOpen(true);
  };

  const handleAddContact = async (e) => {
    e.preventDefault();
    setFormError('');
    setFormSubmitting(true);
    try {
      const res = await fetch('/api/v1/contacts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: formData.email, name: formData.name || undefined }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error?.message || 'Failed to create contact');
      setIsAddModalOpen(false);
      fetchContacts(1);
    } catch (err) {
      setFormError(err.message);
    } finally {
      setFormSubmitting(false);
    }
  };

  const handleEditContact = async (e) => {
    e.preventDefault();
    if (!editingContact) return;
    setFormError('');
    setFormSubmitting(true);
    try {
      const body = {};
      if (formData.email !== editingContact.email) body.email = formData.email;
      if ((formData.name || '') !== (editingContact.name || '')) body.name = formData.name || null;

      if (Object.keys(body).length === 0) {
        setIsEditModalOpen(false);
        return;
      }

      const res = await fetch(`/api/v1/contacts/${editingContact.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error?.message || 'Failed to update contact');
      setIsEditModalOpen(false);
      setEditingContact(null);
      fetchContacts(pagination.page);
    } catch (err) {
      setFormError(err.message);
    } finally {
      setFormSubmitting(false);
    }
  };

  const toggleSubscription = async (id, currentStatus) => {
    try {
      const res = await fetch(`/api/v1/contacts/${id}/subscription`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isSubscribed: !currentStatus }),
      });
      if (!res.ok) {
        const json = await res.json();
        throw new Error(json.error?.message || 'Failed to update subscription');
      }
      fetchContacts(pagination.page);
    } catch (err) {
      setError(err.message);
    }
  };

  const archiveContact = async (id) => {
    if (!confirm('Are you sure you want to archive this contact?')) return;
    try {
      const res = await fetch(`/api/v1/contacts/${id}/archive`, { method: 'POST' });
      if (!res.ok) {
        const json = await res.json();
        throw new Error(json.error?.message || 'Failed to archive');
      }
      fetchContacts(pagination.page);
    } catch (err) {
      setError(err.message);
    }
  };

  const restoreContact = async (id) => {
    try {
      const res = await fetch(`/api/v1/contacts/${id}/restore`, { method: 'POST' });
      if (!res.ok) {
        const json = await res.json();
        throw new Error(json.error?.message || 'Failed to restore');
      }
      fetchContacts(pagination.page);
    } catch (err) {
      setError(err.message);
    }
  };

  const handleImport = async (e) => {
    e.preventDefault();
    if (!importFile) return;
    setImportLoading(true);
    setImportReport(null);
    setFormError('');

    try {
      const fd = new FormData();
      fd.append('file', importFile);

      const res = await fetch('/api/v1/contacts/import', {
        method: 'POST',
        body: fd,
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error?.message || 'Import failed');
      setImportReport(json.data);
      fetchContacts(1);
    } catch (err) {
      setFormError(err.message);
    } finally {
      setImportLoading(false);
    }
  };

  const closeImportModal = () => {
    setIsImportModalOpen(false);
    setImportReport(null);
    setImportFile(null);
    setFormError('');
  };

  // --- Render ---
  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-slate-500">Loading MailPilot...</div>
      </div>
    );
  }
  if (!admin) return null;

  const hasActiveFilters = search || statusFilter || subscriptionFilter || archivedFilter === 'true';

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center gap-6">
              <Link href="/" className="text-xl font-bold text-slate-900 hover:text-blue-600 transition-colors">MailPilot</Link>
              <nav className="hidden sm:flex items-center gap-4">
                <Link href="/" className="text-sm text-slate-500 hover:text-slate-900 transition-colors">Dashboard</Link>
                <Link href="/campaigns" className="text-sm text-slate-500 hover:text-slate-900 transition-colors">Campaigns</Link>
                <Link href="/templates" className="text-sm text-slate-500 hover:text-slate-900 transition-colors">Templates</Link>
                <Link href="/segments" className="text-sm text-slate-500 hover:text-slate-900 transition-colors">Segments</Link>
                <Link href="/contacts" className="text-sm font-medium text-blue-600">Contacts</Link>
              </nav>
            </div>
            <div className="flex items-center gap-4">
              <span className="text-sm text-slate-500 hidden sm:inline">{admin.email}</span>
              <button onClick={logout} className="text-sm font-medium text-slate-600 hover:text-slate-900 transition-colors">
                Sign out
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Title row */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
          <h1 className="text-2xl font-bold text-slate-900">Contacts</h1>
          <div className="flex gap-3">
            <button onClick={() => { setFormError(''); setImportFile(null); setImportReport(null); setIsImportModalOpen(true); }}
              className="px-4 py-2 text-sm font-medium bg-white border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 transition-colors">
              Import CSV
            </button>
            <button onClick={openAddModal}
              className="px-4 py-2 text-sm font-medium bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
              + Add Contact
            </button>
          </div>
        </div>

        {/* Search & Filters */}
        <div className="bg-white rounded-lg border border-slate-200 p-4 mb-6">
          <div className="flex flex-col sm:flex-row gap-3">
            <form onSubmit={handleSearch} className="flex-1 flex gap-2">
              <input type="text" placeholder="Search by name or email..."
                value={searchInput} onChange={(e) => setSearchInput(e.target.value)}
                className="flex-1 border border-slate-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                aria-label="Search contacts"
              />
              <button type="submit" className="px-4 py-2 text-sm font-medium bg-slate-100 text-slate-700 rounded-lg hover:bg-slate-200 transition-colors">
                Search
              </button>
            </form>
            <div className="flex gap-2 flex-wrap">
              <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}
                className="border border-slate-300 rounded-lg px-3 py-2 text-sm bg-white focus:ring-2 focus:ring-blue-500 outline-none"
                aria-label="Filter by status">
                <option value="">All Statuses</option>
                <option value="ACTIVE">Active</option>
                <option value="INVALID">Invalid</option>
                <option value="BLOCKED">Blocked</option>
              </select>
              <select value={subscriptionFilter} onChange={(e) => setSubscriptionFilter(e.target.value)}
                className="border border-slate-300 rounded-lg px-3 py-2 text-sm bg-white focus:ring-2 focus:ring-blue-500 outline-none"
                aria-label="Filter by subscription">
                <option value="">All Subscriptions</option>
                <option value="subscribed">Subscribed</option>
                <option value="unsubscribed">Unsubscribed</option>
              </select>
              <select value={archivedFilter} onChange={(e) => setArchivedFilter(e.target.value)}
                className="border border-slate-300 rounded-lg px-3 py-2 text-sm bg-white focus:ring-2 focus:ring-blue-500 outline-none"
                aria-label="Filter archived">
                <option value="false">Active Only</option>
                <option value="true">Archived Only</option>
              </select>
              {hasActiveFilters && (
                <button onClick={clearFilters}
                  className="px-3 py-2 text-sm text-red-600 hover:bg-red-50 rounded-lg transition-colors">
                  Clear
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Error bar */}
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-lg mb-6 flex justify-between items-center">
            <span>{error}</span>
            <button onClick={() => fetchContacts(pagination.page)}
              className="text-sm font-medium text-red-600 hover:text-red-800 underline">
              Retry
            </button>
          </div>
        )}

        {/* Content */}
        <div className="bg-white rounded-lg shadow-sm border border-slate-200 overflow-hidden">
          {isLoading ? (
            <div className="p-12 text-center text-slate-500">Loading contacts...</div>
          ) : contacts.length === 0 ? (
            <div className="p-12 text-center">
              <p className="text-slate-500 text-lg mb-1">
                {hasActiveFilters ? 'No contacts match your filters.' : 'No contacts yet.'}
              </p>
              <p className="text-slate-400 text-sm">
                {hasActiveFilters
                  ? 'Try adjusting your search or filters.'
                  : 'Add a contact or import a CSV file to get started.'}
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200">
                    <th className="px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Email</th>
                    <th className="px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Name</th>
                    <th className="px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Status</th>
                    <th className="px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Subscription</th>
                    <th className="px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {contacts.map((c) => (
                    <tr key={c.id} className="hover:bg-slate-50 transition-colors">
                      <td className="px-4 py-3 text-sm font-medium text-slate-900">{c.email}</td>
                      <td className="px-4 py-3 text-sm text-slate-500">{c.name || '—'}</td>
                      <td className="px-4 py-3 text-sm">
                        <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${
                          c.status === 'ACTIVE' ? 'bg-green-100 text-green-700' :
                          c.status === 'BLOCKED' ? 'bg-red-100 text-red-700' :
                          'bg-yellow-100 text-yellow-700'
                        }`}>
                          {c.status}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-sm">
                        <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${
                          c.isSubscribed ? 'bg-blue-100 text-blue-700' : 'bg-slate-100 text-slate-500'
                        }`}>
                          {c.isSubscribed ? 'Subscribed' : 'Unsubscribed'}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-sm text-right">
                        <div className="flex justify-end gap-2">
                          <button onClick={() => openEditModal(c)}
                            className="text-slate-500 hover:text-blue-600 transition-colors" title="Edit">
                            Edit
                          </button>
                          <button onClick={() => toggleSubscription(c.id, c.isSubscribed)}
                            className="text-slate-500 hover:text-blue-600 transition-colors"
                            title={c.isSubscribed ? 'Unsubscribe' : 'Subscribe'}>
                            {c.isSubscribed ? 'Unsub' : 'Sub'}
                          </button>
                          {c.archivedAt ? (
                            <button onClick={() => restoreContact(c.id)}
                              className="text-slate-500 hover:text-green-600 transition-colors" title="Restore">
                              Restore
                            </button>
                          ) : (
                            <button onClick={() => archiveContact(c.id)}
                              className="text-slate-500 hover:text-red-600 transition-colors" title="Archive">
                              Archive
                            </button>
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

        {/* Pagination */}
        {pagination.totalPages >= 1 && !isLoading && contacts.length > 0 && (
          <div className="mt-4 flex flex-col sm:flex-row justify-between items-center gap-3 text-sm text-slate-500">
            <div>
              Page {pagination.page} of {pagination.totalPages} · {pagination.totalItems} contact{pagination.totalItems !== 1 ? 's' : ''} total
            </div>
            <div className="flex gap-2">
              <button disabled={pagination.page <= 1} onClick={() => goToPage(pagination.page - 1)}
                className="px-3 py-1.5 bg-white border border-slate-300 rounded-lg disabled:opacity-40 hover:bg-slate-50 transition-colors disabled:cursor-not-allowed">
                Previous
              </button>
              <button disabled={pagination.page >= pagination.totalPages} onClick={() => goToPage(pagination.page + 1)}
                className="px-3 py-1.5 bg-white border border-slate-300 rounded-lg disabled:opacity-40 hover:bg-slate-50 transition-colors disabled:cursor-not-allowed">
                Next
              </button>
            </div>
          </div>
        )}
      </main>

      {/* ---- Add Contact Modal ---- */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4" onClick={() => setIsAddModalOpen(false)}>
          <div className="bg-white rounded-xl max-w-md w-full p-6 shadow-xl" onClick={(e) => e.stopPropagation()}>
            <h2 className="text-lg font-bold text-slate-900 mb-4">Add Contact</h2>
            {formError && <div className="text-red-600 text-sm bg-red-50 p-3 rounded-lg mb-4">{formError}</div>}
            <form onSubmit={handleAddContact}>
              <div className="mb-4">
                <label htmlFor="add-email" className="block text-sm font-medium text-slate-700 mb-1">Email *</label>
                <input id="add-email" type="email" required
                  value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                  placeholder="name@example.com" autoFocus
                />
              </div>
              <div className="mb-6">
                <label htmlFor="add-name" className="block text-sm font-medium text-slate-700 mb-1">Name</label>
                <input id="add-name" type="text"
                  value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                  placeholder="John Doe"
                />
              </div>
              <div className="flex justify-end gap-3">
                <button type="button" onClick={() => setIsAddModalOpen(false)}
                  className="px-4 py-2 text-sm text-slate-600 hover:bg-slate-100 rounded-lg transition-colors">Cancel</button>
                <button type="submit" disabled={formSubmitting}
                  className="px-4 py-2 text-sm font-medium bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors">
                  {formSubmitting ? 'Saving...' : 'Save Contact'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ---- Edit Contact Modal ---- */}
      {isEditModalOpen && editingContact && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4" onClick={() => setIsEditModalOpen(false)}>
          <div className="bg-white rounded-xl max-w-md w-full p-6 shadow-xl" onClick={(e) => e.stopPropagation()}>
            <h2 className="text-lg font-bold text-slate-900 mb-4">Edit Contact</h2>
            {formError && <div className="text-red-600 text-sm bg-red-50 p-3 rounded-lg mb-4">{formError}</div>}
            <form onSubmit={handleEditContact}>
              <div className="mb-4">
                <label htmlFor="edit-email" className="block text-sm font-medium text-slate-700 mb-1">Email *</label>
                <input id="edit-email" type="email" required
                  value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                  autoFocus
                />
              </div>
              <div className="mb-6">
                <label htmlFor="edit-name" className="block text-sm font-medium text-slate-700 mb-1">Name</label>
                <input id="edit-name" type="text"
                  value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                />
              </div>
              <div className="flex justify-end gap-3">
                <button type="button" onClick={() => setIsEditModalOpen(false)}
                  className="px-4 py-2 text-sm text-slate-600 hover:bg-slate-100 rounded-lg transition-colors">Cancel</button>
                <button type="submit" disabled={formSubmitting}
                  className="px-4 py-2 text-sm font-medium bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors">
                  {formSubmitting ? 'Saving...' : 'Update Contact'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ---- Import Modal ---- */}
      {isImportModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4" onClick={closeImportModal}>
          <div className="bg-white rounded-xl max-w-lg w-full p-6 shadow-xl" onClick={(e) => e.stopPropagation()}>
            <h2 className="text-lg font-bold text-slate-900 mb-4">Import Contacts</h2>
            {formError && <div className="text-red-600 text-sm bg-red-50 p-3 rounded-lg mb-4">{formError}</div>}

            {importReport ? (
              <div>
                <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-4">
                  <p className="font-semibold text-green-800 mb-2">Import Complete</p>
                  <dl className="grid grid-cols-2 gap-x-4 gap-y-1 text-sm text-green-700">
                    <dt>Total rows</dt><dd className="font-medium">{importReport.totalRows}</dd>
                    <dt>Accepted</dt><dd className="font-medium">{importReport.accepted}</dd>
                    <dt>Duplicates</dt><dd className="font-medium">{importReport.duplicates}</dd>
                    <dt>Invalid</dt><dd className="font-medium">{importReport.invalid}</dd>
                    <dt>Rejected</dt><dd className="font-medium">{importReport.rejected}</dd>
                  </dl>
                </div>
                {importReport.errors && importReport.errors.length > 0 && (
                  <details className="mb-4">
                    <summary className="text-sm text-slate-600 cursor-pointer hover:text-slate-900">
                      View {importReport.errors.length} issue{importReport.errors.length !== 1 ? 's' : ''}
                    </summary>
                    <ul className="mt-2 text-xs text-slate-500 max-h-40 overflow-y-auto space-y-1">
                      {importReport.errors.map((err, i) => (
                        <li key={i} className="bg-slate-50 px-2 py-1 rounded">
                          Row {err.row}: {err.reason}
                        </li>
                      ))}
                    </ul>
                  </details>
                )}
                <button onClick={closeImportModal}
                  className="w-full px-4 py-2 text-sm font-medium bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
                  Close
                </button>
              </div>
            ) : (
              <form onSubmit={handleImport}>
                <div className="mb-6">
                  <label htmlFor="csv-file" className="block text-sm font-medium text-slate-700 mb-1">CSV File</label>
                  <input id="csv-file" type="file" accept=".csv" required
                    onChange={(e) => setImportFile(e.target.files[0])}
                    className="w-full text-sm text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                  />
                  <p className="text-xs text-slate-400 mt-2">
                    Must include an &quot;email&quot; column. Optional &quot;name&quot; column.{' '}
                    <a href="/api/v1/contacts/import-template" className="text-blue-600 hover:underline">
                      Download template
                    </a>.
                  </p>
                </div>
                <div className="flex justify-end gap-3">
                  <button type="button" onClick={closeImportModal}
                    className="px-4 py-2 text-sm text-slate-600 hover:bg-slate-100 rounded-lg transition-colors">Cancel</button>
                  <button type="submit" disabled={importLoading || !importFile}
                    className="px-4 py-2 text-sm font-medium bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors">
                    {importLoading ? 'Importing...' : 'Upload & Import'}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
