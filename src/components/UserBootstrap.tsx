import { useMutation } from "convex/react";
import { useEffect, useRef } from "react";
import { api } from "../../convex/_generated/api";
import { useAuthStatus } from "../lib/useAuthStatus";

export function UserBootstrap() {
  const { isAuthenticated, isLoading } = useAuthStatus();
  const ensureUser = useMutation(api.users.ensure);
  const didRun = useRef(false);

  useEffect(() => {
    if (isLoading || !isAuthenticated || didRun.current) return;
    didRun.current = true;
    void ensureUser().catch(() => {
      // In dev mode with localStorage auth, ensure may fail silently
      // This is expected behavior - the user is authenticated on client
    });
  }, [isAuthenticated, isLoading]);

  return null;
}
