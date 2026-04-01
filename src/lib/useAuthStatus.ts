import { useConvexAuth, useQuery } from "convex/react";
import { useEffect, useState } from "react";
import { api } from "../../convex/_generated/api";
import type { Doc } from "../../convex/_generated/dataModel";

export function useAuthStatus() {
  const auth = useConvexAuth();
  const me = useQuery(api.users.me) as Doc<"users"> | null | undefined;
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  // In dev mode, check localStorage for userId to determine auth status
  useEffect(() => {
    const userId = localStorage.getItem("userId");
    if (userId) {
      setIsAuthenticated(true);
    } else {
      setIsAuthenticated(false);
    }
  }, [me]);

  return {
    me,
    isLoading: auth.isLoading,
    isAuthenticated: isAuthenticated || auth.isAuthenticated,
  };
}
