import { useEffect, useState } from 'react';
import Head from 'next/head';
import { useRouter } from 'next/router';
import Layout from '../components/Layout';
import { useAuth } from '../services/useAuth';
import { contactAPI } from '../services/api';

export default function ContactsPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const [groups, setGroups] = useState([]);
  const [contacts, setContacts] = useState([]);
  const [selectedGroup, setSelectedGroup] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Modals
  const [showGroupModal, setShowGroupModal] = useState(false);
  const [showContactModal, setShowContactModal] = useState(false);
  const [editingGroup, setEditingGroup] = useState(null);
  const [editingContact, setEditingContact] = useState(null);
  const [groupForm, setGroupForm] = useState({ name: '' });
  const [contactForm, setContactForm] = useState({ name: '', mobile: '', group_id: '' });
  const [importing, setImporting] = useState(false);
  const [exporting, setExporting] = useState(false);

  useEffect(() => {
    if (!authLoading && !user) router.push('/login');
  }, [user, authLoading]);

  useEffect(() => {
    if (!user) return;
    fetchGroups();
  }, [user]);

  useEffect(() => {
    if (!user) return;
    fetchContacts(selectedGroup?.id);
  }, [user, selectedGroup?.id]);

  const fetchGroups = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await contactAPI.getGroups();
      if (res.data.success) setGroups(res.data.groups || []);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load groups');
    } finally {
      setLoading(false);
    }
  };

  const fetchContacts = async (groupId) => {
    setLoading(true);
    setError('');
    try {
      const res = await contactAPI.getContacts(groupId);
      if (res.data.success) setContacts(res.data.contacts || []);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load contacts');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateGroup = () => {
    setEditingGroup(null);
    setGroupForm({ name: '' });
    setShowGroupModal(true);
  };

  const handleEditGroup = (g) => {
    setEditingGroup(g);
    setGroupForm({ name: g.name });
    setShowGroupModal(true);
  };

  const handleSaveGroup = async (e) => {
    e?.preventDefault();
    if (!groupForm.name.trim()) return;
    setError('');
    try {
      if (editingGroup) {
        await contactAPI.updateGroup(editingGroup.id, { name: groupForm.name.trim() });
        setSuccess('Group updated');
      } else {
        await contactAPI.createGroup({ name: groupForm.name.trim() });
        setSuccess('Group created');
      }
      setShowGroupModal(false);
      fetchGroups();
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to save group');
    }
  };

  const handleDeleteGroup = async (g) => {
    if (!confirm(`Delete group "${g.name}" and all its contacts?`)) return;
    setError('');
    try {
      await contactAPI.deleteGroup(g.id);
      setSuccess('Group deleted');
      if (selectedGroup?.id === g.id) setSelectedGroup(null);
      fetchGroups();
      fetchContacts(null);
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to delete group');
    }
  };

  const handleAddContact = () => {
    if (!selectedGroup) {
      setError('Select a group first');
      return;
    }
    setEditingContact(null);
    setContactForm({ name: '', mobile: '', group_id: String(selectedGroup.id) });
    setShowContactModal(true);
  };

  const handleEditContact = (c) => {
    setEditingContact(c);
    setContactForm({ name: c.name, mobile: c.mobile, group_id: c.group_id });
    setShowContactModal(true);
  };

  const handleSaveContact = async (e) => {
    e?.preventDefault();
    if (!contactForm.name.trim() || !contactForm.mobile.trim()) return;
    setError('');
    try {
      if (editingContact) {
        await contactAPI.updateContact(editingContact.id, {
          name: contactForm.name.trim(),
          mobile: contactForm.mobile.trim(),
          group_id: contactForm.group_id,
        });
        setSuccess('Contact updated');
      } else {
        await contactAPI.createContact({
          group_id: contactForm.group_id || selectedGroup?.id,
          name: contactForm.name.trim(),
          mobile: contactForm.mobile.trim(),
        });
        setSuccess('Contact added');
      }
      setShowContactModal(false);
      fetchContacts(selectedGroup?.id);
      fetchGroups();
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to save contact');
    }
  };

  const handleDeleteContact = async (c) => {
    if (!confirm(`Delete contact "${c.name}"?`)) return;
    setError('');
    try {
      await contactAPI.deleteContact(c.id);
      setSuccess('Contact deleted');
      fetchContacts(selectedGroup?.id);
      fetchGroups();
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to delete contact');
    }
  };

  const handleImport = async (e) => {
    const file = e?.target?.files?.[0];
    if (!file) return;
    setImporting(true);
    setError('');
    try {
      const formData = new FormData();
      formData.append('file', file);
      const res = await contactAPI.importContacts(formData, selectedGroup?.id);
      if (res.data.success) {
        setSuccess(res.data.message || `Imported ${res.data.imported} contacts`);
        fetchGroups();
        fetchContacts(selectedGroup?.id);
      }
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError(err.response?.data?.message || 'Import failed');
    } finally {
      setImporting(false);
      e.target.value = '';
    }
  };

  const handleExport = async () => {
    setExporting(true);
    setError('');
    try {
      const res = await contactAPI.exportContacts(selectedGroup?.id);
      const blob = new Blob([res.data], { type: 'text/csv;charset=utf-8' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `contacts_export${selectedGroup ? `_${selectedGroup.name}` : ''}.csv`;
      a.click();
      window.URL.revokeObjectURL(url);
      setSuccess('Export downloaded');
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError(err.response?.data?.message || 'Export failed');
    } finally {
      setExporting(false);
    }
  };

  const handleDownloadSample = async () => {
    try {
      const res = await contactAPI.downloadSample();
      const blob = new Blob([res.data], { type: 'text/csv;charset=utf-8' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'contacts_sample.csv';
      a.click();
      window.URL.revokeObjectURL(url);
      setSuccess('Sample downloaded');
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError('Failed to download sample');
    }
  };

  if (authLoading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-emerald-500"></div>
      </div>
    );
  }

  return (
    <Layout>
      <Head>
        <title>Contacts | WPAnyWhere</title>
      </Head>
      <div className="space-y-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">Contacts</h2>
          <p className="text-gray-600 mt-1">Manage groups and contacts. Select a group to import or export CSV.</p>
        </div>

        {error && (
          <div className="p-4 bg-red-50 border border-red-200 text-red-700 rounded-lg">{error}</div>
        )}
        {success && (
          <div className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-700 rounded-lg">{success}</div>
        )}

        <div className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden">
          <div className="flex flex-col md:flex-row min-h-[400px]">
            {/* Groups sidebar */}
            <div className="w-full md:w-64 border-b md:border-b-0 md:border-r border-gray-200 bg-gray-50">
              <div className="p-4 border-b border-gray-200 flex items-center justify-between">
                <h3 className="font-semibold text-gray-800">Groups</h3>
                <button
                  onClick={handleCreateGroup}
                  className="p-2 rounded-lg hover:bg-emerald-100 text-emerald-600 transition"
                  title="Add group"
                >
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                </button>
              </div>
              <div className="overflow-y-auto max-h-[350px]">
                {loading && groups.length === 0 ? (
                  <div className="p-8 text-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-500 mx-auto"></div>
                  </div>
                ) : groups.length === 0 ? (
                  <div className="p-6 text-center text-gray-500 text-sm">
                    No groups yet. Click + to create one.
                  </div>
                ) : (
                  groups.map((g) => (
                    <div
                      key={g.id}
                      className={`flex items-center justify-between gap-2 px-4 py-3 cursor-pointer border-b border-gray-100 hover:bg-white group ${
                        selectedGroup?.id === g.id ? 'bg-white border-l-4 border-l-emerald-500' : ''
                      }`}
                      onClick={() => setSelectedGroup(g)}
                    >
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-gray-800 truncate">{g.name}</p>
                        <p className="text-xs text-gray-500">{g.contact_count || 0} contacts</p>
                      </div>
                      <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition">
                        <button
                          onClick={(e) => { e.stopPropagation(); handleEditGroup(g); }}
                          className="p-1.5 rounded hover:bg-gray-200 text-gray-600"
                          title="Edit"
                        >
                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                          </svg>
                        </button>
                        <button
                          onClick={(e) => { e.stopPropagation(); handleDeleteGroup(g); }}
                          className="p-1.5 rounded hover:bg-red-100 text-red-600"
                          title="Delete"
                        >
                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Contacts list */}
            <div className="flex-1 min-w-0">
              <div className="p-4 border-b border-gray-200 flex items-center justify-between flex-wrap gap-2">
                <h3 className="font-semibold text-gray-800">
                  {selectedGroup ? selectedGroup.name : 'Select a group'}
                </h3>
                {selectedGroup && (
                  <div className="flex items-center gap-2 flex-wrap">
                    <input
                      type="file"
                      accept=".csv"
                      onChange={handleImport}
                      className="hidden"
                      id="import-file"
                    />
                    <label
                      htmlFor="import-file"
                      className={`inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium cursor-pointer transition ${
                        importing ? 'bg-gray-300 cursor-not-allowed text-gray-500' : 'bg-slate-700 hover:bg-slate-600 text-white'
                      }`}
                    >
                      {importing ? 'Importing...' : '📥 Import'}
                    </label>
                    <button
                      onClick={handleExport}
                      disabled={exporting}
                      className="px-3 py-2 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white text-sm rounded-lg font-medium transition"
                    >
                      {exporting ? 'Exporting...' : '📤 Export'}
                    </button>
                    <button
                      onClick={handleDownloadSample}
                      className="px-3 py-2 border border-gray-300 hover:bg-gray-50 text-gray-700 text-sm rounded-lg font-medium transition"
                    >
                      📋 Sample
                    </button>
                    <button
                      onClick={handleAddContact}
                      className="flex items-center gap-1.5 px-3 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-sm rounded-lg font-medium transition"
                    >
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                      </svg>
                      Add Contact
                    </button>
                  </div>
                )}
              </div>
              <div className="overflow-y-auto max-h-[350px]">
                {!selectedGroup ? (
                  <div className="p-12 text-center text-gray-500">
                    Select a group from the left to view contacts
                  </div>
                ) : loading && contacts.length === 0 ? (
                  <div className="p-8 text-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-500 mx-auto"></div>
                  </div>
                ) : contacts.length === 0 ? (
                  <div className="p-12 text-center text-gray-500">
                    No contacts in this group. Click Add Contact or import CSV.
                  </div>
                ) : (
                  <table className="w-full">
                    <thead className="bg-gray-50 sticky top-0">
                      <tr>
                        <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">Name</th>
                        <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">Mobile</th>
                        <th className="w-20 px-4 py-3"></th>
                      </tr>
                    </thead>
                    <tbody>
                      {contacts.map((c) => (
                        <tr key={c.id} className="border-b border-gray-100 hover:bg-gray-50">
                          <td className="px-4 py-3 font-medium text-gray-800">{c.name}</td>
                          <td className="px-4 py-3 text-gray-600 font-mono text-sm">{c.mobile}</td>
                          <td className="px-4 py-3">
                            <div className="flex gap-1">
                              <button
                                onClick={() => handleEditContact(c)}
                                className="p-2 rounded hover:bg-gray-200 text-gray-600"
                                title="Edit"
                              >
                                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                                </svg>
                              </button>
                              <button
                                onClick={() => handleDeleteContact(c)}
                                className="p-2 rounded hover:bg-red-100 text-red-600"
                                title="Delete"
                              >
                                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                </svg>
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            </div>
          </div>
        </div>

        <p className="text-sm text-gray-500">
          <strong>CSV format:</strong> name, mobile. Use Sample for the exact format. Import/Export only for the selected group.
        </p>
      </div>

      {/* Group Modal */}
      {showGroupModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={() => setShowGroupModal(false)}>
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-lg font-semibold text-gray-800 mb-4">
              {editingGroup ? 'Edit Group' : 'Create Group'}
            </h3>
            <form onSubmit={handleSaveGroup}>
              <input
                type="text"
                value={groupForm.name}
                onChange={(e) => setGroupForm({ ...groupForm, name: e.target.value })}
                placeholder="Group name (e.g. Group 1)"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                autoFocus
              />
              <div className="flex gap-2 mt-4">
                <button
                  type="button"
                  onClick={() => setShowGroupModal(false)}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-medium"
                >
                  {editingGroup ? 'Update' : 'Create'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Contact Modal */}
      {showContactModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={() => setShowContactModal(false)}>
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-lg font-semibold text-gray-800 mb-4">
              {editingContact ? 'Edit Contact' : 'Add Contact'}
            </h3>
            <form onSubmit={handleSaveContact}>
              {editingContact ? (
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Group</label>
                  <select
                    value={contactForm.group_id}
                    onChange={(e) => setContactForm({ ...contactForm, group_id: e.target.value })}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500"
                    required
                  >
                    <option value="">Select group</option>
                    {groups.map((g) => (
                      <option key={g.id} value={g.id}>{g.name}</option>
                    ))}
                  </select>
                </div>
              ) : null}
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
                <input
                  type="text"
                  value={contactForm.name}
                  onChange={(e) => setContactForm({ ...contactForm, name: e.target.value })}
                  placeholder="Contact name"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500"
                  required
                />
              </div>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">Mobile</label>
                <input
                  type="text"
                  value={contactForm.mobile}
                  onChange={(e) => setContactForm({ ...contactForm, mobile: e.target.value })}
                  placeholder="919876543210"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 font-mono"
                  required
                />
              </div>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setShowContactModal(false)}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-medium"
                >
                  {editingContact ? 'Update' : 'Add'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </Layout>
  );
}
