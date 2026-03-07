import Link from 'next/link';
import { useRouter } from 'next/router';
import { useAuth } from '../services/useAuth';

export default function Navbar() {
  const router = useRouter();
  const { user, logout } = useAuth();

  const handleLogout = () => {
    logout();
    router.push('/login');
  };

  return (
    <nav className="bg-slate-900 text-white shadow-lg">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <Link href="/">
            <span className="text-xl font-bold cursor-pointer flex items-center gap-2 hover:text-emerald-400 transition">
              <span className="text-2xl">📱</span> WPAnyWhere
            </span>
          </Link>

          {/* Navigation Links */}
          <div className="space-x-6">
            {user ? (
              <>
                <Link href="/dashboard">
                  <span className="hover:text-emerald-400 transition cursor-pointer">Dashboard</span>
                </Link>
                <Link href="/whatsapp">
                  <span className="hover:text-emerald-400 transition cursor-pointer">WhatsApp</span>
                </Link>
                <span className="text-sm text-slate-300">Hi, {user?.name}</span>
                <button
                  onClick={handleLogout}
                  className="bg-red-600 hover:bg-red-500 px-4 py-2 rounded-lg transition"
                >
                  Logout
                </button>
              </>
            ) : (
              <>
                <Link href="/login">
                  <span className="hover:text-emerald-400 transition cursor-pointer">Login</span>
                </Link>
                <Link href="/register">
                  <span className="bg-emerald-600 hover:bg-emerald-500 px-4 py-2 rounded-lg transition cursor-pointer">Register</span>
                </Link>
              </>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}
