import { useEffect, useState } from "react";

export function useAuthStatus() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // Check localStorage for userId on mount
  useEffect(() => {
    const storedUserId = localStorage.getItem("userId");
    setIsAuthenticated(!!storedUserId);
  }, []);

  // Return auth status based on localStorage
  // me is null since we're not using Convex Auth anymore,
  // but header will still show user info from localStorage
  return {
    me: null,
    isLoading,
    isAuthenticated,
  };
}
