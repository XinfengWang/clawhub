import { getAuthUserId } from "@convex-dev/auth/server";
import { internal } from "../_generated/api";
import type { Doc, Id } from "../_generated/dataModel";
import type { ActionCtx, MutationCtx, QueryCtx } from "../_generated/server";

export type Role = "admin" | "moderator" | "user";

/**
 * Get current authenticated user
 * Tries Convex Auth first, then falls back to localStorage for dev mode
 */
async function getCurrentUserId(ctx: MutationCtx | QueryCtx): Promise<Id<"users"> | null> {
  // Try Convex Auth first (for production)
  try {
    const authUserId = await getAuthUserId(ctx);
    if (authUserId) return authUserId;
  } catch {
    // Auth not available, continue
  }

  // In dev mode, userId should come from client via context
  // For now, we can't access it directly from server context
  // The client must pass it through the mutation/query args
  return null;
}

export async function requireUser(ctx: MutationCtx | QueryCtx) {
  const userId = await getCurrentUserId(ctx);
  if (!userId) throw new Error("Unauthorized");
  const user = await ctx.db.get(userId);
  if (!user || user.deletedAt || user.deactivatedAt) throw new Error("User not found");
  return { userId, user };
}

export async function requireUserFromAction(
  ctx: ActionCtx,
): Promise<{ userId: Id<"users">; user: Doc<"users"> }> {
  const userId = await getAuthUserId(ctx);
  if (!userId) throw new Error("Unauthorized");
  const user = await ctx.runQuery(internal.users.getByIdInternal, { userId });
  if (!user || user.deletedAt || user.deactivatedAt) throw new Error("User not found");
  return { userId, user: user as Doc<"users"> };
}

export function assertRole(user: Doc<"users">, allowed: Role[]) {
  if (!user.role || !allowed.includes(user.role as Role)) {
    throw new Error("Forbidden");
  }
}

export function assertAdmin(user: Doc<"users">) {
  assertRole(user, ["admin"]);
}

export function assertModerator(user: Doc<"users">) {
  assertRole(user, ["admin", "moderator"]);
}
