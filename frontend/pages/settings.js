import { useEffect, useState } from 'react';
import Head from 'next/head';
import { useRouter } from 'next/router';
import Layout from '../components/Layout';
import { useAuth } from '../services/useAuth';
import { settingsAPI } from '../services/api';

export default function Settings() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const [webhookUrl, setWebhookUrl] = useState('');
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState(null);

  const [geminiApiKeyInput, setGeminiApiKeyInput] = useState('');
  const [hasGeminiKey, setHasGeminiKey] = useState(false);
  const [geminiKeyMasked, setGeminiKeyMasked] = useState('');
  const [aiAutoReplyEnabled, setAiAutoReplyEnabled] = useState(false);
  const [savingAi, setSavingAi] = useState(false);
  const [aiMessage, setAiMessage] = useState(null);

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [changingPassword, setChangingPassword] = useState(false);
  const [passwordMessage, setPasswordMessage] = useState(null);

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login');
    } else if (user) {
      fetchSettings();
    }
  }, [user, authLoading]);

  const fetchSettings = async () => {
    try {
      const response = await settingsAPI.getSettings();
      if (response.data.success) {
        const s = response.data.settings;
        setWebhookUrl(s.webhook_url || '');
        setGeminiKeyMasked(s.gemini_api_key || '');
        setHasGeminiKey(!!s.has_gemini_key);
        setAiAutoReplyEnabled(!!s.ai_auto_reply_enabled);
        setGeminiApiKeyInput('');
      }
    } catch (err) {
      console.error('Failed to fetch settings:', err);
    }
  };

  const handleWebhookSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setMessage(null);

    try {
      const response = await settingsAPI.updateSettings({ webhook_url: webhookUrl });
      if (response.data.success) {
        setMessage({ type: 'success', text: 'Settings saved successfully' });
      }
    } catch (err) {
      setMessage({
        type: 'error',
        text: err.response?.data?.message || 'Failed to save settings',
      });
    } finally {
      setSaving(false);
    }
  };

  const handleAiSubmit = async (e, forceClearKey = false) => {
    e?.preventDefault();
    setSavingAi(true);
    setAiMessage(null);
    try {
      const payload = { ai_auto_reply_enabled: hasGeminiKey ? aiAutoReplyEnabled : false };
      if (forceClearKey) {
        payload.gemini_api_key = '';
      } else if (geminiApiKeyInput.trim()) {
        payload.gemini_api_key = geminiApiKeyInput.trim();
      }
      const response = await settingsAPI.updateSettings(payload);
      if (response.data.success) {
        const s = response.data.settings;
        setHasGeminiKey(!!s.has_gemini_key);
        setAiAutoReplyEnabled(!!s.ai_auto_reply_enabled);
        setGeminiKeyMasked(s.gemini_api_key || '');
        setGeminiApiKeyInput('');
        setAiMessage({ type: 'success', text: 'AI settings saved successfully' });
      }
    } catch (err) {
      setAiMessage({
        type: 'error',
        text: err.response?.data?.message || 'Failed to save AI settings',
      });
    } finally {
      setSavingAi(false);
    }
  };

  const handleClearGeminiKey = () => {
    handleAiSubmit(null, true);
  };

  const handlePasswordSubmit = async (e) => {
    e.preventDefault();
    setChangingPassword(true);
    setPasswordMessage(null);

    try {
      const response = await settingsAPI.changePassword({
        currentPassword,
        newPassword,
        confirmPassword,
      });
      if (response.data.success) {
        setPasswordMessage({ type: 'success', text: 'Password changed successfully' });
        setCurrentPassword('');
        setNewPassword('');
        setConfirmPassword('');
      }
    } catch (err) {
      setPasswordMessage({
        type: 'error',
        text: err.response?.data?.message || 'Failed to change password',
      });
    } finally {
      setChangingPassword(false);
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
        <title>Settings | WPAnyWhere</title>
      </Head>
      <div className="max-w-5xl">
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-gray-800 mb-1">Settings</h2>
          <p className="text-gray-600">Configure your webhook and account preferences</p>
        </div>

        <div className="grid lg:grid-cols-2 gap-8">
          {/* Left: Webhook */}
          <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-6">
            <h3 className="font-semibold text-gray-800 mb-4">Webhook</h3>
            <p className="text-sm text-gray-600 mb-4">
              All incoming WhatsApp messages will be POSTed to this URL as JSON.
            </p>
            <form onSubmit={handleWebhookSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Webhook URL</label>
                <input
                  type="url"
                  value={webhookUrl}
                  onChange={(e) => setWebhookUrl(e.target.value)}
                  placeholder="https://your-server.com/webhook"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                />
              </div>
              <button
                type="submit"
                disabled={saving}
                className="bg-emerald-600 hover:bg-emerald-700 disabled:bg-gray-400 text-white font-semibold py-2 px-6 rounded-lg transition"
              >
                {saving ? 'Saving...' : 'Save Webhook'}
              </button>
            </form>

            {message && (
              <div
                className={`mt-4 p-3 rounded-lg ${
                  message.type === 'success'
                    ? 'bg-green-50 border border-green-200 text-green-700'
                    : 'bg-red-50 border border-red-200 text-red-700'
                }`}
              >
                {message.text}
              </div>
            )}

            <div className="mt-6 p-4 bg-gray-50 rounded-lg border border-gray-200">
              <p className="text-sm font-medium text-gray-700 mb-2">Webhook Payload Example:</p>
              <pre className="text-xs text-gray-600 overflow-x-auto">
{`{
  "event": "message",
  "userId": 1,
  "message": {
    "id": "...",
    "from": "1234567890@c.us",
    "to": "...",
    "body": "Hello",
    "type": "chat",
    "timestamp": 1234567890,
    "fromMe": false,
    "hasMedia": false,
    "author": null
  }
}`}
              </pre>
            </div>
          </div>

          {/* Right: Change Password */}
          <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-6">
            <h3 className="font-semibold text-gray-800 mb-4">Change Password</h3>
            <p className="text-sm text-gray-600 mb-4">
              Update your account password. Use a strong password with at least 6 characters.
            </p>
            <form onSubmit={handlePasswordSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Current Password</label>
                <input
                  type="password"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">New Password</label>
                <input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  minLength={6}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Confirm New Password</label>
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  minLength={6}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                />
              </div>
              <button
                type="submit"
                disabled={changingPassword}
                className="bg-emerald-600 hover:bg-emerald-700 disabled:bg-gray-400 text-white font-semibold py-2 px-6 rounded-lg transition"
              >
                {changingPassword ? 'Changing...' : 'Change Password'}
              </button>
            </form>

            {passwordMessage && (
              <div
                className={`mt-4 p-3 rounded-lg ${
                  passwordMessage.type === 'success'
                    ? 'bg-green-50 border border-green-200 text-green-700'
                    : 'bg-red-50 border border-red-200 text-red-700'
                }`}
              >
                {passwordMessage.text}
              </div>
            )}
          </div>
        </div>

        {/* AI Auto-Reply - Full width below */}
        <div className="mt-8 bg-white rounded-xl shadow-lg border border-gray-200 p-6">
            <h3 className="font-semibold text-gray-800 mb-4">AI Auto-Reply (Gemini)</h3>
            <p className="text-sm text-gray-600 mb-4">
              Use Google Gemini to auto-reply to incoming WhatsApp messages. Replies are contextual and human-like.
            </p>
            <form onSubmit={handleAiSubmit} className="space-y-4 max-w-xl">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Gemini API Key</label>
                {hasGeminiKey ? (
                  <div className="flex gap-2 items-center">
                    <code className="flex-1 px-4 py-2 bg-gray-100 rounded-lg text-sm text-gray-700">
                      {geminiKeyMasked || '••••••••'}
                    </code>
                    <button
                      type="button"
                      onClick={handleClearGeminiKey}
                      className="px-4 py-2 text-sm text-red-600 hover:bg-red-50 rounded-lg border border-red-200 transition"
                    >
                      Clear
                    </button>
                  </div>
                ) : null}
                <input
                  type="password"
                  value={geminiApiKeyInput}
                  onChange={(e) => setGeminiApiKeyInput(e.target.value)}
                  placeholder={hasGeminiKey ? 'Enter new key to replace' : 'Enter your Gemini API key'}
                  className="w-full mt-2 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Get a free API key from{' '}
                  <a href="https://aistudio.google.com/apikey" target="_blank" rel="noopener noreferrer" className="text-emerald-600 hover:underline">
                    Google AI Studio
                  </a>
                </p>
              </div>
              <div className="flex items-center gap-3">
                <label className={`flex items-center gap-2 ${hasGeminiKey ? 'cursor-pointer' : 'cursor-not-allowed opacity-60'}`}>
                  <input
                    type="checkbox"
                    checked={aiAutoReplyEnabled}
                    onChange={(e) => hasGeminiKey && setAiAutoReplyEnabled(e.target.checked)}
                    disabled={!hasGeminiKey}
                    className="w-4 h-4 rounded border-gray-300 text-emerald-600 focus:ring-emerald-500 disabled:cursor-not-allowed"
                  />
                  <span className="text-sm font-medium text-gray-700">
                    Enable AI auto-reply {!hasGeminiKey && '(add API key first)'}
                  </span>
                </label>
              </div>
              <button
                type="submit"
                disabled={savingAi}
                className="bg-emerald-600 hover:bg-emerald-700 disabled:bg-gray-400 text-white font-semibold py-2 px-6 rounded-lg transition"
              >
                {savingAi ? 'Saving...' : 'Save AI Settings'}
              </button>
            </form>
            {aiMessage && (
              <div
                className={`mt-4 p-3 rounded-lg max-w-xl ${
                  aiMessage.type === 'success'
                    ? 'bg-green-50 border border-green-200 text-green-700'
                    : 'bg-red-50 border border-red-200 text-red-700'
                }`}
              >
                {aiMessage.text}
              </div>
            )}
        </div>
      </div>
    </Layout>
  );
}
