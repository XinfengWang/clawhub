import { useQuery } from "convex/react";
import { useEffect, useState } from "react";
import { api } from "../../convex/_generated/api";

export function useAuthStatus() {
  const [userId, setUserId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Check localStorage for userId on mount
  useEffect(() => {
    const storedUserId = localStorage.getItem("userId");
    setUserId(storedUserId);
    setIsLoading(false);
  }, []);

  // Fetch user data (query handles null/undefined userId gracefully)
  const userQuery = useQuery(api.simpleAuth.getUserById, { userId: userId || undefined });

  return {
    me: userQuery,
    isLoading: isLoading || (userId && userQuery === undefined),
    isAuthenticated: !!userId,
  };
}
