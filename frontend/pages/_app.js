import '../styles/globals.css';
import { useEffect } from 'react';
import { useRouter } from 'next/router';
import Cookies from 'js-cookie';
import { SocketProvider } from '../contexts/SocketContext';

function MyApp({ Component, pageProps }) {
  const router = useRouter();

  useEffect(() => {
    // Redirect to login if no token and not on public pages (client-side only)
    if (typeof window === 'undefined') return;

    const publicPages = ['/', '/login', '/register'];
    const token = Cookies.get('token') || (typeof localStorage !== 'undefined' && localStorage.getItem('token'));

    if (!token && !publicPages.includes(router.pathname)) {
      router.push('/login');
    }
  }, [router.pathname]);

  return (
    <SocketProvider>
      <Component {...pageProps} />
    </SocketProvider>
  );
}

export default MyApp;
