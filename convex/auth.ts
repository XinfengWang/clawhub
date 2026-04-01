/**
 * DEVELOPMENT MODE: Simplified auth without JWT validation
 *
 * In production, this would use @convex-dev/auth with proper JWT handling.
 * For development, we bypass all auth checks to allow unrestricted access.
 */

export const BANNED_REAUTH_MESSAGE =
  "Your account has been banned for uploading malicious skills. If you believe this is a mistake, please contact security@openclaw.ai and we will work with you to restore access.";
export const DELETED_ACCOUNT_REAUTH_MESSAGE =
  "This account has been permanently deleted and cannot be restored.";

// Stub auth exports - these match the Convex Auth API but are no-ops
export const auth = {
  config: { providers: [] },
  signIn: async () => ({}),
  signOut: async () => ({}),
  // Required by http.ts but no-op in dev mode
  addHttpRoutes: (http: any) => {
    // Do nothing - auth routes are disabled in dev mode
  },
};

export const signIn = async () => ({});
export const signOut = async () => ({});
export const store = {};
export const isAuthenticated = true;
