import { useEffect, useState, useCallback } from 'react';
import Head from 'next/head';
import { useRouter } from 'next/router';
import Link from 'next/link';
import Layout from '../components/Layout';
import { useAuth } from '../services/useAuth';
import { useWhatsAppSocket } from '../hooks/useWhatsAppSocket';
import { authAPI } from '../services/api';

export default function Dashboard() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const [userProfile, setUserProfile] = useState(null);
  const [apiKey, setApiKey] = useState('');
  const [copied, setCopied] = useState(false);

  const isConnected = userProfile?.whatsapp_status === 'connected';
  const isConnecting = userProfile?.whatsapp_status === 'connecting';

  useWhatsAppSocket({
    onDisconnected: useCallback(() => {
      setUserProfile((prev) => (prev ? { ...prev, whatsapp_status: 'disconnected' } : null));
    }, []),
    onReady: useCallback(() => {
      setUserProfile((prev) => (prev ? { ...prev, whatsapp_status: 'connected' } : null));
    }, []),
  });

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login');
    } else if (user) {
      fetchProfile();
    }
  }, [user, authLoading]);

  // Poll profile when reconnecting so UI updates when restore completes
  useEffect(() => {
    if (!isConnecting) return;
    const interval = setInterval(fetchProfile, 3000);
    return () => clearInterval(interval);
  }, [isConnecting]);

  const fetchProfile = async () => {
    try {
      const response = await authAPI.getProfile();
      if (response.data.success) {
        setUserProfile(response.data.user);
        setApiKey(response.data.user.api_key || '');
      }
    } catch (err) {
      console.error('Failed to fetch profile:', err);
    }
  };

  const handleCopyApiKey = () => {
    navigator.clipboard.writeText(apiKey);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const maskedApiKey = apiKey ? apiKey.slice(0, 8) + 'XXXXX' + apiKey.slice(-4) : '';

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
        <title>Dashboard | WPAnyWhere</title>
      </Head>
      <div className="space-y-8">
        <div>
          <h2 className="text-2xl font-bold text-gray-800 mb-1">WhatsApp Overview</h2>
          <p className="text-gray-600">Manage your WhatsApp connection and API access</p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className={`w-12 h-12 rounded-full flex items-center justify-center text-2xl ${
                isConnected ? 'bg-emerald-100' : isConnecting ? 'bg-amber-100' : 'bg-red-100'
              }`}>
                {isConnected ? '✅' : isConnecting ? '⏳' : '❌'}
              </div>
              <div>
                <h3 className="font-semibold text-gray-800">Connection Status</h3>
                <p className={`text-sm font-medium ${
                  isConnected ? 'text-emerald-600' : isConnecting ? 'text-amber-600' : 'text-red-600'
                }`}>
                  {isConnected ? 'Connected' : isConnecting ? 'Reconnecting...' : 'Disconnected'}
                </p>
              </div>
            </div>
            <p className="text-sm text-gray-600 mb-4">
              {isConnected
                ? 'Your WhatsApp is linked and ready to send messages.'
                : isConnecting
                  ? 'Restoring your session after server restart...'
                  : 'Connect your WhatsApp to start sending messages via API.'}
            </p>
            <Link href="/whatsapp">
              <span className="inline-block bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-medium px-4 py-2 rounded-lg transition cursor-pointer">
                {isConnected ? 'Manage Connection' : 'Connect WhatsApp'}
              </span>
            </Link>
          </div>

          <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center text-2xl">🔑</div>
              <div>
                <h3 className="font-semibold text-gray-800">API Key</h3>
                <p className="text-sm text-gray-500">Authenticate your requests</p>
              </div>
            </div>
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <code className="flex-1 px-3 py-2 bg-gray-100 rounded-lg font-mono text-sm text-gray-700 truncate">
                  {maskedApiKey || 'Loading...'}
                </code>
                <button
                  onClick={handleCopyApiKey}
                  className="px-3 py-2 bg-slate-700 hover:bg-slate-600 text-white text-sm rounded-lg transition"
                >
                  {copied ? '✓' : 'Copy'}
                </button>
              </div>
              <p className="text-xs text-gray-500">Click Copy to copy full key. Use in x-api-key header.</p>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center text-2xl">📧</div>
              <div>
                <h3 className="font-semibold text-gray-800">Account</h3>
                <p className="text-sm text-gray-500 truncate">{userProfile?.email}</p>
              </div>
            </div>
            <p className="text-sm text-gray-600 mb-4">
              Logged in as {userProfile?.name}
            </p>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-6">
          <h3 className="font-semibold text-gray-800 mb-4">Quick Actions</h3>
          <div className="grid md:grid-cols-3 gap-4">
            <Link href="/whatsapp">
              <span className="flex items-center gap-3 p-4 border border-gray-200 rounded-lg hover:bg-gray-50 hover:border-emerald-300 transition cursor-pointer">
                <span className="text-2xl">💬</span>
                <div>
                  <p className="font-medium text-gray-800">WhatsApp</p>
                  <p className="text-sm text-gray-500">Connect or manage</p>
                </div>
              </span>
            </Link>
            <Link href="/test-api">
              <span className="flex items-center gap-3 p-4 border border-gray-200 rounded-lg hover:bg-gray-50 hover:border-emerald-300 transition cursor-pointer">
                <span className="text-2xl">🧪</span>
                <div>
                  <p className="font-medium text-gray-800">Test API</p>
                  <p className="text-sm text-gray-500">Send test messages</p>
                </div>
              </span>
            </Link>
            <Link href="/documentation">
              <span className="flex items-center gap-3 p-4 border border-gray-200 rounded-lg hover:bg-gray-50 hover:border-emerald-300 transition cursor-pointer">
                <span className="text-2xl">📚</span>
                <div>
                  <p className="font-medium text-gray-800">Documentation</p>
                  <p className="text-sm text-gray-500">API reference & cURL</p>
                </div>
              </span>
            </Link>
          </div>
        </div>
      </div>
    </Layout>
  );
}
