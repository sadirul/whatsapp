import { useEffect, useState } from 'react';
import Head from 'next/head';
import { useRouter } from 'next/router';
import Layout from '../components/Layout';
import { useAuth } from '../services/useAuth';
import { authAPI, messageAPI } from '../services/api';

export default function TestAPI() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const [userProfile, setUserProfile] = useState(null);
  const [activeTab, setActiveTab] = useState('text');
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);

  const [textForm, setTextForm] = useState({ to: '', message: '' });
  const [mediaForm, setMediaForm] = useState({ to: '', caption: '' });
  const [mediaFile, setMediaFile] = useState(null);
  const [mediaUrlForm, setMediaUrlForm] = useState({ to: '', url: '', caption: '' });

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login');
    } else if (user) {
      fetchProfile();
    }
  }, [user, authLoading]);

  const fetchProfile = async () => {
    try {
      const response = await authAPI.getProfile();
      if (response.data.success) {
        setUserProfile(response.data.user);
      }
    } catch (err) {
      console.error('Failed to fetch profile:', err);
    }
  };

  const formatNumber = (num) => num.replace(/\D/g, '').replace(/^0/, '');

  const handleSendText = async (e) => {
    e.preventDefault();
    setLoading(true);
    setResult(null);
    try {
      const res = await messageAPI.sendMessageFromDashboard({
        number: formatNumber(textForm.to),
        message: textForm.message,
      });
      setResult({ success: true, data: res.data });
      setTextForm({ to: '', message: '' });
    } catch (err) {
      setResult({ success: false, message: err.response?.data?.message || 'Failed' });
    } finally {
      setLoading(false);
    }
  };

  const handleSendMedia = async (e) => {
    e.preventDefault();
    if (!mediaFile) return;
    setLoading(true);
    setResult(null);
    try {
      const formData = new FormData();
      formData.append('to', formatNumber(mediaForm.to));
      formData.append('file', mediaFile);
      if (mediaForm.caption) formData.append('caption', mediaForm.caption);
      const res = await messageAPI.sendMediaFromDashboard(formData);
      setResult({ success: true, data: res.data });
      setMediaForm({ to: '', caption: '' });
      setMediaFile(null);
      const fileInput = document.getElementById('media-file');
      if (fileInput) fileInput.value = '';
    } catch (err) {
      setResult({ success: false, message: err.response?.data?.message || 'Failed' });
    } finally {
      setLoading(false);
    }
  };

  const handleSendMediaUrl = async (e) => {
    e.preventDefault();
    setLoading(true);
    setResult(null);
    try {
      const res = await messageAPI.sendMediaUrlFromDashboard({
        to: formatNumber(mediaUrlForm.to),
        url: mediaUrlForm.url,
        caption: mediaUrlForm.caption,
      });
      setResult({ success: true, data: res.data });
      setMediaUrlForm({ to: '', url: '', caption: '' });
    } catch (err) {
      setResult({ success: false, message: err.response?.data?.message || 'Failed' });
    } finally {
      setLoading(false);
    }
  };

  if (authLoading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-emerald-500"></div>
      </div>
    );
  }

  const tabs = [
    { id: 'text', label: 'Send Text' },
    { id: 'media', label: 'Send Media' },
    { id: 'media-url', label: 'Send Media URL' },
  ];

  return (
    <Layout>
      <Head>
        <title>Test API | WPAnyWhere</title>
      </Head>
      <div className="max-w-2xl">
        {userProfile?.whatsapp_status !== 'connected' && (
          <div className="mb-6 p-4 bg-amber-50 border border-amber-200 rounded-lg text-amber-800">
            Connect WhatsApp first to test the API.
          </div>
        )}

        <div className="flex gap-2 mb-6">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-4 py-2 rounded-lg font-medium transition ${
                activeTab === tab.id
                  ? 'bg-emerald-600 text-white'
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden">
          {activeTab === 'text' && (
            <form onSubmit={handleSendText} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Phone Number</label>
                <input
                  type="text"
                  value={textForm.to}
                  onChange={(e) => setTextForm((f) => ({ ...f, to: e.target.value }))}
                  placeholder="919876543210"
                  required
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Message</label>
                <textarea
                  value={textForm.message}
                  onChange={(e) => setTextForm((f) => ({ ...f, message: e.target.value }))}
                  placeholder="Hello!"
                  required
                  rows="3"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                />
              </div>
              <button
                type="submit"
                disabled={loading}
                className="w-full bg-emerald-600 hover:bg-emerald-700 disabled:bg-gray-400 text-white font-semibold py-2 px-4 rounded-lg transition"
              >
                {loading ? 'Sending...' : 'Send Message'}
              </button>
            </form>
          )}

          {activeTab === 'media' && (
            <form onSubmit={handleSendMedia} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Phone Number</label>
                <input
                  type="text"
                  value={mediaForm.to}
                  onChange={(e) => setMediaForm((f) => ({ ...f, to: e.target.value }))}
                  placeholder="919876543210"
                  required
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">File</label>
                <input
                  id="media-file"
                  type="file"
                  onChange={(e) => setMediaFile(e.target.files?.[0])}
                  required
                  accept="image/*,video/*,.pdf"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Caption (optional)</label>
                <textarea
                  value={mediaForm.caption}
                  onChange={(e) => setMediaForm((f) => ({ ...f, caption: e.target.value }))}
                  placeholder="Check this!"
                  rows="3"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500"
                />
              </div>
              <button
                type="submit"
                disabled={loading}
                className="w-full bg-emerald-600 hover:bg-emerald-700 disabled:bg-gray-400 text-white font-semibold py-2 px-4 rounded-lg transition"
              >
                {loading ? 'Sending...' : 'Send Media'}
              </button>
            </form>
          )}

          {activeTab === 'media-url' && (
            <form onSubmit={handleSendMediaUrl} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Phone Number</label>
                <input
                  type="text"
                  value={mediaUrlForm.to}
                  onChange={(e) => setMediaUrlForm((f) => ({ ...f, to: e.target.value }))}
                  placeholder="919876543210"
                  required
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Media URL</label>
                <input
                  type="url"
                  value={mediaUrlForm.url}
                  onChange={(e) => setMediaUrlForm((f) => ({ ...f, url: e.target.value }))}
                  placeholder="https://example.com/image.jpg"
                  required
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Caption (optional)</label>
                <textarea
                  value={mediaUrlForm.caption}
                  onChange={(e) => setMediaUrlForm((f) => ({ ...f, caption: e.target.value }))}
                  placeholder="Image caption"
                  rows="3"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500"
                />
              </div>
              <button
                type="submit"
                disabled={loading}
                className="w-full bg-emerald-600 hover:bg-emerald-700 disabled:bg-gray-400 text-white font-semibold py-2 px-4 rounded-lg transition"
              >
                {loading ? 'Sending...' : 'Send Media'}
              </button>
            </form>
          )}
        </div>

        {result && (
          <div
            className={`mt-6 p-4 rounded-lg ${
              result.success ? 'bg-green-50 border border-green-200 text-green-800' : 'bg-red-50 border border-red-200 text-red-800'
            }`}
          >
            {result.success ? (
              <pre className="text-sm font-mono">{JSON.stringify(result.data, null, 2)}</pre>
            ) : (
              <p>{result.message}</p>
            )}
          </div>
        )}
      </div>
    </Layout>
  );
}
