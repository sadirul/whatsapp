import { useEffect, useState, useCallback, useRef } from 'react';
import Head from 'next/head';
import { useRouter } from 'next/router';
import Layout from '../components/Layout';
import QRCodeBox from '../components/QRCodeBox';
import { useAuth } from '../services/useAuth';
import { useWhatsAppSocket } from '../hooks/useWhatsAppSocket';
import { whatsappAPI } from '../services/api';

export default function WhatsAppPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const [status, setStatus] = useState('disconnected');
  const [qr, setQr] = useState(null);
  const [loading, setLoading] = useState(false);
  const [initializing, setInitializing] = useState(false);
  const [error, setError] = useState('');
  const qrReceivedRef = useRef(false);

  // Real-time Socket.IO handlers
  useWhatsAppSocket({
    onQR: useCallback((data) => {
      qrReceivedRef.current = true;
      setQr(data.qr);
      setLoading(false);
    }, []),
    onReady: useCallback(() => {
      setStatus('connected');
      setQr(null);
      setLoading(false);
      setInitializing(false);
    }, []),
    onAuthenticated: useCallback(() => {
      setStatus('connecting');
    }, []),
    onDisconnected: useCallback(() => {
      setStatus('disconnected');
      setQr(null);
    }, []),
  });

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login');
    } else if (user) {
      fetchStatus();
      // Fallback poll only when socket may not be connected (every 10s)
      const interval = setInterval(fetchStatus, 10000);
      return () => clearInterval(interval);
    }
  }, [user, authLoading]);

  // Pre-initialize WhatsApp in background when page loads (disconnected users)
  // So QR is ready instantly when user clicks Initialize
  useEffect(() => {
    if (!user || status !== 'disconnected') return;
    whatsappAPI.initialize().catch(() => {});
  }, [user, status]);

  const fetchStatus = async () => {
    try {
      const response = await whatsappAPI.getStatus();
      if (response.data.success) {
        setStatus(response.data.status);
      }
    } catch (err) {
      console.error('Failed to fetch status:', err);
    }
  };

  const fetchQRCode = async () => {
    try {
      const response = await whatsappAPI.getQRCode();
      if (response.data.success && response.data.qr) {
        setQr(response.data.qr);
        return true;
      }
      return false;
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to generate QR code');
      return false;
    }
  };

  const handleInitialize = async () => {
    try {
      setInitializing(true);
      setError('');
      setQr(null);
      qrReceivedRef.current = false;
      setLoading(true);
      // Client may already be initializing from login/page load - call initialize (returns fast if ready)
      await whatsappAPI.initialize();
      // Try to get QR immediately - often ready from background pre-init
      let gotQR = await fetchQRCode();
      if (!gotQR && !qrReceivedRef.current) {
        for (let i = 0; i < 7; i++) {
          await new Promise((resolve) => setTimeout(resolve, 2000));
          if (qrReceivedRef.current) break;
          gotQR = await fetchQRCode();
          if (gotQR) break;
        }
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to initialize WhatsApp');
    } finally {
      setInitializing(false);
      if (!qrReceivedRef.current) setLoading(false);
    }
  };

  const handleDisconnect = async () => {
    try {
      await whatsappAPI.disconnect();
      setQr(null);
      setStatus('disconnected');
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to disconnect');
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
        <title>WhatsApp | WPAnyWhere</title>
      </Head>
      <div className="space-y-8">
        <div>
          <h2 className="text-2xl font-bold text-gray-800 mb-1">WhatsApp Connection</h2>
          <p className="text-gray-600">Link your phone to send messages via API</p>
        </div>

        {/* Status Card */}
        <div className={`bg-white rounded-xl shadow-lg border border-gray-200 p-6 transition-all duration-300 ${
          status === 'connected' ? 'border-l-4 border-l-green-500' : status === 'connecting' ? 'border-l-4 border-l-amber-500' : 'border-l-4 border-l-red-500'
        }`}>
          <div>
            <div className="flex items-center justify-between flex-wrap gap-4">
              <div className="flex items-center gap-4">
                <div className={`w-14 h-14 rounded-full flex items-center justify-center text-2xl ${
                  status === 'connected'
                    ? 'bg-emerald-100 animate-pulse'
                    : status === 'connecting'
                      ? 'bg-amber-100 animate-pulse'
                      : 'bg-gray-100'
                }`}>
                  {status === 'connected' ? '✓' : status === 'connecting' ? '⏳' : '○'}
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-500 uppercase tracking-wide">Status</p>
                  <p className={`text-xl font-bold ${
                    status === 'connected' ? 'text-green-600' : status === 'connecting' ? 'text-amber-600' : 'text-red-600'
                  }`}>
                    {status === 'connected' ? 'Connected' : status === 'connecting' ? 'Reconnecting...' : 'Disconnected'}
                  </p>
                </div>
              </div>
              {status === 'connected' && (
                <button
                  onClick={handleDisconnect}
                  className="flex items-center gap-2 px-4 py-2 bg-red-50 hover:bg-red-100 text-red-600 font-medium rounded-lg transition border border-red-200"
                >
                  <span>⏻</span> Disconnect
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="p-4 bg-red-50 border border-red-200 rounded-xl text-red-700 flex items-center gap-2">
            <span className="text-xl">⚠</span>
            <span>{error}</span>
          </div>
        )}

        {/* Main Content */}
        <div className="grid lg:grid-cols-3 gap-6 items-stretch">
          <div className="lg:col-span-2">
            {status === 'connected' ? (
              <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-6">
                <div className="text-center py-8">
                  <div className="inline-flex items-center justify-center w-16 h-16 bg-green-100 rounded-full mb-4">
                    <span className="text-3xl text-green-600">✓</span>
                  </div>
                  <h3 className="text-xl font-bold text-gray-800 mb-2">You&apos;re All Set!</h3>
                  <p className="text-gray-600 mb-6">Your WhatsApp is linked and ready to send messages</p>
                  <button
                    onClick={() => router.push('/dashboard')}
                    className="inline-flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold py-2 px-6 rounded-lg transition"
                  >
                    <span>→</span> Go to Dashboard
                  </button>
                </div>
              </div>
            ) : (
              <QRCodeBox
                qr={qr}
                loading={loading || initializing}
                onInitialize={handleInitialize}
              />
            )}
          </div>

          {/* Instructions Sidebar */}
          <div className="flex">
            <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-6 flex flex-col w-full">
              <h3 className="font-semibold text-gray-800 mb-4">How to Connect</h3>
              <div className="flex-1">
              <ol className="space-y-4">
                {[
                  { step: 1, text: 'Click "Initialize" to generate QR code', icon: '🖱️' },
                  { step: 2, text: 'Open WhatsApp on your phone', icon: '📲' },
                  { step: 3, text: 'Go to Settings → Linked Devices', icon: '⚙️' },
                  { step: 4, text: 'Tap "Link a Device" and scan', icon: '📷' },
                  { step: 5, text: 'Wait for connection to complete', icon: '⏳' },
                ].map((item) => (
                  <li key={item.step} className="flex gap-3">
                    <span className="flex-shrink-0 w-8 h-8 bg-emerald-100 text-emerald-700 rounded-lg flex items-center justify-center text-sm font-bold">
                      {item.step}
                    </span>
                    <div className="pt-0.5">
                      <p className="text-gray-700 text-sm">{item.text}</p>
                    </div>
                  </li>
                ))}
              </ol>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}
