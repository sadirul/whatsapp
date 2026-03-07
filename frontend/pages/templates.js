import { useEffect, useState, useRef } from 'react';
import Head from 'next/head';
import { useRouter } from 'next/router';
import Layout from '../components/Layout';
import { useAuth } from '../services/useAuth';
import { templateAPI } from '../services/api';

export default function TemplatesPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const [templates, setTemplates] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({ name: '', type: 'text', message: '', media_url: '', caption: '' });
  const [viewTemplate, setViewTemplate] = useState(null);
  const [viewFileUrl, setViewFileUrl] = useState(null);
  const fileInputRef = useRef(null);

  useEffect(() => {
    if (!authLoading && !user) router.push('/login');
  }, [user, authLoading]);

  useEffect(() => {
    if (!user) return;
    fetchTemplates();
  }, [user]);

  const fetchTemplates = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await templateAPI.getTemplates();
      if (res.data.success) setTemplates(res.data.templates || []);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load templates');
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = () => {
    setEditing(null);
    setForm({ name: '', type: 'text', message: '', media_url: '', caption: '' });
    setShowModal(true);
  };

  const handleEdit = (t) => {
    setEditing(t);
    setForm({
      name: t.name,
      type: t.type,
      message: t.message || '',
      media_url: t.media_url || '',
      caption: t.caption || '',
    });
    setShowModal(true);
  };

  const handleView = async (t) => {
    setViewTemplate(t);
    setViewFileUrl(null);
    setShowViewModal(true);
    if (t.type === 'media' && t.file_path) {
      try {
        const res = await templateAPI.getTemplateFile(t.id);
        const url = URL.createObjectURL(res.data);
        setViewFileUrl(url);
      } catch (_) {}
    }
  };

  const closeViewModal = () => {
    if (viewFileUrl) URL.revokeObjectURL(viewFileUrl);
    setViewTemplate(null);
    setViewFileUrl(null);
    setShowViewModal(false);
  };

  const handleSubmit = async (e) => {
    e?.preventDefault();
    if (!form.name.trim()) return;
    if (form.type === 'text' && !form.message.trim()) {
      setError('Message is required');
      return;
    }
    if (form.type === 'media_url' && !form.media_url.trim()) {
      setError('Media URL is required');
      return;
    }
    if (form.type === 'media' && !editing && !fileInputRef.current?.files?.length) {
      setError('File is required for media type');
      return;
    }
    setError('');
    try {
      if (form.type === 'media') {
        const fd = new FormData();
        fd.append('name', form.name.trim());
        fd.append('type', form.type);
        fd.append('caption', form.caption);
        if (fileInputRef.current?.files?.[0]) fd.append('file', fileInputRef.current.files[0]);
        if (editing) await templateAPI.updateTemplate(editing.id, fd);
        else await templateAPI.createTemplate(fd);
      } else {
        const data = {
          name: form.name.trim(),
          type: form.type,
          message: form.type === 'text' ? form.message : undefined,
          media_url: form.type === 'media_url' ? form.media_url.trim() : undefined,
          caption: form.caption || undefined,
        };
        if (editing) await templateAPI.updateTemplate(editing.id, data);
        else await templateAPI.createTemplate(data);
      }
      setSuccess(editing ? 'Template updated' : 'Template created');
      setShowModal(false);
      fetchTemplates();
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to save template');
    }
  };

  const handleDelete = async (t) => {
    if (!confirm(`Delete template "${t.name}"?`)) return;
    setError('');
    try {
      await templateAPI.deleteTemplate(t.id);
      setSuccess('Template deleted');
      fetchTemplates();
      if (viewTemplate?.id === t.id) closeViewModal();
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to delete');
    }
  };

  const typeLabel = (t) => ({ text: 'Text', media: 'Media', media_url: 'Media URL' }[t] || t);

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
        <title>Templates | WPAnyWhere</title>
      </Head>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h2 className="text-2xl font-bold text-gray-800">Templates</h2>
            <p className="text-gray-600 mt-1">Create text, media, or media URL templates for sending messages.</p>
          </div>
          <button
            onClick={handleCreate}
            className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-medium transition"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Create Template
          </button>
        </div>

        {error && <div className="p-4 bg-red-50 border border-red-200 text-red-700 rounded-lg">{error}</div>}
        {success && <div className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-700 rounded-lg">{success}</div>}

        <div className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            {loading ? (
              <div className="p-12 text-center">
                <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-emerald-500 mx-auto"></div>
              </div>
            ) : templates.length === 0 ? (
              <div className="p-12 text-center text-gray-500">No templates yet. Create one to get started.</div>
            ) : (
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">Name</th>
                    <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">Type</th>
                    <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">Preview</th>
                    <th className="w-28 px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {templates.map((t) => (
                    <tr key={t.id} className="border-b border-gray-100 hover:bg-gray-50">
                      <td className="px-4 py-3 font-medium text-gray-800">{t.name}</td>
                      <td className="px-4 py-3">
                        <span className="inline-flex px-2 py-1 text-xs font-medium rounded-full bg-slate-100 text-slate-700">
                          {typeLabel(t.type)}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-600 max-w-xs truncate">
                        {t.type === 'text' && t.message}
                        {t.type === 'media' && (t.file_name || 'File attached')}
                        {t.type === 'media_url' && (t.media_url || '-')}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            onClick={() => handleView(t)}
                            className="p-2 rounded-lg hover:bg-blue-100 text-blue-600"
                            title="View template"
                          >
                            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                            </svg>
                          </button>
                          <button
                            onClick={() => handleEdit(t)}
                            className="p-2 rounded-lg hover:bg-gray-200 text-gray-600"
                            title="Edit"
                          >
                            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                            </svg>
                          </button>
                          <button
                            onClick={() => handleDelete(t)}
                            className="p-2 rounded-lg hover:bg-red-100 text-red-600"
                            title="Delete"
                          >
                            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
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

        <p className="text-sm text-gray-500">
          <strong>Types:</strong> Text = mobile + message. Media = mobile + file + caption. Media URL = mobile + URL + caption.
        </p>
      </div>

      {/* Create/Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={() => setShowModal(false)}>
          <div className="bg-white rounded-xl shadow-xl max-w-lg w-full max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="p-6">
              <h3 className="text-lg font-semibold text-gray-800 mb-4">{editing ? 'Edit Template' : 'Create Template'}</h3>
              <form onSubmit={handleSubmit}>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
                    <input
                      type="text"
                      value={form.name}
                      onChange={(e) => setForm({ ...form, name: e.target.value })}
                      placeholder="Template name"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
                    <select
                      value={form.type}
                      onChange={(e) => setForm({ ...form, type: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500"
                    >
                      <option value="text">Text (mobile + message)</option>
                      <option value="media">Media (mobile + file + caption)</option>
                      <option value="media_url">Media URL (mobile + URL + caption)</option>
                    </select>
                  </div>
                  {form.type === 'text' && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Message</label>
                      <textarea
                        value={form.message}
                        onChange={(e) => setForm({ ...form, message: e.target.value })}
                        placeholder="Message content"
                        rows={4}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500"
                        required={form.type === 'text'}
                      />
                    </div>
                  )}
                  {form.type === 'media' && (
                    <>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">File</label>
                        <input
                          ref={fileInputRef}
                          type="file"
                          accept="image/*,video/*,audio/*,.pdf,.doc,.docx"
                          onChange={() => {}}
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                        />
                        {editing?.file_name && <p className="text-xs text-gray-500 mt-1">Current: {editing.file_name}</p>}
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Caption (optional)</label>
                        <textarea
                          value={form.caption}
                          onChange={(e) => setForm({ ...form, caption: e.target.value })}
                          placeholder="Caption"
                          rows={2}
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500"
                        />
                      </div>
                    </>
                  )}
                  {form.type === 'media_url' && (
                    <>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Media URL</label>
                        <input
                          type="url"
                          value={form.media_url}
                          onChange={(e) => setForm({ ...form, media_url: e.target.value })}
                          placeholder="https://example.com/image.jpg"
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500"
                          required={form.type === 'media_url'}
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Caption (optional)</label>
                        <textarea
                          value={form.caption}
                          onChange={(e) => setForm({ ...form, caption: e.target.value })}
                          placeholder="Caption"
                          rows={2}
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500"
                        />
                      </div>
                    </>
                  )}
                </div>
                <div className="flex gap-2 mt-6">
                  <button type="button" onClick={() => setShowModal(false)} className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50">
                    Cancel
                  </button>
                  <button type="submit" className="flex-1 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-medium">
                    {editing ? 'Update' : 'Create'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* View Modal */}
      {showViewModal && viewTemplate && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={closeViewModal}>
          <div className="bg-white rounded-xl shadow-xl max-w-lg w-full max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="p-6">
              <h3 className="text-lg font-semibold text-gray-800 mb-2">{viewTemplate.name}</h3>
              <p className="text-sm text-gray-500 mb-4">{typeLabel(viewTemplate.type)}</p>
              {viewTemplate.type === 'text' && (
                <div className="p-4 bg-gray-50 rounded-lg">
                  <p className="text-gray-800 whitespace-pre-wrap">{viewTemplate.message}</p>
                </div>
              )}
              {viewTemplate.type === 'media' && (
                <div className="space-y-2">
                  {viewFileUrl ? (
                    <div className="rounded-lg overflow-hidden border border-gray-200">
                      {viewTemplate.file_name?.match(/\.(jpg|jpeg|png|gif|webp)$/i) ? (
                        <img src={viewFileUrl} alt="" className="w-full max-h-80 object-contain" />
                      ) : (
                        <a href={viewFileUrl} download={viewTemplate.file_name} className="block p-4 bg-gray-50 text-blue-600 hover:underline">
                          Download: {viewTemplate.file_name}
                        </a>
                      )}
                    </div>
                  ) : (
                    <p className="text-gray-500">File: {viewTemplate.file_name}</p>
                  )}
                  {viewTemplate.caption && <p className="text-sm text-gray-600">{viewTemplate.caption}</p>}
                </div>
              )}
              {viewTemplate.type === 'media_url' && (
                <div className="space-y-2">
                  <a href={viewTemplate.media_url} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline break-all">
                    {viewTemplate.media_url}
                  </a>
                  {viewTemplate.caption && <p className="text-sm text-gray-600 mt-2">{viewTemplate.caption}</p>}
                </div>
              )}
              <button onClick={closeViewModal} className="mt-4 w-full px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50">
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </Layout>
  );
}
