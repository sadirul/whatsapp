/**
 * Socket Context - Provides authenticated Socket.IO connection to the app.
 * Connects when user is logged in, disconnects on logout.
 */

import { createContext, useContext, useEffect, useState } from 'react';
import Cookies from 'js-cookie';
import { connectSocket, disconnectSocket, getSocket } from '../services/socket';

const SocketContext = createContext(null);

export const SocketProvider = ({ children }) => {
  const [socket, setSocket] = useState(null);
  const [connected, setConnected] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const token = Cookies.get('token');
    if (!token) {
      disconnectSocket();
      setSocket(null);
      setConnected(false);
      return;
    }

    const s = connectSocket(token);
    if (s) {
      setSocket(s);
      setConnected(s.connected);

      const onConnect = () => setConnected(true);
      const onDisconnect = () => setConnected(false);

      s.on('connect', onConnect);
      s.on('disconnect', onDisconnect);

      return () => {
        s.off('connect', onConnect);
        s.off('disconnect', onDisconnect);
      };
    }
  }, []);

  return (
    <SocketContext.Provider value={{ socket, connected }}>
      {children}
    </SocketContext.Provider>
  );
};

export const useSocket = () => {
  const ctx = useContext(SocketContext);
  return ctx;
};
