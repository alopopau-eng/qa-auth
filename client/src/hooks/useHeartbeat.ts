import { useEffect, useRef } from "react";
import { api } from "@/lib/api";

export function useHeartbeat(page: string) {
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    // Send initial heartbeat
    api.sendHeartbeat(page).catch(console.error);

    // Send heartbeat every 30 seconds
    intervalRef.current = setInterval(() => {
      api.sendHeartbeat(page).catch(console.error);
    }, 30000);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [page]);
}
