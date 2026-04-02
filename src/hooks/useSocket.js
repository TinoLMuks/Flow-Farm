/**
 * useSocket Hook
 * 
 * Provides real-time WebSocket connection to the backend server.
 * Automatically handles connection, reconnection, and room management.
 */

import { useEffect, useRef, useState, useCallback } from 'react';
import { io } from 'socket.io-client';

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

  // Initialize socket connection
  useEffect(() => {
    // Create socket connection
    socketRef.current = io(SOCKET_URL, {
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionAttempts: 10,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
    });

    const socket = socketRef.current;

    // Connection handlers
    socket.on('connect', () => {
      console.log('[Socket] Connected:', socket.id);
      setIsConnected(true);
    });

    socket.on('disconnect', (reason) => {
      console.log('[Socket] Disconnected:', reason);
      setIsConnected(false);
    });

    socket.on('connect_error', (error) => {
      console.error('[Socket] Connection error:', error.message);
      setIsConnected(false);
    });

    // Cleanup on unmount
    return () => {
      socket.disconnect();
    };
  }, []);

  // Join/leave tank room when tankId changes
  useEffect(() => {
    const socket = socketRef.current;
    if (!socket || !isConnected) return;

    if (tankId) {
      socket.emit('join-tank', tankId);
      console.log(`[Socket] Joining tank-${tankId}`);
    }

    return () => {
      if (tankId) {
        socket.emit('leave-tank', tankId);
        console.log(`[Socket] Leaving tank-${tankId}`);
      }
    };
  }, [tankId, isConnected]);

  // Listen for sensor updates
  useEffect(() => {
    const socket = socketRef.current;
    if (!socket) return;

    // Tank-specific sensor update
    const handleSensorUpdate = (data) => {
      console.log('[Socket] Sensor update:', data);
      setLatestReadings(data);
      setLastUpdate(new Date());
    };

    // Global sensor update (for overview page)
    const handleGlobalSensorUpdate = (data) => {
      if (!tankId) {
        // Only process global updates if not subscribed to a specific tank
        handleSensorUpdate(data);
      }
    };

    socket.on('sensor-update', handleSensorUpdate);
    socket.on('global-sensor-update', handleGlobalSensorUpdate);

    return () => {
      socket.off('sensor-update', handleSensorUpdate);
      socket.off('global-sensor-update', handleGlobalSensorUpdate);
    };
  }, [tankId]);

  // Listen for alerts
  useEffect(() => {
    const socket = socketRef.current;
    if (!socket) return;

    const handleAlert = (data) => {
      console.log('[Socket] Alert received:', data);
      setLatestAlert(data);
    };

    const handleGlobalAlert = (data) => {
      if (!tankId) {
        handleAlert(data);
      }
    };

    socket.on('alert', handleAlert);
    socket.on('global-alert', handleGlobalAlert);

    return () => {
      socket.off('alert', handleAlert);
      socket.off('global-alert', handleGlobalAlert);
    };
  }, [tankId]);

  // Method to emit custom events
  const emit = useCallback((event, data) => {
    if (socketRef.current) {
      socketRef.current.emit(event, data);
    }
  }, []);

  // Method to subscribe to custom events
  const on = useCallback((event, callback) => {
    if (socketRef.current) {
      socketRef.current.on(event, callback);
      return () => socketRef.current.off(event, callback);
    }
  }, []);

  return {
    socket: socketRef.current,
    isConnected,
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
  const socketRef = useRef(null);

  useEffect(() => {
    socketRef.current = io(SOCKET_URL, {
      transports: ['websocket', 'polling'],
    });

    socketRef.current.on('connect', () => setIsConnected(true));
    socketRef.current.on('disconnect', () => setIsConnected(false));

    return () => {
      socketRef.current.disconnect();
    };
  }, []);

  return isConnected;
}

export default useSocket;
