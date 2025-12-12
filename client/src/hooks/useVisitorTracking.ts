import { useEffect } from "react";
import { api } from "@/lib/api";

export function useVisitorTracking(page: string) {
  useEffect(() => {
    const trackVisit = async () => {
      try {
        await api.trackVisitor({
          page,
          country: "Qatar", // Default, could be detected via IP geolocation
        });
      } catch (error) {
        // Silently fail - tracking shouldn't break the app
        console.error("Visitor tracking failed:", error);
      }
    };

    trackVisit();
  }, [page]);
}
