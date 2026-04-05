/**
 * useSocket Hook
 * 
 * Provides real-time WebSocket connection to the backend server.
 * Gracefully handles cases where the backend isn't available.
 */

import { useEffect, useRef, useState, useCallback } from 'react';

const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || 'http://localhost:5000';

/**
 * Main socket hook for real-time updates
 * @param {number} tankId - Tank ID to subscribe to (optional, for tank-specific updates)
 */
export function useSocket(tankId = null) {
  const socketRef = useRef(null);
  const [isConnected, setIsConnected] = useState(false);
  const [lastUpdate, setLastUpdate] = useState(null);
  const [latestReadings, setLatestReadings] = useState(null);
  const [latestAlert, setLatestAlert] = useState(null);
  const [connectionError, setConnectionError] = useState(null);

  // Initialize socket connection with dynamic import
  useEffect(() => {
    let socket = null;
    let mounted = true;

    async function initSocket() {
      try {
        // Dynamically import socket.io-client
        const { io } = await import('socket.io-client');
        
        if (!mounted) return;

        // Create socket connection
        socket = io(SOCKET_URL, {
          transports: ['websocket', 'polling'],
          reconnection: true,
          reconnectionAttempts: 5,
          reconnectionDelay: 1000,
          reconnectionDelayMax: 5000,
          timeout: 5000,
        });

        socketRef.current = socket;

        // Connection handlers
        socket.on('connect', () => {
          if (mounted) {
            setIsConnected(true);
            setConnectionError(null);
          }
        });

        socket.on('disconnect', (reason) => {
          if (mounted) {
            setIsConnected(false);
          }
        });

        socket.on('connect_error', (error) => {
          if (mounted) {
            setIsConnected(false);
            setConnectionError(error.message);
          }
        });

        // Tank room management
        if (tankId) {
          socket.emit('join-tank', tankId);
        }

        // Listen for sensor updates
        socket.on('sensor-update', (data) => {
          if (mounted) {
            setLatestReadings(data);
            setLastUpdate(new Date());
          }
        });

        socket.on('global-sensor-update', (data) => {
          if (mounted && !tankId) {
            setLatestReadings(data);
            setLastUpdate(new Date());
          }
        });

        // Listen for alerts
        socket.on('alert', (data) => {
          if (mounted) {
            setLatestAlert(data);
          }
        });

        socket.on('global-alert', (data) => {
          if (mounted && !tankId) {
            setLatestAlert(data);
          }
        });

      } catch (error) {
        if (mounted) {
          setConnectionError('Socket.IO not available');
          setIsConnected(false);
        }
      }
    }

    initSocket();

    // Cleanup on unmount
    return () => {
      mounted = false;
      if (socket) {
        socket.disconnect();
      }
    };
  }, [tankId]);

  // Method to emit custom events
  const emit = useCallback((event, data) => {
    if (socketRef.current && socketRef.current.connected) {
      socketRef.current.emit(event, data);
    }
  }, []);

  // Method to subscribe to custom events
  const on = useCallback((event, callback) => {
    if (socketRef.current) {
      socketRef.current.on(event, callback);
      return () => socketRef.current?.off(event, callback);
    }
    return () => {};
  }, []);

  return {
    socket: socketRef.current,
    isConnected,
    connectionError,
    lastUpdate,
    latestReadings,
    latestAlert,
    emit,
    on
  };
}

/**
 * Hook for just checking connection status
 */
export function useSocketStatus() {
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    let socket = null;
    let mounted = true;

    async function init() {
      try {
        const { io } = await import('socket.io-client');
        if (!mounted) return;

        socket = io(SOCKET_URL, {
          transports: ['websocket', 'polling'],
          timeout: 5000,
        });

        socket.on('connect', () => mounted && setIsConnected(true));
        socket.on('disconnect', () => mounted && setIsConnected(false));
      } catch {
        // Socket.IO not available
      }
    }

    init();

    return () => {
      mounted = false;
      socket?.disconnect();
    };
  }, []);

  return isConnected;
}

export default useSocket;
