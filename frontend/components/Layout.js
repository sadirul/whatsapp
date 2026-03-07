import { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { useAuth } from '../services/useAuth';
import { useWhatsAppSocket } from '../hooks/useWhatsAppSocket';
import { authAPI } from '../services/api';

const menuItems = [
  { href: '/dashboard', label: 'Dashboard', icon: '📊' },
  { href: '/whatsapp', label: 'WhatsApp', icon: '💬' },
  { href: '/messages', label: 'Messages', icon: '✉️' },
  { href: '/test-api', label: 'Test API', icon: '🧪' },
  { href: '/documentation', label: 'Documentation', icon: '📚' },
  { href: '/settings', label: 'Settings', icon: '⚙️' },
];

export default function Layout({ children }) {
  const router = useRouter();
  const { user, logout } = useAuth();
  const [whatsappStatus, setWhatsappStatus] = useState(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useWhatsAppSocket({
    onDisconnected: useCallback(() => setWhatsappStatus('disconnected'), []),
    onReady: useCallback(() => setWhatsappStatus('connected'), []),
  });

  useEffect(() => {
    if (!user) return;
    authAPI.getProfile()
      .then((res) => res.data.success && setWhatsappStatus(res.data.user.whatsapp_status))
      .catch(() => {});
  }, [user]);

  const handleLogout = () => {
    logout();
    router.push('/login');
  };

  const closeMobileMenu = () => setMobileMenuOpen(false);

  useEffect(() => {
    router.events.on('routeChangeComplete', closeMobileMenu);
    return () => router.events.off('routeChangeComplete', closeMobileMenu);
  }, [router.events]);

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Mobile overlay */}
      {mobileMenuOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 md:hidden"
          onClick={closeMobileMenu}
          aria-hidden="true"
        />
      )}

      {/* Left Sidebar */}
      <aside
        className={`w-64 bg-slate-900 text-white flex flex-col fixed h-full z-50 transition-transform duration-300 ease-out md:translate-x-0 ${
          mobileMenuOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
        }`}
      >
        <div className="p-6 border-b border-slate-700">
          <Link href="/dashboard">
            <span className="text-xl font-bold cursor-pointer flex items-center gap-2">
              <span className="text-2xl">📱</span>
              WPAnyWhere
            </span>
          </Link>
        </div>
        <nav className="flex-1 p-4 space-y-1">
          {menuItems.map((item) => {
            const isActive = router.pathname === item.href;
            return (
              <Link key={item.href} href={item.href}>
                <span
                  className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors cursor-pointer ${
                    isActive
                      ? 'bg-emerald-600 text-white'
                      : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                  }`}
                >
                  <span className="text-lg">{item.icon}</span>
                  {item.label}
                </span>
              </Link>
            );
          })}
        </nav>
        <div className="p-4 border-t border-slate-700 space-y-2">
          <div className="px-4 py-2 text-sm text-slate-400 truncate">{user?.name}</div>
          <div className="flex items-center gap-2 px-4 py-1">
            <span
              className={`flex-shrink-0 w-2 h-2 rounded-full ${
                whatsappStatus === 'connected' ? 'bg-emerald-500' : whatsappStatus === 'connecting' ? 'bg-amber-500 animate-pulse' : 'bg-red-500'
              }`}
              title={whatsappStatus === 'connected' ? 'WhatsApp Connected' : whatsappStatus === 'connecting' ? 'Reconnecting...' : 'WhatsApp Disconnected'}
            />
            <span className="text-xs text-slate-500">
              WhatsApp {whatsappStatus === 'connected' ? 'Connected' : whatsappStatus === 'connecting' ? 'Reconnecting...' : whatsappStatus !== null ? 'Disconnected' : '...'}
            </span>
          </div>
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-2 px-4 py-2 text-sm text-red-400 hover:bg-slate-800 hover:text-red-300 rounded-lg transition"
          >
            <span>🚪</span> Logout
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 md:ml-64 min-w-0">
        {/* Header */}
        <header className="bg-white border-b border-gray-200 sticky top-0 z-30 shadow-sm">
          <div className="px-4 md:px-8 py-4 flex items-center justify-between gap-4">
            <button
              type="button"
              onClick={() => setMobileMenuOpen((o) => !o)}
              className="md:hidden p-2 -ml-2 rounded-lg hover:bg-gray-100 text-gray-600"
              aria-label="Toggle menu"
            >
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                {mobileMenuOpen ? (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                ) : (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                )}
              </svg>
            </button>
            <h1 className="text-xl font-semibold text-gray-800 truncate flex-1">
              {menuItems.find((m) => m.href === router.pathname)?.label || 'WPAnyWhere'}
            </h1>
            <span className="text-sm text-gray-500 truncate hidden sm:inline">Hi, {user?.name}</span>
          </div>
        </header>

        {/* Page Content */}
        <main className={router.pathname === '/messages' ? 'p-4 h-[calc(100vh-4rem)]' : 'p-8'}>{children}</main>
      </div>
    </div>
  );
}
