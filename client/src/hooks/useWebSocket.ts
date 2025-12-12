import { useEffect, useState, useRef, useCallback } from "react";

interface WebSocketMessage {
  type: string;
  data: any;
  timestamp: number;
}

interface RealtimeStats {
  onlineCount: number;
  totalApplications: number;
  newApplication: any | null;
}

export function useWebSocket() {
  const [isConnected, setIsConnected] = useState(false);
  const [stats, setStats] = useState<RealtimeStats>({
    onlineCount: 0,
    totalApplications: 0,
    newApplication: null,
  });
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const connect = useCallback(() => {
    // Construct WebSocket URL
    const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
    const wsUrl = `${protocol}//${window.location.host}/ws`;

    try {
      const ws = new WebSocket(wsUrl);
      wsRef.current = ws;

      ws.onopen = () => {
        console.log("WebSocket connected");
        setIsConnected(true);
      };

      ws.onmessage = (event) => {
        try {
          const message: WebSocketMessage = JSON.parse(event.data);
          
          switch (message.type) {
            case "initial_stats":
              setStats((prev) => ({
                ...prev,
                onlineCount: message.data.onlineCount,
                totalApplications: message.data.applications,
              }));
              break;
              
            case "online_count":
              setStats((prev) => ({
                ...prev,
                onlineCount: message.data.count,
              }));
              break;
              
            case "new_application":
              setStats((prev) => ({
                ...prev,
                totalApplications: message.data.totalApplications,
                newApplication: message.data.application,
              }));
              break;
          }
        } catch (e) {
          console.error("WebSocket message parse error:", e);
        }
      };

      ws.onclose = () => {
        console.log("WebSocket disconnected");
        setIsConnected(false);
        wsRef.current = null;

        // Reconnect after 5 seconds
        reconnectTimeoutRef.current = setTimeout(() => {
          connect();
        }, 5000);
      };

      ws.onerror = (error) => {
        console.error("WebSocket error:", error);
      };
    } catch (e) {
      console.error("WebSocket connection error:", e);
    }
  }, []);

  useEffect(() => {
    connect();

    return () => {
      if (wsRef.current) {
        wsRef.current.close();
      }
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
    };
  }, [connect]);

  return {
    isConnected,
    stats,
    clearNewApplication: () => setStats((prev) => ({ ...prev, newApplication: null })),
  };
}
