import { createContext, useContext, useEffect, useRef, useState } from 'react';
import { io } from 'socket.io-client';
import { useAuth } from './AuthContext.jsx';

const SocketContext = createContext(null);

export function SocketProvider({ children }) {
  const { user } = useAuth();
  const [socket, setSocket] = useState(null);
  const [notifications, setNotifications] = useState([]);

  useEffect(() => {
    const token = localStorage.getItem('accessToken');
    if (!user || !token) {
      setSocket(null);
      return;
    }

    const newSocket = io('/', { path: '/socket.io', auth: { token } });
    setSocket(newSocket);

    function pushNotification(message, type = 'info') {
      setNotifications((prev) => [{ id: Date.now() + Math.random(), message, type, read: false }, ...prev].slice(0, 50));
    }

    newSocket.on('request:new', (payload) =>
      pushNotification(`${payload.requesterName} requested "${payload.listingTitle}"`, 'request')
    );
    newSocket.on('request:accepted', () => pushNotification('Your request was accepted — contact details unlocked', 'success'));
    newSocket.on('request:declined', () => pushNotification('Your request was declined', 'warning'));
    newSocket.on('message:new', (msg) => pushNotification(`New message: ${msg.text.slice(0, 40)}`, 'message'));
    newSocket.on('listing:matched', (payload) =>
      pushNotification(`A new listing matches your wishlist: "${payload.listing.title}"`, 'match')
    );
    newSocket.on('verification:updated', (payload) =>
      pushNotification(`Your verification was ${payload.status}`, payload.status === 'approved' ? 'success' : 'warning')
    );

    return () => newSocket.disconnect();
  }, [user]);

  function joinTransactionRoom(transactionId) {
    socket?.emit('room:join', transactionId);
  }

  function markAllRead() {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  }

  return (
    <SocketContext.Provider value={{ socket, notifications, joinTransactionRoom, markAllRead }}>
      {children}
    </SocketContext.Provider>
  );
}

export function useSocketContext() {
  const ctx = useContext(SocketContext);
  if (!ctx) throw new Error('useSocketContext must be used within SocketProvider');
  return ctx;
}
