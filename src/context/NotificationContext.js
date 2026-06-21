import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { useAuth } from './AuthContext';

const NotificationContext = createContext();

export const NotificationProvider = ({ children }) => {
  const [notifications, setNotifications] = useState([]);
  const { currentUser } = useAuth();

  const addNotification = useCallback((message, type = 'info') => {
    const id = Math.random().toString(36).substring(2, 9);

    setNotifications(prev => [...prev, { id, message, type }]);

    // Play global push sound notification
    const audio = new Audio('/notification.mp3');
    audio.play().catch(e => console.log('Global notification sound playback blocked by browser: ', e));

    // Auto-dismiss the toast card after 5 seconds
    setTimeout(() => {
      setNotifications(prev => prev.filter(n => n.id !== id));
    }, 5000);
  }, []);

  const dismissNotification = useCallback((id) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  }, []);

  // Establish and manage connection lifecycle to the SSE stream
  useEffect(() => {
    if (!currentUser || !currentUser.id) return;

    let apiUrl = process.env.REACT_APP_API_URL;
    if (!apiUrl) {
      console.warn("WARNING: REACT_APP_API_URL is undefined during build! Falling back to localhost. Real-time notifications will fail on live environments.");
      apiUrl = 'http://localhost:8080/api';
    }
    const sseUrl = `${apiUrl}/notifications/subscribe/${currentUser.id}`;

    console.log(`Establishing real-time SSE stream at: ${sseUrl}`);
    const eventSource = new EventSource(sseUrl);

    eventSource.addEventListener('INIT', (event) => {
      console.log('SSE connection initialized:', event.data);
    });

    eventSource.addEventListener('alert', (event) => {
      console.log('Real-time notification received:', event.data);
      addNotification(event.data, 'success');
      // Dispatch a global event so active pages can instantly refresh their data
      window.dispatchEvent(new CustomEvent('sse-notification', { detail: event.data }));
    });

    eventSource.onerror = (error) => {
      console.error('SSE connection error, browser will attempt auto-reconnect:', error);
    };

    return () => {
      eventSource.close();
    };
  }, [currentUser, addNotification]);

  return (
    <NotificationContext.Provider value={{ addNotification, dismissNotification }}>
      {children}
      {/* Floating Notification Portal */}
      <div style={{
        position: 'fixed',
        bottom: '20px',
        right: '20px',
        zIndex: 10000,
        display: 'flex',
        flexDirection: 'column',
        gap: '10px'
      }}>
        {notifications.map(n => (
          <div key={n.id} style={{
            background: n.type === 'success' ? '#28a745' : '#333',
            color: '#fff',
            padding: '12px 20px',
            borderRadius: '8px',
            boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '15px',
            minWidth: '280px'
          }}>
            <span>{n.message}</span>
            <button onClick={() => dismissNotification(n.id)} style={{
              background: 'none',
              border: 'none',
              color: '#fff',
              cursor: 'pointer',
              fontSize: '1.2rem',
              lineHeight: 1
            }}>&times;</button>
          </div>
        ))}
      </div>
    </NotificationContext.Provider>
  );
};

export const useNotifications = () => useContext(NotificationContext);