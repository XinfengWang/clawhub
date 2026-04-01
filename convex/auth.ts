/**
 * DEVELOPMENT MODE: Simplified auth without JWT validation
 *
 * In production, this would use @convex-dev/auth with proper JWT handling.
 * For development, we bypass all auth checks to allow unrestricted access.
 */

import type { GenericMutationCtx } from "convex/server";
import { ConvexError } from "convex/values";
import { internal } from "./_generated/api";
import type { DataModel, Id } from "./_generated/dataModel";

export const BANNED_REAUTH_MESSAGE =
  "Your account has been banned for uploading malicious skills. If you believe this is a mistake, please contact security@openclaw.ai and we will work with you to restore access.";
export const DELETED_ACCOUNT_REAUTH_MESSAGE =
  "This account has been permanently deleted and cannot be restored.";

const REAUTH_BLOCKING_BAN_ACTIONS = new Set(["user.ban", "user.autoban.malware"]);

export async function handleDeletedUserSignIn(
  ctx: GenericMutationCtx<DataModel>,
  args: { userId: Id<"users">; existingUserId: Id<"users"> | null },
  userOverride?: { deletedAt?: number; deactivatedAt?: number; purgedAt?: number } | null,
) {
  const user = userOverride !== undefined ? userOverride : await ctx.db.get(args.userId);
  if (!user || (!user.deletedAt && !user.deactivatedAt)) return;

  if (args.existingUserId && args.existingUserId !== args.userId) {
    return;
  }

  if (user.deactivatedAt) {
    throw new ConvexError(DELETED_ACCOUNT_REAUTH_MESSAGE);
  }

  const userId = args.userId;
  const deletedAt = user.deletedAt ?? Date.now();
  const banRecords = await ctx.db
    .query("auditLogs")
    .withIndex("by_target", (q) => q.eq("targetType", "user").eq("targetId", userId.toString()))
    .collect();

  const hasBlockingBan = banRecords.some((record) =>
    REAUTH_BLOCKING_BAN_ACTIONS.has(record.action),
  );

  if (hasBlockingBan) {
    throw new ConvexError(BANNED_REAUTH_MESSAGE);
  }

  await ctx.db.patch(userId, {
    deletedAt: undefined,
    deactivatedAt: deletedAt,
    purgedAt: user.purgedAt ?? deletedAt,
    updatedAt: Date.now(),
  });

  throw new ConvexError(DELETED_ACCOUNT_REAUTH_MESSAGE);
}

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
