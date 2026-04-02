import { v } from "convex/values";
import { internalMutation, mutation } from "./functions";
import { requireUser } from "./lib/access";

/**
 * Generate an upload URL for file storage
 * In dev mode with localStorage auth, we accept userId as optional parameter
 * since the file will be validated when publishing the skill
 */
export const generateUploadUrl = mutation({
  args: { userId: v.optional(v.string()) },
  handler: async (ctx, args) => {
    // In dev mode with localStorage auth, skip auth check
    // The publishVersion action will validate the user later
    // Just generate and return the upload URL
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
