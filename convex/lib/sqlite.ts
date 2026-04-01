/**
 * SQLite database stub - not used directly in Convex
 * SQLite operations are handled in Convex Actions (convex/actions/auth.ts)
 * This file exists for type definitions and client-side reference
 */

export interface DbUser {
  id: number;
  uuid: string;
  email: string;
  password_hash: string;
  name: string | null;
  display_name: string | null;
  avatar_url: string | null;
  created_at: string;
  updated_at: string;
}
