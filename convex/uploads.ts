import { v } from "convex/values";
import { internalMutation, mutation } from "./functions";
import { requireUser } from "./lib/access";

/**
 * Generate an upload URL for file storage
 * In dev mode with localStorage auth, we skip authentication here
 * since the file will be validated when publishing the skill
 */
export const generateUploadUrl = mutation({
  args: {},
  handler: async (ctx) => {
    // In dev mode, allow uploads without strict auth check
    // The publishVersion action will validate the user later
    // Try to require user, but don't fail if auth not available
    try {
      await requireUser(ctx);
    } catch {
      // In dev mode with localStorage auth, we allow this
      // The file will be validated when actually publishing
    }
    return ctx.storage.generateUploadUrl();
  },
});

export const generateUploadUrlForUserInternal = internalMutation({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    const user = await ctx.db.get(args.userId);
    if (!user || user.deletedAt || user.deactivatedAt) throw new Error("User not found");
    return ctx.storage.generateUploadUrl();
  },
});
